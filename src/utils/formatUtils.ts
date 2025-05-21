/**
 * Format a timestamp to a human-readable "time ago" string
 */
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else {
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  }
};

/**
 * Format a numeric amount with a token symbol
 */
export const formatAmount = (amount: number, symbol: string): string => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(2)}B ${symbol}`;
  } else if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}M ${symbol}`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(2)}K ${symbol}`;
  } else {
    return `${amount} ${symbol}`;
  }
};

/**
 * Format a wallet address to a shortened form
 */
export const formatWalletAddress = (address: string): string => {
  if (!address) return '';
  return address.length > 8 ? `${address.slice(0, 4)}...${address.slice(-4)}` : address;
};

/**
 * Convert a value to a different currency
 */
export const convertToCurrency = (value: number, currency: string): number => {
  const rates = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 150.56,
    KES: 129.45
  };

  return value * (rates[currency as keyof typeof rates] || 1);
};
