import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Users, 
  Shield,
  Copy,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface TokenDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenAddress: string;
  tokenSymbol?: string;
  tokenName?: string;
}

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  holders: number;
  liquidity: number;
  fdv: number;
  supply: {
    total: number;
    circulating: number;
  };
  security: {
    isVerified: boolean;
    hasLiquidity: boolean;
    isRug: boolean;
    riskScore: number;
  };
}

const TokenDetailsModal: React.FC<TokenDetailsModalProps> = ({
  isOpen,
  onClose,
  tokenAddress,
  tokenSymbol,
  tokenName
}) => {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mock data for demonstration
  const mockTokenData: TokenData = {
    address: tokenAddress,
    name: tokenName || 'Sample Token',
    symbol: tokenSymbol || 'SAMPLE',
    price: 0.00234,
    change24h: 12.5,
    volume24h: 1250000,
    marketCap: 45000000,
    holders: 8420,
    liquidity: 2100000,
    fdv: 52000000,
    supply: {
      total: 1000000000,
      circulating: 850000000
    },
    security: {
      isVerified: true,
      hasLiquidity: true,
      isRug: false,
      riskScore: 25
    }
  };

  useEffect(() => {
    if (isOpen && tokenAddress) {
      loadTokenData();
    }
  }, [isOpen, tokenAddress]);

  const loadTokenData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setTokenData(mockTokenData);
    } catch (error) {
      console.error('Error loading token data:', error);
      toast.error('Failed to load token data');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toLocaleString();
  };

  const getRiskBadge = (riskScore: number) => {
    if (riskScore <= 30) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Low Risk</Badge>;
    if (riskScore <= 60) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium Risk</Badge>;
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High Risk</Badge>;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-trading-darkAccent border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-3">
            {tokenData ? (
              <>
                <div className="bg-gradient-to-br from-purple-500/30 to-blue-500/30 h-10 w-10 rounded-full flex items-center justify-center font-bold border border-purple-500/20">
                  {tokenData.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="text-xl font-bold">{tokenData.name}</div>
                  <div className="text-sm text-gray-400">{tokenData.symbol}</div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-700 rounded-full animate-pulse" />
                <div>
                  <div className="h-6 w-32 bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-700 rounded animate-pulse mt-1" />
                </div>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="h-64 bg-gray-700 rounded-lg animate-pulse" />
          </div>
        ) : tokenData ? (
          <div className="space-y-6">
            {/* Price and Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-black/20 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Price</p>
                      <p className="text-2xl font-bold text-white">
                        ${tokenData.price.toFixed(6)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">24h Change</p>
                      <p className={`text-2xl font-bold ${tokenData.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tokenData.change24h >= 0 ? '+' : ''}{tokenData.change24h.toFixed(2)}%
                      </p>
                    </div>
                    {tokenData.change24h >= 0 ? 
                      <TrendingUp className="h-8 w-8 text-green-400" /> : 
                      <TrendingDown className="h-8 w-8 text-red-400" />
                    }
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">24h Volume</p>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(tokenData.volume24h)}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Token Address */}
            <Card className="bg-black/20 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Token Address</p>
                    <p className="text-white font-mono text-sm break-all">{tokenData.address}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(tokenData.address)}
                    className="bg-black/20 border-white/10 text-white hover:bg-white/10"
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Information Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="bg-black/20 border-white/10">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="holders">Holders</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-black/20 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">Market Data</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Market Cap</span>
                        <span className="text-white">{formatCurrency(tokenData.marketCap)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">FDV</span>
                        <span className="text-white">{formatCurrency(tokenData.fdv)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Liquidity</span>
                        <span className="text-white">{formatCurrency(tokenData.liquidity)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/20 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">Supply Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Supply</span>
                        <span className="text-white">{formatNumber(tokenData.supply.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Circulating</span>
                        <span className="text-white">{formatNumber(tokenData.supply.circulating)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Holders</span>
                        <span className="text-white">{formatNumber(tokenData.holders)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <Card className="bg-black/20 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Risk Score</span>
                      {getRiskBadge(tokenData.security.riskScore)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Verified Contract</span>
                      <Badge className={tokenData.security.isVerified ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                        {tokenData.security.isVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Liquidity Status</span>
                      <Badge className={tokenData.security.hasLiquidity ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                        {tokenData.security.hasLiquidity ? 'Liquid' : 'Low Liquidity'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="holders" className="space-y-4">
                <Card className="bg-black/20 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Holder Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-400">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>Detailed holder analysis coming soon</p>
                      <p className="text-sm mt-1">This feature will show top holders and distribution</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* External Links */}
            <div className="flex gap-2 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://birdeye.so/token/${tokenData.address}?chain=solana`, '_blank')}
                className="bg-black/20 border-white/10 text-white hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on BirdEye
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://solscan.io/token/${tokenData.address}`, '_blank')}
                className="bg-black/20 border-white/10 text-white hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Solscan
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>Failed to load token data</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TokenDetailsModal;
