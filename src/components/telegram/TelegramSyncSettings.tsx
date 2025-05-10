
import React from 'react';
import { Button } from "@/components/ui/button";

interface TelegramSyncSettingsProps {
  syncInterval: number;
  setSyncInterval: (interval: number) => void;
}

const TelegramSyncSettings: React.FC<TelegramSyncSettingsProps> = ({
  syncInterval,
  setSyncInterval
}) => {
  return (
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
  );
};

export default TelegramSyncSettings;
