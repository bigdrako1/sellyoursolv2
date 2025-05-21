import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ExternalLink, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Clock, 
  AlertTriangle,
  Check,
  Copy,
  Wallet
} from "lucide-react";
import { getTokenInfo } from "@/services/tokenDataService";
import { toast } from "sonner";
import { Token } from "@/types/token.types";

interface TokenDetailsViewProps {
  tokenAddress: string;
  isOpen: boolean;
  onClose: () => void;
  onTrade?: (tokenAddress: string) => void;
}

/**
 * TokenDetailsView component - Shows token details in a modal dialog
 * Provides essential information first with option to view more on external explorer
 */
const TokenDetailsView: React.FC<TokenDetailsViewProps> = ({
  tokenAddress,
  isOpen,
  onClose,
  onTrade
}) => {
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<Token | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (isOpen && tokenAddress) {
      loadTokenData();
    }
  }, [isOpen, tokenAddress]);

  const loadTokenData = async () => {
    setLoading(true);
    try {
      const data = await getTokenInfo(tokenAddress);
      
      // Transform the data into our Token type
      const token: Token = {
        address: tokenAddress,
        name: data.name || "Unknown Token",
        symbol: data.symbol || "???",
        price: data.price?.value || 0,
        priceChange24h: data.price?.change24h || 0,
        liquidity: data.liquidity?.usd || 0,
        volume: data.volume24h || 0,
        marketCap: data.marketCap || 0,
        holders: data.holders?.count || 0,
        createdAt: data.createdAt || new Date().toISOString(),
        quality: data.quality?.score || 0,
        qualityLabel: data.quality?.label || "Unknown",
        riskLevel: data.quality?.risk || 50,
        decimals: data.decimals || 9,
        totalSupply: data.supply?.total || 0,
        circulatingSupply: data.supply?.circulating || 0,
        website: data.links?.website || "",
        twitter: data.links?.twitter || "",
        telegram: data.links?.telegram || ""
      };
      
      setTokenData(token);
    } catch (error) {
      console.error("Error loading token data:", error);
      toast.error("Failed to load token data", {
        description: "Could not retrieve token information. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(tokenAddress);
    toast.success("Address copied to clipboard");
  };

  const handleViewOnExplorer = () => {
    window.open(`https://birdeye.so/token/${tokenAddress}?chain=solana`, '_blank');
  };

  const handleTrade = () => {
    if (onTrade) {
      onTrade(tokenAddress);
    } else {
      window.open(`https://jup.ag/swap/SOL-${tokenAddress}`, '_blank');
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    } else {
      return value.toFixed(0);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }
  };

  const getQualityBadge = (quality: number) => {
    if (quality >= 80) {
      return <Badge className="bg-green-600">High Quality</Badge>;
    } else if (quality >= 50) {
      return <Badge className="bg-yellow-600">Medium Quality</Badge>;
    } else {
      return <Badge className="bg-red-600">Low Quality</Badge>;
    }
  };

  const getRiskBadge = (risk: number) => {
    if (risk <= 30) {
      return <Badge className="bg-green-600">Low Risk</Badge>;
    } else if (risk <= 70) {
      return <Badge className="bg-yellow-600">Medium Risk</Badge>;
    } else {
      return <Badge className="bg-red-600">High Risk</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-trading-darkAccent border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {loading ? (
              <Skeleton className="h-6 w-40" />
            ) : (
              <>
                <span>{tokenData?.name}</span>
                <Badge variant="outline" className="bg-blue-900/20 text-blue-300 border-blue-500/20">
                  ${tokenData?.symbol}
                </Badge>
              </>
            )}
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            {loading ? (
              <Skeleton className="h-4 w-64" />
            ) : (
              <>
                <div className="font-mono text-xs">{tokenAddress.substring(0, 8)}...{tokenAddress.substring(tokenAddress.length - 8)}</div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyAddress}>
                  <Copy className="h-3 w-3" />
                </Button>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-black/20 border-white/10 border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
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
                  <Card className="bg-black/20 border-white/5">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-400">Current Price</div>
                      <div className="text-xl font-bold">${tokenData?.price.toFixed(8)}</div>
                      <div className={`text-xs mt-1 ${tokenData?.priceChange24h && tokenData.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {tokenData?.priceChange24h ? `${tokenData.priceChange24h >= 0 ? '+' : ''}${tokenData.priceChange24h.toFixed(2)}%` : '0.00%'} (24h)
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/20 border-white/5">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-400">Market Cap</div>
                      <div className="text-xl font-bold">{formatCurrency(tokenData?.marketCap || 0)}</div>
                      <div className="text-xs mt-1 text-gray-400">
                        Liquidity: {formatCurrency(tokenData?.liquidity || 0)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-black/20 border-white/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Users className="h-3 w-3" /> Holders
                      </div>
                      <div className="text-lg font-bold">{formatNumber(tokenData?.holders || 0)}</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/20 border-white/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <TrendingUp className="h-3 w-3" /> 24h Volume
                      </div>
                      <div className="text-lg font-bold">{formatCurrency(tokenData?.volume || 0)}</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/20 border-white/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" /> Created
                      </div>
                      <div className="text-lg font-bold">{formatTimeAgo(tokenData?.createdAt || new Date().toISOString())}</div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4 mt-4">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                <Card className="bg-black/20 border-white/5">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-400">Total Supply</div>
                        <div className="text-lg font-bold">{formatNumber(tokenData?.totalSupply || 0)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Circulating Supply</div>
                        <div className="text-lg font-bold">{formatNumber(tokenData?.circulatingSupply || 0)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/20 border-white/5">
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-400 mb-2">Token Metrics</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Decimals</span>
                        <span className="text-sm font-medium">{tokenData?.decimals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Holders</span>
                        <span className="text-sm font-medium">{formatNumber(tokenData?.holders || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">24h Volume</span>
                        <span className="text-sm font-medium">{formatCurrency(tokenData?.volume || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Liquidity</span>
                        <span className="text-sm font-medium">{formatCurrency(tokenData?.liquidity || 0)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-4">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                <Card className="bg-black/20 border-white/5">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm font-medium">Token Quality</div>
                      {getQualityBadge(tokenData?.quality || 0)}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium">Risk Level</div>
                      {getRiskBadge(tokenData?.riskLevel || 50)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/20 border-white/5">
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-400 mb-2">Security Checks</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {tokenData?.quality && tokenData.quality >= 70 ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm">Token Contract Verification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tokenData?.liquidity && tokenData.liquidity >= 10000 ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm">Sufficient Liquidity</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tokenData?.holders && tokenData.holders >= 100 ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm">Holder Distribution</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            className="bg-black/20 border-white/10 hover:bg-white/10"
            onClick={handleViewOnExplorer}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Explorer
          </Button>
          <Button onClick={handleTrade}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Trade Token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TokenDetailsView;
