import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  BarChart3,
  LineChart,
  PieChart,
  Calendar,
  Wallet,
  ArrowLeft,
  Download,
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";

// Mock data for wallet analytics
const walletData = {
  address: "3FTHyP7TLcqd6C969eGHQ2QfnpRFmfqbKA2MnzTcf3j9",
  alias: "Whale Trader 1",
  stats: {
    totalTrades: 47,
    successRate: 88,
    avgHoldTime: "3.2 days",
    profitLoss: "+324%",
    balance: "$1,250,000",
    tokens: 12
  },
  recentActivity: [
    { date: "2023-11-01", action: "Buy", token: "SOL", amount: 1200, price: "$120.45" },
    { date: "2023-11-02", action: "Sell", token: "BONK", amount: 15000000, price: "$0.00002" },
    { date: "2023-11-03", action: "Buy", token: "JUP", amount: 5000, price: "$1.23" },
    { date: "2023-11-04", action: "Buy", token: "PYTH", amount: 2500, price: "$0.45" },
    { date: "2023-11-05", action: "Sell", token: "JUP", amount: 5000, price: "$1.56" }
  ]
};

const WalletTrackingAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState("overview");
  const [timeRange, setTimeRange] = React.useState("30d");

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: "Auto Trading", path: "/auto-trading" },
        { label: "Wallet Tracking", path: "/wallet-tracking" },
        { label: "Analytics", path: "/wallet-tracking/analytics" }
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wallet Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">
            Detailed analysis of wallet trading patterns and performance
          </p>
        </div>

        <div className="flex gap-2">
          <Link to="/wallet-tracking">
            <Button variant="outline" className="bg-trading-darkAccent border-white/10 hover:bg-white/10">
              <ArrowLeft size={16} className="mr-2" />
              Back to Wallets
            </Button>
          </Link>

          <Button>
            <RefreshCw size={16} className="mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      <Card className="card-with-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-400" />
              <CardTitle>{walletData.alias}</CardTitle>
            </div>
            <Badge variant="outline" className="bg-purple-900/20 text-purple-300 border-purple-500/20">
              Solana
            </Badge>
          </div>
          <CardDescription className="font-mono">
            {walletData.address}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-trading-darkAccent border-white/5">
              <CardContent className="pt-6">
                <div className="text-xs text-gray-400">Total Trades</div>
                <div className="text-2xl font-bold mt-1">{walletData.stats.totalTrades}</div>
              </CardContent>
            </Card>
            <Card className="bg-trading-darkAccent border-white/5">
              <CardContent className="pt-6">
                <div className="text-xs text-gray-400">Success Rate</div>
                <div className="text-2xl font-bold mt-1 text-green-500">{walletData.stats.successRate}%</div>
              </CardContent>
            </Card>
            <Card className="bg-trading-darkAccent border-white/5">
              <CardContent className="pt-6">
                <div className="text-xs text-gray-400">Profit/Loss</div>
                <div className="text-2xl font-bold mt-1 text-green-500">{walletData.stats.profitLoss}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-black/20 border-white/10 border">
              <TabsTrigger value="overview" className="gap-1">
                <BarChart3 size={14} /> Overview
              </TabsTrigger>
              <TabsTrigger value="trades" className="gap-1">
                <LineChart size={14} /> Trades
              </TabsTrigger>
              <TabsTrigger value="tokens" className="gap-1">
                <PieChart size={14} /> Tokens
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1">
                <Calendar size={14} /> Calendar
              </TabsTrigger>
            </TabsList>

            <div className="flex justify-end mt-4 mb-2">
              <div className="flex bg-black/20 rounded-md p-1">
                <Button 
                  variant={timeRange === "7d" ? "default" : "ghost"} 
                  size="sm"
                  className="text-xs"
                  onClick={() => setTimeRange("7d")}
                >
                  7D
                </Button>
                <Button 
                  variant={timeRange === "30d" ? "default" : "ghost"} 
                  size="sm"
                  className="text-xs"
                  onClick={() => setTimeRange("30d")}
                >
                  30D
                </Button>
                <Button 
                  variant={timeRange === "90d" ? "default" : "ghost"} 
                  size="sm"
                  className="text-xs"
                  onClick={() => setTimeRange("90d")}
                >
                  90D
                </Button>
                <Button 
                  variant={timeRange === "all" ? "default" : "ghost"} 
                  size="sm"
                  className="text-xs"
                  onClick={() => setTimeRange("all")}
                >
                  All
                </Button>
              </div>
            </div>

            <TabsContent value="overview" className="mt-4">
              <div className="bg-black/20 rounded-lg p-4 h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 size={48} className="mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">Wallet performance chart would appear here</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Showing data for the last {timeRange === "7d" ? "7 days" : timeRange === "30d" ? "30 days" : timeRange === "90d" ? "90 days" : "all time"}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trades" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-black/20 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs text-gray-400 border-b border-white/5">
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Action</th>
                          <th className="px-4 py-2 text-left">Token</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                          <th className="px-4 py-2 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {walletData.recentActivity.map((activity, index) => (
                          <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-3">{activity.date}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={
                                activity.action === "Buy" 
                                  ? "bg-green-900/20 text-green-400 border-green-500/20" 
                                  : "bg-red-900/20 text-red-400 border-red-500/20"
                              }>
                                {activity.action}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">{activity.token}</td>
                            <td className="px-4 py-3 text-right">{activity.amount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">{activity.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tokens" className="mt-4">
              <div className="bg-black/20 rounded-lg p-4 h-64 flex items-center justify-center">
                <div className="text-center">
                  <PieChart size={48} className="mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">Token allocation chart would appear here</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Showing data for the last {timeRange === "7d" ? "7 days" : timeRange === "30d" ? "30 days" : timeRange === "90d" ? "90 days" : "all time"}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="mt-4">
              <div className="bg-black/20 rounded-lg p-4 h-64 flex items-center justify-center">
                <div className="text-center">
                  <Calendar size={48} className="mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">Trading activity calendar would appear here</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Showing data for the last {timeRange === "7d" ? "7 days" : timeRange === "30d" ? "30 days" : timeRange === "90d" ? "90 days" : "all time"}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletTrackingAnalytics;
