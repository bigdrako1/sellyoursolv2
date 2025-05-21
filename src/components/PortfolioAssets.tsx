
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, SlidersHorizontal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCurrencyStore } from "@/store/currencyStore";
import { heliusApiCall } from "@/utils/apiUtils";
import { getConnectedWallet } from "@/utils/walletUtils";
import { convertUsdToCurrency, formatCurrency } from "@/utils/currencyUtils";

interface AssetData {
  name: string;
  symbol: string;
  type: string;
  chain: string;
  balance: number;
  price: number;
  value: number;
  change24h: number;
}

const PortfolioAssets = () => {
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { currency, currencySymbol } = useCurrencyStore();

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const walletAddress = getConnectedWallet();

        if (walletAddress) {
          // In a production app, fetch real wallet assets from Helius API
          try {
            const response = await heliusApiCall("getTokenBalances", [walletAddress]);

            if (response && response.tokens) {
              // Process token data
              const processedAssets = await Promise.all(response.tokens.map(async (token: any) => {
                // Get price data from Jupiter
                try {
                  const priceResponse = await fetch(`https://price.jup.ag/v4/price?ids=${token.mint}`);
                  const priceData = await priceResponse.json();
                  const price = priceData?.data?.[token.mint]?.price || 0;
                  const change24h = priceData?.data?.[token.mint]?.priceChange24h || 0;

                  // Calculate value
                  const balance = token.amount / Math.pow(10, token.decimals);
                  const value = balance * price;

                  return {
                    name: token.name || "Unknown Token",
                    symbol: token.symbol || token.mint.substring(0, 4),
                    type: "token",
                    chain: "solana",
                    balance,
                    price,
                    value,
                    change24h
                  };
                } catch (error) {
                  console.error(`Error fetching price for token ${token.mint}:`, error);
                  return null;
                }
              }));

              // Filter out null values (failed price fetches)
              const validAssets = processedAssets.filter(asset => asset !== null);
              setAssets(validAssets as AssetData[]);
            } else {
              setAssets([]);
            }
          } catch (error) {
            console.error("Error fetching tokens from Helius:", error);
            setAssets([]);
          }
        } else {
          // No wallet connected
          setAssets([]);
        }
      } catch (error) {
        console.error("Error fetching portfolio assets:", error);
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  // Apply filters
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = searchTerm === "" ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChain = filter === "all" || asset.chain === filter;

    return matchesSearch && matchesChain;
  });

  // Calculate total value
  const totalValue = filteredAssets.reduce((sum, asset) => sum + asset.value, 0);

  // Use the utility function for currency conversion
  const convertToCurrency = (value: number): number => {
    return convertUsdToCurrency(value, currency);
  };

  // Format currency with symbol and proper formatting
  const formatCurrencyValue = (value: number, options = {}): string => {
    return formatCurrency(value, currency, currencySymbol, options);
  };

  return (
    <Card className="trading-card">
      <div className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h3 className="font-bold text-lg">Portfolio Assets</h3>

          <div className="flex w-full sm:w-auto gap-2">
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-black/20 border-white/10"
              />
              <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            <Button variant="outline" size="icon" className="bg-trading-darkAccent border-white/10">
              <Filter size={16} />
            </Button>

            <Button variant="outline" size="icon" className="bg-trading-darkAccent border-white/10">
              <SlidersHorizontal size={16} />
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant={filter === "all" ? "secondary" : "outline"}
            size="sm"
            className={filter !== "all" ? "bg-trading-darkAccent border-white/10" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "solana" ? "secondary" : "outline"}
            size="sm"
            className={filter !== "solana" ? "bg-trading-darkAccent border-white/10" : ""}
            onClick={() => setFilter("solana")}
          >
            Solana
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead className="text-gray-400">Asset</TableHead>
                <TableHead className="text-gray-400">Chain</TableHead>
                <TableHead className="text-gray-400 text-right">Balance</TableHead>
                <TableHead className="text-gray-400 text-right">Price</TableHead>
                <TableHead className="text-gray-400 text-right">Value</TableHead>
                <TableHead className="text-gray-400 text-right">24h Change</TableHead>
                <TableHead className="text-gray-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48">
                    <div className="flex flex-col items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 text-trading-highlight animate-spin mb-2" />
                      <p className="text-gray-400">Loading assets...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="text-center py-10">
                      <p className="text-gray-400">No assets found</p>
                      {!getConnectedWallet() && (
                        <p className="text-sm text-gray-500 mt-1">Connect your wallet to view your assets</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset, index) => (
                  <TableRow key={`${asset.symbol}-${index}`} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <div className="font-medium">{asset.name}</div>
                      <div className="text-xs text-gray-400">{asset.symbol}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-solana/20 text-solana-foreground">
                        Solana
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{asset.balance.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatCurrencyValue(asset.price, { maximumFractionDigits: asset.price < 1 ? 4 : 2 })}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrencyValue(asset.value)}</TableCell>
                    <TableCell className={`text-right ${asset.change24h >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                      {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-7 bg-trading-darkAccent border-white/10">Trade</Button>
                        <Button variant="outline" size="sm" className="h-7 bg-trading-darkAccent border-white/10">Details</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {loading ? 'Loading...' : `Showing ${filteredAssets.length} of ${assets.length} assets`}
          </div>
          <div className="text-sm">
            Total Value: <span className="font-bold">{formatCurrencyValue(totalValue)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PortfolioAssets;
