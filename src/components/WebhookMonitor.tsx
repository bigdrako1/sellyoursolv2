
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  WebhookIcon,
  Plus,
  Settings,
  Check,
  AlertCircle,
  Trash2,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Webhook {
  id: string;
  name: string;
  url: string;
  active: boolean;
  type: 'token' | 'smart_money' | 'whale' | 'wallet';
  lastTriggered?: string;
  events: string[];
}

const WebhookMonitor: React.FC = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: "webhook-1",
      name: "Token Detection",
      url: "https://api.myservice.com/webhooks/token-detection",
      active: true,
      type: "token",
      lastTriggered: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      events: ["new_token", "token_price_change"]
    }
  ]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWebhook, setNewWebhook] = useState<Partial<Webhook>>({
    name: "",
    url: "",
    active: true,
    type: "token",
    events: ["new_token"]
  });
  
  const { toast } = useToast();
  
  const handleAddWebhook = () => {
    if (!newWebhook.name || !newWebhook.url) {
      toast({
        title: "Missing Information",
        description: "Please provide a name and URL for the webhook",
        variant: "destructive"
      });
      return;
    }
    
    const webhook: Webhook = {
      id: `webhook-${Date.now()}`,
      name: newWebhook.name,
      url: newWebhook.url,
      active: newWebhook.active || true,
      type: newWebhook.type as 'token' | 'smart_money' | 'whale' | 'wallet',
      events: newWebhook.events || ["new_token"]
    };
    
    setWebhooks([...webhooks, webhook]);
    setNewWebhook({
      name: "",
      url: "",
      active: true,
      type: "token",
      events: ["new_token"]
    });
    setShowAddForm(false);
    
    toast({
      title: "Webhook Added",
      description: `Webhook '${webhook.name}' has been added successfully`,
    });
  };
  
  const toggleWebhookStatus = (id: string) => {
    setWebhooks(
      webhooks.map(webhook => 
        webhook.id === id 
          ? { ...webhook, active: !webhook.active } 
          : webhook
      )
    );
    
    const webhook = webhooks.find(w => w.id === id);
    if (webhook) {
      toast({
        title: webhook.active ? "Webhook Disabled" : "Webhook Enabled",
        description: `Webhook '${webhook.name}' has been ${webhook.active ? 'disabled' : 'enabled'}`
      });
    }
  };
  
  const deleteWebhook = (id: string) => {
    const webhook = webhooks.find(w => w.id === id);
    if (webhook) {
      setWebhooks(webhooks.filter(w => w.id !== id));
      
      toast({
        title: "Webhook Deleted",
        description: `Webhook '${webhook.name}' has been deleted`,
        variant: "destructive"
      });
    }
  };
  
  const testWebhook = (webhook: Webhook) => {
    toast({
      title: "Testing Webhook",
      description: `Sending test payload to ${webhook.name}...`,
    });
    
    // In a real implementation, this would make an API call
    setTimeout(() => {
      toast({
        title: "Webhook Test Successful",
        description: `Test payload successfully sent to ${webhook.name}`,
      });
    }, 1500);
  };
  
  const getTypeLabel = (type: string) => {
    switch(type) {
      case "token": return "Token Detection";
      case "smart_money": return "Smart Money";
      case "whale": return "Whale Activity";
      case "wallet": return "Wallet Tracking";
      default: return type;
    }
  };
  
  return (
    <Card className="card-with-border">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="flex items-center gap-2">
          <WebhookIcon className="h-5 w-5 text-blue-400" />
          Webhook Monitor
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-black/20 border-white/10"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Webhook
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showAddForm && (
          <div className="bg-black/40 border border-white/10 rounded-lg p-4 mb-4 space-y-3">
            <h3 className="font-medium mb-2">Add New Webhook</h3>
            
            <div className="space-y-2">
              <Label htmlFor="webhookName">Name</Label>
              <Input
                id="webhookName"
                placeholder="My Webhook"
                value={newWebhook.name}
                onChange={e => setNewWebhook({...newWebhook, name: e.target.value})}
                className="bg-black/20 border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhookURL">URL</Label>
              <Input
                id="webhookURL"
                placeholder="https://api.example.com/webhook"
                value={newWebhook.url}
                onChange={e => setNewWebhook({...newWebhook, url: e.target.value})}
                className="bg-black/20 border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhookType">Type</Label>
              <select
                id="webhookType"
                value={newWebhook.type}
                onChange={e => setNewWebhook({...newWebhook, type: e.target.value as any})}
                className="w-full h-9 rounded-md border border-white/10 bg-black/20 px-3 text-sm"
              >
                <option value="token">Token Detection</option>
                <option value="smart_money">Smart Money</option>
                <option value="whale">Whale Activity</option>
                <option value="wallet">Wallet Tracking</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="webhookActive">Active</Label>
              <Switch
                id="webhookActive"
                checked={newWebhook.active}
                onCheckedChange={checked => setNewWebhook({...newWebhook, active: checked})}
              />
            </div>
            
            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddWebhook}>
                <Check className="mr-2 h-4 w-4" />
                Add Webhook
              </Button>
            </div>
          </div>
        )}
        
        {webhooks.length > 0 ? (
          <div className="space-y-3">
            {webhooks.map(webhook => (
              <div key={webhook.id} className="bg-black/20 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{webhook.name}</span>
                    <Badge variant={webhook.active ? "default" : "secondary"}>
                      {webhook.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <Switch
                      checked={webhook.active}
                      onCheckedChange={() => toggleWebhookStatus(webhook.id)}
                      className="mr-2"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteWebhook(webhook.id)}
                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-gray-400">Type</div>
                      <div>{getTypeLabel(webhook.type)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Last Triggered</div>
                      <div>{webhook.lastTriggered ? new Date(webhook.lastTriggered).toLocaleTimeString() : 'Never'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-400">URL</div>
                    <div className="flex items-center">
                      <span className="truncate max-w-[250px]">{webhook.url}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => window.open(webhook.url, '_blank')}
                        className="h-6 w-6 ml-1"
                      >
                        <ExternalLink size={12} />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-400">Events</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {webhook.events.map(event => (
                        <Badge key={event} variant="outline" className="bg-black/30">
                          {event.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => testWebhook(webhook)}
                    className="bg-black/20 border-white/10"
                  >
                    Test Webhook
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="text-gray-400">No webhooks configured</p>
            <p className="text-xs text-gray-500 mt-1">
              Add webhooks to receive real-time notifications about token activity
            </p>
          </div>
        )}
        
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 flex items-start gap-2">
          <AlertCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="mb-1">Webhooks send real-time notifications when specific events occur, such as:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>New token detection</li>
              <li>Price movements exceeding thresholds</li>
              <li>Smart money wallet activities</li>
              <li>Whale transactions</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebhookMonitor;
