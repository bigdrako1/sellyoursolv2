
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CurrencySelector from "@/components/CurrencySelector";
import { useState } from "react";
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  LineChart, 
  Zap, 
  BarChart2, 
  Webhook, 
  MessageSquare, 
  Settings, 
  Wallet,
  Coins
} from "lucide-react";
import LivePriceTracker from "@/components/LivePriceTracker";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: "/", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { path: "/market-analysis", label: "Market Analysis", icon: <LineChart size={18} /> },
  { path: "/auto-trading", label: "Auto Trading", icon: <Zap size={18} /> },
  { path: "/portfolio", label: "Portfolio", icon: <BarChart2 size={18} /> },
  { path: "/tokens", label: "Tokens", icon: <Coins size={18} /> },
  { path: "/wallets", label: "Wallets", icon: <Wallet size={18} /> },
  { path: "/webhooks", label: "Webhooks", icon: <Webhook size={18} /> },
  { path: "/telegram-monitor", label: "Telegram Monitor", icon: <MessageSquare size={18} /> },
  { path: "/settings", label: "Settings", icon: <Settings size={18} /> }
];

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  size?: "default" | "small";
}

const NavItem = ({ to, icon, label, isActive, size = "default" }: NavItemProps) => {
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
        isActive 
          ? "bg-trading-highlight/20 text-white" 
          : "hover:bg-trading-darkAccent",
        size === "small" && "text-sm"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;
  
  return (
    <header className="bg-trading-darkAccent border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and navigation */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold text-trading-highlight">SellYourSOL V2</Link>
            
            {/* Main Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <NavItem 
                  key={item.path}
                  to={item.path}
                  icon={item.icon}
                  label={item.label}
                  isActive={currentPath === item.path}
                />
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
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <NavItem 
                  key={item.path}
                  to={item.path}
                  icon={item.icon}
                  label={item.label}
                  isActive={currentPath === item.path}
                  size="small"
                />
              ))}
            </div>
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
