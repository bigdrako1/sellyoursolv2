import React, { useState, useEffect } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  WebhookTransactionType, 
  createTokenTransferWebhook, 
  createNftActivityWebhook,
  createWalletActivityWebhook,
  listWebhooks,
  removeWebhook
} from "@/utils/webhookUtils";
import { getConnectedWallet } from "@/utils/walletUtils";
import { ChevronDown, Trash2, Plus } from "lucide-react";

const Webhooks: React.FC = () => {
  const [systemActive, setSystemActive] = useState(true);
  const [systemLatency, setSystemLatency] = useState(25);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [webhookUrl, setWebhookUrl] = useState("");
  const [accountAddress, setAccountAddress] = useState("");
  const [webhookType, setWebhookType] = useState<string>(WebhookTransactionType.TRANSFER);
  const [webhookName, setWebhookName] = useState("");
  
  const { toast } = useToast();
  
  // Check for connected wallet
  useEffect(() => {
    const savedWallet = getConnectedWallet();
    if (savedWallet) {
      setWalletAddress(savedWallet);
    }
  }, []);
  
  // Load webhooks
  useEffect(() => {
    fetchWebhooks();
  }, []);
  
  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const result = await listWebhooks();
      setWebhooks(result);
    } catch (error) {
      console.error("Failed to fetch webhooks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch webhooks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitWebhook = async () => {
    if (!webhookUrl || !accountAddress) {
      toast({
        title: "Missing Information",
        description: "Please provide both webhook URL and account address.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      let result;
      const name = webhookName || "Webhook " + new Date().toISOString();
      
      switch (webhookType) {
        case WebhookTransactionType.TOKEN_TRANSFER:
        case WebhookTransactionType.TRANSFER:
          result = await createTokenTransferWebhook(name, webhookUrl, [accountAddress]);
          break;
        case WebhookTransactionType.NFT_MINT:
        case WebhookTransactionType.NFT_SALE:
        case WebhookTransactionType.NFT_LISTING:
          result = await createNftActivityWebhook(name, webhookUrl, [accountAddress]);
          break;
        default:
          result = await createWalletActivityWebhook(name, webhookUrl, [accountAddress]);
      }
      
      toast({
        title: "Webhook Created",
        description: `Successfully created webhook with ID: ${result?.id || 'unknown'}`,
      });
      
      // Reset form
      setWebhookUrl("");
      setAccountAddress("");
      setWebhookName("");
      setShowCreateForm(false);
      
      // Refresh webhooks
      fetchWebhooks();
    } catch (error) {
      console.error("Failed to create webhook:", error);
      toast({
        title: "Error",
        description: "Failed to create webhook. Please check your inputs and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      setLoading(true);
      const success = await removeWebhook(webhookId);
      
      if (success) {
        toast({
          title: "Webhook Deleted",
          description: "Successfully deleted webhook."
        });
        
        // Refresh webhooks
        fetchWebhooks();
      } else {
        throw new Error("Failed to delete webhook");
      }
    } catch (error) {
      console.error(`Failed to delete webhook ${webhookId}:`, error);
      toast({
        title: "Error",
        description: "Failed to delete webhook. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-trading-dark text-white">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 pb-10">
        <div className="py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Webhooks</h1>
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)} 
              className="trading-button"
            >
              <Plus size={16} className="mr-2" />
              Create Webhook
            </Button>
          </div>
          
          {showCreateForm && (
            <Card className="mb-6 bg-black/20 border-white/10">
              <CardHeader>
                <CardTitle>Create New Webhook</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Webhook Name (Optional)</label>
                    <Input 
                      value={webhookName}
                      onChange={(e) => setWebhookName(e.target.value)}
                      placeholder="My Webhook"
                      className="bg-black/30 border-white/10"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Webhook URL</label>
                    <Input 
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://your-server.com/webhook"
                      className="bg-black/30 border-white/10"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      The URL that will receive webhook events from Helius
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Account Address</label>
                    <Input 
                      value={accountAddress}
                      onChange={(e) => setAccountAddress(e.target.value)}
                      placeholder="Solana address to monitor"
                      className="bg-black/30 border-white/10"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Webhook Type</label>
                    <Select 
                      value={webhookType} 
                      onValueChange={setWebhookType}
                    >
                      <SelectTrigger className="bg-black/30 border-white/10">
                        <SelectValue placeholder="Select webhook type" />
                      </SelectTrigger>
                      <SelectContent className="bg-trading-darkAccent border-white/10">
                        <SelectItem value={WebhookTransactionType.TOKEN_TRANSFER}>Token Transfer</SelectItem>
                        <SelectItem value={WebhookTransactionType.NFT_MINT}>NFT Mint</SelectItem>
                        <SelectItem value={WebhookTransactionType.NFT_SALE}>NFT Sale</SelectItem>
                        <SelectItem value={WebhookTransactionType.NFT_LISTING}>NFT Listing</SelectItem>
                        <SelectItem value={WebhookTransactionType.SWAP}>Token Swap</SelectItem>
                        <SelectItem value={WebhookTransactionType.ANY}>Any Transaction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={handleSubmitWebhook}
                      disabled={loading || !webhookUrl || !accountAddress}
                      className="trading-button"
                    >
                      Create Webhook
                    </Button>
                    <Button 
                      onClick={() => setShowCreateForm(false)}
                      variant="outline"
                      className="border-white/10 hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Tabs defaultValue="active">
            <TabsList className="bg-trading-darkAccent w-full mb-4">
              <TabsTrigger value="active" className="flex-1">Active Webhooks</TabsTrigger>
              <TabsTrigger value="logs" className="flex-1">Webhook Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active">
              <Card className="bg-black/20 border-white/10">
                <CardContent className="p-4">
                  {loading ? (
                    <div className="py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                      <p className="mt-2">Loading webhooks...</p>
                    </div>
                  ) : webhooks.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-gray-400">No webhooks found. Create one to get started.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead>Webhook ID</TableHead>
                          <TableHead>URL</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Addresses</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {webhooks.map((webhook) => (
                          <TableRow key={webhook.id} className="border-white/10">
                            <TableCell className="font-mono">{webhook.id}</TableCell>
                            <TableCell className="truncate max-w-[200px]">{webhook.url}</TableCell>
                            <TableCell>{Array.isArray(webhook.transactionTypes) ? webhook.transactionTypes.join(', ') : 'Any'}</TableCell>
                            <TableCell className="truncate max-w-[200px]">
                              {Array.isArray(webhook.accountAddresses) ? webhook.accountAddresses.length : 0} address(es)
                            </TableCell>
                            <TableCell>
                              <Button 
                                onClick={() => handleDeleteWebhook(webhook.id)}
                                variant="ghost" 
                                size="sm"
                                className="hover:bg-red-900/20 hover:text-red-500"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="logs">
              <Card className="bg-black/20 border-white/10">
                <CardContent className="p-4">
                  <p className="text-center py-6 text-gray-400">
                    Webhook event logs will be displayed here.
                    <br />
                    Configure a webhook first to start receiving events.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer systemActive={systemActive} systemLatency={systemLatency} />
    </div>
  );
};

export default Webhooks;
