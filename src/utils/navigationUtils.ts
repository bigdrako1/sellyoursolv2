
import { useLocation } from "react-router-dom";

export const useCurrentPath = () => {
  const location = useLocation();
  return location.pathname;
};

export const isActiveRoute = (currentPath: string, path: string) => {
  return currentPath === path;
};

export const getPageTitle = (path: string): string => {
  const pathMap: Record<string, string> = {
    "/": "Dashboard",
    "/market-analysis": "Market Analysis",
    "/auto-trading": "Auto Trading",
    "/portfolio": "Portfolio",
    "/tokens": "Token Management",
    "/wallets": "Wallet Management",
    "/webhooks": "Webhooks",
    "/telegram-monitor": "Telegram Monitor",
    "/settings": "Settings"
  };

  return pathMap[path] || "Not Found";
};
