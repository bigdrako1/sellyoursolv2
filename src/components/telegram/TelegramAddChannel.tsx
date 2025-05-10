
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface TelegramAddChannelProps {
  newChannelName: string;
  setNewChannelName: (name: string) => void;
  handleAddChannel: () => void;
}

const TelegramAddChannel: React.FC<TelegramAddChannelProps> = ({
  newChannelName,
  setNewChannelName,
  handleAddChannel
}) => {
  return (
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
  );
};

export default TelegramAddChannel;
