import { toast } from "sonner";
import { getConnectedWallet } from "@/utils/walletUtils";
import { heliusApiCall } from "@/utils/apiUtils";
import { useSettingsStore } from "@/store/settingsStore";

// Define trade types
export interface Trade {
  id: string;
  tokenSymbol: string;
  tokenAddress: string;
  tokenDecimals: number;
  amount: number;
  price: number;
  value: number;
  type: 'buy' | 'sell';
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  txHash?: string;
  profit?: number;
  profitPercentage?: number;
}

export interface TradeParams {
  tokenSymbol: string;
  tokenAddress: string;
  tokenDecimals: number;
  amount: number;
  price: number;
  type: 'buy' | 'sell';
  slippage?: number;
}

export interface TradePosition {
  tokenSymbol: string;
  tokenAddress: string;
  entryPrice: number;
  currentPrice: number;
  amount: number;
  value: number;
  profitLoss: number;
  profitLossPercentage: number;
  timestamp: number;
}

// In-memory storage for trades (in a real app, this would be persisted)
let trades: Trade[] = [];
let positions: Map<string, TradePosition> = new Map();

/**
 * Execute a trade within the app
 * This function handles all trade execution logic
 */
export async function executeTrade(params: TradeParams): Promise<Trade> {
  try {
    const walletAddress = getConnectedWallet();
    
    if (!walletAddress) {
      throw new Error("No wallet connected. Please connect your wallet to trade.");
    }
    
    // Generate a unique ID for the trade
    const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Calculate trade value
    const value = params.amount * params.price;
    
    // Create the trade object
    const trade: Trade = {
      id: tradeId,
      tokenSymbol: params.tokenSymbol,
      tokenAddress: params.tokenAddress,
      tokenDecimals: params.tokenDecimals,
      amount: params.amount,
      price: params.price,
      value: value,
      type: params.type,
      status: 'pending',
      timestamp: Date.now(),
    };
    
    // Add to trades list
    trades.push(trade);
    
    // Simulate trade execution (in a real app, this would call a DEX or CEX API)
    const success = await simulateTradeExecution(trade);
    
    if (success) {
      // Update trade status
      trade.status = 'completed';
      trade.txHash = `0x${Math.random().toString(36).substring(2, 15)}`;
      
      // Update positions
      updatePositions(trade);
      
      toast.success(`${params.type === 'buy' ? 'Buy' : 'Sell'} order executed`, {
        description: `${params.amount} ${params.tokenSymbol} at $${params.price.toFixed(params.price < 0.01 ? 8 : 2)}`
      });
      
      return trade;
    } else {
      // Update trade status
      trade.status = 'failed';
      
      toast.error(`${params.type === 'buy' ? 'Buy' : 'Sell'} order failed`, {
        description: "The trade could not be executed. Please try again."
      });
      
      throw new Error("Trade execution failed");
    }
  } catch (error) {
    console.error("Trade execution error:", error);
    toast.error("Trade execution error", {
      description: error instanceof Error ? error.message : "Unknown error occurred"
    });
    throw error;
  }
}

/**
 * Simulate trade execution (for demo purposes)
 * In a real app, this would interact with a DEX or CEX
 */
async function simulateTradeExecution(trade: Trade): Promise<boolean> {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // 95% success rate for simulation
      const success = Math.random() > 0.05;
      resolve(success);
    }, 1500);
  });
}

/**
 * Update positions based on a completed trade
 */
