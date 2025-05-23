/**
 * Agents Screen
 * 
 * This screen displays a list of trading agents with their status and metrics.
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Text, Button, Chip, FAB, Searchbar, Menu, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { fetchAgents, startAgent, stopAgent } from '../../store/actions/agentActions';
import { formatPercentage } from '../../utils/formatters';
import AgentStatusBadge from '../../components/agents/AgentStatusBadge';
import ErrorView from '../../components/common/ErrorView';

const AgentsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const dispatch = useDispatch();
  const theme = useTheme();
  
  const { agents, loading, error } = useSelector(state => state.agents);
  
  useEffect(() => {
    loadAgents();
  }, [dispatch]);
  
  const loadAgents = async () => {
    try {
      await dispatch(fetchAgents());
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAgents();
    setRefreshing(false);
  };
  
  const handleStartAgent = async (agentId) => {
    try {
      await dispatch(startAgent(agentId));
    } catch (error) {
      console.error('Failed to start agent:', error);
    }
  };
  
  const handleStopAgent = async (agentId) => {
    try {
      await dispatch(stopAgent(agentId));
    } catch (error) {
      console.error('Failed to stop agent:', error);
    }
  };
  
  const handleAgentPress = (agent) => {
    navigation.navigate('AgentDetail', { agentId: agent.id });
  };
  
  const handleCreateAgent = () => {
    navigation.navigate('CreateAgent');
  };
  
  const filterAgents = () => {
    let filteredAgents = [...agents];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredAgents = filteredAgents.filter(agent => 
        agent.name.toLowerCase().includes(query) || 
        agent.type.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filteredAgents = filteredAgents.filter(agent => agent.status === statusFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filteredAgents = filteredAgents.filter(agent => agent.type === typeFilter);
    }
    
    return filteredAgents;
  };
  
  const renderAgentItem = ({ item }) => (
    <Card style={styles.agentCard} onPress={() => handleAgentPress(item)}>
      <Card.Content>
        <View style={styles.agentHeader}>
          <Title>{item.name}</Title>
          <AgentStatusBadge status={item.status} />
        </View>
        
        <Paragraph style={styles.agentType}>{item.type}</Paragraph>
        
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Return</Text>
            <Text style={[
              styles.metricValue,
              { color: (item.metrics?.return || 0) >= 0 ? 'green' : 'red' }
            ]}>
              {formatPercentage(item.metrics?.return || 0)}
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Win Rate</Text>
            <Text style={styles.metricValue}>
              {formatPercentage(item.metrics?.winRate || 0)}
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Trades</Text>
            <Text style={styles.metricValue}>
              {item.metrics?.trades || 0}
            </Text>
          </View>
        </View>
        
        <View style={styles.tagsContainer}>
          {item.symbols && item.symbols.map((symbol, index) => (
            <Chip key={index} style={styles.symbolChip} textStyle={styles.symbolChipText}>
              {symbol}
            </Chip>
          ))}
        </View>
      </Card.Content>
      
      <Card.Actions style={styles.cardActions}>
        {item.status === 'running' ? (
          <Button 
            mode="outlined" 
            onPress={() => handleStopAgent(item.id)}
            color={theme.colors.error}
          >
            Stop
          </Button>
        ) : (
          <Button 
            mode="outlined" 
            onPress={() => handleStartAgent(item.id)}
            color={theme.colors.primary}
          >
            Start
          </Button>
        )}
        
        <Button 
          mode="contained" 
          onPress={() => handleAgentPress(item)}
        >
          Details
        </Button>
      </Card.Actions>
    </Card>
  );
  
  if (loading && !refreshing && !agents.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  if (error && !refreshing && !agents.length) {
    return (
      <ErrorView 
        message="Failed to load agents"
        onRetry={loadAgents}
      />
    );
  }
  
  const filteredAgents = filterAgents();
  
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search agents"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <Button
          mode="outlined"
          onPress={() => setFilterMenuVisible(true)}
          style={styles.filterButton}
          icon="filter-variant"
        >
          Filter
        </Button>
      </View>
      
      <Menu
        visible={filterMenuVisible}
        onDismiss={() => setFilterMenuVisible(false)}
        anchor={{ x: 0, y: 0 }}
        style={styles.filterMenu}
      >
        <Menu.Item title="Status" disabled />
        <Divider />
        <Menu.Item
          title="All"
          onPress={() => {
            setStatusFilter('all');
            setFilterMenuVisible(false);
          }}
          titleStyle={statusFilter === 'all' ? { color: theme.colors.primary } : {}}
        />
        <Menu.Item
          title="Running"
          onPress={() => {
            setStatusFilter('running');
            setFilterMenuVisible(false);
          }}
          titleStyle={statusFilter === 'running' ? { color: theme.colors.primary } : {}}
        />
        <Menu.Item
          title="Stopped"
          onPress={() => {
            setStatusFilter('stopped');
            setFilterMenuVisible(false);
          }}
          titleStyle={statusFilter === 'stopped' ? { color: theme.colors.primary } : {}}
        />
        <Divider />
        <Menu.Item title="Type" disabled />
        <Divider />
        <Menu.Item
          title="All"
          onPress={() => {
            setTypeFilter('all');
            setFilterMenuVisible(false);
          }}
          titleStyle={typeFilter === 'all' ? { color: theme.colors.primary } : {}}
        />
        <Menu.Item
          title="Predictive"
          onPress={() => {
            setTypeFilter('predictive');
            setFilterMenuVisible(false);
          }}
          titleStyle={typeFilter === 'predictive' ? { color: theme.colors.primary } : {}}
        />
        <Menu.Item
          title="Reinforcement"
          onPress={() => {
            setTypeFilter('reinforcement');
            setFilterMenuVisible(false);
          }}
          titleStyle={typeFilter === 'reinforcement' ? { color: theme.colors.primary } : {}}
        />
      </Menu>
      
      {filteredAgents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No agents found</Text>
          <Button 
            mode="contained" 
            onPress={handleCreateAgent}
            style={styles.createButton}
          >
            Create Agent
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredAgents}
          renderItem={renderAgentItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={handleCreateAgent}
      />
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
    height: 50,
    justifyContent: 'center',
  },
  filterMenu: {
    marginTop: 60,
  },
  listContent: {
    padding: 10,
  },
  agentCard: {
    marginBottom: 15,
    elevation: 2,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agentType: {
    marginBottom: 10,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  symbolChip: {
    marginRight: 5,
    marginBottom: 5,
  },
  symbolChipText: {
    fontSize: 12,
  },
  cardActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
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

export default AgentsScreen;
