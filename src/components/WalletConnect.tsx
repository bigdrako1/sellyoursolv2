import { useState, useEffect, useRef, KeyboardEvent } from "react";
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
import {
  buttonA11yProps,
  handleKeyboardEvent,
  menuItemA11yProps
} from "@/utils/accessibilityUtils";

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

const WalletConnect = ({ onConnect, onDisconnect }: WalletConnectProps) => {
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
    console.log("WalletConnect useEffect triggered - walletAddress:", walletAddress);
    console.log("Current auth state - isAuthenticated:", isAuthenticated);

    if (walletAddress) {
      console.log("Wallet address available, fetching balances");
      fetchWalletBalances(walletAddress);
    } else {
      console.log("No wallet address available, skipping balance fetch");
    }

    // Log installed wallets on component mount
    console.log("Installed wallets:", installedWallets);
    console.log("Wallets detected:", walletsDetected);
  }, [walletAddress, isAuthenticated]);

  const handleConnect = async (walletName?: string) => {
    setConnecting(true);

    try {
      // Connect and authenticate in one step
      const result = await signIn(walletName);

      if (result && result.address) {
        // Call the onConnect callback with the wallet address
        onConnect(result.address);

        // Fetch wallet balances after connection
        fetchWalletBalances(result.address);
      }
    } catch (error) {
      console.error("Connection error:", error);

      // Toast notification is already handled in the AuthContext
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    console.log("handleDisconnect called");
    console.log("Current state - walletAddress:", walletAddress, "isAuthenticated:", isAuthenticated);

    setDisconnecting(true);

    try {
      console.log("Calling signOut from auth context");
      // Use signOut from auth context to ensure both wallet disconnection and auth state reset
      const signOutResult = await signOut();
      console.log("Sign out result:", signOutResult);

      console.log("Resetting wallet balances and show balances state");
      setWalletBalances(null);
      setShowBalances(false);

      if (onDisconnect) {
        console.log("Calling onDisconnect callback");
        onDisconnect();
      }

      console.log("Wallet disconnected successfully");
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Disconnection error:", error);
      console.error("Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });

      toast({
        title: "Disconnection Failed",
        description: error instanceof Error ? error.message : "Failed to disconnect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log("Disconnection attempt completed, setting disconnecting to false");
      setDisconnecting(false);
    }
  };

  const fetchWalletBalances = async (address: string) => {
    console.log("fetchWalletBalances called for address:", address);

    try {
      console.log("Calling getWalletBalances");
      // Fetch balances from Solana
      const balances = await getWalletBalances(address);
      console.log("Wallet balances received:", balances);

      setWalletBalances(balances);
      console.log("Wallet balances state updated");
    } catch (error) {
      console.error("Error fetching wallet balances:", error);
      console.error("Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });

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
            className="focus:ring-2 focus:ring-trading-highlight/50"
            aria-label="Refresh wallet detection"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh wallet detection</span>
          </Button>
        </div>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="trading-button focus:ring-2 focus:ring-trading-highlight/50"
            aria-label="Select wallet to connect"
          >
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-trading-darkAccent border-trading-highlight/20"
          aria-label="Available wallets"
        >
          {installedWallets.map((wallet) => (
            <DropdownMenuItem
              key={wallet.name}
              className="cursor-pointer hover:bg-trading-highlight/10 focus:bg-trading-highlight/20 focus:text-white"
              onClick={() => handleConnect(wallet.name)}
              onKeyDown={(e: KeyboardEvent) => handleKeyboardEvent(e, () => handleConnect(wallet.name))}
              {...menuItemA11yProps(`Connect to ${wallet.name} wallet`)}
            >
              <div className="flex items-center w-full">
                {wallet.icon && (
                  <img
                    src={wallet.icon}
                    alt="" // Empty alt since the name is already in text
                    aria-hidden="true"
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
                    onKeyDown={(e: KeyboardEvent) => handleKeyboardEvent(e, copyAddress)}
                    className="text-trading-highlight hover:text-trading-highlight/80 ml-1 focus:outline-none focus:ring-2 focus:ring-trading-highlight/50 rounded-sm"
                    {...buttonA11yProps("Copy wallet address", "Copies the wallet address to clipboard")}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="sr-only">Copy wallet address</span>
                  </button>
                </div>
                {walletBalances && (
                  <button
                    onClick={toggleBalances}
                    onKeyDown={(e: KeyboardEvent) => handleKeyboardEvent(e, toggleBalances)}
                    className="text-xs text-trading-highlight hover:underline flex items-center mt-1 focus:outline-none focus:ring-2 focus:ring-trading-highlight/50 rounded-sm p-0.5"
                    {...buttonA11yProps(
                      showBalances ? "Hide wallet balance" : "Show wallet balance",
                      "Toggles the visibility of your wallet balance"
                    )}
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
              className="border-trading-danger/30 text-trading-danger hover:bg-trading-danger/10 focus:ring-2 focus:ring-trading-danger/30"
              aria-label={disconnecting ? "Disconnecting wallet" : "Disconnect wallet"}
            >
              {disconnecting ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Disconnecting...</span>
                  <span className="sr-only">Disconnecting wallet, please wait</span>
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Disconnect</span>
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
                aria-label="Connecting to wallet, please wait"
              >
                <RotateCw className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Connecting...</span>
                <span className="sr-only">Connecting to wallet, please wait</span>
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
