
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Wallet } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const { signIn, walletAddress, walletsDetected, installedWallets, detectingWallets, refreshWalletsStatus } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async (walletName?: string) => {
    setLoading(true);

    try {
      await signIn(walletName);
      toast("Login successful", {
        description: "Welcome back!",
      });
      navigate('/');
    } catch (error) {
      toast.error("Authentication failed", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshWallets = async () => {
    await refreshWalletsStatus();
    toast("Wallet Detection Refreshed", {
      description: `${installedWallets.length} compatible wallets found`,
    });
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Connect Wallet
          </CardTitle>
          <CardDescription className="text-center">
            Connect your Solana wallet to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {detectingWallets ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
              <p>Detecting wallets...</p>
            </div>
          ) : installedWallets.length > 0 ? (
            <div className="grid gap-3">
              {installedWallets.map((wallet) => (
                <Button 
                  key={wallet.name}
                  onClick={() => handleAuth(wallet.name)}
                  disabled={loading}
                  className="flex items-center justify-center gap-2"
                  variant="default"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                  Connect with {wallet.name}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 space-y-4">
              <p className="text-center text-amber-500">No Solana wallets detected</p>
              <Button 
                onClick={handleRefreshWallets}
                variant="outline"
                className="gap-2"
              >
                <Loader2 className="h-4 w-4" />
                Refresh Wallet Detection
              </Button>
              <p className="text-xs text-gray-500 text-center max-w-xs mt-4">
                To use this application, you need to install a Solana wallet extension 
                like Phantom or Solflare in your browser.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