function updatePositions(trade: Trade): void {
  if (trade.status !== 'completed') return;
  
  const { tokenSymbol, tokenAddress, amount, price, type, timestamp } = trade;
  
  // Get existing position if any
  const existingPosition = positions.get(tokenAddress);
  
  if (type === 'buy') {
    if (existingPosition) {
      // Update existing position
      const totalAmount = existingPosition.amount + amount;
      const totalValue = existingPosition.value + (amount * price);
      const avgPrice = totalValue / totalAmount;
      
      const updatedPosition: TradePosition = {
        tokenSymbol,
        tokenAddress,
        entryPrice: avgPrice,
        currentPrice: price,
        amount: totalAmount,
        value: totalValue,
        profitLoss: totalValue - (totalAmount * avgPrice),
        profitLossPercentage: ((price / avgPrice) - 1) * 100,
        timestamp
      };
      
      positions.set(tokenAddress, updatedPosition);
    } else {
      // Create new position
      const newPosition: TradePosition = {
        tokenSymbol,
        tokenAddress,
        entryPrice: price,
        currentPrice: price,
        amount,
        value: amount * price,
        profitLoss: 0,
        profitLossPercentage: 0,
        timestamp
      };
      
      positions.set(tokenAddress, newPosition);
    }
  } else if (type === 'sell') {
    if (existingPosition) {
      // Update existing position
      const remainingAmount = existingPosition.amount - amount;
      
      if (remainingAmount <= 0) {
        // Position closed
        positions.delete(tokenAddress);
        
        // Calculate profit/loss
        const entryValue = amount * existingPosition.entryPrice;
        const exitValue = amount * price;
        trade.profit = exitValue - entryValue;
        trade.profitPercentage = ((price / existingPosition.entryPrice) - 1) * 100;
      } else {
        // Partial sell
        const remainingValue = remainingAmount * existingPosition.entryPrice;
        
        const updatedPosition: TradePosition = {
          ...existingPosition,
          amount: remainingAmount,
          value: remainingValue,
          currentPrice: price,
          profitLoss: (price - existingPosition.entryPrice) * remainingAmount,
          profitLossPercentage: ((price / existingPosition.entryPrice) - 1) * 100,
        };
        
        positions.set(tokenAddress, updatedPosition);
        
        // Calculate profit/loss for this trade
        const entryValue = amount * existingPosition.entryPrice;
        const exitValue = amount * price;
        trade.profit = exitValue - entryValue;
        trade.profitPercentage = ((price / existingPosition.entryPrice) - 1) * 100;
      }
    } else {
      console.warn(`Attempted to sell ${tokenSymbol} but no position exists`);
    }
  }
}

/**
 * Get all trades
 */
export function getTrades(): Trade[] {
  return [...trades];
}

/**
 * Get all open positions
 */
export function getPositions(): TradePosition[] {
  return Array.from(positions.values());
}

/**
 * Get a specific trade by ID
 */
export function getTradeById(tradeId: string): Trade | undefined {
  return trades.find(trade => trade.id === tradeId);
}

/**
 * Get a specific position by token address
 */
export function getPositionByToken(tokenAddress: string): TradePosition | undefined {
  return positions.get(tokenAddress);
}

/**
 * Update token prices for all positions
 */
export async function updatePositionPrices(): Promise<void> {
  // In a real app, this would fetch current prices from an API
  for (const [tokenAddress, position] of positions.entries()) {
    // Simulate price change (±5%)
    const priceChange = (Math.random() * 0.1) - 0.05;
    const newPrice = position.currentPrice * (1 + priceChange);
    
    const updatedPosition: TradePosition = {
      ...position,
      currentPrice: newPrice,
      profitLoss: (newPrice - position.entryPrice) * position.amount,
      profitLossPercentage: ((newPrice / position.entryPrice) - 1) * 100,
    };
    
    positions.set(tokenAddress, updatedPosition);
  }
}

/**
 * Close a position (sell all tokens)
 */
export async function closePosition(tokenAddress: string): Promise<Trade | null> {
  const position = positions.get(tokenAddress);
  
  if (!position) {
    toast.error("Position not found", {
      description: "The position you're trying to close doesn't exist."
    });
    return null;
  }
  
  const tradeParams: TradeParams = {
    tokenSymbol: position.tokenSymbol,
    tokenAddress: position.tokenAddress,
    tokenDecimals: 9, // Default for most Solana tokens
    amount: position.amount,
    price: position.currentPrice,
    type: 'sell'
  };
  
  try {
    const trade = await executeTrade(tradeParams);
    return trade;
  } catch (error) {
    console.error("Error closing position:", error);
    return null;
  }
}

export default {
  executeTrade,
  getTrades,
  getPositions,
  getTradeById,
  getPositionByToken,
  updatePositionPrices,
  closePosition
};
