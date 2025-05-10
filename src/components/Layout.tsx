
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SystemControls from "@/components/SystemControls";
import { useSettingsStore } from "@/store/settingsStore";

const Layout = () => {
  const systemActive = useSettingsStore((state) => state.systemSettings.systemActive);
  const setSystemActive = useSettingsStore((state) => state.setSystemActive);
  
  const toggleSystemActive = () => setSystemActive(!systemActive);
  
  // Track system latency state
  const [systemLatency, setSystemLatency] = React.useState<number | null>(null);
  
  // Simulate latency updates
  React.useEffect(() => {
    if (systemActive) {
      const interval = setInterval(() => {
        // Simulate random latency between 20-120ms
        setSystemLatency(Math.floor(Math.random() * 100) + 20);
      }, 5000);
      
      return () => clearInterval(interval);
    } else {
      setSystemLatency(null);
    }
  }, [systemActive]);
  
  return (
    <div className="min-h-screen flex flex-col bg-trading-dark text-white">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <SystemControls 
          systemActive={systemActive} 
          toggleSystemActive={toggleSystemActive} 
        />
        <div className="mt-4">
          <Outlet />
        </div>
      </main>
      <Footer systemActive={systemActive} systemLatency={systemLatency} />
    </div>
  );
};

export default Layout;
