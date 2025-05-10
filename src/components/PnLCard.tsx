import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TradingPosition } from '@/types/token.types';
import { useToast } from '@/hooks/use-toast';
import {
  Share2,
  Download,
  Twitter,
  Copy,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Rocket,
  Trophy,
  Clock,
  DollarSign,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import html2canvas from 'html2canvas';

interface PnLCardProps {
  position: TradingPosition;
  onClose?: () => void;
}

const PnLCard: React.FC<PnLCardProps> = ({ position, onClose }) => {
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate profit/loss
  const isProfitable = position.pnl > 0;
  const roi = position.roi;
  const pnlAmount = position.pnl;

  // Calculate ROI multiplier (e.g., 2.5x)
  const roiMultiplier = 1 + (roi / 100);

  // Format dates
  const entryDate = new Date(position.entryTime).toLocaleDateString();
  const exitDate = position.exitTime ? new Date(position.exitTime).toLocaleDateString() : 'Active';

  // Mock market cap data (in a real app, this would come from an API)
  const entryMarketCap = position.entryPrice * 1_000_000; // Simulated market cap
  const exitMarketCap = (position.exitPrice || position.currentPrice) * 1_000_000; // Simulated market cap

  // Format market caps with appropriate suffixes
  const formatMarketCap = (value: number): string => {
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  // Calculate holding period
  const calculateHoldingPeriod = () => {
    const entryTime = new Date(position.entryTime).getTime();
    const exitTime = position.exitTime ? new Date(position.exitTime).getTime() : Date.now();
    const diffInDays = Math.floor((exitTime - entryTime) / (1000 * 60 * 60 * 24));

    if (diffInDays < 1) {
      const diffInHours = Math.floor((exitTime - entryTime) / (1000 * 60 * 60));
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((exitTime - entryTime) / (1000 * 60));
        return `${diffInMinutes} minutes`;
      }
      return `${diffInHours} hours`;
    }

    return `${diffInDays} days`;
  };

  // Get performance emoji based on ROI
  const getPerformanceEmoji = () => {
    if (roi >= 500) return '🚀🚀🚀';
    if (roi >= 300) return '🚀🚀';
    if (roi >= 100) return '🚀';
    if (roi >= 50) return '🔥';
    if (roi >= 20) return '💰';
    if (roi >= 0) return '✅';
    if (roi >= -20) return '⚠️';
    return '❌';
  };

  // Handle share
  const handleShare = async () => {
    if (navigator.share && cardRef.current) {
      setIsGenerating(true);
      try {
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: '#121212',
          scale: 2, // Higher quality
          logging: false
        });
        const dataUrl = canvas.toDataURL('image/png');

        // Convert data URL to Blob
        const blob = await (await fetch(dataUrl)).blob();

        // Share
        await navigator.share({
          title: `${position.tokenSymbol} Trade Result`,
          text: `My ${position.tokenSymbol} trade on SellYourSol: ${formatPercent(roi)} ROI (${roiMultiplier.toFixed(2)}x) ${getPerformanceEmoji()}`,
          files: [new File([blob], 'sellyoursol-trade.png', { type: 'image/png' })]
        });

        toast({
          title: "Shared Successfully",
          description: "Your PnL card has been shared",
        });
      } catch (error) {
        console.error("Error sharing:", error);
        toast({
          title: "Share Failed",
          description: "Could not share the PnL card",
          variant: "destructive",
        });
      } finally {
        setIsGenerating(false);
      }
    } else {
      toast({
        title: "Share Not Supported",
        description: "Your browser doesn't support sharing",
        variant: "destructive",
      });
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (cardRef.current) {
      setIsGenerating(true);
      try {
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: '#121212',
          scale: 2, // Higher quality
          logging: false
        });
        const dataUrl = canvas.toDataURL('image/png');

        // Create download link
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `sellyoursol-${position.tokenSymbol}-${roiMultiplier.toFixed(2)}x.png`;
        link.click();

        toast({
          title: "Download Complete",
          description: "Your PnL card has been downloaded",
        });
      } catch (error) {
        console.error("Error downloading:", error);
        toast({
          title: "Download Failed",
          description: "Could not download the PnL card",
          variant: "destructive",
        });
      } finally {
        setIsGenerating(false);
      }
    }
  };

  // Handle tweet
  const handleTweet = () => {
    const tweetText = `Just ${isProfitable ? 'made' : 'lost'} ${formatCurrency(Math.abs(pnlAmount))} (${roiMultiplier.toFixed(2)}x) trading $${position.tokenSymbol} on SellYourSol! ${getPerformanceEmoji()} #SellYourSol #Crypto #Trading`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, '_blank');
  };

  // Handle copy
  const handleCopy = () => {
    const textToCopy = `Token: ${position.tokenSymbol} (${position.tokenName})
Entry Market Cap: ${formatMarketCap(entryMarketCap)}
Exit Market Cap: ${formatMarketCap(exitMarketCap)}
ROI: ${formatPercent(roi)} (${roiMultiplier.toFixed(2)}x)
PnL: ${formatCurrency(pnlAmount)}
Holding Period: ${calculateHoldingPeriod()}
Platform: SellYourSol.io ${getPerformanceEmoji()}`;

    navigator.clipboard.writeText(textToCopy);

    toast({
      title: "Copied to Clipboard",
      description: "Trade details copied to clipboard",
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50 p-4">
      <div className="w-full max-w-md">
        <div ref={cardRef} className="w-full">
          <Card className="card-with-border overflow-hidden bg-gradient-to-br from-gray-900 to-black">
            {/* Top gradient bar */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

            {/* Mascot watermark */}
            <div className="absolute bottom-5 right-5 opacity-5 pointer-events-none">
              <img src="/mascot.png" alt="" className="w-40 h-40" />
            </div>

            <CardHeader className="pb-2 relative">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-xl bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 text-transparent bg-clip-text">
                    Trade Result
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <img src="/logo.png" alt="SellYourSol Logo" className="h-7 w-7" />
                  <span className="font-bold text-sm bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                    SellYourSol
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Token info and ROI */}
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold">${position.tokenSymbol}</h3>
                    <div className="bg-black/30 px-2 py-0.5 rounded text-xs text-gray-300 border border-white/10">
                      Solana
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">{position.tokenName}</p>
                </div>
                <div className={`flex flex-col items-end ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                  <div className="flex items-center gap-1">
                    {isProfitable ? (
                      <ArrowUpRight className="h-5 w-5" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5" />
                    )}
                    <span className="text-2xl font-bold">{formatPercent(roi)}</span>
                  </div>
                  <div className="text-sm font-medium">
                    {roiMultiplier.toFixed(2)}x {getPerformanceEmoji()}
                  </div>
                </div>
              </div>

              {/* Main stats grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                    <BarChart3 className="h-3 w-3" />
                    <p>Entry Market Cap</p>
                  </div>
                  <p className="font-medium">{formatMarketCap(entryMarketCap)}</p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                    <BarChart3 className="h-3 w-3" />
                    <p>Exit Market Cap</p>
                  </div>
                  <p className="font-medium">{formatMarketCap(exitMarketCap)}</p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                    <DollarSign className="h-3 w-3" />
                    <p>PnL</p>
                  </div>
                  <p className={`font-medium ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                    {isProfitable ? '+' : ''}{formatCurrency(pnlAmount)}
                  </p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                    <Clock className="h-3 w-3" />
                    <p>Holding Period</p>
                  </div>
                  <p className="font-medium">{calculateHoldingPeriod()}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Entry Date</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Exit Date</span>
                  </div>
                </div>
                <div className="flex justify-between font-medium">
                  <span>{entryDate}</span>
                  <span>{exitDate}</span>
                </div>
              </div>

              {/* Scale out history */}
              {position.scaleOutHistory.length > 0 && (
                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                    <Sparkles className="h-3 w-3 text-blue-400" />
                    <p>Scale Out History</p>
                  </div>
                  <div className="space-y-2">
                    {position.scaleOutHistory.map((event, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{new Date(event.time).toLocaleDateString()}</span>
                        <span className="text-blue-400">{event.percentOfPosition}% at {formatCurrency(event.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievement badge */}
              {isProfitable && roi > 50 && (
                <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-3 rounded-lg border border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 rounded-full">
                      <Trophy className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-blue-300">
                        {roi >= 500 ? 'Legendary Trader' :
                         roi >= 300 ? 'Expert Trader' :
                         roi >= 100 ? 'Advanced Trader' :
                         'Skilled Trader'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {roi >= 500 ? 'Achieved 5x+ return' :
                         roi >= 300 ? 'Achieved 3x+ return' :
                         roi >= 100 ? 'Achieved 2x+ return' :
                         'Achieved 50%+ return'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between border-t border-white/5 pt-4">
              <div className="text-xs text-gray-500">
                Generated by SellYourSol
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-blue-400">sellYourSol.io</span>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="flex justify-between mt-4 gap-2">
          <Button
            variant="outline"
            onClick={handleShare}
            disabled={isGenerating}
            className="flex-1 bg-black/30 border-white/10 hover:bg-white/10"
          >
            {isGenerating ? (
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <Share2 className="h-4 w-4 mr-2" />
            )}
            Share
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex-1 bg-black/30 border-white/10 hover:bg-white/10"
          >
            {isGenerating ? (
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download
          </Button>
          <Button
            variant="outline"
            onClick={handleTweet}
            className="flex-1 bg-black/30 border-white/10 hover:bg-white/10"
          >
            <Twitter className="h-4 w-4 mr-2" />
            Tweet
          </Button>
          <Button
            variant="outline"
            onClick={handleCopy}
            className="flex-1 bg-black/30 border-white/10 hover:bg-white/10"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={onClose}
          className="w-full mt-2 text-gray-400 hover:text-white"
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export default PnLCard;
