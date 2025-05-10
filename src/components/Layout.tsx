
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SystemControls from "@/components/SystemControls";
import { useSettingsStore } from "@/store/settingsStore";

const Layout = () => {
  const systemActive = useSettingsStore((state) => state.systemState.systemActive);
  const toggleSystemActive = useSettingsStore((state) => state.toggleSystemActive);
  
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
      <Footer />
    </div>
  );
};

export default Layout;
