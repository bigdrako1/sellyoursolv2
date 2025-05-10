import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BacktestingDashboard from '@/components/BacktestingDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart2, LineChart, History, Settings } from 'lucide-react';

const Backtesting: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-trading-dark text-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Strategy Backtesting</h1>
          <p className="text-gray-400">
            Test and optimize your trading strategies with historical data
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <BacktestingDashboard />
          </TabsContent>

          <TabsContent value="history">
            <Card className="card-with-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Backtest History
                </CardTitle>
                <CardDescription>
                  View and compare your previous backtest results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No backtest history available yet.</p>
                  <p className="text-sm">Run a backtest to see results here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="card-with-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Backtest Settings
                </CardTitle>
                <CardDescription>
                  Configure global settings for backtesting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Data Settings</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-gray-400">Default Data Source</label>
                            <select className="w-full bg-black/20 border border-white/10 rounded-md p-2 text-sm">
                              <option value="birdeye">BirdEye</option>
                              <option value="helius">Helius</option>
                              <option value="jupiter">Jupiter</option>
                              <option value="custom">Custom API</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-gray-400">Default Timeframe</label>
                            <select className="w-full bg-black/20 border border-white/10 rounded-md p-2 text-sm">
                              <option value="1m">1 Minute</option>
                              <option value="5m">5 Minutes</option>
                              <option value="15m">15 Minutes</option>
                              <option value="1h" selected>1 Hour</option>
                              <option value="4h">4 Hours</option>
                              <option value="1d">1 Day</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400">Cache Historical Data</label>
                          <div className="flex items-center">
                            <input type="checkbox" className="mr-2" checked />
                            <span className="text-sm">Enable data caching to improve performance</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Monte Carlo Simulation</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-gray-400">Default Iterations</label>
                            <input type="number" value="1000" className="w-full bg-black/20 border border-white/10 rounded-md p-2 text-sm" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-gray-400">Confidence Interval</label>
                            <select className="w-full bg-black/20 border border-white/10 rounded-md p-2 text-sm">
                              <option value="0.9">90%</option>
                              <option value="0.95" selected>95%</option>
                              <option value="0.99">99%</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400">Randomization Method</label>
                          <select className="w-full bg-black/20 border border-white/10 rounded-md p-2 text-sm">
                            <option value="shuffle" selected>Shuffle Trades</option>
                            <option value="bootstrap">Bootstrap Resampling</option>
                            <option value="random_sequence">Random Sequence</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Parameter Optimization</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-gray-400">Optimization Target</label>
                            <select className="w-full bg-black/20 border border-white/10 rounded-md p-2 text-sm">
                              <option value="sharpe" selected>Sharpe Ratio</option>
                              <option value="sortino">Sortino Ratio</option>
                              <option value="total_return">Total Return</option>
                              <option value="max_drawdown">Max Drawdown</option>
                              <option value="profit_factor">Profit Factor</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-gray-400">Max Combinations</label>
                            <input type="number" value="1000" className="w-full bg-black/20 border border-white/10 rounded-md p-2 text-sm" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400">Parallel Processing</label>
                          <div className="flex items-center">
                            <input type="checkbox" className="mr-2" checked />
                            <span className="text-sm">Enable parallel processing for faster optimization</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Report Settings</h3>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400">Default Metrics</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center">
                              <input type="checkbox" className="mr-2" checked />
                              <span className="text-sm">Sharpe Ratio</span>
                            </div>
                            <div className="flex items-center">
                              <input type="checkbox" className="mr-2" checked />
                              <span className="text-sm">Max Drawdown</span>
                            </div>
                            <div className="flex items-center">
                              <input type="checkbox" className="mr-2" checked />
                              <span className="text-sm">Win Rate</span>
                            </div>
                            <div className="flex items-center">
                              <input type="checkbox" className="mr-2" checked />
                              <span className="text-sm">Profit Factor</span>
                            </div>
                            <div className="flex items-center">
                              <input type="checkbox" className="mr-2" checked />
                              <span className="text-sm">Total Return</span>
                            </div>
                            <div className="flex items-center">
                              <input type="checkbox" className="mr-2" />
                              <span className="text-sm">Sortino Ratio</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400">Auto-save Results</label>
                          <div className="flex items-center">
                            <input type="checkbox" className="mr-2" checked />
                            <span className="text-sm">Automatically save backtest results</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="card-with-border">
            <CardHeader>
              <CardTitle>Backtesting Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Use a sufficient amount of historical data to ensure statistical significance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Test strategies across different market conditions (bull, bear, sideways)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Account for slippage and trading fees to get realistic results</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Avoid overfitting by testing strategies on out-of-sample data</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Focus on risk-adjusted returns rather than absolute returns</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-with-border">
            <CardHeader>
              <CardTitle>Advanced Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">✓</span>
                  <span>Monte Carlo simulation for strategy robustness testing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">✓</span>
                  <span>Parameter optimization to find optimal strategy settings</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">✓</span>
                  <span>Custom strategy builder with visual programming interface</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">✓</span>
                  <span>Import historical data from various sources and exchanges</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">✓</span>
                  <span>Strategy comparison tools for side-by-side analysis</span>
                </li>
                <li className="flex items-start mt-4">
                  <span className="text-yellow-400 mr-2">★</span>
                  <span className="text-yellow-400">New! Machine learning model integration for advanced predictions</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Backtesting;
