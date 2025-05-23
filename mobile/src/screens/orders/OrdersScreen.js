/**
 * Orders Screen
 * 
 * This screen displays a list of open and recent orders.
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Text, Button, Chip, Searchbar, SegmentedButtons, useTheme, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { fetchOrders, cancelOrder } from '../../store/actions/orderActions';
import { formatCurrency, formatDate } from '../../utils/formatters';
import ErrorView from '../../components/common/ErrorView';

const OrdersScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState('open');
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  
  const dispatch = useDispatch();
  const theme = useTheme();
  
  const { orders, loading, error } = useSelector(state => state.orders);
  
  useEffect(() => {
    loadOrders();
  }, [dispatch, orderType]);
  
  const loadOrders = async () => {
    try {
      await dispatch(fetchOrders(orderType));
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };
  
  const handleOrderPress = (order) => {
    navigation.navigate('OrderDetail', { orderId: order.id });
  };
  
  const handleCancelOrder = async (orderId) => {
    try {
      setCancellingOrderId(orderId);
      await dispatch(cancelOrder(orderId));
    } catch (error) {
      console.error('Failed to cancel order:', error);
    } finally {
      setCancellingOrderId(null);
    }
  };
  
  const filterOrders = () => {
    if (!searchQuery) {
      return orders;
    }
    
    const query = searchQuery.toLowerCase();
    return orders.filter(order => 
      order.symbol.toLowerCase().includes(query) || 
      order.type.toLowerCase().includes(query) ||
      order.side.toLowerCase().includes(query) ||
      order.status.toLowerCase().includes(query)
    );
  };
  
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'open':
      case 'new':
        return theme.colors.primary;
      case 'filled':
      case 'closed':
        return 'green';
      case 'canceled':
      case 'cancelled':
        return 'orange';
      case 'rejected':
      case 'expired':
        return 'red';
      default:
        return theme.colors.text;
    }
  };
  
  const getSideColor = (side) => {
    return side.toLowerCase() === 'buy' ? 'green' : 'red';
  };
  
  const renderOrderItem = ({ item }) => (
    <Card style={styles.orderCard} onPress={() => handleOrderPress(item)}>
      <Card.Content>
        <View style={styles.orderHeader}>
          <View>
            <Title style={styles.symbol}>{item.symbol}</Title>
            <Text style={styles.date}>{formatDate(item.created_at)}</Text>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {item.status}
          </Chip>
        </View>
        
        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{item.type}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Side</Text>
            <Text style={[styles.detailValue, { color: getSideColor(item.side) }]}>
              {item.side}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>{item.amount}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>
              {item.price ? formatCurrency(item.price) : 'Market'}
            </Text>
          </View>
        </View>
      </Card.Content>
      
      {(orderType === 'open' || item.status === 'open' || item.status === 'new') && (
        <Card.Actions style={styles.cardActions}>
          <Button 
            mode="outlined" 
            onPress={() => handleCancelOrder(item.id)}
            loading={cancellingOrderId === item.id}
            disabled={cancellingOrderId === item.id}
            color={theme.colors.error}
          >
            Cancel
          </Button>
          
          <Button 
            mode="contained" 
            onPress={() => handleOrderPress(item)}
          >
            Details
          </Button>
        </Card.Actions>
      )}
    </Card>
  );
  
  if (loading && !refreshing && !orders.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  if (error && !refreshing && !orders.length) {
    return (
      <ErrorView 
        message="Failed to load orders"
        onRetry={loadOrders}
      />
    );
  }
  
  const filteredOrders = filterOrders();
  
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search orders"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>
      
      <View style={styles.segmentContainer}>
        <SegmentedButtons
          value={orderType}
          onValueChange={setOrderType}
          buttons={[
            { value: 'open', label: 'Open' },
            { value: 'closed', label: 'Closed' },
            { value: 'all', label: 'All' }
          ]}
          style={styles.segmentedButtons}
        />
      </View>
      
      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No orders found</Text>
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
          data={filteredOrders}
          renderItem={renderOrderItem}
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
  segmentContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  segmentedButtons: {
    marginBottom: 10,
  },
  listContent: {
    padding: 10,
  },
  orderCard: {
    marginBottom: 15,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  symbol: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 12,
    opacity: 0.7,
  },
  statusChip: {
    height: 28,
  },
  orderDetails: {
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

export default OrdersScreen;
