
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CurrencySelector from "@/components/CurrencySelector";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import LivePriceTracker from "@/components/LivePriceTracker";

interface HeaderProps {
  walletAddress?: string;
}

const Header = ({ walletAddress = "" }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/market-analysis", label: "Market Analysis" },
    { path: "/auto-trading", label: "Auto Trading" },
    { path: "/portfolio", label: "Portfolio" },
    { path: "/backtesting", label: "Backtesting" },
    { path: "/risk-management", label: "Risk Management" },
    { path: "/strategy-monitoring", label: "Strategy Monitoring" },
    { path: "/smart-money-tracking", label: "Smart Money" },
    { path: "/settings", label: "Settings" }
  ];

  const isActive = (path: string) => {
    return location.pathname === path ? "bg-trading-highlight/20 text-white" : "hover:bg-trading-darkAccent";
  };

  return (
    <header className="bg-trading-darkAccent border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and navigation */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold text-trading-highlight">SellYourSOL V2</Link>

            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md ${isActive(item.path)}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <LivePriceTracker />
            </div>
            <CurrencySelector />

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              size="icon"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-trading-darkAccent border-t border-white/5">
          <div className="container mx-auto px-4 py-2">
            <nav className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md ${isActive(item.path)}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 pt-2 border-t border-white/10">
              <LivePriceTracker />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
