import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RiskManagementDashboard from '@/components/RiskManagementDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, BarChart2, Settings } from 'lucide-react';

const RiskManagement: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-trading-dark text-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Risk Management</h1>
          <p className="text-gray-400">
            Advanced tools to manage and optimize your trading risk
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risk Alerts
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <RiskManagementDashboard />
          </TabsContent>

          <TabsContent value="alerts">
            <Card className="card-with-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Risk Alerts
                </CardTitle>
                <CardDescription>
                  Notifications about potential risk issues in your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-medium mb-1">High Correlation Risk</h3>
                        <p className="text-sm text-gray-400 mb-2">
                          Your portfolio contains multiple assets with high correlation (greater than 0.8)
                        </p>
                        <div className="text-xs text-yellow-500/80">
                          Detected 2 hours ago • Medium Priority
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-medium mb-1">Position Size Limit Exceeded</h3>
                        <p className="text-sm text-gray-400 mb-2">
                          SOL position exceeds maximum position size limit (25% vs 20% limit)
                        </p>
                        <div className="text-xs text-red-500/80">
                          Detected 30 minutes ago • High Priority
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-medium mb-1">Volatility Increase</h3>
                        <p className="text-sm text-gray-400 mb-2">
                          Market volatility has increased by 35% in the last 24 hours
                        </p>
                        <div className="text-xs text-blue-500/80">
                          Detected 4 hours ago • Low Priority
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="card-with-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5" />
                  Risk Reports
                </CardTitle>
                <CardDescription>
                  Detailed analysis of your portfolio risk metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                      <h3 className="text-sm font-medium mb-2">Portfolio Risk Score</h3>
                      <div className="flex items-center gap-2">
                        <div className="text-3xl font-bold text-yellow-500">68</div>
                        <div className="text-xs text-gray-400">/ 100</div>
                      </div>
                      <div className="mt-2">
                        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 rounded-full" style={{ width: '68%' }}></div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-gray-400">
                          <span>High Risk</span>
                          <span>Low Risk</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                      <h3 className="text-sm font-medium mb-2">Diversification Score</h3>
                      <div className="flex items-center gap-2">
                        <div className="text-3xl font-bold text-green-500">82</div>
                        <div className="text-xs text-gray-400">/ 100</div>
                      </div>
                      <div className="mt-2">
                        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '82%' }}></div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-gray-400">
                          <span>Poor</span>
                          <span>Excellent</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                      <h3 className="text-sm font-medium mb-2">Volatility Exposure</h3>
                      <div className="flex items-center gap-2">
                        <div className="text-3xl font-bold text-red-500">75</div>
                        <div className="text-xs text-gray-400">/ 100</div>
                      </div>
                      <div className="mt-2">
                        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-gray-400">
                          <span>Low</span>
                          <span>High</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                    <h3 className="text-sm font-medium mb-4">Risk Breakdown by Position</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left pb-2">Asset</th>
                            <th className="text-right pb-2">Allocation</th>
                            <th className="text-right pb-2">Risk Contribution</th>
                            <th className="text-right pb-2">Volatility</th>
                            <th className="text-right pb-2">Max Drawdown</th>
                            <th className="text-right pb-2">Risk Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-white/5">
                            <td className="py-3">SOL</td>
                            <td className="text-right py-3">25.4%</td>
                            <td className="text-right py-3">32.8%</td>
                            <td className="text-right py-3">65.2%</td>
                            <td className="text-right py-3">18.5%</td>
                            <td className="text-right py-3">
                              <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-500">Medium</span>
                            </td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-3">USDC</td>
                            <td className="text-right py-3">35.2%</td>
                            <td className="text-right py-3">5.1%</td>
                            <td className="text-right py-3">1.2%</td>
                            <td className="text-right py-3">0.5%</td>
                            <td className="text-right py-3">
                              <span className="px-2 py-1 rounded bg-green-500/20 text-green-500">Low</span>
                            </td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-3">JUP</td>
                            <td className="text-right py-3">15.8%</td>
                            <td className="text-right py-3">22.3%</td>
                            <td className="text-right py-3">78.5%</td>
                            <td className="text-right py-3">25.2%</td>
                            <td className="text-right py-3">
                              <span className="px-2 py-1 rounded bg-red-500/20 text-red-500">High</span>
                            </td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-3">BONK</td>
                            <td className="text-right py-3">8.6%</td>
                            <td className="text-right py-3">18.9%</td>
                            <td className="text-right py-3">92.1%</td>
                            <td className="text-right py-3">35.8%</td>
                            <td className="text-right py-3">
                              <span className="px-2 py-1 rounded bg-red-500/20 text-red-500">High</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3">WIF</td>
                            <td className="text-right py-3">15.0%</td>
                            <td className="text-right py-3">20.9%</td>
                            <td className="text-right py-3">85.3%</td>
                            <td className="text-right py-3">28.7%</td>
                            <td className="text-right py-3">
                              <span className="px-2 py-1 rounded bg-red-500/20 text-red-500">High</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                      <h3 className="text-sm font-medium mb-4">Risk Correlation Matrix</h3>
                      <div className="h-64">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr>
                                <th className="text-left"></th>
                                <th className="text-center p-2">SOL</th>
                                <th className="text-center p-2">USDC</th>
                                <th className="text-center p-2">JUP</th>
                                <th className="text-center p-2">BONK</th>
                                <th className="text-center p-2">WIF</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="font-medium p-2">SOL</td>
                                <td className="text-center p-2 bg-green-500/50">1.00</td>
                                <td className="text-center p-2 bg-blue-500/10">0.12</td>
                                <td className="text-center p-2 bg-yellow-500/30">0.65</td>
                                <td className="text-center p-2 bg-yellow-500/20">0.58</td>
                                <td className="text-center p-2 bg-yellow-500/20">0.52</td>
                              </tr>
                              <tr>
                                <td className="font-medium p-2">USDC</td>
                                <td className="text-center p-2 bg-blue-500/10">0.12</td>
                                <td className="text-center p-2 bg-green-500/50">1.00</td>
                                <td className="text-center p-2 bg-blue-500/10">0.08</td>
                                <td className="text-center p-2 bg-blue-500/10">0.05</td>
                                <td className="text-center p-2 bg-blue-500/10">0.10</td>
                              </tr>
                              <tr>
                                <td className="font-medium p-2">JUP</td>
                                <td className="text-center p-2 bg-yellow-500/30">0.65</td>
                                <td className="text-center p-2 bg-blue-500/10">0.08</td>
                                <td className="text-center p-2 bg-green-500/50">1.00</td>
                                <td className="text-center p-2 bg-yellow-500/40">0.72</td>
                                <td className="text-center p-2 bg-yellow-500/30">0.68</td>
                              </tr>
                              <tr>
                                <td className="font-medium p-2">BONK</td>
                                <td className="text-center p-2 bg-yellow-500/20">0.58</td>
                                <td className="text-center p-2 bg-blue-500/10">0.05</td>
                                <td className="text-center p-2 bg-yellow-500/40">0.72</td>
                                <td className="text-center p-2 bg-green-500/50">1.00</td>
                                <td className="text-center p-2 bg-yellow-500/40">0.78</td>
                              </tr>
                              <tr>
                                <td className="font-medium p-2">WIF</td>
                                <td className="text-center p-2 bg-yellow-500/20">0.52</td>
                                <td className="text-center p-2 bg-blue-500/10">0.10</td>
                                <td className="text-center p-2 bg-yellow-500/30">0.68</td>
                                <td className="text-center p-2 bg-yellow-500/40">0.78</td>
                                <td className="text-center p-2 bg-green-500/50">1.00</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                      <h3 className="text-sm font-medium mb-4">Risk Recommendations</h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                          <div className="flex items-start">
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-medium">High Correlation Risk</h4>
                              <p className="text-xs text-gray-400 mt-1">
                                Your meme tokens (BONK, WIF) have a high correlation (0.78). Consider diversifying to reduce risk.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                          <div className="flex items-start">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-medium">Volatility Exposure</h4>
                              <p className="text-xs text-gray-400 mt-1">
                                39.4% of your portfolio is in high-volatility assets. Consider rebalancing to reduce risk.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                          <div className="flex items-start">
                            <Shield className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-medium">Stablecoin Allocation</h4>
                              <p className="text-xs text-gray-400 mt-1">
                                Your stablecoin allocation (35.2%) provides good protection against market downturns.
                              </p>
                            </div>
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
              <CardTitle>Risk Management Principles</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Always prioritize capital preservation over profit maximization</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Use position sizing to limit exposure to any single asset</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Implement stop losses to limit downside on all positions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Diversify across uncorrelated assets to reduce portfolio risk</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Scale position sizes based on volatility and market conditions</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-with-border">
            <CardHeader>
              <CardTitle>Risk Management Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>Dynamic position sizing based on volatility and risk parameters</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>Trailing stop loss implementation to lock in profits</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>Portfolio correlation analysis to identify concentration risk</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>Automated scale-out strategy at predefined profit levels</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>Risk alerts for portfolio imbalances and market conditions</span>
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

export default RiskManagement;
