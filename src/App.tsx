
import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const MarketAnalysis = lazy(() => import("./pages/MarketAnalysis"));
const Settings = lazy(() => import("./pages/Settings"));
const AutoTrading = lazy(() => import("./pages/AutoTrading"));
const Auth = lazy(() => import("./pages/Auth"));
const Backtesting = lazy(() => import("./pages/Backtesting"));
const RiskManagement = lazy(() => import("./pages/RiskManagement"));
const StrategyMonitoring = lazy(() => import("./pages/StrategyMonitoring"));
const SmartMoneyTracking = lazy(() => import("./pages/SmartMoneyTracking"));

// Create a new QueryClient instance with production-ready settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      gcTime: 300000, // 5 minutes
    },
  },
});

// Import session utilities and spinner
import { isSessionValid } from '@/utils/sessionUtils';
import { PageSpinner } from "@/components/ui/spinner";

// Protected route wrapper component based on wallet authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Check if user is authenticated using our session management system
  const isAuthenticated = isSessionValid();

  if (!isAuthenticated) {
    // Redirect to auth page if not authenticated
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => (
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <TooltipProvider>
              <AuthProvider>
                <Toaster />
                <Sonner />
                <Suspense fallback={<PageSpinner />}>
                  <Routes>
                    <Route path="/" element={
                      <ErrorBoundary>
                        <Index />
                      </ErrorBoundary>
                    } />
                    <Route path="/market-analysis" element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <MarketAnalysis />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } />
                    <Route path="/auto-trading" element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <AutoTrading />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } />
                    <Route path="/portfolio" element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <Portfolio />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <Settings />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } />
                    <Route path="/backtesting" element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <Backtesting />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } />
                    <Route path="/risk-management" element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <RiskManagement />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } />
                    <Route path="/strategy-monitoring" element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <StrategyMonitoring />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } />
                    <Route path="/smart-money-tracking" element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <SmartMoneyTracking />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } />
                    <Route path="/auth" element={
                      <ErrorBoundary>
                        <Auth />
                      </ErrorBoundary>
                    } />
                    <Route path="*" element={
                      <ErrorBoundary>
                        <NotFound />
                      </ErrorBoundary>
                    } />
                  </Routes>
                </Suspense>
              </AuthProvider>
            </TooltipProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

export default App;
