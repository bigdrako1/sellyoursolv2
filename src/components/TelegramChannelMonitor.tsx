
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Loader2, MessageSquare, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface MonitoredChannel {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  lastChecked?: string;
  tokensDetected?: number;
}

// Sample monitored channels
const INITIAL_CHANNELS: MonitoredChannel[] = [
  {
    id: "-1002022554106",
    name: "CYRILXBT GAMBLING",
    isActive: true,
    lastChecked: new Date().toISOString(),
    tokensDetected: 23
  },
  {
    id: "7583670120",
    name: "MAGIC1000x BOT",
    isActive: true,
    lastChecked: new Date().toISOString(),
    tokensDetected: 42
  },
  {
    id: "6917338381",
    name: "GMGN ALERT BOT 1",
    isActive: false,
    lastChecked: new Date(Date.now() - 86400000).toISOString(),
    tokensDetected: 17
  }
];

const TelegramChannelMonitor: React.FC = () => {
  const [channels, setChannels] = useState<MonitoredChannel[]>(INITIAL_CHANNELS);
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [newChannelId, setNewChannelId] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const handleAddChannel = () => {
    if (!newChannelId) {
      toast.error("Please enter a channel ID");
      return;
    }
    
    // Check if channel already exists
    if (channels.some(c => c.id === newChannelId)) {
      toast.error("This channel is already being monitored");
      return;
    }
    
    const newChannel: MonitoredChannel = {
      id: newChannelId,
      name: newChannelName || `Channel ${newChannelId}`,
      isActive: true,
      lastChecked: new Date().toISOString(),
      tokensDetected: 0
    };
    
    setChannels([...channels, newChannel]);
    setNewChannelId("");
    setNewChannelName("");
    setIsAddingChannel(false);
    
    toast(`Channel ${newChannelName || newChannelId} added successfully`);
  };
  
  const toggleChannelStatus = (channelId: string) => {
    setChannels(channels.map(channel => {
      if (channel.id === channelId) {
        const newStatus = !channel.isActive;
        toast(newStatus ? 
          `Channel ${channel.name} activated` : 
          `Channel ${channel.name} deactivated`
        );
        return { ...channel, isActive: newStatus };
      }
      return channel;
    }));
  };
  
  const removeChannel = (channelId: string) => {
    const channelToRemove = channels.find(c => c.id === channelId);
    if (channelToRemove) {
      setChannels(channels.filter(channel => channel.id !== channelId));
      toast(`Channel ${channelToRemove.name} removed from monitoring`);
    }
  };
  
  const handleConnectTelegram = async () => {
    setIsConnecting(true);
    
    // Simulate connection process
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsConnected(true);
      toast("Successfully connected to Telegram");
    } catch (error) {
      toast.error("Failed to connect to Telegram");
    } finally {
      setIsConnecting(false);
    }
  };
  
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ago`;
    }
  };
  
  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Telegram Channel Monitor
          </div>
          <div>
            {isConnected ? (
              <Badge className="bg-green-600">Connected</Badge>
            ) : (
              <Button 
                size="sm" 
                onClick={handleConnectTelegram}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : "Connect Telegram"}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isConnected && (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Monitored Channels</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsAddingChannel(!isAddingChannel)}
                  className="h-8 text-xs"
                >
                  Add Channel
                </Button>
              </div>
              
              {isAddingChannel && (
                <div className="bg-black/20 p-3 rounded-md space-y-3">
                  <div>
                    <Label htmlFor="channelId">Channel ID or Username</Label>
                    <Input
                      id="channelId"
                      placeholder="e.g. -1001234567890 or @channelname"
                      value={newChannelId}
                      onChange={(e) => setNewChannelId(e.target.value)}
                      className="bg-black/30 border-white/10 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="channelName">Display Name (Optional)</Label>
                    <Input
                      id="channelName"
                      placeholder="e.g. My Trading Channel"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      className="bg-black/30 border-white/10 mt-1"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsAddingChannel(false)}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddChannel}>
                      <Check className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                {channels.map(channel => (
                  <div 
                    key={channel.id}
                    className={`bg-black/20 p-3 rounded-md ${!channel.isActive && 'opacity-70'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{channel.name}</div>
                        <div className="text-xs text-gray-400">ID: {channel.id}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={channel.isActive} 
                          onCheckedChange={() => toggleChannelStatus(channel.id)}
                          className="data-[state=checked]:bg-green-600"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-red-400" 
                          onClick={() => removeChannel(channel.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </Button>
                      </div>
                    </div>
                    
                    {channel.lastChecked && (
                      <div className="mt-2 flex justify-between text-xs">
                        <div className="text-gray-400">
                          Last checked: {formatTimeAgo(channel.lastChecked)}
                        </div>
                        {channel.tokensDetected !== undefined && (
                          <div>
                            Tokens detected: <span className="text-blue-400 font-medium">{channel.tokensDetected}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {channels.length === 0 && (
                  <div className="text-center py-4 text-sm text-gray-400">
                    No channels are being monitored
                  </div>
                )}
              </div>
            </>
          )}
          
          {!isConnected && !isConnecting && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-400 mb-2">Telegram monitoring not connected</p>
              <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                Connect your Telegram account to monitor channels for new token mentions and trading signals
              </p>
              <Button onClick={handleConnectTelegram}>
                Connect Telegram
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TelegramChannelMonitor;
