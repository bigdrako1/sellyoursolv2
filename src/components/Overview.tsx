
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, AlertCircle, Clock, TrendingUp } from "lucide-react";

interface OverviewProps {
  totalProfit: number;
  activeStrategies: number;
  pendingTrades: number;
  totalTrades: number;
}

const Overview = ({ totalProfit, activeStrategies, pendingTrades, totalTrades }: OverviewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="trading-card">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400">Total Profit</p>
              <h3 className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} USD
              </h3>
            </div>
            <div className={`p-2 rounded-full ${totalProfit >= 0 ? 'bg-trading-success/20' : 'bg-trading-danger/20'}`}>
              {totalProfit >= 0 ? (
                <ArrowUp className="h-5 w-5 text-trading-success" />
              ) : (
                <ArrowDown className="h-5 w-5 text-trading-danger" />
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Updated just now
          </div>
        </div>
      </Card>
      
      <Card className="trading-card">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400">Active Strategies</p>
              <h3 className="text-2xl font-bold">{activeStrategies}</h3>
            </div>
            <div className="p-2 rounded-full bg-trading-highlight/20">
              <TrendingUp className="h-5 w-5 text-trading-highlight" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {activeStrategies > 0 ? 'Running autonomously' : 'No active strategies'}
          </div>
        </div>
      </Card>
      
      <Card className="trading-card">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400">Pending Trades</p>
              <h3 className="text-2xl font-bold">{pendingTrades}</h3>
            </div>
            <div className="p-2 rounded-full bg-trading-warning/20">
              <Clock className="h-5 w-5 text-trading-warning" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {pendingTrades > 0 ? 'Awaiting execution' : 'No pending trades'}
          </div>
        </div>
      </Card>
      
      <Card className="trading-card">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400">Total Trades</p>
              <h3 className="text-2xl font-bold">{totalTrades}</h3>
            </div>
            <div className="p-2 rounded-full bg-blue-500/20">
              <AlertCircle className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Lifetime executed trades
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Overview;
