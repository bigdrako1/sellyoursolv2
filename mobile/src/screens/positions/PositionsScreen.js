/**
 * Positions Screen
 * 
 * This screen displays a list of open positions with profit/loss information.
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Text, Button, Chip, Searchbar, useTheme, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { fetchPositions, closePosition } from '../../store/actions/positionActions';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import ErrorView from '../../components/common/ErrorView';

const PositionsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [closingPositionId, setClosingPositionId] = useState(null);
  
  const dispatch = useDispatch();
  const theme = useTheme();
  
  const { positions, loading, error } = useSelector(state => state.positions);
  
  useEffect(() => {
    loadPositions();
  }, [dispatch]);
  
  const loadPositions = async () => {
    try {
      await dispatch(fetchPositions());
    } catch (error) {
      console.error('Failed to load positions:', error);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadPositions();
    setRefreshing(false);
  };
  
  const handlePositionPress = (position) => {
    navigation.navigate('PositionDetail', { positionId: position.id });
  };
  
  const handleClosePosition = async (positionId) => {
    try {
      setClosingPositionId(positionId);
      await dispatch(closePosition(positionId));
    } catch (error) {
      console.error('Failed to close position:', error);
    } finally {
      setClosingPositionId(null);
    }
  };
  
  const filterPositions = () => {
    if (!searchQuery) {
      return positions;
    }
    
    const query = searchQuery.toLowerCase();
    return positions.filter(position => 
      position.symbol.toLowerCase().includes(query) || 
      position.side.toLowerCase().includes(query)
    );
  };
  
  const getSideColor = (side) => {
    return side.toLowerCase() === 'long' ? 'green' : 'red';
  };
  
  const renderPositionItem = ({ item }) => (
    <Card style={styles.positionCard} onPress={() => handlePositionPress(item)}>
      <Card.Content>
        <View style={styles.positionHeader}>
          <Title style={styles.symbol}>{item.symbol}</Title>
          <Chip
            style={[styles.sideChip, { backgroundColor: getSideColor(item.side) + '20' }]}
            textStyle={{ color: getSideColor(item.side) }}
          >
            {item.side}
          </Chip>
        </View>
        
        <View style={styles.positionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>{item.amount}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Entry Price</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.entry_price)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Price</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.current_price)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>P&L</Text>
            <Text style={[
              styles.pnlValue,
              { color: item.pnl >= 0 ? 'green' : 'red' }
            ]}>
              {formatCurrency(item.pnl)} ({formatPercentage(item.pnl_percentage)})
            </Text>
          </View>
        </View>
      </Card.Content>
      
      <Card.Actions style={styles.cardActions}>
        <Button 
          mode="outlined" 
          onPress={() => handleClosePosition(item.id)}
          loading={closingPositionId === item.id}
          disabled={closingPositionId === item.id}
          color={theme.colors.error}
        >
          Close
        </Button>
        
        <Button 
          mode="contained" 
          onPress={() => handlePositionPress(item)}
        >
          Details
        </Button>
      </Card.Actions>
    </Card>
  );
  
  if (loading && !refreshing && !positions.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  if (error && !refreshing && !positions.length) {
    return (
      <ErrorView 
        message="Failed to load positions"
        onRetry={loadPositions}
      />
    );
  }
  
  const filteredPositions = filterPositions();
  
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search positions"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>
      
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.summaryTitle}>Portfolio Summary</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Value</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(positions.reduce((sum, pos) => sum + (pos.amount * pos.current_price), 0))}
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total P&L</Text>
                <Text style={[
                  styles.summaryValue,
                  { 
                    color: positions.reduce((sum, pos) => sum + pos.pnl, 0) >= 0 
                      ? 'green' 
                      : 'red' 
                  }
                ]}>
                  {formatCurrency(positions.reduce((sum, pos) => sum + pos.pnl, 0))}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>
      
      {filteredPositions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No positions found</Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Markets')}
            style={styles.createButton}
          >
            Go to Markets
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredPositions}
          renderItem={renderPositionItem}
          keyExtractor={item => item.id}
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
    padding: 10,
  },
  searchbar: {
    elevation: 2,
  },
  summaryContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  summaryCard: {
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 10,
  },
  positionCard: {
    marginBottom: 15,
    elevation: 2,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  symbol: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sideChip: {
    height: 28,
  },
  positionDetails: {
    marginTop: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    opacity: 0.7,
  },
  detailValue: {
    fontWeight: 'bold',
  },
  pnlValue: {
    fontWeight: 'bold',
  },
  cardActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 20,
  },
  createButton: {
    paddingHorizontal: 20,
  },
});

export default PositionsScreen;
