
import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useCurrencyStore } from "@/store/currencyStore";
import { heliusRpcCall } from "@/utils/apiUtils";

interface PortfolioHistoryProps {
  walletAddress: string | null;
}

// Define the transaction type
interface Transaction {
  id: number;
  type: string;
  token: string;
  amount: number;
  value: number;
  timestamp: string;
  status: "completed" | "pending" | "failed";
  txHash: string;
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const PortfolioHistory: React.FC<PortfolioHistoryProps> = ({ walletAddress }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { currency, currencySymbol } = useCurrencyStore();
  
  // Initialize with transactions on mount
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        if (walletAddress) {
          // In a production app, we would fetch real transactions from Helius API
          // For now, we're just showing an empty state
          setTransactions([]);
          
          // Example code to fetch real transactions when API is available:
          /*
          const response = await heliusRpcCall("getSignaturesForAddress", [walletAddress, { limit: 20 }]);
          
          if (response && Array.isArray(response)) {
            // Process the transaction data
            const processedTxs = await Promise.all(response.map(async (tx: any, index: number) => {
              // Get transaction details
              const txDetails = await heliusRpcCall("getTransaction", [tx.signature]);
              
              // Determine if this was a token transfer, swap, etc.
              // This is simplified - in reality would need more sophisticated parsing
              const isTokenTransaction = txDetails.meta?.preTokenBalances && txDetails.meta?.postTokenBalances;
              const tokenInfoPromises = [];
              
              let tokenSymbol = "SOL";
              let amount = 0;
              let value = 0;
              let type = "Transfer";
              
              if (isTokenTransaction) {
                // Get token info
                const tokenInfo = await heliusRpcCall("getTokenAccountsByOwner", [
                  walletAddress,
                  { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }
                ]);
                
                // Parse token transfers - simplified
                tokenSymbol = "Unknown Token";
                amount = txDetails.meta.postTokenBalances[0]?.uiTokenAmount.uiAmount || 0;
                
                // Determine if swap
                if (txDetails.meta.preTokenBalances.length > 1 && txDetails.meta.postTokenBalances.length > 1) {
                  type = "Swap";
                }
              } else {
                // Native SOL transfer
                const preBalance = txDetails.meta?.preBalances[0] || 0;
                const postBalance = txDetails.meta?.postBalances[0] || 0;
                amount = Math.abs(postBalance - preBalance) / 1e9; // lamports to SOL
                
                // Get SOL price for value calculation
                const solPriceResponse = await fetch("https://price.jup.ag/v4/price?ids=SOL");
                const solPriceData = await solPriceResponse.json();
                const solPrice = solPriceData?.data?.SOL?.price || 0;
                value = amount * solPrice;
              }
              
              return {
                id: index,
                type,
                token: tokenSymbol,
                amount,
                value,
                timestamp: new Date(tx.blockTime * 1000).toISOString(),
                status: "completed",
                txHash: tx.signature
              };
            }));
            
            setTransactions(processedTxs);
          }
          */
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [walletAddress]);

  // Convert USD values to the selected currency
  const convertToCurrency = (value: number): number => {
    const rates = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 150.56
    };
    
    return value * (rates[currency as keyof typeof rates] || 1);
  };
  
  const filteredTransactions = filter === "all" 
    ? transactions 
    : transactions.filter(tx => 
        filter === "deposits" ? tx.type === "Deposit" : 
        filter === "withdrawals" ? tx.type === "Withdrawal" : 
        filter === "swaps" ? tx.type === "Swap" : true
      );
  
  if (!walletAddress) {
    return (
      <Card className="trading-card">
        <div className="p-6 text-center">
          <p className="text-gray-400">Connect your wallet to view transaction history</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="trading-card">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Transaction History</h3>
          <Tabs defaultValue="all" className="w-auto">
            <TabsList className="bg-black/20">
              <TabsTrigger value="all" onClick={() => setFilter("all")}>All</TabsTrigger>
              <TabsTrigger value="deposits" onClick={() => setFilter("deposits")}>Deposits</TabsTrigger>
              <TabsTrigger value="withdrawals" onClick={() => setFilter("withdrawals")}>Withdrawals</TabsTrigger>
              <TabsTrigger value="swaps" onClick={() => setFilter("swaps")}>Swaps</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead className="text-gray-400">Date</TableHead>
                <TableHead className="text-gray-400">Type</TableHead>
                <TableHead className="text-gray-400">Token</TableHead>
                <TableHead className="text-gray-400 text-right">Amount</TableHead>
                <TableHead className="text-gray-400 text-right">Value</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Transaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40">
                    <div className="flex flex-col items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 text-trading-highlight animate-spin mb-2" />
                      <p className="text-gray-400">Loading transactions...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <div className="font-medium">{formatTime(tx.timestamp)}</div>
                      <div className="text-xs text-gray-400">{formatDate(tx.timestamp)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`
                        ${tx.type === "Deposit" ? 'bg-green-500/20 text-green-400' : 
                          tx.type === "Withdrawal" ? 'bg-red-500/20 text-red-400' : 
                          'bg-blue-500/20 text-blue-400'}
                      `}>
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{tx.token}</TableCell>
                    <TableCell className="text-right">{tx.amount}</TableCell>
                    <TableCell className="text-right">{currencySymbol}{convertToCurrency(tx.value).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={`
                        ${tx.status === "completed" ? 'bg-trading-success/20 text-trading-success' : 
                          tx.status === "pending" ? 'bg-trading-warning/20 text-trading-warning' : 
                          'bg-trading-danger/20 text-trading-danger'}
                      `}>
                        {tx.status === "completed" ? 'Completed' : 
                        tx.status === "pending" ? 'Pending' : 'Failed'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={`https://solscan.io/tx/${tx.txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-trading-highlight hover:underline text-sm"
                      >
                        {tx.txHash}
                      </a>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-40">
                    <div className="text-center py-4 text-gray-400">
                      No transactions found for this wallet
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 text-sm text-gray-400">
          {isLoading ? 'Loading...' : `Showing ${filteredTransactions.length} of ${transactions.length} transactions`}
        </div>
      </div>
    </Card>
  );
};

export default PortfolioHistory;
