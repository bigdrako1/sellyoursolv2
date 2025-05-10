
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
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
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem = ({ to, icon, label, isActive }: NavItemProps) => (
  <Link 
    to={to} 
    className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
      isActive 
        ? "bg-trading-highlight/20 text-white" 
        : "hover:bg-trading-darkAccent"
    )}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

const MainNavigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const navItems = [
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
  
  return (
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
  );
};

export const MobileNavigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { path: "/market-analysis", label: "Market Analysis", icon: <LineChart size={16} /> },
    { path: "/auto-trading", label: "Auto Trading", icon: <Zap size={16} /> },
    { path: "/portfolio", label: "Portfolio", icon: <BarChart2 size={16} /> },
    { path: "/tokens", label: "Tokens", icon: <Coins size={16} /> },
    { path: "/wallets", label: "Wallets", icon: <Wallet size={16} /> },
    { path: "/webhooks", label: "Webhooks", icon: <Webhook size={16} /> },
    { path: "/telegram-monitor", label: "Telegram Monitor", icon: <MessageSquare size={16} /> },
    { path: "/settings", label: "Settings", icon: <Settings size={16} /> }
  ];
  
  return (
    <div className="flex flex-col space-y-1">
      {navItems.map((item) => (
        <Link 
          key={item.path} 
          to={item.path} 
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md",
            currentPath === item.path 
              ? "bg-trading-highlight/20 text-white" 
              : "hover:bg-trading-darkAccent"
          )}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  );
};

export default MainNavigation;
