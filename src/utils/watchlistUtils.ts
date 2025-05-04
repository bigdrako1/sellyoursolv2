
// Watchlist utilities

export interface WatchlistToken {
  address: string;
  name: string;
  symbol: string;
  addedAt: string;
  notes?: string;
  lastPrice?: number;
  alertThreshold?: number;
  priceAlert?: boolean;
}

/**
 * Add a token to the watchlist
 * @param token Token to add to watchlist
 * @returns Updated watchlist
 */
export const addToWatchlist = (token: WatchlistToken): WatchlistToken[] => {
  const watchlist = getWatchlist();
  
  // Check if token is already in watchlist
  const exists = watchlist.some(t => t.address === token.address);
  if (exists) {
    return watchlist;
  }
  
  // Add token to watchlist with current timestamp
  const newToken = {
    ...token,
    addedAt: new Date().toISOString()
  };
  
  const updatedWatchlist = [...watchlist, newToken];
  
  // Save to localStorage
  localStorage.setItem('token_watchlist', JSON.stringify(updatedWatchlist));
  
  return updatedWatchlist;
};

/**
 * Remove a token from the watchlist
 * @param tokenAddress Address of the token to remove
 * @returns Updated watchlist
 */
export const removeFromWatchlist = (tokenAddress: string): WatchlistToken[] => {
  const watchlist = getWatchlist();
  const updatedWatchlist = watchlist.filter(token => token.address !== tokenAddress);
  
  // Save to localStorage
  localStorage.setItem('token_watchlist', JSON.stringify(updatedWatchlist));
  
  return updatedWatchlist;
};

/**
 * Get the current watchlist
 * @returns Array of watchlist tokens
 */
export const getWatchlist = (): WatchlistToken[] => {
  const watchlist = localStorage.getItem('token_watchlist');
  
  if (!watchlist) {
    return [];
  }
  
  try {
    return JSON.parse(watchlist);
  } catch (error) {
    console.error('Error parsing watchlist:', error);
    return [];
  }
};

/**
 * Update token data in the watchlist
 * @param tokenAddress Token address to update
 * @param updates Updates to apply to the token
 * @returns Updated watchlist
 */
export const updateWatchlistToken = (
  tokenAddress: string, 
  updates: Partial<WatchlistToken>
): WatchlistToken[] => {
  const watchlist = getWatchlist();
  
  const updatedWatchlist = watchlist.map(token => {
    if (token.address === tokenAddress) {
      return { ...token, ...updates };
    }
    return token;
  });
  
  // Save to localStorage
  localStorage.setItem('token_watchlist', JSON.stringify(updatedWatchlist));
  
  return updatedWatchlist;
};

/**
 * Check if a token is in the watchlist
 * @param tokenAddress Address of token to check
 * @returns True if token is in watchlist
 */
export const isInWatchlist = (tokenAddress: string): boolean => {
  const watchlist = getWatchlist();
  return watchlist.some(token => token.address === tokenAddress);
};

/**
 * Set price alert for a token
 * @param tokenAddress Token address
 * @param threshold Price change threshold percentage
 * @param enabled Whether alert is enabled
 * @returns Updated watchlist
 */
export const setPriceAlert = (
  tokenAddress: string, 
  threshold: number, 
  enabled: boolean
): WatchlistToken[] => {
  return updateWatchlistToken(tokenAddress, {
    alertThreshold: threshold,
    priceAlert: enabled
  });
};

/**
 * Add notes to a watchlist token
 * @param tokenAddress Token address
 * @param notes Notes to add
 * @returns Updated watchlist
 */
export const addTokenNotes = (tokenAddress: string, notes: string): WatchlistToken[] => {
  return updateWatchlistToken(tokenAddress, { notes });
};
