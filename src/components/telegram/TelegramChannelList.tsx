
import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { TelegramSource } from "@/types/token.types";

interface TelegramChannelListProps {
  channels: TelegramSource[];
  handleToggleChannel: (id: string) => void;
  handleRemoveChannel: (id: string) => void;
}

const TelegramChannelList: React.FC<TelegramChannelListProps> = ({ 
  channels, 
  handleToggleChannel, 
  handleRemoveChannel 
}) => {
  return (
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
  );
};

export default TelegramChannelList;
