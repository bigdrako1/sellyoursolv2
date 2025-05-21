
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SystemControls from "@/components/SystemControls";
import { useSettingsStore } from "@/store/settingsStore";

const Layout = () => {
  const systemActive = useSettingsStore((state) => state.systemSettings.systemActive);
  const setSystemActive = useSettingsStore((state) => state.setSystemActive);
  const location = useLocation();

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

  // Determine if we're on the settings page
  const isSettingsPage = location.pathname === "/settings";

  // Calculate footer height for padding (approximate values)
  const footerHeight = {
    mobile: 220, // Mobile footer is taller due to stacking
    desktop: 100  // Desktop footer is shorter
  };

  return (
    <div className="min-h-screen flex flex-col bg-trading-dark text-white">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 pb-[240px] md:pb-[120px]">
        <div className="max-w-full overflow-x-hidden">
          <Outlet context={{ systemActive, toggleSystemActive, isSettingsPage }} />
        </div>
      </main>
      <Footer systemActive={systemActive} systemLatency={systemLatency} />
    </div>
  );
};

export default Layout;
