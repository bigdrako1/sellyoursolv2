
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Telegram, Plus, RefreshCw, Eye, EyeOff, Trash2, MessageCircle, Settings, ExternalLink } from "lucide-react";
import { toast } from "sonner";

// Sample monitored channels
const INITIAL_CHANNELS = [
  { id: "-1002022554106", name: "CYRILXBT GAMBLING", active: true, messages: 128, tokens: 43, smart: true },
  { id: "7583670120", name: "MAGIC1000x BOT", active: true, messages: 89, tokens: 27, smart: true },
  { id: "6917338381", name: "GMGN ALERT BOT 1", active: true, messages: 67, tokens: 19, smart: false },
  { id: "7296296743", name: "GMGN ALERT BOT2", active: false, messages: 54, tokens: 12, smart: false },
  { id: "7438902115", name: "SMART MONEY BUYS", active: true, messages: 210, tokens: 52, smart: true },
  { id: "-1002333406905", name: "MEME1000X", active: true, messages: 94, tokens: 30, smart: false },
];

const TelegramMonitor = () => {
  const [connecting, setConnecting] = useState(false);
  const [channels, setChannels] = useState(INITIAL_CHANNELS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChannelId, setNewChannelId] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const handleConnect = () => {
    setConnecting(true);
    
    // Simulate connection process
    setTimeout(() => {
      toast.success("Telegram monitoring connected", {
        description: "Successfully connected to your Telegram account"
      });
      setConnecting(false);
    }, 2000);
  };
  
  const handleAddChannel = () => {
    if (!newChannelId || !newChannelName) {
      toast.error("Please fill all fields");
      return;
    }
    
    // Check if channel already exists
    if (channels.some(c => c.id === newChannelId)) {
      toast.error("This channel is already being monitored");
      return;
    }
    
    const newChannel = {
      id: newChannelId,
      name: newChannelName,
      active: true,
      messages: 0,
      tokens: 0,
      smart: false
    };
    
    setChannels([newChannel, ...channels]);
    setNewChannelId("");
    setNewChannelName("");
    setShowAddForm(false);
    
    toast.success("Channel added", {
      description: `${newChannelName} added to monitoring list`
    });
  };
  
  const toggleChannelActive = (id: string) => {
    setProcessingIds(prev => [...prev, id]);
    
    // Simulate processing delay
    setTimeout(() => {
      setChannels(channels.map(channel => 
        channel.id === id ? { ...channel, active: !channel.active } : channel
      ));
      
      setProcessingIds(prev => prev.filter(p => p !== id));
      
      toast.success("Channel status updated", {
        description: `Monitoring ${channels.find(c => c.id === id)?.active ? "disabled" : "enabled"}`
      });
    }, 1000);
  };
  
  const deleteChannel = (id: string) => {
    setProcessingIds(prev => [...prev, id]);
    
    // Simulate processing delay
    setTimeout(() => {
      const channelName = channels.find(c => c.id === id)?.name;
      setChannels(channels.filter(channel => channel.id !== id));
      setProcessingIds(prev => prev.filter(p => p !== id));
      
      toast.success("Channel removed", {
        description: `${channelName} removed from monitoring list`
      });
    }, 1000);
  };
  
  // Filter and search channels
  const filteredChannels = channels.filter(channel => {
    if (filter === "active" && !channel.active) return false;
    if (filter === "inactive" && channel.active) return false;
    
    if (searchTerm) {
      return channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        channel.id.includes(searchTerm);
    }
    
    return true;
  });
  
  const activeChannelsCount = channels.filter(c => c.active).length;
  const totalTokensDetected = channels.reduce((acc, channel) => acc + channel.tokens, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Telegram className="h-5 w-5 text-blue-400" />
          Telegram Channel Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-black/20 p-4 rounded-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Telegram Monitoring Status</h4>
                <div className="text-xs text-gray-400">
                  Listen for tokens in Telegram groups, channels and bots
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleConnect}
                  disabled={connecting}
                  className="trading-button"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Telegram className="h-4 w-4 mr-2" />
                      Connect Telegram
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/20">
                <div className="text-sm text-gray-400">Monitored Channels</div>
                <div className="text-2xl font-bold mt-1">{channels.length}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {activeChannelsCount} active, {channels.length - activeChannelsCount} inactive
                </div>
              </div>
              
              <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/20">
                <div className="text-sm text-gray-400">Messages Scanned</div>
                <div className="text-2xl font-bold mt-1">{channels.reduce((acc, channel) => acc + channel.messages, 0)}</div>
                <div className="text-xs text-gray-400 mt-1">
                  From all monitored channels
                </div>
              </div>
              
              <div className="bg-green-900/20 p-3 rounded-lg border border-green-500/20">
                <div className="text-sm text-gray-400">Tokens Detected</div>
                <div className="text-2xl font-bold mt-1">{totalTokensDetected}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {channels.filter(c => c.smart).reduce((acc, c) => acc + c.tokens, 0)} from smart money channels
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between gap-2 mb-2">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className={`${filter === "all" ? "bg-blue-500/20 text-blue-400" : "bg-black/20"}`}
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`${filter === "active" ? "bg-green-500/20 text-green-400" : "bg-black/20"}`}
                onClick={() => setFilter("active")}
              >
                Active
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`${filter === "inactive" ? "bg-red-500/20 text-red-400" : "bg-black/20"}`}
                onClick={() => setFilter("inactive")}
              >
                Inactive
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Input 
                placeholder="Search channels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-[200px] bg-black/20 border-white/10 h-9"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-500/20 text-blue-400 border-blue-500/20"
              >
                <Plus size={14} className="mr-1" /> Add Channel
              </Button>
            </div>
          </div>
          
          {showAddForm && (
            <div className="bg-black/20 rounded-lg p-4 mb-4 border border-white/10">
              <h4 className="text-sm font-medium mb-2">Add Telegram Channel</h4>
              <div className="space-y-3">
                <Input 
                  placeholder="Channel ID (e.g., -1001234567890)"
                  value={newChannelId}
                  onChange={(e) => setNewChannelId(e.target.value)}
                  className="bg-black/30 border-white/10"
                />
                <Input 
                  placeholder="Channel Name"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="bg-black/30 border-white/10"
                />
                <div className="flex gap-2">
                  <Button className="trading-button" onClick={handleAddChannel}>Add Channel</Button>
                  <Button 
                    variant="outline" 
                    className="border-white/10 hover:bg-white/10"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-black/20 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-400">Channel</th>
                    <th className="text-center p-3 font-medium text-gray-400">Status</th>
                    <th className="text-center p-3 font-medium text-gray-400">Messages</th>
                    <th className="text-center p-3 font-medium text-gray-400">Tokens</th>
                    <th className="text-right p-3 font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChannels.map((channel) => (
                    <tr key={channel.id} className="hover:bg-white/5 border-b border-white/5 last:border-0">
                      <td className="p-3">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <span className="font-medium">{channel.name}</span>
                            {channel.smart && (
                              <Badge className="ml-2 bg-blue-500/20 text-blue-400 border-none">
                                Smart Money
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">{channel.id}</div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={`${channel.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} border-none`}>
                          {channel.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">{channel.messages}</td>
                      <td className="p-3 text-center">
                        <span className="font-medium">{channel.tokens}</span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => toggleChannelActive(channel.id)}
                            disabled={processingIds.includes(channel.id)}
                            className="h-8 w-8 hover:text-white"
                          >
                            {processingIds.includes(channel.id) ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : channel.active ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:text-blue-400"
                          >
                            <MessageCircle size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:text-purple-400"
                          >
                            <Settings size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-400 hover:text-blue-300"
                            title="View in Telegram"
                          >
                            <ExternalLink size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:text-red-400"
                            onClick={() => deleteChannel(channel.id)}
                            disabled={processingIds.includes(channel.id)}
                          >
                            {processingIds.includes(channel.id) ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredChannels.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400">
                        No channels match your filter criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-blue-900/10 p-3 rounded-lg border border-blue-500/20 flex justify-between items-center">
            <div className="text-sm">
              <span className="text-blue-400 font-medium">Telegram API Connection</span>
              <div className="text-xs text-gray-400 mt-1">
                Uses user account authentication to monitor channels
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Switch id="enable-monitoring" defaultChecked={true} />
                <label htmlFor="enable-monitoring" className="text-xs text-gray-400">
                  Enable Monitoring
                </label>
              </div>
              <Button variant="outline" size="sm" className="border-blue-500/20">
                <RefreshCw size={14} className="mr-1" /> Refresh Status
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TelegramMonitor;
