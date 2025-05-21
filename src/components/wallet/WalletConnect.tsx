import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  connectWallet, 
  disconnectWallet, 
  getWalletBalances, 
  WalletData,
  signMessage
} from "@/utils/walletUtils";
import WalletCard from "./WalletCard";
import WalletSelector, { WalletProviderInfo } from "./WalletSelector";
import WalletBalance from "./WalletBalance";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

// Mock wallet providers for development
const WALLET_PROVIDERS: WalletProviderInfo[] = [
  {
    name: "Phantom",
    icon: "https://phantom.app/favicon.ico",
    installed: true
  },
  {
    name: "Solflare",
    icon: "https://solflare.com/favicon.ico",
    installed: true
  },
  {
    name: "Coinbase Wallet",
    icon: "https://www.coinbase.com/favicon.ico",
    installed: true
  }
];

const WalletConnect: React.FC = () => {
  const { user, signIn, signOut } = useAuth();
  const [detectingWallets, setDetectingWallets] = useState(true);
  const [installedWallets, setInstalledWallets] = useState<WalletProviderInfo[]>([]);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Detect installed wallets
    detectWallets();
    
    // If user is already signed in, fetch wallet data
    if (user?.walletAddress) {
      fetchWalletData(user.walletAddress);
    }
  }, [user]);

  const detectWallets = () => {
    setDetectingWallets(true);
    
    // In a real app, this would detect actual wallet extensions
    setTimeout(() => {
      setInstalledWallets(WALLET_PROVIDERS);
      setDetectingWallets(false);
    }, 1000);
  };

  const fetchWalletData = async (address: string) => {
    setLoading(true);
    try {
      const data = await getWalletBalances(address);
      setWalletData(data);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast.error("Failed to fetch wallet data");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (walletName: string) => {
    setLoading(true);
    try {
      // Connect to wallet
      const result = await connectWallet(walletName);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to connect wallet");
      }
      
      // Sign message for authentication
      const message = `Sign in to SellYourSolv2 at ${new Date().toISOString()}`;
      const signature = await signMessage(message, result.address);
      
      if (!signature || !signature.signature) {
        throw new Error("Failed to sign message");
      }
      
      // Sign in with the signature
      await signIn({
        walletAddress: result.address,
        signature: signature.signature,
        provider: walletName
      });
      
      // Fetch wallet data
      await fetchWalletData(result.address);
      
      toast.success("Wallet connected successfully");
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await disconnectWallet();
      await signOut();
      setWalletData(null);
      toast.success("Wallet disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error("Failed to disconnect wallet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <WalletCard title="Wallet">
      {user?.walletAddress ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-400">Connected Wallet</div>
              <div className="font-medium">{user.walletAddress}</div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDisconnect}
              disabled={loading}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : walletData ? (
            <WalletBalance walletData={walletData} />
          ) : (
            <div className="text-center py-4 text-gray-400">
              Failed to load wallet data
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center py-6 space-y-4">
          <p className="text-gray-400 text-center mb-4">
            Connect your Solana wallet to access the platform
          </p>
          
          <WalletSelector
            detectingWallets={detectingWallets}
            installedWallets={installedWallets}
            onConnect={handleConnect}
            onRefresh={detectWallets}
          />
        </div>
      )}
    </WalletCard>
  );
};

export default WalletConnect;
