
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { MessageSquare, AlertCircle, PlusCircle, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { TelegramSource } from "@/types/token.types";
import { isAuthenticatedWithTelegram } from "@/services/telegramAuthService";
import TelegramAuthentication from "@/components/TelegramAuthentication";
import { processMessageForTokens } from "@/services/telegramMessageParsingService";
import TelegramChannelList from "@/components/telegram/TelegramChannelList";
import TelegramAddChannel from "@/components/telegram/TelegramAddChannel";
import TelegramSyncSettings from "@/components/telegram/TelegramSyncSettings";

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
              
              <TelegramSyncSettings 
                syncInterval={syncInterval} 
                setSyncInterval={setSyncInterval} 
              />
              
              <TelegramAddChannel 
                newChannelName={newChannelName}
                setNewChannelName={setNewChannelName}
                handleAddChannel={handleAddChannel}
              />
              
              <TelegramChannelList 
                channels={channels}
                handleToggleChannel={handleToggleChannel}
                handleRemoveChannel={handleRemoveChannel}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TelegramChannelMonitor;
