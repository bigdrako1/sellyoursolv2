
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, RotateCw } from "lucide-react";

interface WalletConnectProps {
  onConnect: (address: string) => void;
}

const WalletConnect = ({ onConnect }: WalletConnectProps) => {
  const [connecting, setConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  const handleConnect = async () => {
    setConnecting(true);
    
    // Simulating wallet connection
    setTimeout(() => {
      const mockAddress = "8xH5f...3Zdy7";
      setWalletAddress(mockAddress);
      onConnect(mockAddress);
      setConnecting(false);
    }, 1500);
  };

  return (
    <Card className="trading-card">
      <div className="flex flex-col md:flex-row justify-between items-center p-3 gap-4">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-trading-highlight" />
          <div>
            {walletAddress ? (
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">Connected Wallet</span>
                <span className="font-medium">{walletAddress}</span>
              </div>
            ) : (
              <span className="font-medium">Connect Wallet</span>
            )}
          </div>
        </div>
        
        <Button 
          onClick={handleConnect} 
          disabled={connecting || !!walletAddress}
          className={`trading-button ${walletAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {connecting ? (
            <>
              <RotateCw className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : walletAddress ? (
            "Connected"
          ) : (
            "Connect"
          )}
        </Button>
      </div>
    </Card>
  );
};

export default WalletConnect;
