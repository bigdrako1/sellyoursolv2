import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MessageSquare, Settings, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TelegramAuthentication from '@/components/TelegramAuthentication';
import { isAuthenticatedWithTelegram } from '@/services/telegramAuthService';

const TelegramMonitor = () => {
  const [activeTab, setActiveTab] = useState("channels");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check authentication status on mount
  useEffect(() => {
    setIsAuthenticated(isAuthenticatedWithTelegram());
  }, []);
  
  const handleAuthenticationChange = (isAuth: boolean) => {
    setIsAuthenticated(isAuth);
  };
  
  const handleRefresh = () => {
    setIsConnecting(true);
    // Simulate refresh process
    setTimeout(() => {
      setIsConnecting(false);
    }, 1500);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <MessageSquare size={20} className="text-blue-500" />
              <h2 className="text-xl font-bold">Telegram Channel Monitoring</h2>
            </div>
            {isAuthenticated && (
              <Button 
                variant="outline" 
                size="sm"
                className="bg-trading-darkAccent border-white/10 hover:bg-white/10"
                onClick={handleRefresh}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <RefreshCw size={14} className="mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <Settings size={14} className="mr-2" />
                    Refresh Status
                  </>
                )}
              </Button>
            )}
          </div>
          
          {!isAuthenticated ? (
            <TelegramAuthentication onAuthenticationChange={handleAuthenticationChange} />
          ) : (
            <Tabs defaultValue="channels" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="channels">Monitored Channels</TabsTrigger>
                <TabsTrigger value="filters">Alert Filters</TabsTrigger>
                <TabsTrigger value="history">Alert History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="channels" className="space-y-4">
                <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">User Channels</h3>
                    <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/20">
                      Connected
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {["CYRILXBT GAMBLING", "SMART MONEY BUYS", "MEME1000X", "SOLANA ACTIVITY TRACKER"].map((channel) => (
                      <div key={channel} className="flex justify-between items-center p-2 bg-black/30 rounded border border-white/10">
                        <div className="flex items-center gap-2">
                          <MessageSquare size={16} className="text-blue-500" />
                          <span>{channel}</span>
                        </div>
                        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/20">
                          Active
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="filters" className="space-y-4">
                <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                  <h3 className="font-medium mb-4">Token Quality Filters</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Minimum Liquidity ($)</label>
                      <Input 
                        type="number" 
                        defaultValue={10000}
                        className="bg-black/30 border-white/10"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Minimum Holders</label>
                      <Input 
                        type="number" 
                        defaultValue={50}
                        className="bg-black/30 border-white/10"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Maximum Risk Score</label>
                      <Input 
                        type="number" 
                        defaultValue={30}
                        className="bg-black/30 border-white/10"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="space-y-4">
                <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                  <h3 className="font-medium mb-4">Recent Alerts</h3>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-3 bg-black/30 rounded border border-white/10">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">New Token Alert</div>
                          <div className="text-sm text-gray-400">{new Date().toLocaleTimeString()}</div>
                        </div>
                        <div className="text-sm mb-2">Token: MEME{i+1} (MEME{i+1})</div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/20">
                            View
                          </Badge>
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/20">
                            Trade
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TelegramMonitor;
