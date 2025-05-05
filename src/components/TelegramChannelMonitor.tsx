
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, AlertCircle, Settings, Plus } from "lucide-react";

const MONITORED_CHANNELS = [
  {
    id: "channel1",
    name: "CYRILXBT GAMBLING",
    channelId: "-1002022554106",
    active: true,
    tokenCount: 14,
    lastUpdate: "10m ago"
  },
  {
    id: "channel2",
    name: "MAGIC1000x BOT",
    channelId: "7583670120",
    active: true,
    tokenCount: 8,
    lastUpdate: "25m ago"
  },
  {
    id: "channel3",
    name: "GMGN ALERT BOT 1",
    channelId: "6917338381",
    active: true,
    tokenCount: 12,
    lastUpdate: "18m ago"
  },
  {
    id: "channel4",
    name: "SMART MONEY BUYS",
    channelId: "7438902115",
    active: true,
    tokenCount: 6,
    lastUpdate: "31m ago"
  }
];

const TelegramChannelMonitor: React.FC = () => {
  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            Telegram Channel Monitor
          </div>
          <Button size="sm" variant="outline" className="bg-black/20 border-white/10">
            <Plus className="h-4 w-4 mr-1" />
            Add Channel
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-400 font-medium mb-1">Channel Monitoring Active</p>
                <p className="text-gray-300">
                  The system is monitoring {MONITORED_CHANNELS.length} Telegram channels for token contract addresses.
                  Token detection will automatically extract Solana addresses and validate them.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium">Monitored Channels ({MONITORED_CHANNELS.length})</div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {MONITORED_CHANNELS.map(channel => (
              <div key={channel.id} className="bg-black/20 p-3 rounded-lg border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{channel.name}</div>
                  <Switch checked={channel.active} />
                </div>
                
                <div className="mt-2 text-xs text-gray-400 font-mono">
                  ID: {channel.channelId}
                </div>
                
                <div className="mt-2 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600">{channel.tokenCount} tokens</Badge>
                    <span className="text-xs text-gray-400">Last update: {channel.lastUpdate}</span>
                  </div>
                  
                  <Button size="sm" variant="outline" className="text-xs h-7 bg-black/20 border-white/10">
                    View Tokens
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div>
            <div className="mb-2 text-sm font-medium">Add New Channel</div>
            <div className="flex gap-2">
              <Input placeholder="Enter channel ID or URL" className="bg-black/20 border-white/10" />
              <Button>Add</Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              You can add public channels by ID or URL. Private channels require authentication.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TelegramChannelMonitor;
