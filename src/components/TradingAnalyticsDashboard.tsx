
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Users, DollarSign } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AnalyticsCardProps {
  title: string;
  value: string;
  trend: number;
  description: string;
  icon: React.ReactNode;
}

const AnalyticsCard = ({ title, value, trend, description, icon }: AnalyticsCardProps) => {
  return (
    <Card className="bg-trading-darkAccent border-trading-highlight/20">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <div className="flex items-baseline mt-1">
              <h3 className="text-2xl font-bold">{value}</h3>
              <span className={`ml-2 text-sm font-medium ${trend >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <div className="p-2 rounded-full bg-trading-highlight/10">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TradingAnalyticsDashboard = () => {
  // Sample data for the analytics dashboard
  const metricsData = {
    scannedTokens: { value: '186', trend: 12, description: 'Last 24 hours' },
    qualityTokens: { value: '32', trend: 8, description: '17% qualify rate' },
    averageRoi: { value: '+24%', trend: 5, description: 'From qualified tokens' },
    alertAccuracy: { value: '89%', trend: -2, description: 'True positive rate' }
  };
  
  const securityStats = {
    rugsIdentified: 14,
    honeypotsPrevented: 8,
    safeTokens: 32,
    totalScanned: 54
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Tokens Scanned"
          value={metricsData.scannedTokens.value}
          trend={metricsData.scannedTokens.trend}
          description={metricsData.scannedTokens.description}
          icon={<Users className="h-5 w-5 text-trading-highlight" />}
        />
        
        <AnalyticsCard
          title="Quality Tokens Found"
          value={metricsData.qualityTokens.value}
          trend={metricsData.qualityTokens.trend}
          description={metricsData.qualityTokens.description}
          icon={<CheckCircle className="h-5 w-5 text-trading-success" />}
        />
        
        <AnalyticsCard
          title="Average ROI"
          value={metricsData.averageRoi.value}
          trend={metricsData.averageRoi.trend}
          description={metricsData.averageRoi.description}
          icon={<TrendingUp className="h-5 w-5 text-trading-success" />}
        />
        
        <AnalyticsCard
          title="Alert Accuracy"
          value={metricsData.alertAccuracy.value}
          trend={metricsData.alertAccuracy.trend}
          description={metricsData.alertAccuracy.description}
          icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-trading-darkAccent border-trading-highlight/20">
          <CardHeader>
            <CardTitle className="text-lg">Security Statistics</CardTitle>
            <CardDescription>Token security analysis results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Rug Pulls Identified</span>
                  <span className="text-sm font-medium text-trading-danger">{securityStats.rugsIdentified}</span>
                </div>
                <Progress 
                  value={(securityStats.rugsIdentified / securityStats.totalScanned) * 100} 
                  className="h-2 bg-gray-700" 
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Honeypots Prevented</span>
                  <span className="text-sm font-medium text-amber-400">{securityStats.honeypotsPrevented}</span>
                </div>
                <Progress 
                  value={(securityStats.honeypotsPrevented / securityStats.totalScanned) * 100} 
                  className="h-2 bg-gray-700" 
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Safe Tokens</span>
                  <span className="text-sm font-medium text-trading-success">{securityStats.safeTokens}</span>
                </div>
                <Progress 
                  value={(securityStats.safeTokens / securityStats.totalScanned) * 100} 
                  className="h-2 bg-gray-700" 
                />
              </div>
              
              <div className="pt-2 mt-4 border-t border-trading-highlight/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Token Quality Score (Average)</span>
                  <span className="text-sm font-medium">68/100</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-trading-danger via-amber-400 to-trading-success h-2.5 rounded-full" style={{ width: '68%' }}></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>High Risk</span>
                  <span>Medium Risk</span>
                  <span>Low Risk</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-trading-darkAccent border-trading-highlight/20">
          <CardHeader>
            <CardTitle className="text-lg">Token Performance</CardTitle>
            <CardDescription>24h performance of monitored tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Solana', symbol: 'SOL', change: 2.4, volume: '$1.2B', marketCap: '$40.2B', risk: 'low' },
                { name: 'Bonk', symbol: 'BONK', change: 5.1, volume: '$12.4M', marketCap: '$580M', risk: 'medium' },
                { name: 'Dogwifhat', symbol: 'WIF', change: -1.3, volume: '$8.7M', marketCap: '$850M', risk: 'low' },
                { name: 'Jokerace', symbol: 'JOKE', change: 12.5, volume: '$3.2M', marketCap: '$110M', risk: 'medium' },
                { name: 'Pump Fun Token', symbol: 'PFUN', change: -5.8, volume: '$420K', marketCap: '$6.5M', risk: 'high' },
              ].map((token, i) => (
                <div key={i} className="flex items-center justify-between p-2 hover:bg-trading-dark/50 rounded-md">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3
                      ${token.risk === 'low' ? 'bg-gradient-to-br from-teal-500 to-green-600' : 
                        token.risk === 'medium' ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                          'bg-gradient-to-br from-red-500 to-pink-600'}`}>
                      {token.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{token.name} <span className="text-gray-400 text-sm">{token.symbol}</span></div>
                      <div className="text-xs text-gray-400">Vol: {token.volume} • MC: {token.marketCap}</div>
                    </div>
                  </div>
                  <div className={`flex items-center ${token.change >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                    {token.change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                    <span className="font-medium">{token.change >= 0 ? '+' : ''}{token.change}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TradingAnalyticsDashboard;
