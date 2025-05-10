
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ApiKeyDescription from "@/components/ApiKeyDescription";
import SystemControls from "@/components/SystemControls";
import ApiUsageMonitor from "@/components/ApiUsageMonitor";
import HeliusSetup from "@/components/HeliusSetup";
import ConnectedServices from "@/components/ConnectedServices";
import TokenDetectionBotControl from "@/components/TokenDetectionBotControl";
import SmartMoneyDetectionSystem from "@/components/SmartMoneyDetectionSystem";
import WebhookMonitor from "@/components/WebhookMonitor";
import TwitterScraper from "@/components/TwitterScraper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import DebugPanel from "@/components/DebugPanel";
import NotificationSettings from "@/components/NotificationSettings";
import AdvancedSettings from "@/components/AdvancedSettings";
import WalletMonitor from "@/components/WalletMonitor";
import TradingStrategy from "@/components/TradingStrategy";
import TradingAnalyticsDashboard from "@/components/TradingAnalyticsDashboard";
import TrackingWallets from "@/components/TrackingWallets";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const { user } = useAuth();
  
  // Add state for system control props
  const [systemControlActiveTab, setSystemControlActiveTab] = useState("dashboard");
  const [systemActive, setSystemActive] = useState(true);
  
  // Add state for services status
  const [servicesStatus, setServicesStatus] = useState({
    solanaRpc: true,
    heliusApi: false,
    webhooks: true,
  });

  useEffect(() => {
    // Check for URL hash to set active tab
    const hash = window.location.hash?.substring(1);
    if (hash && ["general", "apis", "detection", "notifications", "advanced", "diagnostics", "trading", "wallets", "analytics"].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = value;
  };
  
  const toggleSystemActive = () => {
    setSystemActive(!systemActive);
  };

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-3xl font-bold mb-6">Settings</h2>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-8">
        <TabsList className="w-full mb-6 flex flex-wrap gap-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="apis">API Keys</TabsTrigger>
          <TabsTrigger value="detection">Detection</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <SystemControls 
            activeTab={systemControlActiveTab} 
            setActiveTab={setSystemControlActiveTab} 
            systemActive={systemActive} 
            toggleSystemActive={toggleSystemActive} 
          />
          <ConnectedServices servicesStatus={servicesStatus} />
        </TabsContent>

        <TabsContent value="apis" className="space-y-6">
          <ApiKeyDescription />
          <HeliusSetup />
          <ApiUsageMonitor />
        </TabsContent>

        <TabsContent value="detection" className="space-y-6">
          <TwitterScraper />
          <TokenDetectionBotControl />
          <SmartMoneyDetectionSystem />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
          <WebhookMonitor />
        </TabsContent>

        <TabsContent value="trading" className="space-y-6">
          <TradingStrategy />
        </TabsContent>

        <TabsContent value="wallets" className="space-y-6">
          <WalletMonitor />
          <TrackingWallets />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <TradingAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <AdvancedSettings />
        </TabsContent>
        
        <TabsContent value="diagnostics" className="space-y-6">
          <DebugPanel />
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Console Logging</h3>
            <p className="mb-4">
              Enable detailed console logging for troubleshooting.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => console.log("Test log - this will appear in the console")}>
                Test Console Log
              </Button>
              <Button onClick={() => console.error("Test error - this will appear in the console")}>
                Test Console Error
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
