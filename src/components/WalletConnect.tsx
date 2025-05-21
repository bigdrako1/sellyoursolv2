import { WalletConnect as NewWalletConnect } from "@/components/wallet";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Wallet,
  RotateCw,
  LogOut,
  ArrowUpRight,
  Copy,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Loader2
} from "lucide-react";
import { formatWalletAddress } from "@/utils/solanaWalletUtils";
import { useToast } from "@/hooks/use-toast";
import { useCurrencyStore } from "@/store/currencyStore";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getWalletBalances = async (address: string) => {
  try {
    // This is a placeholder - in a real app, you would fetch actual balances from Solana
    return {
      balance: 5.23, // Example SOL balance
      totalUsdValue: 150.75 // Example USD value
    };
  } catch (error) {
    console.error("Error fetching wallet balances:", error);
    return {
      balance: 0,
      totalUsdValue: 0
    };
  }
};

interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect?: () => void;
}

// Use the new component if no props are provided
const WalletConnect = (props: WalletConnectProps) => {
  // If no props are provided, use the new component
  if (!props.onConnect && !props.onDisconnect) {
    return <NewWalletConnect />;
  }

  // Otherwise, use the original component with the provided props
  const { onConnect, onDisconnect } = props;
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showBalances, setShowBalances] = useState(false);
  const [walletBalances, setWalletBalances] = useState<any>(null);
  const { toast } = useToast();
  const { currency, currencySymbol } = useCurrencyStore();
  const {
    walletAddress,
    walletProvider,
    isAuthenticated,
    signIn,
    signOut,
    installedWallets,
    walletsDetected,
    detectingWallets,
    refreshWalletsStatus
  } = useAuth();

  // Fetch wallet balances when wallet is connected
  useEffect(() => {
    if (walletAddress) {
      fetchWalletBalances(walletAddress);
    }
  }, [walletAddress]);

  const handleConnect = async (walletName?: string) => {
    setConnecting(true);

    try {
      // Always attempt to sign in with the specified wallet
      const result = await signIn(walletName);

      // If we have a result with an address, use it
      if (result && result.address) {
        onConnect(result.address);

        toast({
          title: "Wallet Connected",
          description: "Successfully connected to wallet address: " + formatWalletAddress(result.address),
          variant: "default",
        });

        // Fetch wallet balances after connection
        fetchWalletBalances(result.address);
      } else if (walletAddress && !isAuthenticated) {
        // If wallet is connected but not authenticated, proceed with authentication
        await signIn();
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);

    try {
      // Use signOut from auth context to ensure both wallet disconnection and auth state reset
      await signOut();

      setWalletBalances(null);
      setShowBalances(false);
      if (onDisconnect) onDisconnect();

      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected successfully.",
        variant: "default",
      });
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

  const handleRefreshWallets = async () => {
    await refreshWalletsStatus();
    toast({
      title: "Wallet Detection Refreshed",
      description: `${installedWallets.length} compatible wallets found`,
    });
  };

  // Convert SOL value to selected currency
  const convertToCurrency = (value: number): number => {
    const rates = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 150.56,
      KES: 129.45
    };

    return value * (rates[currency as keyof typeof rates] || 1);
  };

  const renderWalletSelector = () => {
    if (detectingWallets) {
      return (
        <Button variant="outline" disabled className="flex items-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Detecting wallets...
        </Button>
      );
    }

    if (installedWallets.length === 0) {
      return (
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-trading-danger" disabled>
            No wallets found
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={handleRefreshWallets}
            title="Refresh wallet detection"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="trading-button">
            <Wallet className="h-4 w-4 mr-2" />
            Connect & Sign In
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-trading-darkAccent border-trading-highlight/20">
          {installedWallets.map((wallet) => (
            <DropdownMenuItem
              key={wallet.name}
              className="cursor-pointer hover:bg-trading-highlight/10"
              onClick={() => handleConnect(wallet.name)}
            >
              <div className="flex items-center w-full">
                {wallet.icon && (
                  <img
                    src={wallet.icon}
                    alt={`${wallet.name} icon`}
                    className="h-5 w-5 mr-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                {wallet.name}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <Card className="trading-card card-with-border">
      <div className="flex flex-col md:flex-row justify-between items-center p-3 gap-4">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-trading-highlight" />
          <div>
            {walletAddress ? (
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">Connected Wallet</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{formatWalletAddress(walletAddress)}</span>
                  {walletProvider && (
                    <span className="text-xs bg-trading-highlight/20 text-trading-highlight px-1.5 py-0.5 rounded ml-1">
                      {walletProvider}
                    </span>
                  )}
                  <button
                    onClick={copyAddress}
                    className="text-trading-highlight hover:text-trading-highlight/80 ml-1"
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
              <div className="flex flex-col">
                <span className="font-medium">Connect Wallet</span>
                <span className="text-xs text-gray-400">
                  Sign in with any Solana wallet
                </span>
              </div>
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
          <div className="flex gap-2 items-center">
            {connecting ? (
              <Button
                disabled
                className="trading-button"
              >
                <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </Button>
            ) : (
              renderWalletSelector()
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default WalletConnect;
