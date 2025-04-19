
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Brain, Zap } from "lucide-react";

interface OverviewProps {
  totalProfit: number;
  activeStrategies: number;
  pendingTrades: number;
  totalTrades: number;
}

const Overview = ({ totalProfit, activeStrategies, pendingTrades, totalTrades }: OverviewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 bg-trading-darkAccent border-white/5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400">Total PnL</p>
            <div className="flex items-baseline mt-1">
              <h3 className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                ${Math.abs(totalProfit).toFixed(2)}
              </h3>
              <span className={`ml-2 text-sm flex items-center ${totalProfit >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                {totalProfit >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {Math.abs(((totalProfit / 1000) * 100)).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className={`p-2 rounded-full ${totalProfit >= 0 ? 'bg-trading-success/20' : 'bg-trading-danger/20'}`}>
            {totalProfit >= 0 ? <ArrowUpRight className="text-trading-success" /> : <ArrowDownRight className="text-trading-danger" />}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Realized</span>
            <span className={totalProfit >= 0 ? 'text-trading-success' : 'text-trading-danger'}>
              ${(totalProfit * 0.8).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-400 mt-1">
            <span>Unrealized</span>
            <span className={totalProfit >= 0 ? 'text-trading-success' : 'text-trading-danger'}>
              ${(totalProfit * 0.2).toFixed(2)}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-trading-darkAccent border-white/5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400">Active Strategies</p>
            <div className="flex items-baseline mt-1">
              <h3 className="text-2xl font-bold">{activeStrategies}</h3>
              <span className="ml-2 text-sm text-trading-highlight">/ 3</span>
            </div>
          </div>
          <div className="p-2 rounded-full bg-purple-500/20">
            <Brain className="text-purple-400" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Success Rate</span>
            <span className="text-trading-success">78%</span>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-trading-darkAccent border-white/5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400">Pending Trades</p>
            <div className="flex items-baseline mt-1">
              <h3 className="text-2xl font-bold">{pendingTrades}</h3>
              <span className="ml-2 text-sm text-trading-highlight">Active</span>
            </div>
          </div>
          <div className="p-2 rounded-full bg-trading-highlight/20">
            <Zap className="text-trading-highlight" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Avg Duration</span>
            <span>2m 15s</span>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-trading-darkAccent border-white/5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Trades</p>
            <div className="flex items-baseline mt-1">
              <h3 className="text-2xl font-bold">{totalTrades}</h3>
              <span className="ml-2 text-sm text-trading-success">
                <ArrowUpRight size={16} className="inline" />
                24h
              </span>
            </div>
          </div>
          <div className="p-2 rounded-full bg-trading-success/20">
            <ArrowUpRight className="text-trading-success" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Win Rate</span>
            <span className="text-trading-success">82%</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Overview;
