
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
import { cn } from "@/lib/utils";

export interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

export const navItems: NavItem[] = [
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

export const NavItem = ({ to, icon, label, isActive, size = "default" }: NavItemProps) => {
  // Clone the icon with appropriate size
  const iconElement = React.isValidElement(icon) 
    ? React.cloneElement(icon as React.ReactElement, { 
        size: size === "small" ? 16 : 18 
      }) 
    : null;

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
      {iconElement}
      <span>{label}</span>
    </Link>
  );
};

export const useNavigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  return {
    currentPath,
    isActivePath: (path: string) => currentPath === path,
    navItems,
  };
};

const AppNavigation = () => {
  const { currentPath } = useNavigation();
  
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
  const { currentPath } = useNavigation();
  
  return (
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
  );
};

export default AppNavigation;
