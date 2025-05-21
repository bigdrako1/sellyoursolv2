// Mock data for smart money alerts
export const mockAlerts = [
  {
    id: 1,
    type: "whale",
    address: "8xDc...3Fgh",
    action: "bought",
    token: "SOL",
    amount: "5,000",
    value: "$750,000",
    time: "10 min ago"
  },
  {
    id: 2,
    type: "insider",
    address: "3jKm...9Pqr",
    action: "sold",
    token: "BONK",
    amount: "1.2B",
    value: "$120,000",
    time: "25 min ago"
  },
  {
    id: 3,
    type: "whale",
    address: "5tYu...7Vwx",
    action: "bought",
    token: "JUP",
    amount: "25,000",
    value: "$45,000",
    time: "1 hour ago"
  }
];

// Sample smart money signals
export interface SmartMoneySignal {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
  walletAddress: string;
  walletLabel: string;
  timestamp: string;
  action: "buy" | "sell";
  amount: number;
  confidence: number;
}

export const SAMPLE_SIGNALS: SmartMoneySignal[] = [
  {
    id: "1",
    tokenName: "Solana",
    tokenSymbol: "SOL",
    tokenAddress: "So11111111111111111111111111111111111111112",
    walletAddress: "B8oMRGgLETGQcksXBawvTDXvr5NLKX1jsBL2bAhXHyQT",
    walletLabel: "Smart Trader 1",
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    action: "buy",
    amount: 500,
    confidence: 85
  },
  {
    id: "2",
    tokenName: "Bonk",
    tokenSymbol: "BONK",
    tokenAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    walletAddress: "DWkZXkZKuqeM1aM991Kz6BVLuGgzWEyK9K4YqgJV6EEU",
    walletLabel: "SOL Whale",
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    action: "buy",
    amount: 10000000000,
    confidence: 92
  },
  {
    id: "3",
    tokenName: "Jupiter",
    tokenSymbol: "JUP",
    tokenAddress: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    walletAddress: "B8oMRGgLETGQcksXBawvTDXvr5NLKX1jsBL2bAhXHyQT",
    walletLabel: "Smart Trader 1",
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    action: "sell",
    amount: 2500,
    confidence: 78
  }
];

// Mock data for trading signals
export interface TradingSignal {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  signalType: "buy" | "sell" | "watch";
  confidence: number;
  detectedAt: string;
  detectionSource: "wallet" | "pattern" | "ai";
  sourceAddress?: string;
  predictedMovement: number;
  timeFrame: "short" | "medium" | "long";
}

export const SAMPLE_TRADING_SIGNALS: TradingSignal[] = [
  {
    tokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    tokenSymbol: "USDC",
    tokenName: "USD Coin",
    signalType: "buy",
    confidence: 92,
    detectedAt: new Date(Date.now() - 1800000).toISOString(),
    detectionSource: "wallet",
    sourceAddress: "B8oMRGgLETGQcksXBawvTDXvr5NLKX1jsBL2bAhXHyQT",
    predictedMovement: 15,
    timeFrame: "short"
  },
  {
    tokenAddress: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    tokenSymbol: "WIF",
    tokenName: "Dogwifhat",
    signalType: "sell",
    confidence: 78,
    detectedAt: new Date(Date.now() - 3600000).toISOString(),
    detectionSource: "pattern",
    predictedMovement: -8,
    timeFrame: "medium"
  },
  {
    tokenAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    tokenSymbol: "BONK",
    tokenName: "Bonk",
    signalType: "watch",
    confidence: 85,
    detectedAt: new Date(Date.now() - 7200000).toISOString(),
    detectionSource: "ai",
    predictedMovement: 12,
    timeFrame: "medium"
  }
];
