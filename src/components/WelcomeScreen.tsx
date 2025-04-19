
import WalletConnect from "@/components/WalletConnect";

interface WelcomeScreenProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
}

const WelcomeScreen = ({ onConnect, onDisconnect }: WelcomeScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-3 trading-gradient-text">SellYourSOL™ v2</h1>
        <p className="text-gray-400 max-w-lg">
          Autonomous, AFK-capable trading system for Solana and Binance Smart Chain.
          Connect your wallet to begin trading with advanced AI strategies.
        </p>
      </div>
      <div className="w-full max-w-md">
        <WalletConnect onConnect={onConnect} onDisconnect={onDisconnect} />
      </div>
    </div>
  );
};

export default WelcomeScreen;
