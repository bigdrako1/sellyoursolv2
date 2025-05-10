import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StrategyMonitor from '@/components/StrategyMonitor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, History, Settings, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const StrategyMonitoring: React.FC = () => {
  const { toast } = useToast();
  const [systemActive, setSystemActive] = useState(true);
  const [systemLatency, setSystemLatency] = useState<number | null>(42);
  
  // Handle strategy update
  const handleStrategyUpdate = (strategyId: string, enabled: boolean, parameters: any) => {
    console.log(`Strategy ${strategyId} updated:`, { enabled, parameters });
    
    toast({
      title: 'Strategy Updated',
      description: `Strategy settings have been updated and ${enabled ? 'enabled' : 'disabled'}.`,
    });
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-trading-dark text-white">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Strategy Monitoring</h1>
          <p className="text-gray-400">
            Monitor, optimize and adapt your trading strategies in real-time
          </p>
        </div>
        
        <Tabs defaultValue="monitor" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="monitor" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alerts
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
          
          <TabsContent value="monitor">
            <StrategyMonitor onStrategyUpdate={handleStrategyUpdate} />
          </TabsContent>
          
          <TabsContent value="alerts">
            <Card className="card-with-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Strategy Alerts
                </CardTitle>
                <CardDescription>
                  Notifications about strategy performance and issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-medium mb-1">Performance Degradation</h3>
                        <p className="text-sm text-gray-400 mb-2">
                          Front Running AI strategy performance has decreased by 15% in the last 24 hours
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
                        <h3 className="font-medium mb-1">Strategy Error</h3>
                        <p className="text-sm text-gray-400 mb-2">
                          Market Runner Detection strategy encountered 3 execution errors
                        </p>
                        <div className="text-xs text-red-500/80">
                          Detected 30 minutes ago • High Priority
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-medium mb-1">Optimization Opportunity</h3>
                        <p className="text-sm text-gray-400 mb-2">
                          Wallet Activity Tracker strategy can be optimized for 12% better performance
                        </p>
                        <div className="text-xs text-green-500/80">
                          Detected 4 hours ago • Low Priority
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card className="card-with-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Strategy History
                </CardTitle>
                <CardDescription>
                  Historical performance and changes to your strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-black/20 border border-white/5 rounded-lg">
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                        <Settings className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Strategy Parameters Updated</h3>
                        <p className="text-sm text-gray-400 mb-2">
                          Front Running AI sensitivity increased from 80 to 85
                        </p>
                        <div className="text-xs text-gray-500">
                          December 15, 2023 • 10:30 AM
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-black/20 border border-white/5 rounded-lg">
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mr-3">
                        <Activity className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Strategy Enabled</h3>
                        <p className="text-sm text-gray-400 mb-2">
                          Wallet Activity Tracker strategy was enabled
                        </p>
                        <div className="text-xs text-gray-500">
                          December 14, 2023 • 2:45 PM
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-black/20 border border-white/5 rounded-lg">
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                        <Settings className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Strategy Optimized</h3>
                        <p className="text-sm text-gray-400 mb-2">
                          Market Runner Detection strategy was automatically optimized
                        </p>
                        <div className="text-xs text-gray-500">
                          December 10, 2023 • 9:15 AM
                        </div>
                      </div>
                    </div>
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
                  Monitoring Settings
                </CardTitle>
                <CardDescription>
                  Configure global settings for strategy monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Monitoring settings will be available in a future update.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="card-with-border">
            <CardHeader>
              <CardTitle>Strategy Monitoring Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Regularly review strategy performance across different market conditions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Set up alerts for significant performance changes or errors</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Optimize strategies based on data-driven insights rather than emotions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Test strategy changes in a controlled environment before full deployment</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Document all strategy changes and their impact on performance</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="card-with-border">
            <CardHeader>
              <CardTitle>Monitoring Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>Real-time performance tracking for all active strategies</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>Automated strategy optimization based on performance data</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>Intelligent alerts for performance issues and opportunities</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>Historical performance tracking and strategy change history</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span>A/B testing framework for strategy parameter optimization</span>
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

export default StrategyMonitoring;
