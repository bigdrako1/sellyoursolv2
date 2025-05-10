
import React, { useState, useEffect } from 'react';
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Copy, Play, Plus, RotateCw, Trash, Webhook } from "lucide-react";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import WebhookMonitor from "@/components/WebhookMonitor";
import TokenAlert from "@/components/TokenAlert";
import { Separator } from "@/components/ui/separator";

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  description: string;
  lastTriggered: string | null;
  status: 'active' | 'error' | 'inactive';
  payload: string;
}

const defaultPayload = `{
  "token_address": "{{token_address}}",
  "token_name": "{{token_name}}",
  "token_symbol": "{{token_symbol}}",
  "price": {{price}},
  "market_cap": {{market_cap}},
  "liquidity": {{liquidity}},
  "holders": {{holders}},
  "quality_score": {{quality_score}},
  "risk_level": "{{risk_level}}",
  "source": "{{source}}"
}`;

const Webhooks = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [activeTab, setActiveTab] = useState('config');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookDesc, setNewWebhookDesc] = useState('');
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [customPayload, setCustomPayload] = useState(defaultPayload);
  const { toast } = useToast();

  // Initialize webhooks from localStorage on component mount
  useEffect(() => {
    const savedWebhooks = localStorage.getItem('webhooks');
    if (savedWebhooks) {
      try {
        setWebhooks(JSON.parse(savedWebhooks));
      } catch (e) {
        console.error("Error parsing saved webhooks:", e);
      }
    }
  }, []);

  // Save webhooks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('webhooks', JSON.stringify(webhooks));
  }, [webhooks]);

  const handleAddWebhook = () => {
    if (!newWebhookUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid webhook URL",
        variant: "destructive",
      });
      return;
    }

    const newWebhook: WebhookConfig = {
      id: Date.now().toString(),
      name: newWebhookName.trim() || `Webhook ${webhooks.length + 1}`,
      url: newWebhookUrl.trim(),
      description: newWebhookDesc.trim(),
      lastTriggered: null,
      status: 'active',
      payload: customPayload
    };

    setWebhooks([...webhooks, newWebhook]);
    setNewWebhookUrl('');
    setNewWebhookName('');
    setNewWebhookDesc('');
    setCustomPayload(defaultPayload);

    toast({
      title: "Webhook Added",
      description: "Your webhook has been added successfully."
    });
  };

  const handleUpdateWebhook = () => {
    if (!editingWebhook) return;

    const updatedWebhooks = webhooks.map(webhook =>
      webhook.id === editingWebhook.id ? editingWebhook : webhook
    );

    setWebhooks(updatedWebhooks);
    setEditingWebhook(null);

    toast({
      title: "Webhook Updated",
      description: "Your webhook has been updated successfully."
    });
  };

  const handleDeleteWebhook = (id: string) => {
    const updatedWebhooks = webhooks.filter(webhook => webhook.id !== id);
    setWebhooks(updatedWebhooks);

    toast({
      title: "Webhook Deleted",
      description: "Your webhook has been removed."
    });
  };

  const handleTestWebhook = (webhook: WebhookConfig) => {
    // Mock webhook trigger
    toast({
      title: "Testing Webhook",
      description: `Sending test request to ${webhook.name}`
    });

    // Update the webhook with a new lastTriggered timestamp
    const updatedWebhooks = webhooks.map(w =>
      w.id === webhook.id ? { ...w, lastTriggered: new Date().toISOString() } : w
    );

    setWebhooks(updatedWebhooks);

    // Simulate webhook response after a delay
    setTimeout(() => {
      toast({
        title: "Webhook Test Completed",
        description: `Test completed for ${webhook.name}`
      });
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard"
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-trading-dark text-white">
      <Header />

      <main className="flex-grow container mx-auto px-4 pb-10">
        <div className="py-6">
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-gray-400 mt-2">Configure and manage webhooks to receive token alerts</p>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar with token alert configuration */}
            <div className="lg:col-span-1">
              <TokenAlert onAlertToggle={(enabled) => console.log("Alerts toggled:", enabled)} initiallyEnabled={true} />

              <Card className="mt-6 p-6 bg-trading-darkAccent">
                <h3 className="text-lg font-bold mb-2 flex items-center">
                  <Webhook className="mr-2 h-5 w-5" />
                  Webhook Variables
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Use these variables in your webhook payload to dynamically insert token data:
                </p>

                <div className="space-y-2 text-sm">
                  {[
                    { name: '{{token_address}}', desc: 'Token contract address' },
                    { name: '{{token_name}}', desc: 'Token name' },
                    { name: '{{token_symbol}}', desc: 'Token symbol' },
                    { name: '{{price}}', desc: 'Current price in USD' },
                    { name: '{{market_cap}}', desc: 'Market cap in USD' },
                    { name: '{{liquidity}}', desc: 'Liquidity in USD' },
                    { name: '{{holders}}', desc: 'Number of holders' },
                    { name: '{{quality_score}}', desc: 'Quality score (0-100)' },
                    { name: '{{risk_level}}', desc: 'Risk level' },
                    { name: '{{source}}', desc: 'Token source' },
                  ].map(variable => (
                    <div key={variable.name} className="flex justify-between items-center">
                      <div>
                        <span className="font-mono text-green-400">{variable.name}</span>
                        <span className="text-gray-400 ml-2">- {variable.desc}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(variable.name)}
                        className="h-6 w-6"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Main content */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="config">Configuration</TabsTrigger>
                  <TabsTrigger value="monitor">Monitor</TabsTrigger>
                </TabsList>

                <TabsContent value="config" className="mt-0">
                  <Card className="p-6 bg-trading-darkAccent">
                    <h3 className="text-lg font-bold mb-4">Your Webhooks</h3>

                    {webhooks.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">
                        <Webhook className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>No webhooks configured</p>
                        <p className="text-sm mt-2">Add your first webhook to receive token alerts</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {webhooks.map(webhook => (
                          <Card key={webhook.id} className="p-4 bg-black/20 border border-white/10">
                            <div className="flex justify-between">
                              <div className="flex-1">
                                <h4 className="font-bold">{webhook.name}</h4>
                                <div className="text-xs text-gray-400 truncate mt-1">{webhook.url}</div>
                                {webhook.description && (
                                  <p className="text-sm mt-1">{webhook.description}</p>
                                )}
                                <div className="flex items-center mt-2 text-xs text-gray-400">
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    webhook.status === 'active' ? 'bg-green-500' :
                                    webhook.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                                  }`}></div>
                                  <span className="capitalize">{webhook.status}</span>
                                  {webhook.lastTriggered && (
                                    <span className="ml-4">Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleTestWebhook(webhook)}
                                  title="Test webhook"
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingWebhook(webhook)}
                                  title="Edit webhook"
                                >
                                  <RotateCw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteWebhook(webhook.id)}
                                  className="text-red-500 hover:text-red-600"
                                  title="Delete webhook"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {editingWebhook ? (
                      <>
                        <Separator className="my-6" />

                        <h3 className="text-lg font-bold mb-4">Update Webhook</h3>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Name</label>
                            <Input
                              placeholder="Webhook name"
                              value={editingWebhook.name}
                              onChange={(e) => setEditingWebhook({...editingWebhook, name: e.target.value})}
                              className="bg-black/30 border-white/10"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-1 block">URL</label>
                            <Input
                              placeholder="https://example.com/webhook"
                              value={editingWebhook.url}
                              onChange={(e) => setEditingWebhook({...editingWebhook, url: e.target.value})}
                              className="bg-black/30 border-white/10"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-1 block">Description (Optional)</label>
                            <Input
                              placeholder="Webhook description"
                              value={editingWebhook.description}
                              onChange={(e) => setEditingWebhook({...editingWebhook, description: e.target.value})}
                              className="bg-black/30 border-white/10"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-1 block">Payload Template</label>
                            <Textarea
                              placeholder="Webhook payload JSON template"
                              value={editingWebhook.payload}
                              onChange={(e) => setEditingWebhook({...editingWebhook, payload: e.target.value})}
                              className="bg-black/30 border-white/10 font-mono h-40"
                            />
                          </div>

                          <div className="flex justify-end space-x-4 mt-4">
                            <Button
                              variant="outline"
                              onClick={() => setEditingWebhook(null)}
                              className="border-white/10"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleUpdateWebhook}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Update Webhook
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Separator className="my-6" />

                        <h3 className="text-lg font-bold mb-4">Add New Webhook</h3>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Name</label>
                            <Input
                              placeholder="Webhook name"
                              value={newWebhookName}
                              onChange={(e) => setNewWebhookName(e.target.value)}
                              className="bg-black/30 border-white/10"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-1 block">URL</label>
                            <Input
                              placeholder="https://example.com/webhook"
                              value={newWebhookUrl}
                              onChange={(e) => setNewWebhookUrl(e.target.value)}
                              className="bg-black/30 border-white/10"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-1 block">Description (Optional)</label>
                            <Input
                              placeholder="Webhook description"
                              value={newWebhookDesc}
                              onChange={(e) => setNewWebhookDesc(e.target.value)}
                              className="bg-black/30 border-white/10"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-1 block">Payload Template</label>
                            <Textarea
                              placeholder="Webhook payload JSON template"
                              value={customPayload}
                              onChange={(e) => setCustomPayload(e.target.value)}
                              className="bg-black/30 border-white/10 font-mono h-40"
                            />
                          </div>

                          <Button
                            onClick={handleAddWebhook}
                            className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Webhook
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="monitor" className="mt-0">
                  <WebhookMonitor />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Webhooks;
