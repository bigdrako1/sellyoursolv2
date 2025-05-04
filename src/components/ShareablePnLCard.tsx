
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Check } from "lucide-react";
import { formatCurrency } from "@/config/appDefinition";
import { useCurrencyStore } from "@/store/currencyStore";
import APP_CONFIG from "@/config/appDefinition";
import html2canvas from "html2canvas";

interface ShareablePnLCardProps {
  tokenSymbol: string;
  entryMarketCap: number;
  exitMarketCap: number;
  profit: number;
  profitPercentage: number;
  date: string;
  backgroundGradient?: string;
}

const ShareablePnLCard = ({
  tokenSymbol,
  entryMarketCap,
  exitMarketCap,
  profit,
  profitPercentage,
  date,
  backgroundGradient = "from-trading-highlight to-purple-500"
}: ShareablePnLCardProps) => {
  const { currency, currencySymbol } = useCurrencyStore();
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    try {
      const cardElement = document.getElementById("pnl-card");
      if (!cardElement) return;

      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2, // Higher resolution
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `${tokenSymbol}-pnl-card-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading card:", error);
    }
  };

  const handleShare = async () => {
    try {
      const cardElement = document.getElementById("pnl-card");
      if (!cardElement) return;

      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2, // Higher resolution
      });
      
      const blob = await new Promise<Blob>((resolve) => 
        canvas.toBlob((blob) => resolve(blob!), "image/png", 1)
      );
      
      if (navigator.share) {
        await navigator.share({
          title: `${tokenSymbol} Trading PnL | ${APP_CONFIG.name}`,
          text: `My ${tokenSymbol} trade PnL: ${profitPercentage > 0 ? '+' : ''}${profitPercentage.toFixed(2)}% (${currencySymbol}${profit.toFixed(2)})`,
          files: [new File([blob], `${tokenSymbol}-pnl.png`, { type: "image/png" })]
        });
      } else {
        // Fallback to clipboard
        const data = [new ClipboardItem({ "image/png": blob })];
        await navigator.clipboard.write(data);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("Error sharing card:", error);
    }
  };

  const isProfitable = profitPercentage > 0;

  return (
    <div className="my-4">
      <Card 
        id="pnl-card" 
        className={`bg-gradient-to-br ${backgroundGradient} p-6 rounded-xl shadow-xl overflow-hidden relative`}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-pattern opacity-10"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-white text-xl font-bold tracking-tight">
                {tokenSymbol}
              </h3>
              <p className="text-white/90 text-sm">{date}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm py-1 px-3 rounded-full">
              <span className="text-white text-xs font-medium">{APP_CONFIG.name}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black/20 backdrop-blur-sm p-3 rounded-lg">
              <p className="text-white/70 text-xs mb-1">Entry Market Cap</p>
              <p className="text-white font-bold">{currencySymbol}{formatNumber(entryMarketCap)}</p>
            </div>
            
            <div className="bg-black/20 backdrop-blur-sm p-3 rounded-lg">
              <p className="text-white/70 text-xs mb-1">Exit Market Cap</p>
              <p className="text-white font-bold">{currencySymbol}{formatNumber(exitMarketCap)}</p>
            </div>
          </div>
          
          <div className="bg-black/30 backdrop-blur-sm p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <span className="text-white/80">Profit/Loss</span>
              <span className={`text-lg font-bold ${isProfitable ? 'text-green-300' : 'text-red-300'}`}>
                {isProfitable ? '+' : ''}{profitPercentage.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-white/80">Value</span>
              <span className={`text-lg font-bold ${isProfitable ? 'text-green-300' : 'text-red-300'}`}>
                {isProfitable ? '+' : ''}{currencySymbol}{profit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </Card>
      
      <div className="flex justify-center mt-3 gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1 bg-trading-darkAccent border-white/10 hover:bg-white/10"
          onClick={handleDownload}
        >
          <Download size={14} />
          <span>Download</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1 bg-trading-darkAccent border-white/10 hover:bg-white/10"
          onClick={handleShare}
        >
          {copied ? <Check size={14} /> : <Share2 size={14} />}
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </Button>
      </div>
    </div>
  );
};

// Helper function to format large numbers
function formatNumber(num: number): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  }
  return num.toFixed(2);
}

export default ShareablePnLCard;
