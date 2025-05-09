
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, RefreshCw, Plus, Trash2, Twitter, Search, ExternalLink } from 'lucide-react';
import { 
  useTwitterScraper, 
  TwitterAccount, 
  ScrapedToken,
  extractContractAddresses 
} from '@/services/twitterScraperService';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const TwitterScraper = () => {
  const { toast } = useToast();
  const { 
    accounts, 
    tokens, 
    lastCheckTime,
    isChecking,
    checkAllAccounts,
    updateAccount,
    addAccount,
    removeAccount,
    markTokenAsProcessed
  } = useTwitterScraper(120000); // Check every 2 minutes
  
  const [newAccountUsername, setNewAccountUsername] = useState('');
  const [newAccountDisplayName, setNewAccountDisplayName] = useState('');
  const [activeTab, setActiveTab] = useState('tokens');
  const [filterProcessed, setFilterProcessed] = useState(false);
  
  // Filter tokens based on processed state
  const filteredTokens = filterProcessed 
    ? tokens.filter(token => !token.processed)
    : tokens;

  // Test the contract address extraction function
  useEffect(() => {
    // Demo test the extraction function
    const testExtract = extractContractAddresses("Check this token DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 it's amazing!");
    console.log("Contract extraction test:", testExtract);
  }, []);
  
  // Handle adding a new account
  const handleAddAccount = () => {
    if (!newAccountUsername.trim()) return;
    
    const displayName = newAccountDisplayName.trim() || newAccountUsername.trim();
    
    addAccount({
      username: newAccountUsername.trim(),
      displayName,
      lastChecked: new Date(),
      enabled: true
    });
    
    toast({
      title: "Account added",
      description: `Now monitoring @${newAccountUsername.trim()} for Solana contracts`,
    });
    
    setNewAccountUsername('');
    setNewAccountDisplayName('');
  };
  
  // Test scan function
  const handleTestScan = async () => {
    try {
      toast({
        title: "Scanning accounts",
        description: "Looking for contract addresses in recent tweets...",
      });
      
      await checkAllAccounts();
      
      if (tokens.length === 0) {
        toast({
          title: "No tokens found",
          description: "No contract addresses were found in recent tweets.",
        });
      }
    } catch (error) {
      console.error("Error during test scan:", error);
      toast({
        title: "Scan failed",
        description: "There was an error scanning for contract addresses.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Twitter className="mr-2 h-5 w-5 text-blue-400" />
          Twitter Contract Scanner
        </CardTitle>
        <CardDescription>
          Automatically scan Twitter accounts for Solana contract addresses
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full border-b rounded-none">
            <TabsTrigger value="tokens" className="flex-1">Found Tokens ({tokens.length})</TabsTrigger>
            <TabsTrigger value="accounts" className="flex-1">Monitored Accounts ({accounts.length})</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tokens" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium">
                  {filteredTokens.length} Token{filteredTokens.length !== 1 ? 's' : ''}
                </h3>
                <p className="text-xs text-gray-500">
                  Last checked {formatDistanceToNow(lastCheckTime, { addSuffix: true })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="show-unprocessed" 
                    checked={filterProcessed} 
                    onCheckedChange={setFilterProcessed}
                  />
                  <Label htmlFor="show-unprocessed" className="text-xs">Show unprocessed only</Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestScan}
                  disabled={isChecking}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
                  Scan Now
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-[320px]">
              {filteredTokens.length > 0 ? (
                <div className="space-y-2">
                  {filteredTokens.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map(token => (
                    <TokenCard 
                      key={`${token.contractAddress}-${token.tweetId}`} 
                      token={token}
                      onMarkProcessed={() => markTokenAsProcessed(token.contractAddress, token.tweetId)} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-500">No tokens found yet</p>
                  <p className="text-sm text-gray-400">
                    Tokens will appear here when they are found in monitored Twitter accounts
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="accounts" className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Input
                placeholder="Twitter username"
                value={newAccountUsername}
                onChange={(e) => setNewAccountUsername(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Display name (optional)"
                value={newAccountDisplayName}
                onChange={(e) => setNewAccountDisplayName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddAccount} disabled={!newAccountUsername.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            
            {accounts.length > 0 ? (
              <div className="space-y-2">
                {accounts.map(account => (
                  <div 
                    key={account.username}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={account.enabled}
                        onCheckedChange={(checked) => updateAccount(account.username, { enabled: checked })}
                      />
                      <div>
                        <p className="font-medium">{account.displayName}</p>
                        <p className="text-sm text-gray-500">@{account.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Checked {formatDistanceToNow(account.lastChecked, { addSuffix: true })}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAccount(account.username)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No accounts added yet</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Scanner Settings</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="scan-interval">Scan interval</Label>
                    <div className="text-sm">2 minutes</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-detect">Automatically detect contract addresses</Label>
                    <Switch id="auto-detect" defaultChecked />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Notification Settings</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="desktop-notifications">Show desktop notifications</Label>
                    <Switch id="desktop-notifications" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound-notifications">Play sound on new token</Label>
                    <Switch id="sound-notifications" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Component to display a single token card
const TokenCard = ({ token, onMarkProcessed }: { token: ScrapedToken, onMarkProcessed: () => void }) => {
  return (
    <div className={`border rounded-md p-3 ${token.processed ? 'bg-gray-50 dark:bg-gray-900/30' : ''}`}>
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={token.processed ? "secondary" : "default"}>
            {token.processed ? 'Processed' : 'New'}
          </Badge>
          <p className="text-sm text-gray-500">
            From @{token.username}
          </p>
        </div>
        <div className="text-xs text-gray-500">
          {formatDistanceToNow(token.timestamp, { addSuffix: true })}
        </div>
      </div>
      
      <p className="mt-2 text-sm">{token.text}</p>
      
      <div className="mt-2">
        <p className="text-xs text-gray-500">Contract Address:</p>
        <code className="text-xs bg-gray-100 dark:bg-gray-900 p-1 rounded font-mono block overflow-x-auto">
          {token.contractAddress}
        </code>
      </div>
      
      <div className="mt-3 flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a 
              href={`https://birdeye.so/token/${token.contractAddress}?chain=solana`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <Search className="h-3 w-3 mr-1" />
              Birdeye
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a 
              href={`https://jup.ag/swap/SOL-${token.contractAddress}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Jupiter
            </a>
          </Button>
        </div>
        {!token.processed && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onMarkProcessed}
          >
            Mark as processed
          </Button>
        )}
      </div>
    </div>
  );
};

export default TwitterScraper;
