
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Fixed import
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { MessageSquare, AlertCircle, PlusCircle, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { TelegramSource } from "@/types/token.types";
import { isAuthenticatedWithTelegram } from "@/services/telegramAuthService";
import TelegramAuthentication from "@/components/TelegramAuthentication";
import { processMessageForTokens } from "@/services/telegramMessageParsingService";

// Default monitored channels
const MONITORED_CHANNELS: TelegramSource[] = [
  {
    id: "c1",
    name: "CYRILXBT GAMBLING",
    description: "Crypto gambling signals and calls",
    isActive: true,
    isConnected: true,
    lastChecked: new Date().toISOString(),
    tokenCount: 15
  },
  {
    id: "c2",
    name: "MAGIC1000x BOT",
    description: "New token launches and monitoring",
    isActive: true,
    isConnected: true,
    lastChecked: new Date().toISOString(),
    tokenCount: 23
  },
  {
    id: "c3",
    name: "SMART MONEY BUYS",
    description: "Track smart money wallet movements",
    isActive: true,
    isConnected: true,
    lastChecked: new Date().toISOString(),
    tokenCount: 8
  },
  {
    id: "c4",
    name: "MEME1000X",
    description: "Meme coin sniping and analysis",
    isActive: true,
    isConnected: true,
    lastChecked: new Date().toISOString(),
    tokenCount: 12
  },
  {
    id: "c5",
    name: "GMGN ALERT BOT 1",
    description: "New token alerts and trends",
    isActive: true,
    isConnected: true,
    lastChecked: new Date().toISOString(),
    tokenCount: 9
  },
  {
    id: "c6",
    name: "GMGN ALERT BOT2",
    description: "Token performance tracking",
    isActive: true,
    isConnected: true,
    lastChecked: new Date().toISOString(),
    tokenCount: 14
  },
  {
    id: "c7",
    name: "SOLANA ACTIVITY TRACKER",
    description: "Track Solana ecosystem activity",
    isActive: true,
    isConnected: true,
    lastChecked: new Date().toISOString(),
    tokenCount: 31
  },
  {
    id: "c8",
    name: "ORTSAA",
    description: "Token alerts and signals",
    isActive: true,
    isConnected: true,
    lastChecked: new Date().toISOString(),
    tokenCount: 5
  },
  {
    id: "c9",
    name: "BUGSIE CHANNEL",
    description: "Token signals and calls",
    isActive: true,
    isConnected: true,
    lastChecked: new Date().toISOString(),
    tokenCount: 18
  },
  {
    id: "c10",
    name: "TREYS",
    description: "Crypto trading calls",
    isActive: true,
    isConnected: true,
    lastChecked: new Date().toISOString(),
    tokenCount: 7
  }
];

const TelegramChannelMonitor: React.FC = () => {
  const [channels, setChannels] = useState<TelegramSource[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [syncInterval, setSyncInterval] = useState(2); // Default 2 minutes
  
  // Check if authenticated with Telegram
  const checkAuthStatus = useCallback(() => {
    const isAuth = isAuthenticatedWithTelegram();
    setIsConnected(isAuth);
    return isAuth;
  }, []);
  
  // Load saved channels on mount
  useEffect(() => {
    const loadChannels = () => {
      try {
        const savedChannels = localStorage.getItem('telegram_channels');
        if (savedChannels) {
          setChannels(JSON.parse(savedChannels));
        } else {
          // Load demo channels if nothing saved
          setChannels(MONITORED_CHANNELS);
        }
      } catch (error) {
        console.error("Error loading channels:", error);
        // Fall back to demo channels on error
        setChannels(MONITORED_CHANNELS);
      }
    };
    
    const isAuth = checkAuthStatus();
    if (isAuth) {
      loadChannels();
    }
  }, [checkAuthStatus]);
  
  // Save channels whenever they change
  useEffect(() => {
    if (channels.length > 0) {
      localStorage.setItem('telegram_channels', JSON.stringify(channels));
    }
  }, [channels]);
  
  const handleAuthenticationChange = (isAuthenticated: boolean) => {
    setIsConnected(isAuthenticated);
    
    if (isAuthenticated && channels.length === 0) {
      setChannels(MONITORED_CHANNELS);
    }
  };
  
  const handleToggleChannel = (id: string) => {
    setChannels(channels.map(channel => 
      channel.id === id 
        ? {...channel, isActive: !channel.isActive} 
        : channel
    ));
    
    const channel = channels.find(c => c.id === id);
    if (channel) {
      toast(
        channel.isActive 
          ? `Monitoring paused for ${channel.name}` 
          : `Monitoring activated for ${channel.name}`,
        {
          description: channel.isActive 
            ? "You will no longer receive alerts from this channel" 
            : "You will now receive alerts from this channel"
        }
      );
    }
  };
  
  const handleAddChannel = () => {
    if (!newChannelName.trim()) {
      toast.error("Channel Name Required", {
        description: "Please enter a channel name"
      });
      return;
    }
    
    const newChannel: TelegramSource = {
      id: `c${Date.now()}`,
      name: newChannelName,
      isActive: true,
      isConnected: false,
      lastChecked: new Date().toISOString(),
      tokenCount: 0
    };
    
    setChannels([...channels, newChannel]);
    setNewChannelName("");
    
    toast.success("Channel Added", {
      description: `${newChannelName} has been added to your monitoring list`
    });
  };
  
  const handleRemoveChannel = (id: string) => {
    const channelToRemove = channels.find(c => c.id === id);
    setChannels(channels.filter(channel => channel.id !== id));
    
    if (channelToRemove) {
      toast.warning("Channel Removed", {
        description: `${channelToRemove.name} has been removed from your monitoring list`
      });
    }
  };
  
  const handleRefreshAll = () => {
    setIsLoading(true);
    
    // Simulate refreshing all channels
    setTimeout(() => {
      setChannels(channels.map(channel => ({
        ...channel,
        lastChecked: new Date().toISOString()
      })));
      setIsLoading(false);
      
      toast.success("Channels Refreshed", {
        description: "All channels have been checked for new tokens"
      });
    }, 2000);
  };
  
  const processMessageExample = () => {
    // Example of how to process a message using the service
    const exampleMessage = {
      text: "New token alert: 8nVWMuHDXH667Kb5JZLhvQQfnkZf3WzKkEPYNDgGe1iF pump is looking good!",
      sourceId: "c1"
    };
    
    const { tokens, shouldProcess } = processMessageForTokens(
      exampleMessage.sourceId,
      exampleMessage.text
    );
    
    if (shouldProcess) {
      console.log("Found new token:", tokens[0]);
      // In a real implementation, this would trigger token analysis
    }
  };
  
  return (
    <Card className="card-with-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-400" />
            Telegram Token Detection
          </CardTitle>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!isConnected ? (
            <TelegramAuthentication onAuthenticationChange={handleAuthenticationChange} />
          ) : (
            <>
              <div className="flex items-center justify-between bg-green-900/20 p-3 rounded-md border border-green-900/30">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Telegram Token Detection Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-black/20 border-white/10 text-xs"
                    onClick={handleRefreshAll}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="h-3 w-3 rounded-full border-2 border-t-transparent border-blue-500 animate-spin"></span>
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Sync Now
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-md bg-blue-900/10 border border-blue-900/20">
                <div className="text-xs text-gray-400">Check channels every:</div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant={syncInterval === 1 ? "default" : "outline"} 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => setSyncInterval(1)}
                  >
                    1m
                  </Button>
                  <Button 
                    variant={syncInterval === 2 ? "default" : "outline"} 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => setSyncInterval(2)}
                  >
                    2m
                  </Button>
                  <Button 
                    variant={syncInterval === 5 ? "default" : "outline"} 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => setSyncInterval(5)}
                  >
                    5m
                  </Button>
                </div>
                <div className="ml-auto text-xs text-gray-400">
                  Last sync: {new Date().toLocaleTimeString()}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newChannel" className="block">Add New Channel</Label>
                <div className="flex gap-2">
                  <Input 
                    id="newChannel"
                    placeholder="Enter channel name or link" 
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="bg-black/20 border-white/10"
                  />
                  <Button onClick={handleAddChannel}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
              
              <div className="bg-black/20 rounded-md p-2">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium">Monitored Channels ({channels.filter(c => c.isActive).length}/{channels.length})</div>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400">
                    {channels.reduce((sum, channel) => sum + (channel.tokenCount || 0), 0)} tokens detected
                  </Badge>
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {channels.map((channel) => (
                    <div 
                      key={channel.id} 
                      className="flex items-center justify-between p-2 rounded bg-black/30"
                    >
                      <div className="overflow-hidden">
                        <div className="font-medium text-sm flex items-center">
                          {channel.name}
                          {channel.tokenCount > 0 && (
                            <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0 h-4 bg-blue-500/10 text-blue-300">
                              {channel.tokenCount}
                            </Badge>
                          )}
                        </div>
                        {channel.description && (
                          <div className="text-xs text-gray-400 truncate max-w-[240px]">{channel.description}</div>
                        )}
                        <div className="text-[10px] text-gray-500">
                          Last checked: {new Date(channel.lastChecked || Date.now()).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={channel.isActive}
                          onCheckedChange={() => handleToggleChannel(channel.id)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={() => handleRemoveChannel(channel.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TelegramChannelMonitor;
