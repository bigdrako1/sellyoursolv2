
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PortfolioOverview from "@/components/PortfolioOverview";
import PortfolioAssets from "@/components/PortfolioAssets";
import PortfolioHistory from "@/components/PortfolioHistory";
import PortfolioPerformance from "@/components/PortfolioPerformance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getConnectedWallet, getWalletBalances } from "@/utils/walletUtils";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

const Portfolio = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [systemActive, setSystemActive] = useState(true);
  const [systemLatency, setSystemLatency] = useState(25);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [walletData, setWalletData] = useState<any>(null);
  
  useEffect(() => {
    // Check for connected wallet on mount
    const savedWallet = getConnectedWallet();
    if (savedWallet) {
      setWalletAddress(savedWallet);
      loadWalletData(savedWallet);
    } else {
      setIsLoading(false);
    }
  }, []);
  
  const loadWalletData = async (address: string) => {
    setIsLoading(true);
    try {
      const data = await getWalletBalances(address);
      setWalletData(data);
    } catch (error) {
      console.error("Failed to load wallet data", error);
      toast({
        title: "Data Error",
        description: "Could not load portfolio data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const connectWallet = () => {
    toast({
      title: "Wallet Connection",
      description: "Connect your wallet to view actual portfolio data",
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-trading-dark text-white">
      <Header walletAddress={walletAddress || ""} />
      
      <main className="flex-grow container mx-auto px-4 pb-10">
        <div className="py-6">
          <h1 className="text-3xl font-bold mb-6">Portfolio Overview</h1>
          
          {!walletAddress ? (
            <div className="bg-trading-darkAccent border border-white/10 rounded-lg p-6 text-center">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-trading-highlight" />
              <h2 className="text-xl font-medium mb-2">No Wallet Connected</h2>
              <p className="text-gray-400 mb-4">Please connect your wallet to view your portfolio data.</p>
              <Button 
                className="trading-button"
                onClick={connectWallet}
              >
                Connect Wallet
              </Button>
            </div>
          ) : (
            <>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="bg-white/5 rounded-lg h-40"></div>
                  <div className="bg-white/5 rounded-lg h-80"></div>
                </div>
              ) : (
                <>
                  <PortfolioOverview walletData={walletData} />
                  
                  <div className="mt-8">
                    <Tabs defaultValue="assets" className="w-full">
                      <TabsList className="bg-trading-darkAccent">
                        <TabsTrigger value="assets">Assets</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                      </TabsList>
                      
                      <div className="mt-6">
                        <TabsContent value="assets" className="mt-0">
                          <PortfolioAssets walletData={walletData} />
                        </TabsContent>
                        
                        <TabsContent value="performance" className="mt-0">
                          <PortfolioPerformance walletData={walletData} />
                        </TabsContent>
                        
                        <TabsContent value="history" className="mt-0">
                          <PortfolioHistory walletAddress={walletAddress} />
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
      
      <Footer systemActive={systemActive} systemLatency={systemLatency} />
    </div>
  );
};

export default Portfolio;
