
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { executeFrontRunTrade } from "@/utils/tradingUtils";

// Define the transaction type
interface Transaction {
  id: number;
  strategy: string;
  token: string;
  action: string;
  amount: number;
  value: number;
  timestamp: string;
  status: "completed" | "pending" | "failed";
  profit: number;
  chain: "solana" | "binance";
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState("all");
  
  // Initialize with empty transactions and fetch on mount
  useEffect(() => {
    // In a real app, this would fetch from an API
    // For now, we'll simulate a few transactions
    const strategies = ["Front Running", "Market Runner", "Smart Tracking"];
    const tokens = ["SOL", "SRUN", "BNB", "FBOT", "TDX", "AUTO"];
    const actions = ["Buy", "Sell"];
    const chains: ("solana" | "binance")[] = ["solana", "binance"];
    
    const mockTransactions: Transaction[] = [];
    const now = new Date();
    
    // Generate just 5 transactions
    for (let i = 0; i < 5; i++) {
      const hours = Math.floor(Math.random() * 48);
      const timestamp = new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
      const strategy = strategies[Math.floor(Math.random() * strategies.length)];
      const chain = chains[Math.floor(Math.random() * chains.length)];
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const amount = parseFloat((Math.random() * (token === "SOL" || token === "BNB" ? 1 : 10)).toFixed(3));
      const value = parseFloat((amount * (Math.random() * 100 + 10)).toFixed(2));
      const status: "completed" | "pending" | "failed" = Math.random() > 0.8 
        ? "pending" 
        : (Math.random() > 0.9 ? "failed" : "completed");
      
      const profit = status === "completed" 
        ? parseFloat((value * (Math.random() * 0.3 - 0.1)).toFixed(2)) 
        : 0;
      
      mockTransactions.push({
        id: i + 1,
        strategy,
        token,
        action,
        amount,
        value,
        timestamp,
        status,
        profit,
        chain
      });
    }
    
    // Sort by timestamp descending (newest first)
    setTransactions(mockTransactions.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  }, []);
  
  const filteredTransactions = filter === "all" 
    ? transactions 
    : transactions.filter(tx => 
        filter === "completed" ? tx.status === "completed" : 
        filter === "solana" ? tx.chain === "solana" : 
        filter === "binance" ? tx.chain === "binance" : true
      );
  
  return (
    <Card className="trading-card">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Transaction History</h3>
          <Tabs defaultValue="all" className="w-auto">
            <TabsList className="bg-black/20">
              <TabsTrigger value="all" onClick={() => setFilter("all")}>All</TabsTrigger>
              <TabsTrigger value="completed" onClick={() => setFilter("completed")}>Completed</TabsTrigger>
              <TabsTrigger value="solana" onClick={() => setFilter("solana")}>Solana</TabsTrigger>
              <TabsTrigger value="binance" onClick={() => setFilter("binance")}>BSC</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead className="text-gray-400">Time</TableHead>
                <TableHead className="text-gray-400">Strategy</TableHead>
                <TableHead className="text-gray-400">Token</TableHead>
                <TableHead className="text-gray-400">Action</TableHead>
                <TableHead className="text-gray-400 text-right">Amount</TableHead>
                <TableHead className="text-gray-400 text-right">Value</TableHead>
                <TableHead className="text-gray-400 text-right">Profit/Loss</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
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
                    <TableCell>{tx.strategy}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${tx.chain === 'solana' ? 'bg-solana' : 'bg-binance'}`}></div>
                        <span>{tx.token}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${tx.action === "Buy" ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {tx.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{tx.amount}</TableCell>
                    <TableCell className="text-right">${tx.value.toFixed(2)}</TableCell>
                    <TableCell className={`text-right ${tx.profit > 0 ? 'text-trading-success' : tx.profit < 0 ? 'text-trading-danger' : 'text-gray-400'}`}>
                      {tx.profit > 0 ? '+' : ''}{tx.profit !== 0 ? `$${tx.profit.toFixed(2)}` : '-'}
                    </TableCell>
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
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-gray-400">
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

export default TransactionHistory;
