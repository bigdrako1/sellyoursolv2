
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WelcomeScreen from "@/components/WelcomeScreen";
import { useAuth } from "@/contexts/AuthContext";

const Index: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleWalletConnect = async (address: string) => {
    // This only sets the wallet address without authentication
    // Authentication is handled separately in the Auth page
  };

  const handleWalletDisconnect = () => {
    // Wallet disconnect is handled in AuthContext
  };

  return (
    <div>
      {!isAuthenticated && (
        <WelcomeScreen onConnect={handleWalletConnect} onDisconnect={handleWalletDisconnect} />
      )}
    </div>
  );
};

export default Index;
