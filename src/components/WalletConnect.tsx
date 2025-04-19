
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, RotateCw, LogOut, ArrowUpRight } from "lucide-react";
import { getWalletBalances } from "@/utils/walletUtils";
import { useToast } from "@/components/ui/use-toast";

interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect?: () => void;
}

const WalletConnect = ({ onConnect, onDisconnect }: WalletConnectProps) => {
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletBalances, setWalletBalances] = useState<any>(null);
  const [showBalances, setShowBalances] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setConnecting(true);
    
    try {
      // Simulating wallet connection
      setTimeout(() => {
        const mockAddress = "8xH5f...3Zdy7";
        setWalletAddress(mockAddress);
        onConnect(mockAddress);
        setConnecting(false);
        
        toast({
          title: "Wallet Connected",
          description: "Successfully connected to wallet address: " + mockAddress,
          variant: "default",
        });
        
        // Fetch wallet balances after connection
        fetchWalletBalances(mockAddress);
      }, 1500);
    } catch (error) {
      setConnecting(false);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleDisconnect = () => {
    setDisconnecting(true);
    
    try {
      // Simulating wallet disconnection
      setTimeout(() => {
        setWalletAddress("");
        setWalletBalances(null);
        setShowBalances(false);
        if (onDisconnect) onDisconnect();
        setDisconnecting(false);
        
        toast({
          title: "Wallet Disconnected",
          description: "Your wallet has been disconnected successfully.",
          variant: "default",
        });
      }, 800);
    } catch (error) {
      setDisconnecting(false);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const fetchWalletBalances = async (address: string) => {
    try {
      // Fetch balances from both chains
      const solanaBalances = await getWalletBalances(address, "solana");
      setWalletBalances(solanaBalances);
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

  return (
    <Card className="trading-card">
      <div className="flex flex-col md:flex-row justify-between items-center p-3 gap-4">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-trading-highlight" />
          <div>
            {walletAddress ? (
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">Connected Wallet</span>
                <span className="font-medium">{walletAddress}</span>
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
                <div className="font-medium">{walletBalances.nativeBalance.toFixed(4)} SOL</div>
                <div className="text-xs text-trading-highlight">${walletBalances.totalUsdValue.toFixed(2)}</div>
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
