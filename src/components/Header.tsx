
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CurrencySelector from "@/components/CurrencySelector";
import { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  LineChart,
  BarChart2,
  BarChart3,
  Settings,
  Wallet,
  Coins,
  Zap,
  Activity,
  AlertTriangle,
  LogOut
} from "lucide-react";
import LivePriceTracker from "@/components/LivePriceTracker";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

// Core navigation items - only include essential pages
const navItems: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { path: "/market-analysis", label: "Market", icon: <LineChart size={18} /> },
  { path: "/auto-trading", label: "Trading", icon: <Zap size={18} /> },
  { path: "/portfolio", label: "Portfolio", icon: <BarChart2 size={18} /> },
  { path: "/tokens", label: "Tokens", icon: <Coins size={18} /> },
  { path: "/wallet-tracking", label: "Wallets", icon: <Wallet size={18} /> },
  { path: "/settings", label: "Settings", icon: <Settings size={18} /> }
];

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  size?: "default" | "small";
  onClick?: () => void;
}

const NavItem = ({ to, icon, label, isActive, size = "default", onClick }: NavItemProps) => {
  const location = useLocation();
  const isActiveOrSubPath = isActive || location.pathname.startsWith(`${to}/`);

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors whitespace-nowrap",
        isActiveOrSubPath
          ? "bg-trading-highlight/20 text-white"
          : "hover:bg-trading-darkAccent",
        size === "small" && "text-sm"
      )}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

interface HeaderProps {
  systemActive?: boolean;
  toggleSystemActive?: () => void;
}

const Header = ({ systemActive = false, toggleSystemActive }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAuthenticated, walletAddress, signOut } = useAuth();

  return (
    <header className="bg-trading-darkAccent border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and navigation */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold text-trading-highlight">SellYourSOL V2</Link>

            {/* Main Navigation */}
            <nav className="hidden md:flex items-center gap-1 max-w-[calc(100vw-300px)] overflow-x-auto">
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

            {toggleSystemActive && (
              <Button
                onClick={toggleSystemActive}
                variant="outline"
                className={`gap-1 transition-all duration-300 hidden sm:flex ${
                  systemActive
                    ? "bg-trading-success/20 text-trading-success hover:bg-trading-success/30 border-trading-success/30"
                    : "bg-trading-danger/20 text-trading-danger hover:bg-trading-danger/30 border-trading-danger/30"
                }`}
              >
                {systemActive ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-trading-success animate-pulse"></div>
                    System Active
                  </>
                ) : (
                  <>
                    <AlertTriangle size={14} />
                    System Paused
                  </>
                )}
              </Button>
            )}

            <CurrencySelector />

            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-1 bg-trading-darkAccent border-white/10"
                onClick={async () => {
                  try {
                    await signOut();
                    toast.success("Wallet disconnected successfully");
                  } catch (error) {
                    console.error("Error disconnecting wallet:", error);
                    toast.error("Failed to disconnect wallet");
                  }
                }}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Disconnect
              </Button>
            )}

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
        <div className="md:hidden bg-trading-darkAccent border-t border-white/5 fixed top-16 left-0 right-0 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
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
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-white/10">
              <LivePriceTracker />

              {toggleSystemActive && (
                <Button
                  onClick={toggleSystemActive}
                  variant="outline"
                  className={`gap-1 transition-all duration-300 mt-3 w-full ${
                    systemActive
                      ? "bg-trading-success/20 text-trading-success hover:bg-trading-success/30 border-trading-success/30"
                      : "bg-trading-danger/20 text-trading-danger hover:bg-trading-danger/30 border-trading-danger/30"
                  }`}
                >
                  {systemActive ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-trading-success animate-pulse"></div>
                      System Active
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={14} />
                      System Paused
                    </>
                  )}
                </Button>
              )}

              {isAuthenticated && (
                <Button
                  variant="outline"
                  className="mt-3 w-full flex items-center justify-center gap-1 bg-trading-darkAccent border-white/10"
                  onClick={async () => {
                    try {
                      await signOut();
                      toast.success("Wallet disconnected successfully");
                      setMobileMenuOpen(false);
                    } catch (error) {
                      console.error("Error disconnecting wallet:", error);
                      toast.error("Failed to disconnect wallet");
                    }
                  }}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Disconnect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
