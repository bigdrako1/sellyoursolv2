import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Check } from "lucide-react";
import { useCurrencyStore } from "@/store/currencyStore";
import APP_CONFIG from "@/config/appDefinition";
import html2canvas from "html2canvas";

interface PnLCardProps {
  tokenSymbol: string;
  entryMarketCap: number;
  exitMarketCap: number;
  profit: number;
  profitPercentage: number;
  multiplier: number; // ROI multiplier (e.g., 2x, 10x)
  date: string;
  trader?: string; // Optional trader name
  aspectRatio?: "1:1" | "4:5";
  socialHandles?: {
    telegram?: string;
    twitter?: string;
  };
  enhanced?: boolean; // Whether to use the enhanced version
}

// Define tier thresholds and properties
interface Tier {
  name: string;
  threshold: number; // Minimum multiplier or percentage to reach this tier
  mascot: string;
  mainColor: string;
  gradientFrom: string;
  gradientTo: string;
  emotion: string;
}

const tiers: Tier[] = [
  {
    name: "God Mode",
    threshold: 50, // 50x or +5000%
    mascot: "/mascot-god.svg",
    mainColor: "from-yellow-300 to-amber-500",
    gradientFrom: "#FFD700",
    gradientTo: "#FFC107",
    emotion: "Transcendent"
  },
  {
    name: "Legendary",
    threshold: 10, // 10x or +1000%
    mascot: "/mascot-legendary.svg",
    mainColor: "from-green-400 to-green-600",
    gradientFrom: "#4CAF50",
    gradientTo: "#2E7D32",
    emotion: "Ecstatic"
  },
  {
    name: "Successful",
    threshold: 2, // 2x or +200%
    mascot: "/mascot-successful.svg",
    mainColor: "from-green-300 to-green-500",
    gradientFrom: "#8BC34A",
    gradientTo: "#689F38",
    emotion: "Happy"
  },
  {
    name: "Neutral",
    threshold: -0.1, // -10% to +99%
    mascot: "/mascot-neutral.svg",
    mainColor: "from-yellow-400 to-amber-400",
    gradientFrom: "#FFC107",
    gradientTo: "#FFA000",
    emotion: "Content"
  },
  {
    name: "Losing",
    threshold: -0.5, // -50% to -11%
    mascot: "/mascot-losing.svg",
    mainColor: "from-red-400 to-red-600",
    gradientFrom: "#F44336",
    gradientTo: "#D32F2F",
    emotion: "Sad"
  },
  {
    name: "Rugged",
    threshold: -100, // Less than -50%
    mascot: "/mascot-rugged.svg",
    mainColor: "from-gray-700 to-gray-900",
    gradientFrom: "#424242",
    gradientTo: "#212121",
    emotion: "Devastated"
  }
];

