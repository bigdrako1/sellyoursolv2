/**
 * Markets Screen
 * 
 * This screen displays a list of markets with price and volume information.
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Text, Searchbar, Chip, Menu, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { fetchMarkets } from '../../store/actions/marketActions';
import { formatCurrency, formatPercentage, formatVolume } from '../../utils/formatters';
import ErrorView from '../../components/common/ErrorView';

const MarketsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('volume');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [quoteFilter, setQuoteFilter] = useState('all');
  
  const dispatch = useDispatch();
  const theme = useTheme();
  
  const { markets, loading, error } = useSelector(state => state.markets);
  
  useEffect(() => {
    loadMarkets();
  }, [dispatch]);
  
  const loadMarkets = async () => {
    try {
      await dispatch(fetchMarkets());
    } catch (error) {
      console.error('Failed to load markets:', error);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadMarkets();
    setRefreshing(false);
  };
  
  const handleMarketPress = (market) => {
    navigation.navigate('MarketDetail', { symbol: market.symbol });
  };
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };
  
  const filterAndSortMarkets = () => {
    let filteredMarkets = [...markets];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredMarkets = filteredMarkets.filter(market => 
        market.symbol.toLowerCase().includes(query) || 
        market.base.toLowerCase().includes(query) ||
        market.quote.toLowerCase().includes(query)
      );
    }
    
    // Apply quote filter
    if (quoteFilter !== 'all') {
      filteredMarkets = filteredMarkets.filter(market => market.quote === quoteFilter);
    }
    
    // Apply sorting
    filteredMarkets.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'change':
          comparison = a.change_24h - b.change_24h;
          break;
        case 'volume':
          comparison = a.volume_24h - b.volume_24h;
          break;
        case 'name':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        default:
          comparison = a.volume_24h - b.volume_24h;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filteredMarkets;
  };
  
  const renderMarketItem = ({ item }) => (
    <Card style={styles.marketCard} onPress={() => handleMarketPress(item)}>
      <Card.Content>
        <View style={styles.marketHeader}>
          <View style={styles.symbolContainer}>
            <Title style={styles.symbol}>{item.base}</Title>
            <Text style={styles.quote}>/{item.quote}</Text>
          </View>
          <Text style={styles.price}>{formatCurrency(item.price)}</Text>
        </View>
        
        <View style={styles.marketDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>24h Change</Text>
            <Text style={[
              styles.detailValue,
              { color: item.change_24h >= 0 ? 'green' : 'red' }
            ]}>
              {formatPercentage(item.change_24h)}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>24h Volume</Text>
            <Text style={styles.detailValue}>
              {formatVolume(item.volume_24h)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
  
  const renderSortButton = (label, value) => (
    <Chip
      selected={sortBy === value}
      onPress={() => {
        if (sortBy === value) {
          toggleSortOrder();
        } else {
          setSortBy(value);
          setSortOrder('desc');
        }
      }}
      style={styles.sortChip}
    >
      {label} {sortBy === value && (
        <MaterialCommunityIcons
          name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
          size={16}
          color={theme.colors.primary}
        />
      )}
    </Chip>
  );
  
  if (loading && !refreshing && !markets.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  if (error && !refreshing && !markets.length) {
    return (
      <ErrorView 
        message="Failed to load markets"
        onRetry={loadMarkets}
      />
    );
  }
  
  const filteredMarkets = filterAndSortMarkets();
  const quoteAssets = [...new Set(markets.map(market => market.quote))];
  
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search markets"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <TouchableOpacity
          onPress={() => setFilterMenuVisible(true)}
          style={styles.filterButton}
        >
          <MaterialCommunityIcons
            name="filter-variant"
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>
      
      <Menu
        visible={filterMenuVisible}
        onDismiss={() => setFilterMenuVisible(false)}
        anchor={{ x: 0, y: 0 }}
        style={styles.filterMenu}
      >
        <Menu.Item title="Quote Asset" disabled />
        <Divider />
        <Menu.Item
          title="All"
          onPress={() => {
            setQuoteFilter('all');
            setFilterMenuVisible(false);
          }}
          titleStyle={quoteFilter === 'all' ? { color: theme.colors.primary } : {}}
        />
        {quoteAssets.map(quote => (
          <Menu.Item
            key={quote}
            title={quote}
            onPress={() => {
              setQuoteFilter(quote);
              setFilterMenuVisible(false);
            }}
            titleStyle={quoteFilter === quote ? { color: theme.colors.primary } : {}}
          />
        ))}
      </Menu>
      
      <View style={styles.sortContainer}>
        {renderSortButton('Name', 'name')}
        {renderSortButton('Price', 'price')}
        {renderSortButton('Change', 'change')}
        {renderSortButton('Volume', 'volume')}
      </View>
      
      {filteredMarkets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No markets found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMarkets}
          renderItem={renderMarketItem}
          keyExtractor={item => item.symbol}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  searchbar: {
    flex: 1,
    marginRight: 10,
  },
  filterButton: {
    padding: 10,
  },
  filterMenu: {
    marginTop: 60,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 10,
    flexWrap: 'wrap',
  },
  sortChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  listContent: {
    padding: 10,
  },
  marketCard: {
    marginBottom: 15,
    elevation: 2,
  },
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  symbolContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  symbol: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  quote: {
    fontSize: 16,
    marginLeft: 2,
    opacity: 0.7,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  marketDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
  },
});

export default MarketsScreen;
