
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, RotateCw, LogOut, ArrowUpRight, Copy } from "lucide-react";
import { getWalletBalances, connectWallet, disconnectWallet, getConnectedWallet } from "@/utils/walletUtils";
import { useToast } from "@/hooks/use-toast";
import { useCurrencyStore } from "@/store/currencyStore";

interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect?: () => void;
}

const WalletConnect = ({ onConnect, onDisconnect }: WalletConnectProps) => {
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalances, setWalletBalances] = useState<any>(null);
  const [showBalances, setShowBalances] = useState(false);
  const { toast } = useToast();
  const { currency, currencySymbol } = useCurrencyStore();

  // Check for connected wallet on mount
  useEffect(() => {
    const savedWallet = getConnectedWallet();
    if (savedWallet) {
      setWalletAddress(savedWallet);
      onConnect(savedWallet);
      fetchWalletBalances(savedWallet);
    }
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    
    try {
      const result = await connectWallet("Phantom");
      if (result.success) {
        setWalletAddress(result.address);
        onConnect(result.address);
        
        toast({
          title: "Wallet Connected",
          description: "Successfully connected to wallet address: " + result.address,
          variant: "default",
        });
        
        // Fetch wallet balances after connection
        fetchWalletBalances(result.address);
      } else {
        throw new Error(result.error || "Failed to connect");
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };
  
  const handleDisconnect = async () => {
    setDisconnecting(true);
    
    try {
      const success = await disconnectWallet();
      
      if (success) {
        setWalletAddress(null);
        setWalletBalances(null);
        setShowBalances(false);
        if (onDisconnect) onDisconnect();
        
        toast({
          title: "Wallet Disconnected",
          description: "Your wallet has been disconnected successfully.",
          variant: "default",
        });
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDisconnecting(false);
    }
  };
  
  const fetchWalletBalances = async (address: string) => {
    try {
      // Fetch balances from Solana
      const balances = await getWalletBalances(address);
      setWalletBalances(balances);
    } catch (error) {
      console.error("Error fetching wallet balances:", error);
      toast({
        title: "Balance Fetch Failed",
        description: "Unable to retrieve wallet balances. Please refresh.",
        variant: "destructive",
      });
    }
  };
  
  const toggleBalances = () => {
    setShowBalances(!showBalances);
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
        variant: "default",
      });
    }
  };

  // Convert SOL value to selected currency
  const convertToCurrency = (value: number): number => {
    const rates = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 150.56
    };
    
    return value * (rates[currency as keyof typeof rates] || 1);
  };

  return (
    <Card className="trading-card">
      <div className="flex flex-col md:flex-row justify-between items-center p-3 gap-4">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-trading-highlight" />
          <div>
            {walletAddress ? (
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">Connected Wallet</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{walletAddress}</span>
                  <button 
                    onClick={copyAddress}
                    className="text-trading-highlight hover:text-trading-highlight/80"
                    aria-label="Copy wallet address"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                {walletBalances && (
                  <button 
                    onClick={toggleBalances} 
                    className="text-xs text-trading-highlight hover:underline flex items-center mt-1"
                  >
                    {showBalances ? "Hide Balance" : "Show Balance"} <ArrowUpRight className="ml-1 h-3 w-3" />
                  </button>
                )}
              </div>
            ) : (
              <span className="font-medium">Connect Wallet</span>
            )}
          </div>
        </div>
        
        {walletAddress ? (
          <div className="flex gap-2 items-center">
            {showBalances && walletBalances && (
              <div className="text-right mr-2">
                <div className="text-xs text-gray-400">Balance</div>
                <div className="font-medium">{walletBalances.balance.toFixed(4)} SOL</div>
                <div className="text-xs text-trading-highlight">
                  {currencySymbol}{convertToCurrency(walletBalances.totalUsdValue).toFixed(2)}
                </div>
              </div>
            )}
            <Button 
              onClick={handleDisconnect} 
              disabled={disconnecting}
              variant="outline"
              className="border-trading-danger/30 text-trading-danger hover:bg-trading-danger/10"
            >
              {disconnecting ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleConnect} 
            disabled={connecting}
            className="trading-button"
          >
            {connecting ? (
              <>
                <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect"
            )}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default WalletConnect;
