import { useState } from 'react';

interface Token {
  symbol: string;
  name: string;
  address?: string;
  price?: number;
  change24h?: number;
  volume?: number;
  liquidity?: number;
}

interface UseTradingReturn {
  tradingModalOpen: boolean;
  selectedTokenForTrade: Token | null;
  openTradingModal: (token: Token, action?: 'buy' | 'sell') => void;
  closeTradingModal: () => void;
}

export const useTrading = (): UseTradingReturn => {
  const [tradingModalOpen, setTradingModalOpen] = useState(false);
  const [selectedTokenForTrade, setSelectedTokenForTrade] = useState<Token | null>(null);

  const openTradingModal = (token: Token, action: 'buy' | 'sell' = 'buy') => {
    setSelectedTokenForTrade({
      ...token,
      address: token.address || `${token.symbol.toLowerCase()}_mock_address`
    });
    setTradingModalOpen(true);
  };

  const closeTradingModal = () => {
    setTradingModalOpen(false);
    setSelectedTokenForTrade(null);
  };

  return {
    tradingModalOpen,
    selectedTokenForTrade,
    openTradingModal,
    closeTradingModal
  };
};

export default useTrading;
