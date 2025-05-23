/**
 * Dashboard Screen
 * 
 * This screen displays the main dashboard with account summary, active agents, and recent trades.
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Text, Button, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

import { fetchDashboardData } from '../../store/actions/dashboardActions';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import AgentStatusBadge from '../../components/agents/AgentStatusBadge';
import ErrorView from '../../components/common/ErrorView';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();
  const theme = useTheme();
  
  const { 
    accountSummary, 
    activeAgents, 
    recentTrades, 
    performanceData,
    loading, 
    error 
  } = useSelector(state => state.dashboard);
  
  useEffect(() => {
    loadDashboardData();
  }, [dispatch]);
  
  const loadDashboardData = async () => {
    try {
      await dispatch(fetchDashboardData());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };
  
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  if (error && !refreshing) {
    return (
      <ErrorView 
        message="Failed to load dashboard data"
        onRetry={loadDashboardData}
      />
    );
  }
  
  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => theme.colors.primary,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    labelColor: (opacity = 1) => theme.colors.text,
  };
  
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Account Summary Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Account Summary</Title>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Paragraph>Balance</Paragraph>
              <Text style={styles.summaryValue}>
                {formatCurrency(accountSummary?.balance || 0)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Paragraph>Portfolio Value</Paragraph>
              <Text style={styles.summaryValue}>
                {formatCurrency(accountSummary?.portfolioValue || 0)}
              </Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Paragraph>24h Change</Paragraph>
              <Text style={[
                styles.summaryValue,
                { color: (accountSummary?.change24h || 0) >= 0 ? 'green' : 'red' }
              ]}>
                {formatPercentage(accountSummary?.change24h || 0)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Paragraph>Open Positions</Paragraph>
              <Text style={styles.summaryValue}>
                {accountSummary?.openPositions || 0}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {/* Performance Chart Card */}
      {performanceData && performanceData.labels && performanceData.datasets && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Portfolio Performance</Title>
            <LineChart
              data={{
                labels: performanceData.labels,
                datasets: [
                  {
                    data: performanceData.datasets[0].data,
                    color: (opacity = 1) => theme.colors.primary,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}
      
      {/* Active Agents Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title>Active Agents</Title>
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('Agents')}
              compact
            >
              View All
            </Button>
          </View>
          
          {activeAgents && activeAgents.length > 0 ? (
            activeAgents.map((agent, index) => (
              <View key={agent.id}>
                {index > 0 && <Divider style={styles.divider} />}
                <View style={styles.agentItem}>
                  <View style={styles.agentInfo}>
                    <Text style={styles.agentName}>{agent.name}</Text>
                    <Paragraph>{agent.type}</Paragraph>
                  </View>
                  <View style={styles.agentStatus}>
                    <AgentStatusBadge status={agent.status} />
                    <Text style={[
                      styles.agentReturn,
                      { color: (agent.return || 0) >= 0 ? 'green' : 'red' }
                    ]}>
                      {formatPercentage(agent.return || 0)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Paragraph style={styles.emptyMessage}>No active agents</Paragraph>
          )}
        </Card.Content>
        <Card.Actions>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('CreateAgent')}
            style={styles.button}
          >
            Create Agent
          </Button>
        </Card.Actions>
      </Card>
      
      {/* Recent Trades Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title>Recent Trades</Title>
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('Orders')}
              compact
            >
              View All
            </Button>
          </View>
          
          {recentTrades && recentTrades.length > 0 ? (
            recentTrades.map((trade, index) => (
              <View key={trade.id}>
                {index > 0 && <Divider style={styles.divider} />}
                <View style={styles.tradeItem}>
                  <View style={styles.tradeInfo}>
                    <Text style={styles.tradeSymbol}>{trade.symbol}</Text>
                    <Paragraph>{new Date(trade.timestamp).toLocaleString()}</Paragraph>
                  </View>
                  <View style={styles.tradeDetails}>
                    <Text style={[
                      styles.tradeSide,
                      { color: trade.side === 'BUY' ? 'green' : 'red' }
                    ]}>
                      {trade.side}
                    </Text>
                    <Text style={styles.tradeAmount}>
                      {trade.amount} @ {formatCurrency(trade.price)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Paragraph style={styles.emptyMessage}>No recent trades</Paragraph>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 15,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  summaryItem: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  divider: {
    marginVertical: 10,
  },
  agentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  agentStatus: {
    alignItems: 'flex-end',
  },
  agentReturn: {
    marginTop: 5,
    fontWeight: 'bold',
  },
  tradeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tradeInfo: {
    flex: 1,
  },
  tradeSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tradeDetails: {
    alignItems: 'flex-end',
  },
  tradeSide: {
    fontWeight: 'bold',
  },
  tradeAmount: {
    marginTop: 5,
  },
  emptyMessage: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 15,
  },
  button: {
    marginTop: 10,
    width: '100%',
  },
});

export default DashboardScreen;
