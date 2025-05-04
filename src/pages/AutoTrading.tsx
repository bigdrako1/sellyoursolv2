
import React from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TradingTab from "@/components/TradingTab";

const AutoTrading = () => {
  const [systemActive, setSystemActive] = React.useState(true);
  const [systemLatency, setSystemLatency] = React.useState(25);
  
  return (
    <div className="min-h-screen flex flex-col bg-trading-dark text-white">
      <Header walletAddress="" />
      
      <main className="flex-grow container mx-auto px-4 pb-10">
        <div className="py-6">
          <h1 className="text-3xl font-bold mb-6">Auto Trading</h1>
          <TradingTab />
        </div>
      </main>
      
      <Footer systemActive={systemActive} systemLatency={systemLatency} />
    </div>
  );
};

export default AutoTrading;
