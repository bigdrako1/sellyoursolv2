
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Brain, Zap, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { getConnectedWallet } from "@/utils/walletUtils";
import { heliusApiCall } from "@/utils/apiUtils";

interface OverviewProps {
  totalProfit: number;
  activeStrategies: number;
  pendingTrades: number;
  totalTrades: number;
}

const Overview = ({ totalProfit = 0, activeStrategies = 0, pendingTrades = 0, totalTrades = 0 }: OverviewProps) => {
  const [realizedProfit, setRealizedProfit] = useState(0);
  const [unrealizedProfit, setUnrealizedProfit] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchWalletPnL = async () => {
      setLoading(true);
      try {
        const walletAddress = getConnectedWallet();
        
        if (walletAddress) {
          try {
            // In a real app, this would fetch from Helius API
            const transactions = await heliusApiCall("getSignaturesForAddress", [walletAddress]);
            
            if (transactions && Array.isArray(transactions)) {
              // Process transaction data to calculate PnL
              // This is simplified - in a real implementation, we would need to track
              // buys and sells to calculate actual realized and unrealized profit
              let calculatedRealizedProfit = 0;
              let calculatedUnrealizedProfit = 0;
              
              setRealizedProfit(calculatedRealizedProfit);
              setUnrealizedProfit(calculatedUnrealizedProfit);
            }
          } catch (error) {
            console.error("Error calculating wallet PnL:", error);
            setRealizedProfit(0);
            setUnrealizedProfit(0);
          }
        }
      } catch (error) {
        console.error("Error fetching wallet PnL:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWalletPnL();
  }, []);

  // Calculate total profit
  const calculatedTotalProfit = realizedProfit + unrealizedProfit;
  
  // Calculate percentage change (avoiding division by zero)
  const percentChange = calculatedTotalProfit !== 0 ? ((calculatedTotalProfit / 1000) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 bg-trading-darkAccent border-white/5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400">Total PnL</p>
            <div className="flex items-baseline mt-1">
              <h3 className={`text-2xl font-bold ${calculatedTotalProfit >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                ${Math.abs(calculatedTotalProfit).toFixed(2)}
              </h3>
              <span className={`ml-2 text-sm flex items-center ${calculatedTotalProfit >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                {calculatedTotalProfit >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {Math.abs(percentChange).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className={`p-2 rounded-full ${calculatedTotalProfit >= 0 ? 'bg-trading-success/20' : 'bg-trading-danger/20'}`}>
            {calculatedTotalProfit >= 0 ? <ArrowUpRight className="text-trading-success" /> : <ArrowDownRight className="text-trading-danger" />}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Realized</span>
            <span className={realizedProfit >= 0 ? 'text-trading-success' : 'text-trading-danger'}>
              ${realizedProfit.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-400 mt-1">
            <span>Unrealized</span>
            <span className={unrealizedProfit >= 0 ? 'text-trading-success' : 'text-trading-danger'}>
              ${unrealizedProfit.toFixed(2)}
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
            <span className="text-trading-success">0%</span>
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
            <span>0m 0s</span>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-trading-darkAccent border-white/5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Trades</p>
            <div className="flex items-baseline mt-1">
              <h3 className="text-2xl font-bold">{totalTrades}</h3>
              <span className="ml-2 text-sm text-trading-secondary">
                24h
              </span>
            </div>
          </div>
          <div className="p-2 rounded-full bg-trading-secondary/20">
            <Wallet className="text-trading-secondary" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Win Rate</span>
            <span className="text-trading-success">0%</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Overview;
