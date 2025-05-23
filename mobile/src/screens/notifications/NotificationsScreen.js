/**
 * Notifications Screen
 * 
 * This screen displays a list of notifications from the platform.
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Text, IconButton, Button, Divider, Menu, useTheme, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../store/actions/notificationActions';
import { formatRelativeTime } from '../../utils/formatters';
import ErrorView from '../../components/common/ErrorView';

const NotificationsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filterType, setFilterType] = useState('all');
  
  const dispatch = useDispatch();
  const theme = useTheme();
  
  const { notifications, loading, error } = useSelector(state => state.notifications);
  
  useEffect(() => {
    loadNotifications();
  }, [dispatch]);
  
  const loadNotifications = async () => {
    try {
      await dispatch(fetchNotifications());
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };
  
  const handleMarkAsRead = async (notificationId) => {
    try {
      await dispatch(markAsRead(notificationId));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead());
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };
  
  const handleDeleteNotification = async (notificationId) => {
    try {
      await dispatch(deleteNotification(notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };
  
  const handleNotificationPress = (notification) => {
    // Mark as read when pressed
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'agent_status':
        navigation.navigate('AgentDetail', { agentId: notification.metadata?.agent_id });
        break;
      case 'order_update':
        navigation.navigate('OrderDetail', { orderId: notification.metadata?.order_id });
        break;
      case 'position_update':
        navigation.navigate('PositionDetail', { positionId: notification.metadata?.position_id });
        break;
      case 'price_alert':
        navigation.navigate('MarketDetail', { symbol: notification.metadata?.symbol });
        break;
      default:
        // Just show the notification details
        setSelectedNotification(notification);
        setMenuVisible(true);
    }
  };
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'agent_status':
        return 'robot';
      case 'order_update':
        return 'clipboard-list';
      case 'position_update':
        return 'chart-line';
      case 'price_alert':
        return 'bell-ring';
      case 'system':
        return 'information';
      default:
        return 'bell';
    }
  };
  
  const filterNotifications = () => {
    if (filterType === 'all') {
      return notifications;
    }
    
    if (filterType === 'unread') {
      return notifications.filter(notification => !notification.read);
    }
    
    return notifications.filter(notification => notification.type === filterType);
  };
  
  const renderNotificationItem = ({ item }) => (
    <Card 
      style={[
        styles.notificationCard, 
        !item.read && styles.unreadCard
      ]} 
      onPress={() => handleNotificationPress(item)}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={getNotificationIcon(item.type)}
            size={24}
            color={theme.colors.primary}
          />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Title style={styles.title}>{item.title}</Title>
            <Text style={styles.time}>{formatRelativeTime(item.created_at)}</Text>
          </View>
          
          <Paragraph style={styles.message}>{item.message}</Paragraph>
          
          <View style={styles.actionsRow}>
            {!item.read && (
              <Button 
                compact 
                mode="text" 
                onPress={() => handleMarkAsRead(item.id)}
              >
                Mark as read
              </Button>
            )}
            
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteNotification(item.id)}
              style={styles.deleteButton}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
  
  if (loading && !refreshing && !notifications.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  if (error && !refreshing && !notifications.length) {
    return (
      <ErrorView 
        message="Failed to load notifications"
        onRetry={loadNotifications}
      />
    );
  }
  
  const filteredNotifications = filterNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.filterContainer}>
          <Button 
            mode={filterType === 'all' ? 'contained' : 'outlined'} 
            onPress={() => setFilterType('all')}
            compact
            style={styles.filterButton}
          >
            All
          </Button>
          
          <Button 
            mode={filterType === 'unread' ? 'contained' : 'outlined'} 
            onPress={() => setFilterType('unread')}
            compact
            style={styles.filterButton}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </Button>
        </View>
        
        {unreadCount > 0 && (
          <Button 
            mode="text" 
            onPress={handleMarkAllAsRead}
            style={styles.markAllButton}
          >
            Mark all as read
          </Button>
        )}
      </View>
      
      {filteredNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="bell-off"
            size={48}
            color={theme.colors.disabled}
          />
          <Text style={styles.emptyText}>No notifications</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      
      <Menu
        visible={menuVisible}
        onDismiss={() => {
          setMenuVisible(false);
          setSelectedNotification(null);
        }}
        anchor={{ x: 0, y: 0 }}
        style={styles.menu}
      >
        {selectedNotification && (
          <>
            <Menu.Item title={selectedNotification.title} disabled />
            <Divider />
            <View style={styles.menuContent}>
              <Text style={styles.menuMessage}>{selectedNotification.message}</Text>
              <Text style={styles.menuTime}>
                {new Date(selectedNotification.created_at).toLocaleString()}
              </Text>
              
              {selectedNotification.metadata && (
                <>
                  <Divider style={styles.menuDivider} />
                  <Text style={styles.menuMetadataTitle}>Details</Text>
                  {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                    <Text key={key} style={styles.menuMetadata}>
                      <Text style={styles.menuMetadataKey}>{key.replace('_', ' ')}:</Text> {value}
                    </Text>
                  ))}
                </>
              )}
            </View>
            <Divider />
            <Menu.Item 
              title="Close" 
              onPress={() => {
                setMenuVisible(false);
                setSelectedNotification(null);
              }} 
            />
          </>
        )}
      </Menu>
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
  headerContainer: {
    padding: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterButton: {
    marginRight: 10,
  },
  markAllButton: {
    alignSelf: 'flex-end',
  },
  listContent: {
    padding: 10,
  },
  notificationCard: {
    marginBottom: 10,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: 'blue',
  },
  cardContent: {
    flexDirection: 'row',
  },
  iconContainer: {
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  time: {
    fontSize: 12,
    opacity: 0.7,
  },
  message: {
    marginTop: 5,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  deleteButton: {
    margin: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
  },
  menu: {
    width: '80%',
    alignSelf: 'center',
  },
  menuContent: {
    padding: 15,
  },
  menuMessage: {
    fontSize: 14,
    marginBottom: 10,
  },
  menuTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  menuDivider: {
    marginVertical: 10,
  },
  menuMetadataTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  menuMetadata: {
    fontSize: 12,
    marginBottom: 3,
  },
  menuMetadataKey: {
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
});

export default NotificationsScreen;