const PnLCard: React.FC<PnLCardProps> = ({
  tokenSymbol,
  entryMarketCap,
  exitMarketCap,
  profit,
  profitPercentage,
  multiplier,
  date,
  trader,
  aspectRatio = "4:5",
  socialHandles,
  enhanced = false
}) => {
  const { currencySymbol } = useCurrencyStore();
  const [copied, setCopied] = useState(false);

  // Determine the tier based on multiplier
  const tier = useMemo(() => {
    // Sort tiers by threshold in descending order
    const sortedTiers = [...tiers].sort((a, b) => b.threshold - a.threshold);
    // Find the first tier where the multiplier is greater than or equal to the threshold
    return sortedTiers.find(tier => multiplier >= tier.threshold) || sortedTiers[sortedTiers.length - 1];
  }, [multiplier]);

  const handleDownload = async () => {
    try {
      const cardElement = document.getElementById(enhanced ? "enhanced-pnl-card" : "pnl-card");
      if (!cardElement) return;

      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2, // Higher resolution
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `${tokenSymbol}-${tier.name.toLowerCase().replace(' ', '-')}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading card:", error);
    }
  };

  const handleShare = async () => {
    try {
      const cardElement = document.getElementById(enhanced ? "enhanced-pnl-card" : "pnl-card");
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
          title: `${tokenSymbol} ${tier.name} PnL | ${APP_CONFIG.name}`,
          text: `My ${tokenSymbol} trade: ${multiplier.toFixed(2)}x (${profitPercentage > 0 ? '+' : ''}${profitPercentage.toFixed(2)}%) | ${tier.name} tier!`,
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

  // Format large numbers
  const formatNumber = (num: number): string => {
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
  };

  return (
    <div className="my-4">
      <Card
        id={enhanced ? "enhanced-pnl-card" : "pnl-card"}
        className={`bg-gradient-to-br ${tier.mainColor} p-6 rounded-xl shadow-xl overflow-hidden relative ${aspectRatio === "1:1" ? "aspect-square" : "aspect-[4/5]"}`}
        style={{
          background: `linear-gradient(135deg, ${tier.gradientFrom}, ${tier.gradientTo})`,
        }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-pattern opacity-10"></div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Mascot and Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-start">
              <img
                src={tier.mascot}
                alt={`${tier.name} Pepe`}
                className="w-1/5 h-auto mr-3"
              />
              <div>
                <h3 className="text-white text-xl font-bold tracking-tight">
                  {tokenSymbol}
                </h3>
                <p className="text-white/90 text-sm">{date}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-black/30 rounded-full text-white text-xs">
                  {tier.name}
                </span>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm py-1 px-3 rounded-full">
              <span className="text-white text-xs font-medium">{APP_CONFIG.name}</span>
            </div>
          </div>

          {/* Market Cap Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-black/20 backdrop-blur-sm p-3 rounded-lg">
              <p className="text-white/70 text-xs mb-1">Entry Market Cap</p>
              <p className="text-white font-bold">{currencySymbol}{formatNumber(entryMarketCap)}</p>
            </div>

            <div className="bg-black/20 backdrop-blur-sm p-3 rounded-lg">
              <p className="text-white/70 text-xs mb-1">Exit Market Cap</p>
              <p className="text-white font-bold">{currencySymbol}{formatNumber(exitMarketCap)}</p>
            </div>
          </div>

          {/* PnL Info */}
          <div className="bg-black/30 backdrop-blur-sm p-4 rounded-lg mb-4 flex-grow">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/80">ROI Multiplier</span>
              <span className="text-xl font-bold text-white">
                {multiplier.toFixed(2)}x
              </span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/80">Profit/Loss</span>
              <span className="text-lg font-bold text-white">
                {profitPercentage > 0 ? '+' : ''}{profitPercentage.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/80">Value</span>
              <span className="text-lg font-bold text-white">
                {profit > 0 ? '+' : ''}{currencySymbol}{profit.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Trader info (only in enhanced mode) */}
          {enhanced && trader && (
            <div className="bg-black/30 backdrop-blur-sm p-3 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <span className="text-white/80 text-sm">Trader</span>
                <span className="text-white font-medium">{trader}</span>
              </div>
            </div>
          )}

          {/* Social handles (only in enhanced mode) */}
          {enhanced && socialHandles && (
            <div className="flex justify-center gap-3 mb-4">
              {socialHandles.telegram && (
                <a href={socialHandles.telegram} target="_blank" rel="noopener noreferrer" className="text-white/90 hover:text-white">
                  <img src="/assets/telegram-icon.svg" alt="Telegram" className="w-6 h-6" />
                </a>
              )}
              {socialHandles.twitter && (
                <a href={socialHandles.twitter} target="_blank" rel="noopener noreferrer" className="text-white/90 hover:text-white">
                  <img src="/assets/twitter-icon.svg" alt="Twitter" className="w-6 h-6" />
                </a>
              )}
            </div>
          )}
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

export default PnLCard;
