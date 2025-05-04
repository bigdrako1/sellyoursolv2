
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PortfolioOverview from "@/components/PortfolioOverview";
import PortfolioAssets from "@/components/PortfolioAssets";
import PortfolioHistory from "@/components/PortfolioHistory";
import PortfolioPerformance from "@/components/PortfolioPerformance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const Portfolio = () => {
  const [walletAddress, setWalletAddress] = useState("DWTA6...h9Ro");
  const [systemActive, setSystemActive] = useState(true);
  const [systemLatency, setSystemLatency] = useState(25);
  const { toast } = useToast();
  
  const connectWallet = () => {
    toast({
      title: "Wallet connection",
      description: "Connect your wallet to view actual portfolio data",
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-trading-dark text-white">
      <Header walletAddress={walletAddress} />
      
      <main className="flex-grow container mx-auto px-4 pb-10">
        <div className="py-6">
          <h1 className="text-3xl font-bold mb-6">Portfolio Overview</h1>
          
          <PortfolioOverview />
          
          <div className="mt-8">
            <Tabs defaultValue="assets" className="w-full">
              <TabsList className="bg-trading-darkAccent">
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              <div className="mt-6">
                <TabsContent value="assets" className="mt-0">
                  <PortfolioAssets />
                </TabsContent>
                
                <TabsContent value="performance" className="mt-0">
                  <PortfolioPerformance />
                </TabsContent>
                
                <TabsContent value="history" className="mt-0">
                  <PortfolioHistory />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>
      
      <Footer systemActive={systemActive} systemLatency={systemLatency} />
    </div>
  );
};

export default Portfolio;
