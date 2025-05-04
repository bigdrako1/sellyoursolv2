import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrencyStore } from "@/store/currencyStore";

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
  const [filter, setFilter] = useState("all");
  const { currency, currencySymbol } = useCurrencyStore();
  
  // Initialize with transactions on mount
  useEffect(() => {
    if (!walletAddress) return;
    
    const types = ["Deposit", "Withdrawal", "Swap", "Transfer"];
    const tokens = ["SOL", "USDC", "JUP", "BONK", "RAY"];
    const statuses: ("completed" | "pending" | "failed")[] = ["completed", "pending", "failed"];
    
    const mockTransactions: Transaction[] = [];
    const now = new Date();
    
    // Generate 10 transactions
    for (let i = 0; i < 10; i++) {
      const days = Math.floor(Math.random() * 30);
      const timestamp = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
      const type = types[Math.floor(Math.random() * types.length)];
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const amount = parseFloat((Math.random() * (token === "SOL" ? 5 : 100)).toFixed(3));
      const value = parseFloat((amount * (Math.random() * 100 + 10)).toFixed(2));
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const txHash = `${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`;
      
      mockTransactions.push({
        id: i + 1,
        type,
        token,
        amount,
        value,
        timestamp,
        status,
        txHash
      });
    }
    
    // Sort by timestamp descending (newest first)
    setTransactions(mockTransactions.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
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
              {filteredTransactions.length > 0 ? (
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
                  <TableCell colSpan={7} className="text-center py-4 text-gray-400">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 text-sm text-gray-400">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      </div>
    </Card>
  );
};

export default PortfolioHistory;
