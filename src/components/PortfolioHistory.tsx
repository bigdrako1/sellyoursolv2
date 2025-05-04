
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Filter } from "lucide-react";

// Generate sample transaction history
const generateTransactionHistory = () => {
  const transactionTypes = ["deposit", "withdrawal", "trade", "swap", "staking"];
  const tokens = ["SOL", "BNB", "SRUN", "FBOT", "AUTO", "BNX", "TDX"];
  
  const transactions = [];
  const now = new Date();
  
  for (let i = 0; i < 20; i++) {
    const days = Math.floor(Math.random() * 30);
    const hours = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 60);
    
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    date.setHours(date.getHours() - hours);
    date.setMinutes(date.getMinutes() - minutes);
    
    const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    const chain = ["SOL", "SRUN", "AUTO", "TDX"].includes(token) ? "solana" : "binance";
    
    let amount, value;
    let description = "";
    
    switch (type) {
      case "deposit":
        amount = +(Math.random() * 100).toFixed(token === "SOL" || token === "BNB" ? 2 : 0);
        value = +(Math.random() * 1000).toFixed(2);
        description = `Deposit ${amount} ${token}`;
        break;
      case "withdrawal":
        amount = +(Math.random() * 50).toFixed(token === "SOL" || token === "BNB" ? 2 : 0);
        value = +(Math.random() * 500).toFixed(2);
        description = `Withdraw ${amount} ${token}`;
        break;
      case "trade":
        amount = +(Math.random() * 75).toFixed(token === "SOL" || token === "BNB" ? 2 : 0);
        value = +(Math.random() * 800).toFixed(2);
        const action = Math.random() > 0.5 ? "Buy" : "Sell";
        description = `${action} ${amount} ${token}`;
        break;
      case "swap":
        amount = +(Math.random() * 60).toFixed(token === "SOL" || token === "BNB" ? 2 : 0);
        value = +(Math.random() * 600).toFixed(2);
        const toToken = tokens.filter(t => t !== token)[Math.floor(Math.random() * (tokens.length - 1))];
        description = `Swap ${token} to ${toToken}`;
        break;
      case "staking":
        amount = +(Math.random() * 40).toFixed(token === "SOL" || token === "BNB" ? 2 : 0);
        value = +(Math.random() * 400).toFixed(2);
        const stakingAction = Math.random() > 0.5 ? "Stake" : "Unstake";
        description = `${stakingAction} ${amount} ${token}`;
        break;
    }
    
    const status = Math.random() > 0.1 ? "completed" : (Math.random() > 0.5 ? "pending" : "failed");
    
    transactions.push({
      id: i + 1,
      type,
      token,
      chain,
      amount,
      value,
      timestamp: date.toISOString(),
      status,
      description
    });
  }
  
  // Sort by timestamp descending (newest first)
  return transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const PortfolioHistory = () => {
  const [transactions] = useState(generateTransactionHistory);
  const [filter, setFilter] = useState("all");
  
  const filteredTransactions = filter === "all" 
    ? transactions 
    : transactions.filter(tx => 
        filter === "completed" ? tx.status === "completed" : 
        filter === "solana" ? tx.chain === "solana" : 
        filter === "binance" ? tx.chain === "binance" : 
        filter === tx.type
      );
  
  return (
    <Card className="trading-card">
      <div className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h3 className="font-bold text-lg">Transaction History</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1 bg-trading-darkAccent border-white/10 hover:bg-white/10">
              <Filter size={14} />
              <span>Filter</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1 bg-trading-darkAccent border-white/10 hover:bg-white/10">
              <Download size={14} />
              <span>Export</span>
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Tabs defaultValue="all" className="w-auto">
            <TabsList className="bg-black/20">
              <TabsTrigger value="all" onClick={() => setFilter("all")}>All</TabsTrigger>
              <TabsTrigger value="completed" onClick={() => setFilter("completed")}>Completed</TabsTrigger>
              <TabsTrigger value="solana" onClick={() => setFilter("solana")}>Solana</TabsTrigger>
              <TabsTrigger value="binance" onClick={() => setFilter("binance")}>BSC</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className={`${filter === "deposit" ? "bg-white/10 border-white/20" : "bg-trading-darkAccent border-white/10"}`}
              onClick={() => setFilter(filter === "deposit" ? "all" : "deposit")}
            >
              Deposits
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={`${filter === "withdrawal" ? "bg-white/10 border-white/20" : "bg-trading-darkAccent border-white/10"}`}
              onClick={() => setFilter(filter === "withdrawal" ? "all" : "withdrawal")}
            >
              Withdrawals
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={`${filter === "trade" ? "bg-white/10 border-white/20" : "bg-trading-darkAccent border-white/10"}`}
              onClick={() => setFilter(filter === "trade" ? "all" : "trade")}
            >
              Trades
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={`${filter === "swap" ? "bg-white/10 border-white/20" : "bg-trading-darkAccent border-white/10"}`}
              onClick={() => setFilter(filter === "swap" ? "all" : "swap")}
            >
              Swaps
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead className="text-gray-400">Time</TableHead>
                <TableHead className="text-gray-400">Description</TableHead>
                <TableHead className="text-gray-400">Token</TableHead>
                <TableHead className="text-gray-400 text-right">Amount</TableHead>
                <TableHead className="text-gray-400 text-right">Value</TableHead>
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
                  <TableCell>
                    <div className="font-medium">{tx.description}</div>
                    <div className="text-xs text-gray-400 capitalize">{tx.type}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${tx.chain === 'solana' ? 'bg-solana' : 'bg-binance'}`}></div>
                      <span>{tx.token}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{tx.amount}</TableCell>
                  <TableCell className="text-right">${tx.value.toFixed(2)}</TableCell>
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
        
        <div className="mt-4 text-sm text-gray-400">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      </div>
    </Card>
  );
};

export default PortfolioHistory;
