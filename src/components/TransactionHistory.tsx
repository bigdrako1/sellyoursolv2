
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample transaction data
const transactions = [
  { id: 1, strategy: "Front Running", token: "SRUN", action: "Buy", amount: 0.034, value: 83.3, timestamp: "2024-04-19T12:30:45Z", status: "completed", profit: 12.8, chain: "solana" },
  { id: 2, strategy: "Market Runner", token: "BNX", action: "Sell", amount: 0.12, value: 5.49, timestamp: "2024-04-19T10:15:22Z", status: "completed", profit: -1.2, chain: "binance" },
  { id: 3, strategy: "Front Running", token: "AUTO", action: "Buy", amount: 0.05, value: 39.1, timestamp: "2024-04-19T08:45:11Z", status: "completed", profit: 3.5, chain: "solana" },
  { id: 4, strategy: "Smart Tracking", token: "FBOT", action: "Buy", amount: 0.007, value: 8.47, timestamp: "2024-04-18T22:05:33Z", status: "pending", profit: 0, chain: "binance" },
  { id: 5, strategy: "Market Runner", token: "TDX", action: "Sell", amount: 1.5, value: 0.0051, timestamp: "2024-04-18T14:22:09Z", status: "failed", profit: 0, chain: "solana" },
];

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const TransactionHistory = () => {
  const [filter, setFilter] = useState("all");
  
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
              {filteredTransactions.map((tx) => (
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
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
};

export default TransactionHistory;
