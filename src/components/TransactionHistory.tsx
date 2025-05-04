
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useCurrencyStore } from "@/store/currencyStore";
import { heliusRpcCall } from "@/utils/apiUtils";

// Define the transaction type
interface Transaction {
  id: string;
  strategy: string;
  token: string;
  action: string;
  amount: number;
  value: number;
  timestamp: string;
  status: "completed" | "pending" | "failed";
  profit: number;
  signature?: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const { currency, currencySymbol } = useCurrencyStore();
  
  // Fetch transactions on component mount
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      
      try {
        // Get wallet from localStorage
        const walletAddress = localStorage.getItem('walletAddress');
        
        if (walletAddress) {
          // In production, this would fetch real transactions from the Helius API
          const response = await heliusRpcCall("getSignaturesForAddress", [walletAddress, { limit: 10 }]);
          
          if (response && Array.isArray(response)) {
            // Process transaction data
            const processedTransactions = await Promise.all(response.map(async (tx: any, index: number) => {
              // Fetch transaction details
              const txDetails = await heliusRpcCall("getTransaction", [tx.signature]);
              
              // Process transaction data (simplified for now)
              // In a production app, this would be more detailed
              return {
                id: tx.signature,
                strategy: "Manual",
                token: "SOL",
                action: "Transfer",
                amount: 0,
                value: 0,
                timestamp: new Date(tx.blockTime * 1000).toISOString(),
                status: "completed" as const,
                profit: 0,
                signature: tx.signature
              };
            }));
            
            setTransactions(processedTransactions);
          } else {
            // No transactions found or API error
            setTransactions([]);
          }
        } else {
          // No wallet connected
          setTransactions([]);
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, []);

  // Convert USD values to the selected currency
  const convertToCurrency = (value: number): number => {
    const rates = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 150.56,
      KES: 129.45
    };
    
    return value * (rates[currency as keyof typeof rates] || 1);
  };
  
  const filteredTransactions = filter === "all" 
    ? transactions 
    : transactions.filter(tx => 
        filter === "completed" ? tx.status === "completed" : 
        filter === "pending" ? tx.status === "pending" : 
        filter === "failed" ? tx.status === "failed" : true
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
              <TabsTrigger value="pending" onClick={() => setFilter("pending")}>Pending</TabsTrigger>
              <TabsTrigger value="failed" onClick={() => setFilter("failed")}>Failed</TabsTrigger>
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48">
                    <div className="flex flex-col items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 text-trading-highlight animate-spin mb-2" />
                      <p className="text-sm text-gray-400">Loading transactions...</p>
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
                    <TableCell>{tx.strategy}</TableCell>
                    <TableCell>{tx.token}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${tx.action === "Buy" ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {tx.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{tx.amount}</TableCell>
                    <TableCell className="text-right">{currencySymbol}{convertToCurrency(tx.value).toFixed(2)}</TableCell>
                    <TableCell className={`text-right ${tx.profit > 0 ? 'text-trading-success' : tx.profit < 0 ? 'text-trading-danger' : 'text-gray-400'}`}>
                      {tx.profit > 0 ? '+' : ''}{tx.profit !== 0 ? `${currencySymbol}${convertToCurrency(Math.abs(tx.profit)).toFixed(2)}` : '-'}
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
                  <TableCell colSpan={8} className="h-48">
                    <div className="text-center py-4 text-gray-400">
                      {localStorage.getItem('walletAddress') ? 'No transactions found' : 'Connect wallet to view transactions'}
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

export default TransactionHistory;
