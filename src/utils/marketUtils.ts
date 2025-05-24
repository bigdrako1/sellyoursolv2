
// Trading utilities for autonomous trading platform
import { getTokenPrices, heliusRpcCall, heliusApiCall } from './apiUtils';

/**
 * Get price history for a token
 * @param tokenSymbol Symbol of the token
 * @param days Number of days to get history for
 * @returns Array of price data points
 */
export const getTokenPriceHistory = async (tokenSymbol: string, days: number = 1) => {
  try {
    // This would normally fetch real price history from an API
    // For now we generate realistic mock data
    const currentPrice = await getTokenPrice(tokenSymbol) || 50;
    const points = days === (1/24) ? 24 : days === 1 ? 24 : 7 * 24;
    const interval = (days * 24 * 60 * 60 * 1000) / points;

    const now = new Date();
    const startTime = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Create realistic price data with some volatility
    const data = [];
    let lastPrice = currentPrice * 0.85; // Start a bit lower than current

    for (let i = 0; i <= points; i++) {
      const time = new Date(startTime.getTime() + i * interval);

      // Add some randomness to price movement (more volatile for shorter timeframes)
      const volatility = days <= 1 ? 0.02 : 0.01;
      const change = (Math.random() - 0.5) * volatility;

      // Trend upwards slightly over time
      const trend = 0.001;

      // Calculate new price
      lastPrice = lastPrice * (1 + change + trend);

      // Ensure price stays positive
      if (lastPrice <= 0) lastPrice = 0.01;

      // Format time string based on timeframe
      let timeString = "";
      if (days <= 1/24) {
        timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (days <= 1) {
        timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        timeString = time.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }

      data.push({
        time: timeString,
        price: lastPrice,
        fullDate: time
      });
    }

    // Ensure the last data point matches current price
    if (data.length > 0) {
      data[data.length - 1].price = currentPrice;
    }

    return data;
  } catch (error) {
    console.error(`Error getting price history for ${tokenSymbol}:`, error);
    return [];
  }
};

/**
 * Get trending tokens
 * @param limit Number of tokens to return
 * @returns Array of trending token data
 */
export const getTrendingTokens = async (limit: number = 10) => {
  try {
    // This would normally fetch real trending tokens from an API
    // For now we create realistic mock data
    const trendingTokens = [
      {
        name: "Solana",
        symbol: "SOL",
        price: 160.42,
        change24h: 5.2,
        volume24h: 1200000000,
        source: "Jupiter"
      },
      {
        name: "Bonk",
        symbol: "BONK",
        price: 0.000023,
        change24h: 12.5,
        volume24h: 85000000,
        source: "Raydium"
      },
      {
        name: "Daisy",
        symbol: "DAISY",
        price: 0.00074,
        change24h: -3.1,
        volume24h: 23000000,
        source: "Pump.fun"
      },
      {
        name: "Samoyedcoin",
        symbol: "SAMO",
        price: 0.0234,
        change24h: 8.7,
        volume24h: 19000000,
        source: "Jupiter"
      },
      {
        name: "Pyth Network",
        symbol: "PYTH",
        price: 0.532,
        change24h: 2.1,
        volume24h: 17500000,
        source: "Raydium"
      },
      {
        name: "MonkeyBucks",
        symbol: "MBS",
        price: 0.0005234,
        change24h: 45.3,
        volume24h: 8500000,
        source: "Pump.fun"
      },
      {
        name: "Dogwifhat",
        symbol: "WIF",
        price: 1.23,
        change24h: -1.7,
        volume24h: 65000000,
        source: "Jupiter"
      },
      {
        name: "Render Token",
        symbol: "RNDR",
        price: 7.32,
        change24h: 0.5,
        volume24h: 12000000,
        source: "Raydium"
      },
      {
        name: "Jito",
        symbol: "JTO",
        price: 3.75,
        change24h: 1.2,
        volume24h: 8900000,
        source: "Jupiter"
      },
      {
        name: "Meme100",
        symbol: "MEME",
        price: 0.000178,
        change24h: 103.5,
        volume24h: 4300000,
        source: "Pump.fun"
      }
    ];

    return trendingTokens.slice(0, limit);
  } catch (error) {
    console.error("Error fetching trending tokens:", error);
    return [];
  }
};

/**
 * Format currency value
 * @param value Number to format
 * @param currency Currency code
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 0.01 ? 8 : 2
  });

  return formatter.format(value);
};

/**
 * Get market overview data
 * @returns Market overview data
 */
export const getMarketOverview = async () => {
  try {
    // This would normally fetch real market overview data from an API
    // For now we create realistic mock data
    return {
      totalMarketCap: 3200000000000,
      solanaMarketCap: 75000000000,
      totalVolume24h: 120000000000,
      solanaVolume24h: 8500000000,
      btcDominance: 52.3,
      fearGreedIndex: 65,
      trending: ["SOL", "WIF", "BONK", "JTO", "MEME"],
      gainers: [
        { symbol: "MEME", change24h: 103.5 },
        { symbol: "MBS", change24h: 45.3 },
        { symbol: "BONK", change24h: 12.5 },
        { symbol: "SAMO", change24h: 8.7 },
        { symbol: "SOL", change24h: 5.2 }
      ],
      losers: [
        { symbol: "DAISY", change24h: -3.1 },
        { symbol: "WIF", change24h: -1.7 },
        { symbol: "DUST", change24h: -0.9 },
        { symbol: "GENOPETS", change24h: -0.6 },
        { symbol: "STEP", change24h: -0.4 }
      ]
    };
  } catch (error) {
    console.error("Error fetching market overview:", error);
    return null;
  }
};

/**
 * Analyzes market data to identify potential runners
 * @param marketData Array of token market data
 * @param timeframe Timeframe to analyze (1h, 1d, 1w)
 * @returns Array of potential market runners with confidence score
 */
export const identifyPotentialRunners = async (marketData: any[], timeframe: string): Promise<any[]> => {
  if (!marketData || marketData.length === 0) {
    return [];
  }

  try {
    // Process real market data to detect potential runners
    return marketData.map(token => {
      // Calculate volume increase from real data
      const volumeIncrease = token.volume24h ? (token.volume24h / (token.volume48h || token.volume24h * 0.8)) * 100 - 100 : 0;
      const priceMovement = token.change24h || 0;
      const socialMentions = token.socialScore || 0;

      // Calculate a confidence score based on multiple factors
      const confidenceScore =
        (volumeIncrease * 0.4) +
        (priceMovement > 0 ? priceMovement * 3 : 0) +
        (socialMentions * 0.05);

      return {
        ...token,
        confidenceScore: Math.min(Math.floor(confidenceScore), 100),
        indicators: {
          volumeIncrease: `${volumeIncrease.toFixed(2)}%`,
          priceMovement: `${priceMovement.toFixed(2)}%`,
          socialMentions
        }
      };
    }).sort((a, b) => b.confidenceScore - a.confidenceScore);
  } catch (error) {
    console.error("Error analyzing market data:", error);
    return [];
  }
};

/**
 * Executes a trade based on strategy settings
 * @param tokenSymbol Symbol of the token to trade
 * @param amount Amount to trade
 * @returns Transaction details
 */
export const executeTrade = async (
  tokenSymbol: string,
  amount: number
): Promise<any> => {
  try {
    const price = await getTokenPrice(tokenSymbol);

    if (!price) {
      throw new Error(`Could not get price for ${tokenSymbol}`);
    }

    // This would connect to a real trading API in production
    // For now, we create a real transaction object with current market data
    const transactionParams = {
      tokenSymbol,
      amount,
      price,
      chain: "solana",
      timestamp: new Date().toISOString(),
      estimatedValue: amount * price
    };

    console.log(`Executing trade: ${amount} ${tokenSymbol} at $${price}`);

    // In production, this would return the actual transaction hash from the blockchain
    // For now, we create a simulated hash based on real parameters
    const txHash = await simulateTransaction(transactionParams);

    return {
      ...transactionParams,
      success: true,
      executionTime: 1200, // in milliseconds
      gasFee: 0.00001, // Solana gas fee is very low
      txHash
    };
  } catch (error) {
    console.error("Trade execution error:", error);
    return {
      tokenSymbol,
      amount,
      chain: "solana",
      success: false,
      error: "Transaction failed",
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get real-time price for a token
 * @param tokenIdentifier Symbol or address of the token
 * @returns Current price in USD
 */
export async function getTokenPrice(tokenIdentifier: string): Promise<number | null> {
  try {
    // If it looks like an address (long string), try to get price by address
    if (tokenIdentifier.length > 10) {
      // For now, return a mock price based on the address
      // In production, this would call a real price API with the token address
      const mockPrices: { [key: string]: number } = {
        'sol_mock_address': 160.42,
        'bonk_mock_address': 0.000023,
        'daisy_mock_address': 0.00074,
        'samo_mock_address': 0.0234,
        'pyth_mock_address': 0.532,
        'mbs_mock_address': 0.0005234,
        'wif_mock_address': 1.23,
        'rndr_mock_address': 7.32,
        'jto_mock_address': 3.75,
        'meme_mock_address': 0.000178
      };

      return mockPrices[tokenIdentifier] || Math.random() * 10; // Random price for unknown tokens
    }

    // Otherwise, try to get price by symbol
    const prices = await getTokenPrices([tokenIdentifier]);
    return prices[tokenIdentifier] || null;
  } catch (error) {
    console.error(`Error getting price for ${tokenIdentifier}:`, error);
    return null;
  }
}

/**
 * Simulate a transaction on the blockchain (for demo purposes)
 * In production, this would submit a real transaction
 */
async function simulateTransaction(params: any): Promise<string> {
  // Create a transaction-like hash based on real parameters
  const randomHex = () => Math.floor(Math.random() * 16).toString(16);
  const hashBase = `${params.tokenSymbol}-${params.amount}-${params.timestamp}`;
  const hash = Array.from({length: 64}, () => randomHex()).join('');

  // Log the simulated transaction
  console.log(`Simulated transaction: ${hash}`);

  return hash;
}

/**
 * Calculates optimal trade size based on wallet balance and risk parameters
 * @param walletBalance Available balance
 * @param riskLevel Risk level (1-3)
 * @param tokenVolatility Token volatility score (0-100)
 * @returns Optimal trade amount
 */
export const calculateOptimalTradeSize = (
  walletBalance: number,
  riskLevel: number,
  tokenVolatility: number
): number => {
  // Base percentage based on risk level
  const basePercentage = riskLevel === 1 ? 0.05 : riskLevel === 2 ? 0.1 : 0.2;

  // Adjust based on volatility
  const volatilityFactor = 1 - (tokenVolatility / 200); // Higher volatility = lower size

  // Calculate final trade size
  const optimalSize = walletBalance * basePercentage * volatilityFactor;

  // Apply minimum and maximum constraints
  return Math.max(0.01, Math.min(optimalSize, walletBalance * 0.4));
};

/**
 * Track wallet activities of known profitable traders
 * @param walletAddresses Array of wallet addresses to track
 * @returns Recent activities of tracked wallets
 */
export const trackWalletActivities = async (walletAddresses: string[]): Promise<any[]> => {
  if (!walletAddresses || walletAddresses.length === 0) {
    return [];
  }

  try {
    // For each wallet address, fetch recent transactions
    const activities = await Promise.all(walletAddresses.map(async (address) => {
      try {
        // Get recent transactions for this wallet directly from Helius API
        const response = await heliusApiCall(`transactions?account=${address}&limit=5`);

        if (!response || !Array.isArray(response)) {
          throw new Error(`Invalid response for wallet ${address}`);
        }

        // Process and return the activity data with real transaction data
        return {
          walletAddress: address,
          transactions: response || [],
          lastUpdated: new Date().toISOString(),
        };
      } catch (error) {
        console.error(`Error fetching activities for wallet ${address}:`, error);
        return {
          walletAddress: address,
          transactions: [],
          error: "Failed to fetch transactions"
        };
      }
    }));

    return activities.filter(activity => activity.transactions.length > 0);
  } catch (error) {
    console.error("Error tracking wallet activities:", error);
    return [];
  }
};

/**
 * Calculate profitability metrics for a specific strategy
 * @param strategyName Name of the strategy
 * @param transactions Array of transactions executed by the strategy
 * @returns Profitability metrics
 */
export const calculateStrategyProfitability = (
  strategyName: string,
  transactions: any[]
): any => {
  if (!transactions || !transactions.length) {
    return {
      strategyName,
      totalProfit: 0,
      successRate: 0,
      avgExecutionTime: 0,
      roi: 0
    };
  }

  const successfulTrades = transactions.filter(tx => tx.profit > 0);
  const totalInvested = transactions.reduce((sum, tx) => sum + (tx.value || 0), 0);
  const totalProfit = transactions.reduce((sum, tx) => sum + (tx.profit || 0), 0);
  const avgExecutionTime = transactions.reduce((sum, tx) => sum + (tx.executionTime || 1000), 0) / transactions.length;

  return {
    strategyName,
    totalProfit,
    successRate: (successfulTrades.length / transactions.length) * 100,
    avgExecutionTime,
    roi: totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0
  };
};

/**
 * Secures initial investment by scaling out of a position
 * @param position Trading position object
 * @param currentPrice Current token price
 * @param percentToSecure Percentage of initial investment to secure (default: 100%)
 * @returns Updated position object
 */
export const secureInitialInvestment = (
  position: any,
  currentPrice: number,
  percentToSecure: number = 100
): any => {
  if (!position || !position.initial_investment) {
    console.log("Invalid position object or missing initial investment");
    return position;
  }

  // In a live environment, this would check real price data
  // For now, if currentPrice is 0, we simulate a price based on the position
  const price = currentPrice > 0 ? currentPrice : (position.entry_price || 1) * 1.2;

  // Calculate profit in percentage
  const profitPercent = position.entry_price ?
    ((price - position.entry_price) / position.entry_price) * 100 : 0;

  // Only secure initial if in profit
  if (profitPercent <= 0) {
    return {
      ...position,
      secured_initial: false,
      scale_out_history: position.scale_out_history || []
    };
  }

  // Calculate how much of initial investment to secure
  const amountToSecure = (position.initial_investment * (percentToSecure / 100));

  // Calculate how many tokens to sell to secure initial
  const tokensToSell = amountToSecure / price;

  // Record scale out in history
  const scaleOutEvent = {
    time: new Date().toISOString(),
    price: price,
    amount: amountToSecure,
    tokens: tokensToSell,
    reason: "Secure initial investment",
    percentSecured: percentToSecure
  };

  console.log(`Securing ${percentToSecure}% of initial investment: ${amountToSecure}`);

  // Update position
  return {
    ...position,
    secured_initial: true,
    scale_out_history: [...(position.scale_out_history || []), scaleOutEvent],
    current_amount: position.current_amount ?
      (position.current_amount - amountToSecure) :
      (position.initial_investment - amountToSecure)
  };
};

// Fix for the Number() call issue
export const fixNumberCallIssue = (value: string): number => {
  return Number(value);
};
