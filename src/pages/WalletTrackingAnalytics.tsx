import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BarChart3, Wallet, Activity, LineChart } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

const WalletTrackingAnalytics: React.FC = () => {
  const [searchParams] = useSearchParams();
  const walletId = searchParams.get('wallet');
  const viewMode = searchParams.get('view');
  const [walletData, setWalletData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching wallet data
    const fetchWalletData = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be an API call to get wallet data
        await new Promise(resolve => setTimeout(resolve, 800));

        if (walletId) {
          // Mock data for a specific wallet
          setWalletData({
            id: walletId,
            alias: `Wallet ${walletId.substring(0, 4)}`,
            address: `B8oM${walletId}hXHyQT`,
            balance: 127492,
            performance: 24.8,
            trades: 42
          });
        } else {
          // Mock data for all wallets
          setWalletData({
            totalValue: 127492,
            performance: 24.8,
            walletCount: 7
          });
        }
      } catch (error) {
        console.error("Error fetching wallet data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
  }, [walletId]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link to="/wallet-tracking">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Wallet Tracking
            </Button>
          </Link>
          <h2 className="text-3xl font-bold">
            {walletId ? `Wallet Analytics: ${isLoading ? 'Loading...' : walletData?.alias || 'Unknown Wallet'}` : 'All Wallets Analytics'}
          </h2>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Wallet Performance Analytics
          </CardTitle>
          <CardDescription>
            Detailed analytics for tracked wallets and their trading performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trades">Trade History</TabsTrigger>
              <TabsTrigger value="tokens">Token Allocation</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">$127,492</div>
                    <p className="text-sm text-muted-foreground">Total Value Tracked</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-500">+24.8%</div>
                    <p className="text-sm text-muted-foreground">30-Day Performance</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">7</div>
                    <p className="text-sm text-muted-foreground">Active Wallets Tracked</p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-card p-4 rounded-lg border mb-4">
                <h3 className="text-lg font-medium mb-2">Performance Summary</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Tracked wallets have outperformed the market by 18.3% over the last 30 days.
                </p>
                <div className="h-64 bg-muted/20 rounded-md flex items-center justify-center">
                  <LineChart className="h-8 w-8 text-muted" />
                  <span className="ml-2 text-muted">Performance chart will appear here</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trades">
              <div className="bg-card p-4 rounded-lg border mb-4">
                <h3 className="text-lg font-medium mb-2">Recent Trades</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Wallet</th>
                        <th className="text-left py-2">Token</th>
                        <th className="text-left py-2">Type</th>
                        <th className="text-right py-2">Amount</th>
                        <th className="text-right py-2">Value</th>
                        <th className="text-right py-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">B8oM...hXHyQT</td>
                        <td className="py-2">BONK</td>
                        <td className="py-2 text-green-500">Buy</td>
                        <td className="py-2 text-right">2,500,000</td>
                        <td className="py-2 text-right">$1,250</td>
                        <td className="py-2 text-right">2h ago</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">HxFL...yfhm</td>
                        <td className="py-2">JTO</td>
                        <td className="py-2 text-red-500">Sell</td>
                        <td className="py-2 text-right">45</td>
                        <td className="py-2 text-right">$890</td>
                        <td className="py-2 text-right">5h ago</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">B8oM...hXHyQT</td>
                        <td className="py-2">WIF</td>
                        <td className="py-2 text-green-500">Buy</td>
                        <td className="py-2 text-right">1,200</td>
                        <td className="py-2 text-right">$3,600</td>
                        <td className="py-2 text-right">8h ago</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tokens">
              <div className="bg-card p-4 rounded-lg border mb-4">
                <h3 className="text-lg font-medium mb-2">Token Allocation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-64 bg-muted/20 rounded-md flex items-center justify-center">
                    <Activity className="h-8 w-8 text-muted" />
                    <span className="ml-2 text-muted">Allocation chart will appear here</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Top Holdings</h4>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span>SOL</span>
                        <span>42.5%</span>
                      </li>
                      <li className="flex justify-between">
                        <span>JTO</span>
                        <span>18.3%</span>
                      </li>
                      <li className="flex justify-between">
                        <span>BONK</span>
                        <span>12.7%</span>
                      </li>
                      <li className="flex justify-between">
                        <span>WIF</span>
                        <span>8.2%</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Other</span>
                        <span>18.3%</span>
                      </li>
                    </ul>
                  </div>
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
