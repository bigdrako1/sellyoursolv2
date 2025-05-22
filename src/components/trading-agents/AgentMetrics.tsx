/**
 * Component for displaying agent metrics.
 */
import { Agent } from '../../services/tradingAgentService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { ArrowUpRight, ArrowDownRight, Activity, DollarSign, Clock } from 'lucide-react';

interface AgentMetricsProps {
  agent: Agent;
}

const AgentMetrics = ({ agent }: AgentMetricsProps) => {
  const metrics = agent.metrics || {};
  
  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Helper function to format percentage
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Get profit/loss metrics
  const profitLoss = metrics.profit_loss || { total_profit: 0, total_loss: 0, net_pnl: 0 };
  const totalProfit = profitLoss.total_profit || 0;
  const totalLoss = profitLoss.total_loss || 0;
  const netPnL = profitLoss.net_pnl || 0;
  
  // Get counter metrics
  const counters = metrics.counters || {};
  const positionsOpened = counters.positions_opened || 0;
  const errors = counters.errors || 0;
  
  // Get gauge metrics
  const gauges = metrics.gauges || {};
  const lastCycleCompleted = gauges.last_cycle_completed 
    ? new Date(gauges.last_cycle_completed).toLocaleString()
    : 'N/A';
  
  // Get agent-specific metrics
  const getAgentSpecificMetrics = () => {
    switch (agent.type) {
      case 'copy_trading':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard
                title="Tracked Wallets"
                value={gauges.tracked_wallets_count || 0}
                icon={<Activity className="h-4 w-4" />}
              />
              <MetricCard
                title="Trending Tokens"
                value={gauges.trending_tokens_count || 0}
                icon={<Activity className="h-4 w-4" />}
              />
            </div>
          </>
        );
        
      case 'liquidation':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard
                title="Symbols Monitored"
                value={gauges.symbols_count || 0}
                icon={<Activity className="h-4 w-4" />}
              />
              {gauges.position_BTC && (
                <MetricCard
                  title="BTC Position"
                  value={gauges.position_BTC.direction || 'None'}
                  subtitle={gauges.position_BTC.entry_price ? `Entry: $${gauges.position_BTC.entry_price}` : ''}
                  icon={<Activity className="h-4 w-4" />}
                />
              )}
            </div>
          </>
        );
        
      case 'scanner':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="Trending Tokens"
                value={gauges.trending_tokens_count || 0}
                icon={<Activity className="h-4 w-4" />}
              />
              <MetricCard
                title="New Tokens"
                value={gauges.new_tokens_count || 0}
                icon={<Activity className="h-4 w-4" />}
              />
              <MetricCard
                title="Top Traders"
                value={gauges.top_traders_count || 0}
                icon={<Activity className="h-4 w-4" />}
              />
            </div>
          </>
        );
        
      case 'sniper':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard
                title="Potential Tokens"
                value={gauges.potential_tokens_count || 0}
                icon={<Activity className="h-4 w-4" />}
              />
              <MetricCard
                title="SOL Balance"
                value={gauges.sol_balance ? `${gauges.sol_balance} SOL` : 'N/A'}
                subtitle={gauges.sol_balance_warning ? 'Low balance warning' : ''}
                icon={<Activity className="h-4 w-4" />}
              />
            </div>
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Net P&L"
          value={formatCurrency(netPnL)}
          icon={netPnL >= 0 ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
          trend={netPnL >= 0 ? 'positive' : 'negative'}
        />
        <MetricCard
          title="Total Profit"
          value={formatCurrency(totalProfit)}
          icon={<ArrowUpRight className="h-4 w-4 text-green-500" />}
          trend="positive"
        />
        <MetricCard
          title="Total Loss"
          value={formatCurrency(totalLoss)}
          icon={<ArrowDownRight className="h-4 w-4 text-red-500" />}
          trend="negative"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Positions Opened"
          value={positionsOpened}
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          title="Errors"
          value={errors}
          icon={<Activity className="h-4 w-4" />}
          trend={errors > 0 ? 'negative' : undefined}
        />
        <MetricCard
          title="Last Cycle"
          value={lastCycleCompleted}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>
      
      {getAgentSpecificMetrics()}
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'positive' | 'negative';
}

const MetricCard = ({ title, value, subtitle, icon, trend }: MetricCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div>
            <div className={`text-2xl font-bold ${trend === 'positive' ? 'text-green-500' : trend === 'negative' ? 'text-red-500' : ''}`}>
              {value}
            </div>
            {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
          </div>
          {icon && <div>{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentMetrics;
