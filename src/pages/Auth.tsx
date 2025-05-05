
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, Key, Lock, AlertCircle, ExternalLink, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { APP_CONFIG } from "@/config/appDefinition";
import { formatWalletAddress } from "@/utils/solanaWalletUtils";

const Auth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const { toast } = useToast();
  const { 
    signIn, 
    isAuthenticated, 
    walletAddress, 
    walletProvider,
    walletsDetected, 
    installedWallets,
    loadableWallets,
    detectingWallets,
    refreshWalletsStatus
  } = useAuth();
  const navigate = useNavigate();
  
  // Try detecting wallets if none were found on first load
  useEffect(() => {
    if (!detectingWallets && !walletsDetected) {
      const recheckWallets = async () => {
        await refreshWalletsStatus();
      };
      
      // Wait a bit for extensions to initialize
      const timer = setTimeout(recheckWallets, 1500);
      return () => clearTimeout(timer);
    }
  }, [detectingWallets, walletsDetected, refreshWalletsStatus]);
  
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated, redirecting to home");
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // If wallet is connected but not authenticated, we should show a message
    if (walletAddress && !isAuthenticated) {
      toast({
        title: "Wallet Connected",
        description: "Please complete wallet authentication to access the platform",
      });
    }
  }, [walletAddress, isAuthenticated, toast]);
  
  const handleWalletConnect = async (walletName?: string) => {
    setIsConnecting(true);
    try {
      console.log("Initiating sign in process", walletName ? `with ${walletName}` : "");
      const result = await signIn(walletName);
      console.log("Sign in result:", result);
      
      toast({
        title: "Authentication Successful",
        description: "You're now logged in to the platform",
      });
      navigate('/');
    } catch (error) {
      console.error("Authentication failed:", error);
      // Error is handled in the signIn function
    } finally {
      setIsConnecting(false);
    }
  };

  const openWalletWebsite = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const renderWalletsList = () => {
    if (detectingWallets) {
      return (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 text-blue-400 animate-spin mr-2" />
          <span>Detecting wallets...</span>
        </div>
      );
    }

    if (installedWallets.length === 0) {
      return (
        <div className="space-y-4">
          <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-400 mb-1">No Solana Wallets Found</h4>
              <p className="text-sm text-gray-300">
                To continue, you need to install one of these Solana wallet extensions:
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-2">
            {loadableWallets.slice(0, 4).map((wallet) => (
              <Button
                key={wallet.name}
                variant="outline"
                className="flex justify-start items-center p-3 h-auto"
                onClick={() => openWalletWebsite(wallet.url)}
              >
                {wallet.icon && (
                  <img 
                    src={wallet.icon} 
                    alt={`${wallet.name} icon`} 
                    className="h-5 w-5 mr-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="flex flex-col items-start">
                  <span className="text-sm">{wallet.name}</span>
                  <span className="text-xs text-gray-400 flex items-center">
                    Install <Download className="h-3 w-3 ml-1" />
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-400 mb-2">Select a wallet to connect:</p>
        <div className="grid grid-cols-2 gap-2">
          {installedWallets.map((wallet) => (
            <Button
              key={wallet.name}
              variant={walletProvider === wallet.name ? "default" : "outline"}
              className={`flex justify-start items-center p-3 h-auto ${walletProvider === wallet.name ? 'bg-trading-highlight text-white' : ''}`}
              onClick={() => handleWalletConnect(wallet.name)}
              disabled={isConnecting}
            >
              {wallet.icon && (
                <img 
                  src={wallet.icon} 
                  alt={`${wallet.name} icon`} 
                  className="h-5 w-5 mr-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <span className="text-sm">{wallet.name}</span>
              {walletProvider === wallet.name && (
                <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                  Connected
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-trading-dark">
      <div className="flex-grow flex justify-center items-center p-6">
        <Card className="w-full max-w-md bg-trading-darkAccent border-trading-highlight/20">
          <CardHeader className="text-center">
            <div className="w-full flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-trading-highlight/20 flex items-center justify-center">
                <Lock className="h-8 w-8 text-trading-highlight" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold trading-gradient-text">{APP_CONFIG.name}</CardTitle>
            <CardDescription className="text-gray-400">
              {walletAddress ? "Complete authentication to access the platform" : "Connect your Solana wallet to access the platform"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="mb-6">          
              {walletAddress ? (
                <div className="bg-trading-dark/40 p-4 rounded-md mb-4">
                  <div className="text-sm text-gray-400 mb-1">Connected Wallet</div>
                  <div className="font-mono text-trading-highlight flex items-center">
                    <Wallet className="h-4 w-4 mr-2" />
                    {formatWalletAddress(walletAddress, 6)}
                    {walletProvider && (
                      <span className="ml-2 text-xs bg-trading-highlight/20 text-trading-highlight px-1.5 py-0.5 rounded">
                        {walletProvider}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Sign a secure message to complete authentication
                  </p>
                </div>
              ) : (
                renderWalletsList()
              )}
              
              {walletAddress && !isAuthenticated && (
                <Button
                  onClick={() => handleWalletConnect()}
                  className="w-full trading-button mt-4"
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                      Signing Message...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Sign Message to Authenticate
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {/* Added security explanation */}
            {walletAddress && !isAuthenticated && (
              <div className="bg-trading-highlight/10 border border-trading-highlight/20 rounded-md p-3 text-sm">
                <h4 className="font-medium text-trading-highlight mb-1">Secure Authentication</h4>
                <p className="text-gray-300 text-xs">
                  We use wallet signatures for secure, passwordless authentication. This doesn't 
                  grant any transaction permissions — we only verify you own this wallet.
                </p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2 pt-0">
            <p className="text-xs text-center text-gray-400 mt-4">
              By connecting your wallet, you agree to {APP_CONFIG.name}'s Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
