
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Zap, Activity, AlertCircle, Flame, Clock, LineChart } from 'lucide-react';
import { identifyPotentialRunners } from '@/utils/tradingUtils';
import RiskScoring from './RiskScoring';

interface TokenWithScore {
  name: string;
  symbol: string;
  address: string;
  price: number;
  marketCap: number;
  runnerScore: number;
  runnerChance: number;
  volume24h: number;
  holders: number;
  liquidity: number;
  trending: boolean;
  keyMetrics: {
    name: string;
    value: string;
    indicator: 'positive' | 'neutral' | 'negative';
  }[];
  riskFactors: {
    name: string;
    score: number;
    impact: 'high' | 'medium' | 'low';
    description: string;
  }[];
}

const PotentialRunnersDetector = () => {
  const [activeTab, setActiveTab] = useState('real-time');
  const [isScanning, setIsScanning] = useState(false);
  const [tokens, setTokens] = useState<TokenWithScore[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenWithScore | null>(null);
  
  // Function to simulate scanning for potential runners
  const scanForRunners = async () => {
    setIsScanning(true);
    
    // In a real implementation, this would call the blockchain monitoring logic
    // For demo purposes, we'll simulate a delay and use mock data
    setTimeout(() => {
      const mockTokens = [
        {
          name: 'Solana AI Token',
          symbol: 'SOLAI',
          address: 'FGfSNVTvjxK2R5SgzEPMgGzXzz1jUi4Cw7dxc6jbWw7A',
          price: 0.00004582,
          marketCap: 458200,
          runnerScore: 87,
          runnerChance: 76,
          volume24h: 125000,
          holders: 342,
          liquidity: 78000,
          trending: true,
          keyMetrics: [
            { name: 'Wallet Accumulation', value: 'High', indicator: 'positive' as const },
            { name: 'Smart Money Activity', value: 'Medium+', indicator: 'positive' as const },
            { name: 'Tx Volume Increase', value: '128%', indicator: 'positive' as const },
            { name: 'Holder Growth', value: '25% (24h)', indicator: 'positive' as const },
          ],
          riskFactors: [
            {
              name: 'Token Age',
              score: 60,
              impact: 'medium' as const,
              description: 'Token was created 3 days ago'
            },
            {
              name: 'Liquidity/MCap Ratio',
              score: 25,
              impact: 'low' as const,
              description: 'Strong liquidity relative to market cap'
            },
          ]
        },
        {
          name: 'Degen Meme',
          symbol: 'DEGEN',
          address: 'CAxH7mRrgugnY3mShc3LySVC9M2jJdNgWA5JRdRdNpBm',
          price: 0.00000876,
          marketCap: 87600,
          runnerScore: 72,
          runnerChance: 63,
          volume24h: 54000,
          holders: 156,
          liquidity: 32000,
          trending: false,
          keyMetrics: [
            { name: 'Wallet Accumulation', value: 'Medium', indicator: 'positive' as const },
            { name: 'Smart Money Activity', value: 'Low', indicator: 'neutral' as const },
            { name: 'Tx Volume Increase', value: '85%', indicator: 'positive' as const },
            { name: 'Holder Growth', value: '18% (24h)', indicator: 'positive' as const },
          ],
          riskFactors: [
            {
              name: 'Token Age',
              score: 75,
              impact: 'high' as const,
              description: 'Token was created 12 hours ago'
            },
            {
              name: 'Liquidity/MCap Ratio',
              score: 45,
              impact: 'medium' as const,
              description: 'Moderate liquidity relative to market cap'
            },
          ]
        },
        {
          name: 'Moon Puppy',
          symbol: 'MPUP',
          address: 'MpupB8ysX3k7RVBSCQP9hQnG9JNRdXNQy9VioRKrpEC',
          price: 0.000000134,
          marketCap: 134000,
          runnerScore: 64,
          runnerChance: 58,
          volume24h: 42000,
          holders: 205,
          liquidity: 28000,
          trending: true,
          keyMetrics: [
            { name: 'Wallet Accumulation', value: 'Medium', indicator: 'positive' as const },
            { name: 'Smart Money Activity', value: 'Medium', indicator: 'positive' as const },
            { name: 'Tx Volume Increase', value: '62%', indicator: 'positive' as const },
            { name: 'Holder Growth', value: '12% (24h)', indicator: 'neutral' as const },
          ],
          riskFactors: [
            {
              name: 'Token Age',
              score: 40,
              impact: 'medium' as const,
              description: 'Token was created 5 days ago'
            },
            {
              name: 'Liquidity/MCap Ratio',
              score: 55,
              impact: 'medium' as const,
              description: 'Moderate liquidity relative to market cap'
            },
          ]
        }
      ];
      
      setTokens(mockTokens);
      setIsScanning(false);
    }, 2000);
  };
  
  const getRunnerScoreBadge = (score: number) => {
    if (score >= 80) return "bg-green-500 text-white";
    if (score >= 65) return "bg-green-400 text-green-900";
    if (score >= 50) return "bg-yellow-400 text-yellow-900";
    return "bg-red-400 text-red-900";
  };
  
  const handleTokenClick = (token: TokenWithScore) => {
    setSelectedToken(token);
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Potential Runners Detector
          </CardTitle>
          <CardDescription>
            Identify tokens with high potential for significant price movement using on-chain metrics
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="real-time" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-trading-darkAccent">
              <TabsTrigger value="real-time" className="data-[state=active]:bg-trading-highlight/20">
                <Zap className="h-4 w-4 mr-1" /> Real-Time
              </TabsTrigger>
              <TabsTrigger value="watchlist" className="data-[state=active]:bg-trading-highlight/20">
                <Clock className="h-4 w-4 mr-1" /> Watchlist
              </TabsTrigger>
              <TabsTrigger value="trending" className="data-[state=active]:bg-trading-highlight/20">
                <Flame className="h-4 w-4 mr-1" /> Trending
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="real-time" className="space-y-4">
              <div className="flex justify-between">
                <Button 
                  onClick={scanForRunners} 
                  disabled={isScanning}
                  className="bg-trading-highlight hover:bg-trading-highlight/80"
                >
                  {isScanning ? (
                    <>
                      <Activity className="mr-2 h-4 w-4 animate-pulse" /> 
                      Scanning blockchain...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" /> 
                      Scan for Potential Runners
                    </>
                  )}
                </Button>
                
                <Badge className="bg-trading-highlight/20 text-trading-highlight px-2">
                  Helius API: Connected
                </Badge>
              </div>
              
              {isScanning ? (
                <div className="text-center py-8">
                  <div className="inline-block p-3 rounded-full bg-trading-highlight/20 mb-4">
                    <Activity className="h-8 w-8 text-trading-highlight animate-pulse" />
                  </div>
                  <p className="text-gray-400">
                    Analyzing on-chain data for potential runners...
                  </p>
                  <div className="mt-4 max-w-md mx-auto">
                    <Progress value={65} className="h-1" />
                  </div>
                </div>
              ) : tokens.length > 0 ? (
                <div className="space-y-2">
                  {tokens.map((token) => (
                    <div 
                      key={token.address}
                      className={`p-3 rounded-lg bg-trading-darkAccent/30 border border-trading-highlight/10 cursor-pointer transition-colors hover:border-trading-highlight/30 ${selectedToken?.address === token.address ? 'border-trading-highlight/50 bg-trading-highlight/10' : ''}`}
                      onClick={() => handleTokenClick(token)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center">
                            <span className="font-semibold">{token.symbol}</span>
                            {token.trending && (
                              <Badge className="ml-2 bg-orange-500/20 text-orange-400 border-orange-500/30">
                                <Flame className="h-3 w-3 mr-1" /> Trending
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">{token.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end">
                            <Badge className={`${getRunnerScoreBadge(token.runnerScore)}`}>
                              Runner Score: {token.runnerScore}/100
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            ${token.price.toFixed(token.price < 0.00001 ? 8 : 6)} | MCap: ${token.marketCap.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No potential runners detected yet</p>
                  <p className="text-xs mt-1">
                    Click the "Scan for Potential Runners" button to start detection
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="watchlist">
              <div className="text-center py-8 text-gray-400">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Your watchlist is empty</p>
                <p className="text-xs mt-1">
                  Add tokens from the Real-Time scanner to track them here
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="trending">
              <div className="text-center py-8 text-gray-400">
                <Flame className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Loading trending tokens...</p>
                <p className="text-xs mt-1">
                  Data from Pump.fun, DexScreener, Jupiter, and Raydium
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {selectedToken && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <LineChart className="mr-2 h-5 w-5" />
                  {selectedToken.name} ({selectedToken.symbol})
                </CardTitle>
                <CardDescription>
                  {selectedToken.address.substring(0, 6)}...{selectedToken.address.substring(selectedToken.address.length - 4)}
                </CardDescription>
              </div>
              <div>
                <Badge className={`px-3 py-1 ${getRunnerScoreBadge(selectedToken.runnerScore)}`}>
                  {selectedToken.runnerChance}% Runner Probability
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Key On-Chain Metrics</h4>
                  <div className="space-y-2">
                    {selectedToken.keyMetrics.map((metric, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{metric.name}</span>
                        <Badge className={`
                          ${metric.indicator === 'positive' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                            metric.indicator === 'negative' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                            'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}
                        `}>
                          {metric.value}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Market Data</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-trading-darkAccent/30 rounded p-2">
                      <div className="text-xs text-gray-400">Price</div>
                      <div className="font-medium">${selectedToken.price.toFixed(selectedToken.price < 0.00001 ? 8 : 6)}</div>
                    </div>
                    <div className="bg-trading-darkAccent/30 rounded p-2">
                      <div className="text-xs text-gray-400">Market Cap</div>
                      <div className="font-medium">${selectedToken.marketCap.toLocaleString()}</div>
                    </div>
                    <div className="bg-trading-darkAccent/30 rounded p-2">
                      <div className="text-xs text-gray-400">24h Volume</div>
                      <div className="font-medium">${selectedToken.volume24h.toLocaleString()}</div>
                    </div>
                    <div className="bg-trading-darkAccent/30 rounded p-2">
                      <div className="text-xs text-gray-400">Holders</div>
                      <div className="font-medium">{selectedToken.holders}</div>
                    </div>
                    <div className="bg-trading-darkAccent/30 rounded p-2 col-span-2">
                      <div className="text-xs text-gray-400">Liquidity</div>
                      <div className="font-medium">${selectedToken.liquidity.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    {selectedToken.runnerScore >= 80 ? 
                      "High probability of significant price movement based on on-chain signals." :
                    selectedToken.runnerScore >= 65 ?
                      "Moderate probability of upward price movement. Monitor closely." :
                      "Some potential for price action but limited supporting signals."}
                  </AlertDescription>
                </Alert>
              </div>
              
              <div>
                <RiskScoring 
                  tokenAddress={selectedToken.address}
                  tokenName={selectedToken.name}
                  tokenSymbol={selectedToken.symbol}
                  riskFactors={selectedToken.riskFactors}
                  overallRiskScore={55}  // This would be calculated based on risk factors
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" className="border-trading-highlight/30 hover:bg-trading-highlight/10">
                Add to Watchlist
              </Button>
              <Button className="bg-trading-highlight hover:bg-trading-highlight/80">
                View on Birdeye
              </Button>
              <Button className="bg-trading-highlight hover:bg-trading-highlight/80">
                Trade on Jupiter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PotentialRunnersDetector;
