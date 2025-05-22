
import React, { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

// Always loaded components
import Layout from "@/components/Layout";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";

// Lazy-loaded pages
const Settings = lazy(() => import("@/pages/Settings"));
const Portfolio = lazy(() => import("@/pages/Portfolio"));
const MarketAnalysis = lazy(() => import("@/pages/MarketAnalysis"));
const TokensPage = lazy(() => import("@/pages/Tokens"));
const AutoTrading = lazy(() => import("@/pages/AutoTrading"));
const WalletTracking = lazy(() => import("@/pages/WalletTracking"));
const WalletTrackingAnalytics = lazy(() => import("@/pages/WalletTrackingAnalytics"));
const ConsolidatedDashboard = lazy(() => import("@/pages/ConsolidatedDashboard"));

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-2">
      <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  </div>
);

// Wrap lazy components with Suspense
const LazyComponent = (Component: React.ComponentType): React.ReactNode => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

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
        path: "dashboard",
        element: LazyComponent(ConsolidatedDashboard),
      },
      {
        path: "settings",
        element: LazyComponent(Settings),
      },
      {
        path: "portfolio",
        element: LazyComponent(Portfolio),
      },
      {
        path: "market-analysis",
        element: LazyComponent(MarketAnalysis),
      },
      {
        path: "tokens",
        element: LazyComponent(TokensPage),
      },
      {
        path: "auto-trading",
        element: LazyComponent(AutoTrading),
      },
      {
        path: "wallet-tracking",
        element: LazyComponent(WalletTracking),
      },
      {
        path: "wallet-tracking/analytics",
        element: LazyComponent(WalletTrackingAnalytics),
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
