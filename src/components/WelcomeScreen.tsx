
import { Button } from "@/components/ui/button";
import WalletConnect from "@/components/WalletConnect";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn } from "lucide-react";

interface WelcomeScreenProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
}

const WelcomeScreen = ({ onConnect, onDisconnect }: WelcomeScreenProps) => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-3 trading-gradient-text">SellYourSOL™ v2</h1>
        <p className="text-gray-400 max-w-lg">
          Autonomous, AFK-capable trading system for Solana.
          Connect your wallet to begin trading with advanced AI strategies.
        </p>
      </div>
      <div className="w-full max-w-md">
        <WalletConnect onConnect={onConnect} onDisconnect={onDisconnect} />
      </div>
      
      {!isAuthenticated && (
        <div className="mt-6">
          <Link to="/auth">
            <Button className="bg-trading-highlight hover:bg-trading-highlight/80">
              <LogIn className="h-4 w-4 mr-2" />
              Login / Create Account
            </Button>
          </Link>
        </div>
      )}
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
        <FeatureCard 
          title="AI-Powered Trading"
          description="Our algorithms adapt to market conditions in real-time for optimal performance."
          icon="🤖"
        />
        <FeatureCard 
          title="Portfolio Management"
          description="Track assets, monitor performance, and analyze ROI on Solana."
          icon="📊"
        />
        <FeatureCard 
          title="24/7 Automation"
          description="Set your strategy once and let our system handle the rest."
          icon="⏰"
        />
      </div>
    </div>
  );
};

const FeatureCard = ({ title, description, icon }: { title: string, description: string, icon: string }) => (
  <div className="trading-card flex flex-col items-center text-center p-6 hover-scale">
    <div className="text-3xl mb-4">{icon}</div>
    <h3 className="font-bold mb-2 text-trading-highlight">{title}</h3>
    <p className="text-sm text-gray-400">{description}</p>
  </div>
);

export default WelcomeScreen;
