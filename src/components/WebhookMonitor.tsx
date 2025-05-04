
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Activity, Bell, Play, Pause, Plus, AlertTriangle, CheckCircle2, Radio } from 'lucide-react';

interface WebhookEvent {
  id: string;
  timestamp: string;
  type: 'token_activity' | 'whale_movement' | 'liquidity_change' | 'price_alert';
  details: {
    tokenAddress?: string;
    tokenName?: string;
    tokenSymbol?: string;
    walletAddress?: string;
    amount?: number;
    changePercent?: number;
    message: string;
  };
  status: 'success' | 'warning' | 'error';
}

const WebhookMonitor = () => {
  const [isActive, setIsActive] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('https://api.helius-rpc.com/webhook/');
  const [events, setEvents] = useState<WebhookEvent[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 100000).toISOString(),
      type: 'token_activity',
      details: {
        tokenAddress: 'CjF3gzeEZQYwJJaNFG9AP1ig6pNnUXPpJpQJvSVUNHsM',
        tokenName: 'Solana Punk',
        tokenSymbol: 'SPUNK',
        message: 'New token detected with initial liquidity of $25,000'
      },
      status: 'success'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      type: 'whale_movement',
      details: {
        walletAddress: 'DCPcw5SyFDzMc5vhEJHwKgB53yTKcxMxBLuMfThXP3oA',
        tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenSymbol: 'USDC',
        amount: 250000,
        message: 'Whale wallet bought $250,000 worth of tokens'
      },
      status: 'success'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      type: 'liquidity_change',
      details: {
        tokenAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        tokenName: 'Bonk',
        tokenSymbol: 'BONK',
        changePercent: -15,
        message: 'Liquidity decreased by 15% in the last hour'
      },
      status: 'warning'
    }
  ]);
  
  const [webhookFilters, setWebhookFilters] = useState({
    newTokens: true,
    whaleMovements: true,
    liquidityChanges: true,
    priceAlerts: true,
    minLiquidity: 5000,
    minVolume: 1000,
    minHolders: 50
  });
  
  const toggleWebhook = () => {
    setIsActive(!isActive);
  };
  
  const handleFilterChange = (key: keyof typeof webhookFilters, value: any) => {
    setWebhookFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };
  
  return (
    <Card className="bg-trading-darkAccent border-trading-highlight/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg flex items-center">
            <Activity className="mr-2 h-5 w-5 text-trading-highlight" />
            Webhook Monitor
          </CardTitle>
          <CardDescription>
            Monitor blockchain events via Helius webhooks
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Status:</span>
          <Badge 
            variant={isActive ? "default" : "outline"} 
            className={isActive 
              ? "bg-trading-success/20 hover:bg-trading-success/30 text-trading-success" 
              : "bg-trading-danger/10 text-trading-danger border-trading-danger/30"
            }
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleWebhook}
            className={isActive 
              ? "bg-trading-success/10 text-trading-success border-trading-success/30"
              : "bg-trading-danger/10 text-trading-danger border-trading-danger/30"
            }
          >
            {isActive ? (
              <>
                <Pause className="mr-1 h-3 w-3" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-1 h-3 w-3" />
                Resume
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="events">
          <TabsList className="bg-black/20 border-white/10 border mb-4">
            <TabsTrigger value="events">Webhook Events</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="events" className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No webhook events received yet</p>
                <p className="text-sm mt-2">Events will appear here when received</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map(event => (
                  <div 
                    key={event.id} 
                    className="p-3 bg-trading-dark/50 rounded-lg border border-trading-highlight/10"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        {event.status === 'success' && (
                          <CheckCircle2 className="h-4 w-4 mr-2 text-trading-success" />
                        )}
                        {event.status === 'warning' && (
                          <AlertTriangle className="h-4 w-4 mr-2 text-amber-400" />
                        )}
                        {event.status === 'error' && (
                          <AlertTriangle className="h-4 w-4 mr-2 text-trading-danger" />
                        )}
                        <Badge 
                          variant="outline" 
                          className="mr-2 bg-trading-highlight/10 text-trading-highlight border-trading-highlight/30"
                        >
                          {event.type.replace('_', ' ')}
                        </Badge>
                        {event.details.tokenSymbol && (
                          <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                            {event.details.tokenSymbol}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">{event.details.message}</p>
                    {event.details.tokenAddress && (
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs text-gray-400 truncate max-w-[200px]">
                          {event.details.tokenAddress}
                        </span>
                        <div className="flex space-x-2">
                          {event.details.tokenSymbol && (
                            <>
                              <Button variant="outline" size="sm" className="h-7 px-2 py-0 text-xs bg-trading-highlight/10 hover:bg-trading-highlight/20 border-trading-highlight/30">
                                View
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 px-2 py-0 text-xs bg-trading-success/10 hover:bg-trading-success/20 border-trading-success/30 text-trading-success">
                                Add to watchlist
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 flex justify-center">
              <Button variant="outline" className="bg-trading-dark/50 border-trading-highlight/30 hover:bg-trading-highlight/10">
                Load more events
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="config">
            <div className="space-y-4">
              <div>
                <Label htmlFor="webhook-url">Webhook Endpoint URL</Label>
                <div className="flex mt-1">
                  <Input 
                    id="webhook-url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="bg-trading-dark border-trading-highlight/30"
                  />
                  <Button className="ml-2 bg-trading-highlight hover:bg-trading-highlight/80">
                    Save
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  This is the URL that will receive webhook events from Helius
                </p>
              </div>
              
              <div className="border-t border-trading-highlight/10 pt-4 mt-6">
                <h3 className="font-medium mb-2">Event Types</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="new-tokens" 
                      checked={webhookFilters.newTokens}
                      onCheckedChange={(checked) => handleFilterChange('newTokens', Boolean(checked))}
                    />
                    <Label htmlFor="new-tokens" className="cursor-pointer">New token detection</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="whale-movements" 
                      checked={webhookFilters.whaleMovements}
                      onCheckedChange={(checked) => handleFilterChange('whaleMovements', Boolean(checked))}
                    />
                    <Label htmlFor="whale-movements" className="cursor-pointer">Whale wallet movements</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="liquidity-changes" 
                      checked={webhookFilters.liquidityChanges}
                      onCheckedChange={(checked) => handleFilterChange('liquidityChanges', Boolean(checked))}
                    />
                    <Label htmlFor="liquidity-changes" className="cursor-pointer">Liquidity pool changes</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="price-alerts" 
                      checked={webhookFilters.priceAlerts}
                      onCheckedChange={(checked) => handleFilterChange('priceAlerts', Boolean(checked))}
                    />
                    <Label htmlFor="price-alerts" className="cursor-pointer">Price movement alerts</Label>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-trading-highlight/10 pt-4">
                <h3 className="font-medium mb-2">Filter Thresholds</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-liquidity">Minimum Liquidity ($)</Label>
                    <Input 
                      id="min-liquidity" 
                      type="number" 
                      value={webhookFilters.minLiquidity}
                      onChange={(e) => handleFilterChange('minLiquidity', Number(e.target.value))}
                      className="bg-trading-dark border-trading-highlight/30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="min-volume">Minimum Volume ($)</Label>
                    <Input 
                      id="min-volume" 
                      type="number"
                      value={webhookFilters.minVolume}
                      onChange={(e) => handleFilterChange('minVolume', Number(e.target.value))}
                      className="bg-trading-dark border-trading-highlight/30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="min-holders">Minimum Holders</Label>
                    <Input 
                      id="min-holders" 
                      type="number"
                      value={webhookFilters.minHolders}
                      onChange={(e) => handleFilterChange('minHolders', Number(e.target.value))}
                      className="bg-trading-dark border-trading-highlight/30"
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-t border-trading-highlight/10 pt-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Webhook Active Status</h3>
                  <p className="text-sm text-gray-400">Enable or disable the webhook endpoint</p>
                </div>
                <Switch 
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button variant="outline" className="border-trading-highlight/30">
                  Reset to defaults
                </Button>
                <Button className="bg-trading-highlight hover:bg-trading-highlight/80">
                  Save Configuration
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WebhookMonitor;
