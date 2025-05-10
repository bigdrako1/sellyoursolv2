
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Loader2 } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [walletOptions, setWalletOptions] = useState<{name: string, installed: boolean}[]>([]);
  const { signIn, isAuthenticated, installedWallets, refreshWalletsStatus, detectingWallets } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Detect available wallets
  useEffect(() => {
    refreshWalletsStatus();
  }, [refreshWalletsStatus]);

  // Update wallet options when installedWallets changes
  useEffect(() => {
    setWalletOptions(installedWallets.map(wallet => ({
      name: wallet.name,
      installed: wallet.installed
    })));
  }, [installedWallets]);

  const handleConnectWallet = async (walletName: string) => {
    setLoading(true);

    try {
      // Connect and authenticate in one step
      await signIn(walletName);
      toast({
        title: "Wallet Connected",
        description: "Successfully connected and authenticated with wallet",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Connect Your Wallet
          </CardTitle>
          <CardDescription className="text-center">
            Connect your Solana wallet to access the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {detectingWallets ? (
            <div className="flex flex-col items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-trading-highlight" />
              <p className="text-sm text-gray-400">Detecting available wallets...</p>
            </div>
          ) : walletOptions.length > 0 ? (
            <div className="grid gap-3">
              {walletOptions.map((wallet) => (
                <Button
                  key={wallet.name}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-12 trading-button"
                  onClick={() => handleConnectWallet(wallet.name)}
                  disabled={loading}
                >
                  <Wallet className="h-5 w-5" />
                  {loading ? 'Connecting...' : `Connect with ${wallet.name}`}
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 border border-dashed border-gray-700 rounded-lg">
              <Wallet className="h-8 w-8 mx-auto mb-2 text-gray-500" />
              <h3 className="font-medium mb-1">No Wallets Found</h3>
              <p className="text-sm text-gray-400 mb-4">
                Please install a Solana wallet extension to continue
              </p>
              <Button
                variant="outline"
                className="text-sm"
                onClick={() => window.open('https://solana.com/ecosystem/wallets', '_blank')}
              >
                Get a Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
