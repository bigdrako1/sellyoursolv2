import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink,
  ArrowUpRight,
  TrendingUp,
  BarChart2,
  Clock,
  DollarSign,
  Users,
  AlertCircle,
  Copy,
  Check,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import TradingModal from '@/components/TradingModal';
import { formatCurrency, formatNumber, formatPercentage } from "@/utils/formatters";

// Mock token data interface - in a real app, this would come from your API
interface TokenData {
  address: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  liquidity: number;
  description?: string;
  website?: string;
  twitter?: string;
  createdAt?: string;
  logoUrl?: string;
  qualityScore?: number;
  riskLevel?: string;
}

interface TokenDetailsProps {
  tokenAddress: string;
  isOpen: boolean;
  onClose: () => void;
}

const TokenDetails: React.FC<TokenDetailsProps> = ({
  tokenAddress,
  isOpen,
  onClose,
}) => {
  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);
  const [tradingModalOpen, setTradingModalOpen] = useState(false);

  // Fetch token data when the component mounts or tokenAddress changes
  useEffect(() => {
    const fetchTokenData = async () => {
      if (!tokenAddress || !isOpen) return;

      setLoading(true);

      try {
        // In a real app, this would be an API call
        // For demo purposes, we'll simulate a delay and return mock data
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock data
        setToken({
          address: tokenAddress,
          name: "Sample Token",
          symbol: "SMPL",
          price: 0.00123,
          priceChange24h: 5.2,
          marketCap: 1250000,
          volume24h: 450000,
          holders: 1250,
          liquidity: 350000,
          description: "Sample token is a demonstration token for the TokenDetails component.",
          website: "https://example.com",
          twitter: "https://twitter.com/example",
          createdAt: "2023-05-15T12:00:00Z",
          logoUrl: "https://via.placeholder.com/50",
          qualityScore: 75,
          riskLevel: "Medium"
        });
      } catch (error) {
        console.error("Error fetching token data:", error);
        toast.error("Failed to load token details");
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
  }, [tokenAddress, isOpen]);

  const copyToClipboard = () => {
    if (!token) return;

    navigator.clipboard.writeText(token.address);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);

    toast.success("Address copied to clipboard");
  };

  const handleViewOnExplorer = () => {
    if (!token) return;
    window.open(`https://birdeye.so/token/${token.address}?chain=solana`, '_blank');
  };

  const handleTradeToken = () => {
    if (!token) return;
    setTradingModalOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-trading-dark border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {loading ? (
              <Skeleton className="h-6 w-40" />
            ) : (
              <>
                {token?.logoUrl && (
                  <img
                    src={token.logoUrl}
                    alt={token?.symbol}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span>{token?.name}</span>
                <Badge variant="outline" className="ml-2 bg-black/20 text-gray-300">
                  ${token?.symbol}
                </Badge>
              </>
            )}
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            {loading ? (
              <Skeleton className="h-4 w-60" />
            ) : (
              <>
                <div className="font-mono text-xs text-gray-400">
                  {token?.address.substring(0, 8)}...{token?.address.substring(token.address.length - 8)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-white/5"
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  {token?.qualityScore !== undefined && (
                    <Badge
                      className={`${
                        token.qualityScore > 70 ? 'bg-green-900/20 text-green-400' :
                        token.qualityScore > 40 ? 'bg-yellow-900/20 text-yellow-400' :
                        'bg-red-900/20 text-red-400'
                      }`}
                    >
                      Quality: {token.qualityScore}/100
                    </Badge>
                  )}
                  {token?.riskLevel && (
                    <Badge variant="outline" className="bg-black/20 border-white/10">
                      Risk: {token.riskLevel}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-black/20 border-white/10 border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="holders">Holders</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="text-xs text-gray-400 mb-1 flex items-center">
                      <DollarSign size={12} className="mr-1" />
                      Price
                    </div>
                    <div className="font-medium">{formatCurrency(token?.price || 0)}</div>
                    <div className={`text-xs mt-1 ${token?.priceChange24h && token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercentage(token?.priceChange24h || 0)} (24h)
                    </div>
                  </div>

                  <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="text-xs text-gray-400 mb-1 flex items-center">
                      <BarChart2 size={12} className="mr-1" />
                      Market Cap
                    </div>
                    <div className="font-medium">{formatCurrency(token?.marketCap || 0)}</div>
                  </div>

                  <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="text-xs text-gray-400 mb-1 flex items-center">
                      <TrendingUp size={12} className="mr-1" />
                      24h Volume
                    </div>
                    <div className="font-medium">{formatCurrency(token?.volume24h || 0)}</div>
                  </div>

                  <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="text-xs text-gray-400 mb-1 flex items-center">
                      <Users size={12} className="mr-1" />
                      Holders
                    </div>
                    <div className="font-medium">{formatNumber(token?.holders || 0)}</div>
                  </div>
                </div>

                {token?.description && (
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="text-xs text-gray-400 mb-1">Description</div>
                    <p className="text-sm">{token.description}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {token?.website && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-black/20 border-white/10 text-xs h-7"
                      onClick={() => window.open(token.website, '_blank')}
                    >
                      <ExternalLink size={12} className="mr-1" />
                      Website
                    </Button>
                  )}

                  {token?.twitter && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-black/20 border-white/10 text-xs h-7"
                      onClick={() => window.open(token.twitter, '_blank')}
                    >
                      <ExternalLink size={12} className="mr-1" />
                      Twitter
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-black/20 border-white/10 text-xs h-7"
                    onClick={handleViewOnExplorer}
                  >
                    <ArrowUpRight size={12} className="mr-1" />
                    View on Explorer
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4 mt-4">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="bg-black/20 p-4 rounded-lg border border-white/5 h-40 flex items-center justify-center">
                <p className="text-gray-400">Detailed metrics chart will appear here</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="holders" className="space-y-4 mt-4">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                <div className="text-sm font-medium mb-2">Top Holders</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Wallet</span>
                    <span className="text-gray-400">Amount</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Wallet size={12} className="mr-1 text-blue-400" />
                      <span className="font-mono text-xs">3FTHyP...cf3j9</span>
                    </div>
                    <span>15.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Wallet size={12} className="mr-1 text-blue-400" />
                      <span className="font-mono text-xs">6Dkr4H...ekbV</span>
                    </div>
                    <span>8.7%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Wallet size={12} className="mr-1 text-blue-400" />
                      <span className="font-mono text-xs">9AYmFn...iEsZ</span>
                    </div>
                    <span>5.3%</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleViewOnExplorer}
            className="flex-1"
          >
            <ArrowUpRight size={16} className="mr-2" />
            View on Explorer
          </Button>
          <Button
            onClick={handleTradeToken}
            className="flex-1"
          >
            <TrendingUp size={16} className="mr-2" />
            Trade Token
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Trading Modal */}
      {token && (
        <TradingModal
          isOpen={tradingModalOpen}
          onClose={() => setTradingModalOpen(false)}
          token={{
            symbol: token.symbol,
            name: token.name,
            address: token.address,
            price: token.price,
            change24h: token.priceChange24h,
            volume: token.volume24h,
            liquidity: token.liquidity
          }}
          defaultAction="buy"
        />
      )}
    </Dialog>
  );
};

export default TokenDetails;
