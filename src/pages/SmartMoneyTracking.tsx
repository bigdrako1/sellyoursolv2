import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartMoneyTracker from '@/components/SmartMoneyTracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, AlertTriangle, Settings, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const SmartMoneyTracking: React.FC = () => {
  const { toast } = useToast();
  const [systemActive, setSystemActive] = useState(true);
  const [systemLatency, setSystemLatency] = useState<number | null>(42);
  const [trackedWallets, setTrackedWallets] = useState(3);

  // Handle wallet tracking
  const handleWalletTrack = (walletId: string, isTracked: boolean) => {
    console.log(`Wallet ${walletId} ${isTracked ? 'tracked' : 'untracked'}`);

    // Update tracked wallets count
    setTrackedWallets(prev => isTracked ? prev + 1 : Math.max(0, prev - 1));

    toast({
      title: isTracked ? 'Wallet Added' : 'Wallet Removed',
      description: `The wallet has been ${isTracked ? 'added to' : 'removed from'} your tracking list.`,
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-trading-dark text-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Smart Money Tracking</h1>
            <p className="text-gray-400">
              Track and analyze the activities of successful traders and whales
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-600">
              {trackedWallets} Wallets Tracked
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="tracker" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="tracker" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Tracker
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracker">
            <SmartMoneyTracker onWalletTrack={handleWalletTrack} />
          </TabsContent>

          <TabsContent value="alerts">
            <Card className="card-with-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Smart Money Alerts
                </CardTitle>
                <CardDescription>
                  Notifications about significant smart money movements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-medium mb-1">Whale Accumulation</h3>
                        <p className="text-sm text-gray-400 mb-2">
                          Whale wallets have accumulated over 500,000 SOL in the last 24 hours
                        </p>
                        <div className="text-xs text-yellow-500/80">
                          Detected 2 hours ago • Medium Priority
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-medium mb-1">Early Adopter Activity</h3>
                        <p className="text-sm text-gray-400 mb-2">
                          Early adopters are buying significant amounts of JTO token
                        </p>
                        <div className="text-xs text-green-500/80">
                          Detected 30 minutes ago • Low Priority
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-medium mb-1">Institutional Selling</h3>
                        <p className="text-sm text-gray-400 mb-2">
                          Institutional wallets have sold over 15,000 ETH in the last 12 hours
                        </p>
                        <div className="text-xs text-red-500/80">
                          Detected 4 hours ago • High Priority
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="card-with-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure how you want to be notified about smart money movements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                    <h3 className="text-sm font-medium mb-4">Notification Channels</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-blue-500/20">
                            <Bell className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">In-App Notifications</div>
                            <div className="text-xs text-gray-400">Receive alerts within the application</div>
                          </div>
                        </div>
                        <div className="flex items-center h-6">
                          <input type="checkbox" className="toggle toggle-primary" checked />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-green-500/20">
                            <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17.9 8.18C17.78 8.18 17.65 8.16 17.53 8.16C16.07 8.11 14.86 7.8 13.93 7.43C13.08 7.09 12.38 6.67 11.88 6.28C11.38 5.89 11.08 5.53 10.94 5.33C10.81 5.17 10.62 5.08 10.42 5.08C10.23 5.08 10.04 5.17 9.9 5.33C9.76 5.53 9.46 5.89 8.96 6.28C8.46 6.67 7.77 7.09 6.92 7.43C5.99 7.8 4.78 8.11 3.32 8.16C3.2 8.16 3.07 8.18 2.95 8.18C2.42 8.18 2 8.61 2 9.15V15.38C2 15.77 2.18 16.13 2.5 16.33C2.82 16.53 3.21 16.54 3.55 16.35C4.28 15.93 4.75 15.67 5.25 15.37C5.74 15.07 6.3 14.77 7.15 14.43C8.07 14.07 9.27 13.77 10.42 13.72C11.57 13.77 12.77 14.07 13.7 14.43C14.55 14.77 15.1 15.07 15.6 15.37C16.1 15.67 16.56 15.93 17.3 16.35C17.64 16.54 18.03 16.53 18.35 16.33C18.67 16.13 18.85 15.77 18.85 15.38V9.15C18.85 8.61 18.43 8.18 17.9 8.18Z" fill="currentColor"/>
                              <path d="M22 15.38C22 15.77 21.82 16.13 21.5 16.33C21.18 16.53 20.79 16.54 20.45 16.35C19.72 15.93 19.25 15.67 18.75 15.37C18.26 15.07 17.7 14.77 16.85 14.43C15.93 14.07 14.73 13.77 13.58 13.72C12.43 13.77 11.23 14.07 10.3 14.43C9.45 14.77 8.9 15.07 8.4 15.37C7.9 15.67 7.44 15.93 6.7 16.35C6.36 16.54 5.97 16.53 5.65 16.33C5.33 16.13 5.15 15.77 5.15 15.38V9.15C5.15 8.61 5.57 8.18 6.1 8.18C6.22 8.18 6.35 8.16 6.47 8.16C7.93 8.11 9.14 7.8 10.07 7.43C10.92 7.09 11.62 6.67 12.12 6.28C12.62 5.89 12.92 5.53 13.06 5.33C13.19 5.17 13.38 5.08 13.58 5.08C13.77 5.08 13.96 5.17 14.1 5.33C14.24 5.53 14.54 5.89 15.04 6.28C15.54 6.67 16.23 7.09 17.08 7.43C18.01 7.8 19.22 8.11 20.68 8.16C20.8 8.16 20.93 8.18 21.05 8.18C21.58 8.18 22 8.61 22 9.15V15.38Z" fill="currentColor"/>
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Telegram Notifications</div>
                            <div className="text-xs text-gray-400">Receive alerts via Telegram bot</div>
                          </div>
                        </div>
                        <div className="flex items-center h-6">
                          <input type="checkbox" className="toggle toggle-primary" checked />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-purple-500/20">
                            <svg className="h-4 w-4 text-purple-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4C14.89 4.21 14.76 4.48 14.67 4.69C13.09 4.46 11.51 4.46 9.95 4.69C9.85 4.48 9.72 4.21 9.61 4C8.1 4.26 6.66 4.71 5.33 5.33C3.38 8.24 2.75 11.05 3.07 13.83C4.77 15.11 6.4 15.9 8.01 16.42C8.34 15.97 8.63 15.49 8.89 14.98C8.26 14.74 7.65 14.44 7.08 14.08C7.19 14 7.29 13.92 7.39 13.84C10.94 15.45 14.84 15.45 18.36 13.84C18.46 13.92 18.56 14 18.67 14.08C18.09 14.44 17.48 14.74 16.85 14.98C17.1 15.49 17.39 15.97 17.73 16.42C19.34 15.9 20.98 15.11 22.67 13.83C23.05 10.57 22.05 7.8 19.27 5.33ZM9.12 12.38C8.04 12.38 7.16 11.41 7.16 10.24C7.16 9.07 8.03 8.09 9.12 8.09C10.21 8.09 11.09 9.07 11.08 10.24C11.09 11.41 10.21 12.38 9.12 12.38ZM15.62 12.38C14.54 12.38 13.66 11.41 13.66 10.24C13.66 9.07 14.53 8.09 15.62 8.09C16.71 8.09 17.59 9.07 17.58 10.24C17.58 11.41 16.71 12.38 15.62 12.38Z" fill="currentColor"/>
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Discord Notifications</div>
                            <div className="text-xs text-gray-400">Receive alerts via Discord webhook</div>
                          </div>
                        </div>
                        <div className="flex items-center h-6">
                          <input type="checkbox" className="toggle toggle-primary" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-red-500/20">
                            <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.64 8.8C16.49 10.38 15.84 14.22 15.51 15.99C15.37 16.74 15.09 16.99 14.83 17.02C14.25 17.07 13.81 16.64 13.25 16.27C12.37 15.69 11.87 15.33 11.02 14.77C10.03 14.12 10.67 13.76 11.24 13.18C11.39 13.03 13.95 10.7 14 10.49C14.0069 10.4582 14.006 10.4252 13.9973 10.3938C13.9886 10.3624 13.9724 10.3337 13.95 10.31C13.89 10.26 13.81 10.28 13.74 10.29C13.65 10.31 12.25 11.24 9.52 13.08C9.12 13.35 8.76 13.49 8.44 13.48C8.08 13.47 7.4 13.28 6.89 13.11C6.26 12.91 5.77 12.8 5.81 12.45C5.83 12.27 6.08 12.09 6.55 11.9C9.47 10.63 11.41 9.79 12.38 9.39C15.16 8.23 15.73 8.03 16.11 8.03C16.19 8.03 16.38 8.05 16.5 8.15C16.6 8.23 16.63 8.34 16.64 8.42C16.63 8.48 16.65 8.66 16.64 8.8Z" fill="currentColor"/>
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Email Notifications</div>
                            <div className="text-xs text-gray-400">Receive alerts via email</div>
                          </div>
                        </div>
                        <div className="flex items-center h-6">
                          <input type="checkbox" className="toggle toggle-primary" checked />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                    <h3 className="text-sm font-medium mb-4">Alert Types</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Whale Movements</div>
                          <div className="text-xs text-gray-400">Large transactions from known whale wallets</div>
                        </div>
                        <div className="flex items-center h-6">
                          <input type="checkbox" className="toggle toggle-primary" checked />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Smart Money Buys</div>
                          <div className="text-xs text-gray-400">Purchases from wallets with high success rates</div>
                        </div>
                        <div className="flex items-center h-6">
                          <input type="checkbox" className="toggle toggle-primary" checked />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Smart Money Sells</div>
                          <div className="text-xs text-gray-400">Sales from wallets with high success rates</div>
                        </div>
                        <div className="flex items-center h-6">
                          <input type="checkbox" className="toggle toggle-primary" checked />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Early Adopter Activity</div>
                          <div className="text-xs text-gray-400">Transactions from wallets that find gems early</div>
                        </div>
                        <div className="flex items-center h-6">
                          <input type="checkbox" className="toggle toggle-primary" checked />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Institutional Activity</div>
                          <div className="text-xs text-gray-400">Transactions from known institutional wallets</div>
                        </div>
                        <div className="flex items-center h-6">
                          <input type="checkbox" className="toggle toggle-primary" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                    <h3 className="text-sm font-medium mb-4">Notification Thresholds</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm mb-1 block">Minimum Transaction Value</label>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100000" value="5000" className="w-full" />
                          <span className="text-sm whitespace-nowrap">$5,000</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm mb-1 block">Minimum Wallet Success Rate</label>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" value="75" className="w-full" />
                          <span className="text-sm whitespace-nowrap">75%</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm mb-1 block">Maximum Daily Notifications</label>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="50" value="10" className="w-full" />
                          <span className="text-sm whitespace-nowrap">10</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button className="px-4 py-2 bg-trading-highlight hover:bg-trading-highlight/80 text-white rounded-md">
                      Save Notification Settings
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="card-with-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Tracking Settings
                </CardTitle>
                <CardDescription>
                  Configure your smart money tracking preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                    <h3 className="text-sm font-medium mb-4">Wallet Classification</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm mb-1 block">Whale Classification Threshold</label>
                        <div className="flex items-center gap-2">
                          <input type="range" min="100000" max="10000000" value="1000000" step="100000" className="w-full" />
                          <span className="text-sm whitespace-nowrap">$1,000,000</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Wallets with holdings above this value will be classified as whales</p>
                      </div>

                      <div>
                        <label className="text-sm mb-1 block">Smart Money Success Rate Threshold</label>
                        <div className="flex items-center gap-2">
                          <input type="range" min="50" max="100" value="80" className="w-full" />
                          <span className="text-sm whitespace-nowrap">80%</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Wallets with success rates above this value will be classified as smart money</p>
                      </div>

                      <div>
                        <label className="text-sm mb-1 block">Early Adopter Classification</label>
                        <div className="flex items-center gap-2">
                          <input type="range" min="1" max="30" value="7" className="w-full" />
                          <span className="text-sm whitespace-nowrap">7 days</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Wallets that buy tokens within this many days of creation will be classified as early adopters</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                    <h3 className="text-sm font-medium mb-4">Transaction Monitoring</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Real-time Transaction Monitoring</div>
                          <div className="text-xs text-gray-400">Monitor transactions as they happen on-chain</div>
                        </div>
                        <div className="flex items-center h-6">
                          <input type="checkbox" className="toggle toggle-primary" checked />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Historical Analysis</div>
                          <div className="text-xs text-gray-400">Analyze historical transactions for patterns</div>
                        </div>
                        <div className="flex items-center h-6">
                          <input type="checkbox" className="toggle toggle-primary" checked />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Wallet Profitability Tracking</div>
                          <div className="text-xs text-gray-400">Track and calculate wallet profitability over time</div>
                        </div>
                        <div className="flex items-center h-6">
                          <input type="checkbox" className="toggle toggle-primary" checked />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Network Analysis</div>
                          <div className="text-xs text-gray-400">Analyze connections between wallets</div>
                        </div>
                        <div className="flex items-center h-6">
                          <input type="checkbox" className="toggle toggle-primary" checked />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Token Accumulation Tracking</div>
                          <div className="text-xs text-gray-400">Track token accumulation by wallet type</div>
                        </div>
                        <div className="flex items-center h-6">
                          <input type="checkbox" className="toggle toggle-primary" checked />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                    <h3 className="text-sm font-medium mb-4">Data Sources</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-blue-500/20">
                            <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                              <path d="M2 17L12 22L22 17" fill="currentColor"/>
                              <path d="M2 12L12 17L22 12" fill="currentColor"/>
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Helius API</div>
                            <div className="text-xs text-gray-400">Enhanced blockchain data and analytics</div>
                          </div>
                        </div>
                        <div className="flex items-center h-6">
                          <input type="checkbox" className="toggle toggle-primary" checked />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-purple-500/20">
                            <svg className="h-4 w-4 text-purple-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="currentColor"/>
                              <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="currentColor"/>
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Jupiter API</div>
                            <div className="text-xs text-gray-400">Token price and liquidity data</div>
                          </div>
                        </div>
                        <div className="flex items-center h-6">
                          <input type="checkbox" className="toggle toggle-primary" checked />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-green-500/20">
                            <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                              <path d="M2 17L12 22L22 17" fill="currentColor"/>
                              <path d="M2 12L12 17L22 12" fill="currentColor"/>
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium">BirdEye API</div>
                            <div className="text-xs text-gray-400">Token analytics and market data</div>
                          </div>
                        </div>
                        <div className="flex items-center h-6">
                          <input type="checkbox" className="toggle toggle-primary" checked />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-yellow-500/20">
                            <svg className="h-4 w-4 text-yellow-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="currentColor"/>
                              <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="currentColor"/>
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Custom API</div>
                            <div className="text-xs text-gray-400">Your own data source</div>
                          </div>
                        </div>
                        <div className="flex items-center h-6">
                          <input type="checkbox" className="toggle toggle-primary" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="text-sm mb-1 block">Custom API Endpoint</label>
                      <input type="text" placeholder="https://your-api-endpoint.com" className="w-full bg-black/20 border border-white/10 rounded-md p-2 text-sm" />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button className="px-4 py-2 bg-trading-highlight hover:bg-trading-highlight/80 text-white rounded-md">
                      Save Tracking Settings
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="card-with-border">
            <CardHeader>
              <CardTitle>Smart Money Tracking Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Identify potential market movements before they happen</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Learn from the trading patterns of successful traders</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Discover new tokens before they gain mainstream attention</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Understand institutional and whale accumulation patterns</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Receive alerts when significant wallet movements occur</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-with-border">
            <CardHeader>
              <CardTitle>Smart Money Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>Advanced wallet classification and profitability tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>Network analysis to identify connected wallets and patterns</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>Token accumulation tracking across different wallet types</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>Real-time alerts for significant smart money movements</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>Historical performance analysis of tracked wallets</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer systemActive={systemActive} systemLatency={systemLatency} />
    </div>
  );
};

export default SmartMoneyTracking;
