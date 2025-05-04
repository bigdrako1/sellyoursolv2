
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Portfolio from "./pages/Portfolio";
import MarketAnalysis from "./pages/MarketAnalysis";
import Settings from "./pages/Settings";
import AutoTrading from "./pages/AutoTrading";
import Auth from "./pages/Auth";

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

// Protected route wrapper component based on wallet authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Check if user is authenticated using our localStorage-based auth system
  const isAuthenticated = localStorage.getItem('user') !== null;
  
  if (!isAuthenticated) {
    // Redirect to auth page if not authenticated
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <TooltipProvider>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/market-analysis" element={
                  <ProtectedRoute>
                    <MarketAnalysis />
                  </ProtectedRoute>
                } />
                <Route path="/auto-trading" element={
                  <ProtectedRoute>
                    <AutoTrading />
                  </ProtectedRoute>
                } />
                <Route path="/portfolio" element={
                  <ProtectedRoute>
                    <Portfolio />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/auth" element={<Auth />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </TooltipProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
