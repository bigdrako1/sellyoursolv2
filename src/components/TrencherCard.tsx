import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Check } from "lucide-react";
import html2canvas from "html2canvas";

interface TrencherCardProps {
  tokenSymbol?: string;
  calledAt?: string;
  multiplier?: number;
  holdingTime?: string;
}

const TrencherCard: React.FC<TrencherCardProps> = ({
  tokenSymbol = "$TRENCHER",
  calledAt = "110.7K",
  multiplier = 82.2,
  holdingTime = "18h, 7m"
}) => {
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    try {
      const cardElement = document.getElementById("trencher-card");
      if (!cardElement) return;

      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2, // Higher resolution
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `${tokenSymbol.replace("$", "")}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading card:", error);
    }
  };

  const handleShare = async () => {
    try {
      const cardElement = document.getElementById("trencher-card");
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
          title: `${tokenSymbol} ${multiplier}x`,
          text: `${tokenSymbol} ${multiplier}x ROI`,
          files: [new File([blob], `${tokenSymbol.replace("$", "")}.png`, { type: "image/png" })]
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

  return (
    <div className="my-4">
      <Card
        id="trencher-card"
        className="aspect-[4/5] p-6 rounded-xl shadow-xl overflow-hidden relative"
        style={{
          background: "linear-gradient(135deg, #1B5E20, #2E7D32)",
          backgroundImage: "url('/forest-bg.svg')",
          backgroundSize: "cover",
          backgroundBlendMode: "overlay",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Background pattern */}
        <div className="absolute top-0 left-0 w-full h-full bg-green-900/50"></div>

        {/* Cash stacks */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 z-10 overflow-hidden">
          <div className="absolute bottom-0 left-4">
            <svg width="100" height="80" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="10" width="90" height="60" rx="2" fill="#43A047" />
              <rect x="10" y="15" width="80" height="50" rx="1" fill="#66BB6A" />
              <rect x="15" y="20" width="70" height="40" rx="1" fill="#81C784" />
              <rect x="20" y="25" width="60" height="30" rx="1" fill="#A5D6A7" />
              <text x="50" y="45" fontSize="16" fill="white" textAnchor="middle" fontWeight="bold">$</text>
            </svg>
          </div>
          <div className="absolute bottom-0 left-24">
            <svg width="100" height="80" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="10" width="90" height="60" rx="2" fill="#43A047" />
              <rect x="10" y="15" width="80" height="50" rx="1" fill="#66BB6A" />
              <rect x="15" y="20" width="70" height="40" rx="1" fill="#81C784" />
              <rect x="20" y="25" width="60" height="30" rx="1" fill="#A5D6A7" />
              <text x="50" y="45" fontSize="16" fill="white" textAnchor="middle" fontWeight="bold">$</text>
            </svg>
          </div>
          <div className="absolute bottom-0 left-44">
            <svg width="100" height="80" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="10" width="90" height="60" rx="2" fill="#43A047" />
              <rect x="10" y="15" width="80" height="50" rx="1" fill="#66BB6A" />
              <rect x="15" y="20" width="70" height="40" rx="1" fill="#81C784" />
              <rect x="20" y="25" width="60" height="30" rx="1" fill="#A5D6A7" />
              <text x="50" y="45" fontSize="16" fill="white" textAnchor="middle" fontWeight="bold">$</text>
            </svg>
          </div>
        </div>

        <div className="relative z-20 flex flex-col h-full">
          {/* Top section with token name and called at */}
          <div className="flex flex-col items-start mb-4">
            <div className="flex justify-between items-start w-full">
              <div>
                <h1 className="text-white text-6xl font-bold tracking-tight drop-shadow-md" style={{ textShadow: "0 2px 10px rgba(0, 0, 0, 0.5)" }}>
                  {tokenSymbol}
                </h1>
                <p className="text-white/90 text-sm mt-1">
                  called at {calledAt}
                </p>
              </div>

              <div className="flex items-center">
                <img
                  src="/pepe-mascot.svg"
                  alt="Pepe"
                  className="w-40 h-40 -mt-10 -mr-10"
                />
              </div>
            </div>
          </div>

          {/* Middle section with multiplier */}
          <div className="flex-grow flex items-center justify-center">
            <div
              className="text-[#00FF00] text-9xl font-bold tracking-tighter"
              style={{
                textShadow: "0 0 15px rgba(0, 255, 0, 0.8), 0 0 30px rgba(0, 255, 0, 0.4)",
                transform: "scale(1.1)",
              }}
            >
              {multiplier}x
            </div>
          </div>

          {/* Bottom section with trader name and time */}
          <div className="mt-auto flex justify-between items-end">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">TURBOMPOWER</span>
            </div>

            <div className="text-white/80 text-sm">
              {holdingTime}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-center mt-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1 bg-green-900 border-white/10 hover:bg-green-800"
          onClick={handleDownload}
        >
          <Download size={14} />
          <span>Download</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1 bg-green-900 border-white/10 hover:bg-green-800"
          onClick={handleShare}
        >
          {copied ? <Check size={14} /> : <Share2 size={14} />}
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </Button>
      </div>
    </div>
  );
};

export default TrencherCard;
