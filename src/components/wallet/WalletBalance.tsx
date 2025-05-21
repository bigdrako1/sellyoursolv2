import React from "react";
import { WalletData, TokenData } from "@/utils/walletUtils";
import { formatBalance, getChangeColorClass, formatPercentageChange } from "@/utils/walletUtils";
import { ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WalletBalanceProps {
  walletData: WalletData;
  onViewToken?: (token: TokenData) => void;
}

const WalletBalance: React.FC<WalletBalanceProps> = ({ 
  walletData,
  onViewToken
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-black/20 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Total Balance</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-xs text-blue-400 hover:text-blue-300"
            onClick={() => window.open(`https://solscan.io/account/${walletData.address}`, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View on Explorer
          </Button>
        </div>
        <div className="text-2xl font-bold">${walletData.totalUsdValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
        <div className="text-sm text-gray-400 mt-1">{walletData.balance.toFixed(4)} SOL</div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Token Balances</div>
        {walletData.tokens.map((token, index) => (
          <div 
            key={index} 
            className="bg-black/20 p-3 rounded-lg flex justify-between items-center"
            onClick={() => onViewToken && onViewToken(token)}
          >
            <div>
              <div className="font-medium">{token.symbol}</div>
              <div className="text-sm text-gray-400">{token.balance.toLocaleString('en-US', { maximumFractionDigits: 4 })}</div>
            </div>
            <div className="text-right">
              <div>${token.usdValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
              {token.change24h !== undefined && (
                <div className={`text-xs flex items-center ${getChangeColorClass(token.change24h)}`}>
                  {token.change24h > 0 ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {formatPercentageChange(token.change24h)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WalletBalance;
