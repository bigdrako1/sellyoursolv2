
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import WalletConnect from "@/components/WalletConnect";
import CurrencySelector from "@/components/CurrencySelector";

interface HeaderProps {
  walletAddress?: string;
}

const Header = ({ walletAddress = "" }: HeaderProps) => {
  return (
    <header className="bg-trading-darkAccent border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and navigation */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold text-trading-highlight">SolRunner</Link>
            
            <nav className="hidden md:flex items-center space-x-1">
              <Link to="/" className="px-3 py-2 rounded-md hover:bg-trading-darkAccent">
                Dashboard
              </Link>
              <Link to="/market-analysis" className="px-3 py-2 rounded-md hover:bg-trading-darkAccent">
                Market Analysis
              </Link>
              <Link to="/portfolio" className="px-3 py-2 rounded-md hover:bg-trading-darkAccent">
                Portfolio
              </Link>
              <Link to="/settings" className="px-3 py-2 rounded-md hover:bg-trading-darkAccent">
                Settings
              </Link>
            </nav>
          </div>
          
          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            <CurrencySelector />
            
            {walletAddress ? (
              <span className="text-sm hidden md:inline-flex">{walletAddress}</span>
            ) : (
              <WalletConnect 
                onConnect={(address) => console.log("Wallet connected:", address)} 
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
