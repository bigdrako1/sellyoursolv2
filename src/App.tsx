
import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import Index from "@/pages/Index";
import Settings from "@/pages/Settings";
import Portfolio from "@/pages/Portfolio";
import AutoTrading from "@/pages/AutoTrading";
import MarketAnalysis from "@/pages/MarketAnalysis";
import Webhooks from "@/pages/Webhooks";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import Layout from "@/components/Layout";
import TelegramMonitorPage from "@/pages/TelegramMonitor";
import TokensPage from "@/pages/Tokens";
import WalletsPage from "@/pages/Wallets";

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "portfolio",
        element: <Portfolio />,
      },
      {
        path: "auto-trading",
        element: <AutoTrading />,
      },
      {
        path: "market-analysis",
        element: <MarketAnalysis />,
      },
      {
        path: "webhooks",
        element: <Webhooks />,
      },
      {
        path: "telegram-monitor",
        element: <TelegramMonitorPage />,
      },
      {
        path: "tokens",
        element: <TokensPage />,
      },
      {
        path: "wallets",
        element: <WalletsPage />,
      }
    ],
  },
  {
    path: "/auth",
    element: <Auth />,
  },
]);

function App() {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;
