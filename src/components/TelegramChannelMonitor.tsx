
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { MessageSquare, AlertCircle, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "@/services/toastService";

interface TelegramChannel {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  connected: boolean;
}

const SAMPLE_CHANNELS: TelegramChannel[] = [
  {
    id: "c1",
    name: "CYRILXBT GAMBLING",
    description: "Crypto gambling signals and calls",
    active: true,
    connected: true
  },
  {
    id: "c2",
    name: "MAGIC1000x BOT",
    description: "New token launches and monitoring",
    active: true,
    connected: true
  },
  {
    id: "c3",
    name: "SMART MONEY BUYS",
    description: "Track smart money wallet movements",
    active: true,
    connected: true
  },
  {
    id: "c4",
    name: "MEME1000X",
    description: "Meme coin sniping and analysis",
    active: false,
    connected: true
  }
];

const TelegramChannelMonitor: React.FC = () => {
  const [channels, setChannels] = useState<TelegramChannel[]>(SAMPLE_CHANNELS);
  const [isConnected, setIsConnected] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  
  const handleConnect = () => {
    setIsConnected(true);
    toast.success("Telegram Connected", {
      description: "Successfully connected to Telegram API"
    });
  };
  
  const handleDisconnect = () => {
    setIsConnected(false);
    toast.info("Telegram Disconnected", {
      description: "Disconnected from Telegram API"
    });
  };
  
  const handleToggleChannel = (id: string) => {
    setChannels(channels.map(channel => 
      channel.id === id 
        ? {...channel, active: !channel.active} 
        : channel
    ));
    
    const channel = channels.find(c => c.id === id);
    if (channel) {
      toast.show(
        channel.active 
          ? `Monitoring paused for ${channel.name}` 
          : `Monitoring activated for ${channel.name}`,
        {
          description: channel.active 
            ? "You will no longer receive alerts from this channel" 
            : "You will now receive alerts from this channel"
        }
      );
    }
  };
  
  const handleAddChannel = () => {
    if (!newChannelName.trim()) {
      toast.destructive("Channel Name Required", {
        description: "Please enter a channel name"
      });
      return;
    }
    
    const newChannel: TelegramChannel = {
      id: `c${Date.now()}`,
      name: newChannelName,
      active: true,
      connected: false
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
  
  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-400" />
            Telegram Channel Monitor
          </div>
          <Badge className={isConnected ? "bg-green-600" : "bg-red-600"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!isConnected ? (
            <div className="bg-blue-900/20 p-4 rounded-md border border-blue-900/30 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Connect to Telegram</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Connect your Telegram account to monitor channels for token alerts.
                    The system will automatically detect token addresses shared in these channels.
                  </p>
                </div>
              </div>
              <Button onClick={handleConnect} className="w-full">
                Connect Telegram
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between bg-green-900/20 p-3 rounded-md border border-green-900/30">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Telegram Monitoring Active</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-black/20 border-white/10 text-xs"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label className="block">Add New Channel</Label>
                <div className="flex gap-2">
                  <Input 
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
                <div className="text-sm font-medium mb-2">Monitored Channels</div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {channels.map((channel) => (
                    <div 
                      key={channel.id} 
                      className="flex items-center justify-between p-2 rounded bg-black/30"
                    >
                      <div>
                        <div className="font-medium text-sm">{channel.name}</div>
                        {channel.description && (
                          <div className="text-xs text-gray-400">{channel.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={channel.active}
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
