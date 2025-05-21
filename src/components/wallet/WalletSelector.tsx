import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Wallet, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface WalletProviderInfo {
  name: string;
  icon?: string;
  installed: boolean;
}

interface WalletSelectorProps {
  detectingWallets: boolean;
  installedWallets: WalletProviderInfo[];
  onConnect: (walletName: string) => void;
  onRefresh: () => void;
}

const WalletSelector: React.FC<WalletSelectorProps> = ({
  detectingWallets,
  installedWallets,
  onConnect,
  onRefresh
}) => {
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
          onClick={onRefresh}
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
            onClick={() => onConnect(wallet.name)}
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

export default WalletSelector;
