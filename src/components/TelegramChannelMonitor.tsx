
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clipboard, MessageSquare, ExternalLink, Activity, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Channel {
  id: string;
  name: string;
  channelId: string;
  enabled: boolean;
  lastChecked: string;
  messageCount: number;
}

interface ChannelMessage {
  id: string;
  channelId: string;
  channelName: string;
  content: string;
  timestamp: string;
  hasTokenAddresses: boolean;
  extractedAddresses?: string[];
}

const TelegramChannelMonitor = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [activeTab, setActiveTab] = useState<string>("messages");
  const [isMonitoring, setIsMonitoring] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  
  useEffect(() => {
    // Load data from localStorage
    const loadData = () => {
      try {
        const storedChannels = localStorage.getItem("telegram_channels");
        const storedMessages = localStorage.getItem("telegram_messages");
        
        if (storedChannels) {
          setChannels(JSON.parse(storedChannels));
        } else {
          // Initialize with sample channels from Drako specs
          const sampleChannels: Channel[] = [
            { id: "channel-1", name: "CYRILXBT GAMBLING", channelId: "-1002022554106", enabled: true, lastChecked: new Date().toISOString(), messageCount: 156 },
            { id: "channel-2", name: "MAGIC1000x BOT", channelId: "7583670120", enabled: true, lastChecked: new Date().toISOString(), messageCount: 89 },
            { id: "channel-3", name: "GMGN ALERT BOT 1", channelId: "6917338381", enabled: true, lastChecked: new Date().toISOString(), messageCount: 213 },
            { id: "channel-4", name: "SMART MONEY BUYS", channelId: "7438902115", enabled: true, lastChecked: new Date().toISOString(), messageCount: 124 },
            { id: "channel-5", name: "MEME1000X", channelId: "-1002333406905", enabled: true, lastChecked: new Date().toISOString(), messageCount: 301 },
            { id: "channel-6", name: "SOLANA ACTIVITY TRACKER", channelId: "-1002270988204", enabled: true, lastChecked: new Date().toISOString(), messageCount: 178 },
          ];
          setChannels(sampleChannels);
          localStorage.setItem("telegram_channels", JSON.stringify(sampleChannels));
        }
        
        if (storedMessages) {
          setMessages(JSON.parse(storedMessages));
        } else {
          // Initialize with sample messages
          const sampleMessages: ChannelMessage[] = [
            {
              id: "msg-1",
              channelId: "7438902115",
              channelName: "SMART MONEY BUYS",
              content: "🚨 Smart Money Buying Now: BONK (DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263)\nVolume: $857,250 in last 15min",
              timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
              hasTokenAddresses: true,
              extractedAddresses: ["DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"]
            },
            {
              id: "msg-2",
              channelId: "-1002333406905",
              channelName: "MEME1000X",
              content: "New potential runner: MEME100 (MEMEXQWzNMLG4t5UtUVqbXEhJSxssCwYVTT1dosXKz7)\nUp 103.5% in 24h with good liquidity",
              timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
              hasTokenAddresses: true,
              extractedAddresses: ["MEMEXQWzNMLG4t5UtUVqbXEhJSxssCwYVTT1dosXKz7"]
            },
            {
              id: "msg-3",
              channelId: "6917338381",
              channelName: "GMGN ALERT BOT 1",
              content: "🔍 New token with high liquidity detected: MonkeyBucks (MBSbRQpZpU5u8VM9rnjZxkm8J7SUgQKU8nxfvfSEd5h)\nLiquidity: $520K | Volume 24h: $8.5M",
              timestamp: new Date(Date.now() - 95 * 60000).toISOString(),
              hasTokenAddresses: true,
              extractedAddresses: ["MBSbRQpZpU5u8VM9rnjZxkm8J7SUgQKU8nxfvfSEd5h"]
            }
          ];
          setMessages(sampleMessages);
          localStorage.setItem("telegram_messages", JSON.stringify(sampleMessages));
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading telegram monitoring data:", error);
        setLoading(false);
      }
    };
    
    loadData();
    
    // Set up message monitoring (simulation)
    let intervalId: NodeJS.Timeout;
    
    if (isMonitoring) {
      intervalId = setInterval(() => {
        // Only simulate new messages if monitoring is on
        if (isMonitoring && Math.random() > 0.8) { // 20% chance of new message
          simulateNewMessage();
        }
        
        // Update last checked time for channels
        updateChannelActivity();
      }, 30000); // Check every 30 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isMonitoring]);
  
  const updateChannelActivity = () => {
    if (!isMonitoring) return;
    
    setChannels(prevChannels => {
      const updated = prevChannels.map(channel => {
        if (channel.enabled) {
          return {
            ...channel,
            lastChecked: new Date().toISOString()
          };
        }
        return channel;
      });
      
      localStorage.setItem("telegram_channels", JSON.stringify(updated));
      return updated;
    });
  };
  
  const simulateNewMessage = () => {
    // Only create new messages if monitoring is on
    if (!isMonitoring) return;
    
    const enabledChannels = channels.filter(c => c.enabled);
    if (enabledChannels.length === 0) return;
    
    // Select random channel
    const randomChannel = enabledChannels[Math.floor(Math.random() * enabledChannels.length)];
    
    // Generate a sample message with token address
    const tokenOptions = [
      { name: "Daisy", symbol: "DAISY", address: "daiskPLEbNUvVq1k8bCrdo7r9SuCDNYJyXnj1FJP8" },
      { name: "Samoyedcoin", symbol: "SAMO", address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" },
      { name: "Jito", symbol: "JTO", address: "jtojtomepa8beP8AuQc6eXt5FriJwfnGz1Y6law3uE" },
      { name: "Dogwifhat", symbol: "WIF", address: "8vw2WnTuF7RL7RmmaLHYxh68MDiXrgkQ9kBhX12ap8uX" },
      { name: "Render Token", symbol: "RNDR", address: "rndrRo5sQS4LzAGQJxM8WGegrAZmVVehz8WNyZxUQmf" },
    ];
    
    const randomToken = tokenOptions[Math.floor(Math.random() * tokenOptions.length)];
    
    const messagePatterns = [
      `🚀 Token Alert: ${randomToken.name} (${randomToken.address}) showing bullish momentum!`,
      `💰 Smart Money buying: ${randomToken.symbol} (${randomToken.address}) - Large wallet accumulation detected`,
      `⚡️ Volume spike on ${randomToken.symbol} (${randomToken.address}) - Up 12% in last hour!`,
      `🐳 Whale activity detected on ${randomToken.name} (${randomToken.address}), multiple buys in last 10 mins`,
      `👀 Token to watch: ${randomToken.symbol} (${randomToken.address}) forming bullish pattern`
    ];
    
    const messageContent = messagePatterns[Math.floor(Math.random() * messagePatterns.length)];
    
    const newMessage: ChannelMessage = {
      id: `msg-${Date.now()}`,
      channelId: randomChannel.id,
      channelName: randomChannel.name,
      content: messageContent,
      timestamp: new Date().toISOString(),
      hasTokenAddresses: true,
      extractedAddresses: [randomToken.address]
    };
    
    // Update messages state
    setMessages(prevMessages => {
      const updatedMessages = [newMessage, ...prevMessages];
      localStorage.setItem("telegram_messages", JSON.stringify(updatedMessages));
      return updatedMessages;
    });
    
    // Update message count for this channel
    setChannels(prevChannels => {
      const updatedChannels = prevChannels.map(channel => 
        channel.id === randomChannel.id 
          ? { ...channel, messageCount: channel.messageCount + 1 } 
          : channel
      );
      localStorage.setItem("telegram_channels", JSON.stringify(updatedChannels));
      return updatedChannels;
    });
    
    // Show notification
    toast({
      title: `New message in ${randomChannel.name}`,
      description: messageContent.length > 60 ? messageContent.substring(0, 60) + '...' : messageContent,
    });
  };
  
  const toggleChannelStatus = (channelId: string) => {
    setChannels(prevChannels => {
      const updatedChannels = prevChannels.map(channel =>
        channel.id === channelId ? { ...channel, enabled: !channel.enabled } : channel
      );
      localStorage.setItem("telegram_channels", JSON.stringify(updatedChannels));
      return updatedChannels;
    });
  };
  
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    
    toast({
      title: isMonitoring ? "Channel Monitoring Paused" : "Channel Monitoring Active",
      description: isMonitoring 
        ? "You will not receive new message notifications" 
        : "You will receive notifications for new messages",
      variant: isMonitoring ? "destructive" : "default",
    });
  };
  
  const formatTime = (timestamp: string): string => {
    const msgTime = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - msgTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Token address has been copied to clipboard",
      variant: "default",
    });
  };

  return (
    <Card className="card-with-border">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              Telegram Channel Monitor
            </CardTitle>
            <CardDescription>Track tokens from popular Telegram channels</CardDescription>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleMonitoring} 
            className={`${isMonitoring ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'} border-white/10`}
          >
            {isMonitoring ? (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Monitoring
              </>
            ) : (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Paused
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 bg-black/20">
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
          </TabsList>
          
          <TabsContent value="messages" className="mt-4">
            {loading ? (
              <div className="py-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 block rounded-full border-2 border-t-transparent border-blue-400 animate-spin"></span>
                  <span>Loading messages...</span>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto opacity-20 mb-3" />
                <p>No messages detected yet</p>
                <p className="text-sm text-gray-400 mt-1">Messages will appear as they're detected</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {messages.map((message) => (
                  <div key={message.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                        {message.channelName}
                      </Badge>
                      <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                    </div>
                    
                    <p className="text-sm mb-3 whitespace-pre-wrap">{message.content}</p>
                    
                    {message.hasTokenAddresses && message.extractedAddresses && (
                      <div className="bg-black/20 rounded-lg p-2 mt-2">
                        <div className="text-xs text-gray-400 mb-1">Token Address</div>
                        {message.extractedAddresses.map((address, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <code className="font-mono text-xs">{address}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(address)}
                            >
                              <Clipboard className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="channels" className="mt-4">
            {loading ? (
              <div className="py-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 block rounded-full border-2 border-t-transparent border-blue-400 animate-spin"></span>
                  <span>Loading channels...</span>
                </div>
              </div>
            ) : channels.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto opacity-20 mb-3" />
                <p>No channels configured</p>
              </div>
            ) : (
              <div className="space-y-3">
                {channels.map((channel) => (
                  <div key={channel.id} className="p-3 rounded-lg bg-black/20 border border-white/5 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{channel.name}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <span>ID: {channel.channelId}</span>
                        <span>•</span>
                        <span>{channel.messageCount} messages</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-400">
                        {channel.enabled ? (
                          <span className="flex items-center text-green-400">
                            <Activity className="h-3.5 w-3.5 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="text-gray-400">Inactive</span>
                        )}
                      </div>
                      <Switch
                        checked={channel.enabled}
                        onCheckedChange={() => toggleChannelStatus(channel.id)}
                        className="data-[state=checked]:bg-blue-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4">
              <Button variant="outline" className="w-full bg-black/20 border-white/10">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Channel
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TelegramChannelMonitor;
