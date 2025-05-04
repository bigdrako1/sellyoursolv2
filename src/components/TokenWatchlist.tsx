
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Star,
  Trash2,
  ExternalLink,
  Plus,
  Bell,
  BellOff,
  AlertCircle,
  Check,
  Eye,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistToken,
  setPriceAlert,
  addTokenNotes,
  WatchlistToken
} from "@/utils/watchlistUtils";

const TokenWatchlist: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchlistToken[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newToken, setNewToken] = useState({
    address: "",
    name: "",
    symbol: ""
  });
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<WatchlistToken | null>(null);
  const [alertThreshold, setAlertThreshold] = useState(5);
  const [tokenNotes, setTokenNotes] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  
  // Load watchlist on component mount
  useEffect(() => {
    setWatchlist(getWatchlist());
  }, []);
  
  const handleAddToken = () => {
    if (!newToken.address || !newToken.name || !newToken.symbol) {
      toast({
        title: "Missing Information",
        description: "Please provide all required token information",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    // Simulate API call to verify token
    setTimeout(() => {
      try {
        const updatedWatchlist = addToWatchlist({
          ...newToken,
          addedAt: new Date().toISOString()
        });
        
        setWatchlist(updatedWatchlist);
        setAddDialogOpen(false);
        setNewToken({ address: "", name: "", symbol: "" });
        setLoading(false);
        
        toast({
          title: "Token Added",
          description: `${newToken.symbol} has been added to your watchlist`,
        });
      } catch (error) {
        console.error("Error adding token:", error);
        setLoading(false);
        
        toast({
          title: "Error Adding Token",
          description: "There was a problem adding the token to your watchlist",
          variant: "destructive"
        });
      }
    }, 1000);
  };
  
  const handleRemoveToken = (token: WatchlistToken) => {
    const updatedWatchlist = removeFromWatchlist(token.address);
    setWatchlist(updatedWatchlist);
    
    toast({
      title: "Token Removed",
      description: `${token.symbol} has been removed from your watchlist`,
    });
  };
  
  const openNotesDialog = (token: WatchlistToken) => {
    setSelectedToken(token);
    setTokenNotes(token.notes || "");
    setNotesDialogOpen(true);
  };
  
  const openAlertDialog = (token: WatchlistToken) => {
    setSelectedToken(token);
    setAlertThreshold(token.alertThreshold || 5);
    setAlertDialogOpen(true);
  };
  
  const saveTokenNotes = () => {
    if (!selectedToken) return;
    
    const updatedWatchlist = addTokenNotes(selectedToken.address, tokenNotes);
    setWatchlist(updatedWatchlist);
    setNotesDialogOpen(false);
    
    toast({
      title: "Notes Saved",
      description: `Your notes for ${selectedToken.symbol} have been saved`,
    });
  };
  
  const saveAlertSettings = () => {
    if (!selectedToken) return;
    
    const updatedWatchlist = setPriceAlert(selectedToken.address, alertThreshold, true);
    setWatchlist(updatedWatchlist);
    setAlertDialogOpen(false);
    
    toast({
      title: "Alert Set",
      description: `You'll be notified when ${selectedToken.symbol} price changes by ${alertThreshold}%`,
    });
  };
  
  const toggleAlertStatus = (token: WatchlistToken) => {
    const currentStatus = token.priceAlert || false;
    const updatedWatchlist = setPriceAlert(
      token.address, 
      token.alertThreshold || 5, 
      !currentStatus
    );
    
    setWatchlist(updatedWatchlist);
    
    toast({
      title: currentStatus ? "Alert Disabled" : "Alert Enabled",
      description: currentStatus 
        ? `Price alerts for ${token.symbol} have been disabled`
        : `Price alerts for ${token.symbol} have been enabled`,
    });
  };
  
  // Filter tokens based on active tab
  const filteredTokens = activeTab === "all" 
    ? watchlist 
    : activeTab === "alerts" 
      ? watchlist.filter(token => token.priceAlert)
      : watchlist;
  
  return (
    <div className="space-y-4">
      <Card className="card-with-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            Token Watchlist
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddDialogOpen(true)}
            className="bg-black/20 border-white/10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Token
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="pb-2">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="all">All Tokens</TabsTrigger>
              <TabsTrigger value="alerts">With Alerts</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-4">
              {filteredTokens.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredTokens.map(token => (
                    <div key={token.address} className="bg-black/20 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{token.name}</span>
                          <span className="text-gray-400">${token.symbol}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {token.priceAlert && (
                            <Badge className="bg-yellow-500/30 text-yellow-400 border-yellow-500/20">
                              Alert: {token.alertThreshold}%
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-red-900/20 text-red-400"
                            onClick={() => handleRemoveToken(token)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      
                      {token.lastPrice && (
                        <div className="mt-1 mb-2">
                          <div className="text-xs text-gray-400">Last Price</div>
                          <div className="text-sm">${token.lastPrice.toFixed(8)}</div>
                        </div>
                      )}
                      
                      {token.notes && (
                        <div className="bg-gray-800/50 p-2 rounded-md text-xs mt-2 mb-2">
                          <div className="text-gray-400 mb-0.5">Notes</div>
                          <div className="text-gray-200">{token.notes}</div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs bg-black/30 border-white/5 hover:bg-black/40"
                          onClick={() => window.open(`https://birdeye.so/token/${token.address}?chain=solana`, '_blank')}
                        >
                          <Eye size={12} className="mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs bg-black/30 border-white/5 hover:bg-black/40"
                          onClick={() => window.open(`https://jup.ag/swap/SOL-${token.address}`, '_blank')}
                        >
                          <TrendingUp size={12} className="mr-1" />
                          Trade
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs bg-black/30 border-white/5 hover:bg-black/40"
                          onClick={() => openAlertDialog(token)}
                        >
                          <Bell size={12} className="mr-1" />
                          Alert
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs bg-black/30 border-white/5 hover:bg-black/40"
                          onClick={() => openNotesDialog(token)}
                        >
                          <MessageSquare size={12} className="mr-1" />
                          Notes
                        </Button>
                        <Button
                          variant={token.priceAlert ? "default" : "outline"}
                          size="sm"
                          className={`h-7 px-2 text-xs ${token.priceAlert 
                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-yellow-500/30' 
                            : 'bg-black/30 border-white/5 hover:bg-black/40'}`}
                          onClick={() => toggleAlertStatus(token)}
                        >
                          {token.priceAlert ? (
                            <>
                              <BellOff size={12} className="mr-1" />
                              Disable Alert
                            </>
                          ) : (
                            <>
                              <Bell size={12} className="mr-1" />
                              Enable Alert
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                  <p className="text-gray-400">No tokens in your watchlist</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Add tokens to your watchlist to track their prices and receive alerts
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Add Token Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900">
          <DialogHeader>
            <DialogTitle>Add Token to Watchlist</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="tokenAddress">Token Address</Label>
              <Input
                id="tokenAddress"
                value={newToken.address}
                onChange={(e) => setNewToken({...newToken, address: e.target.value})}
                placeholder="Enter token contract address"
                className="bg-black/20 border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tokenName">Token Name</Label>
              <Input
                id="tokenName"
                value={newToken.name}
                onChange={(e) => setNewToken({...newToken, name: e.target.value})}
                placeholder="Enter token name"
                className="bg-black/20 border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tokenSymbol">Token Symbol</Label>
              <Input
                id="tokenSymbol"
                value={newToken.symbol}
                onChange={(e) => setNewToken({...newToken, symbol: e.target.value})}
                placeholder="Enter token symbol"
                className="bg-black/20 border-white/10"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToken}
              disabled={loading || !newToken.address || !newToken.name || !newToken.symbol}
            >
              {loading ? (
                <>
                  <span className="mr-2">Adding...</span>
                  <span className="h-4 w-4 rounded-full border-2 border-t-transparent border-current animate-spin"></span>
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Add Token
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900">
          <DialogHeader>
            <DialogTitle>
              Token Notes - {selectedToken?.symbol}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="tokenNotes">Notes</Label>
              <Textarea
                id="tokenNotes"
                value={tokenNotes}
                onChange={(e) => setTokenNotes(e.target.value)}
                placeholder="Add your notes about this token..."
                className="bg-black/20 border-white/10 min-h-[150px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotesDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveTokenNotes}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Alert Dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900">
          <DialogHeader>
            <DialogTitle>
              Price Alert - {selectedToken?.symbol}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="alertThreshold">Price Change Threshold: {alertThreshold}%</Label>
              </div>
              <Slider
                id="alertThreshold"
                min={1}
                max={50}
                step={1}
                value={[alertThreshold]}
                onValueChange={([value]) => setAlertThreshold(value)}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>1%</span>
                <span>10%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
              <p className="text-xs text-blue-300">
                You will receive an alert when the price of {selectedToken?.symbol} changes (up or down)
                by {alertThreshold}% or more.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAlertDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveAlertSettings}>
              Set Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TokenWatchlist;
