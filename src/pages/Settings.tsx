
import React, { useEffect } from "react";
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
import DashboardTabContent from "@/components/DashboardTabContent";
import TradingTabContent from "@/components/TradingTabContent";
import WalletsTabContent from "@/components/WalletsTabContent";
import AnalyticsTabContent from "@/components/AnalyticsTabContent";
import { toast } from "sonner";
import { useSettingsStore } from "@/store/settingsStore";

const Settings = () => {
  const { user } = useAuth();
  
  // Get settings from our store
  const {
    uiState,
    systemSettings,
    setActiveSettingsTab,
    setSystemActive,
  } = useSettingsStore((state) => ({
    uiState: state.uiState,
    systemSettings: state.systemSettings,
    setActiveSettingsTab: state.setActiveSettingsTab,
    setSystemActive: state.setSystemActive,
  }));
  
  // Services status state
  const [servicesStatus, setServicesStatus] = React.useState({
    solanaRpc: true,
    heliusApi: false,
    webhooks: true,
  });

  useEffect(() => {
    // Check for URL hash to set active tab
    const hash = window.location.hash?.substring(1);
    if (hash && ["general", "apis", "detection", "notifications", "advanced", "diagnostics", "trading", "wallets", "analytics"].includes(hash)) {
      setActiveSettingsTab(hash);
    }
  }, [setActiveSettingsTab]);

  const handleTabChange = (value: string) => {
    setActiveSettingsTab(value);
    window.location.hash = value;
  };
  
  const toggleSystemActive = () => {
    const newStatus = !systemSettings.systemActive;
    setSystemActive(newStatus);
    toast(
      newStatus ? "System activated" : "System paused",
      {
        description: newStatus ? "All automated processes are now running" : "All automated processes have been paused",
        action: {
          label: "Undo",
          onClick: () => setSystemActive(!newStatus),
        },
      }
    );
  };

  // Render the system control content based on active tab
  const renderSystemControlContent = () => {
    switch (uiState.activeSystemControlTab) {
      case "dashboard":
        return <DashboardTabContent />;
      case "trading":
        return <TradingTabContent />;
      case "wallets":
        return <WalletsTabContent />;
      case "analytics":
        return <AnalyticsTabContent />;
      default:
        return <DashboardTabContent />;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-3xl font-bold mb-6">Settings</h2>

      <Tabs value={uiState.activeSettingsTab} onValueChange={handleTabChange} className="mb-8">
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
            systemActive={systemSettings.systemActive} 
            toggleSystemActive={toggleSystemActive} 
          />
          
          {renderSystemControlContent()}
          
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
          <TradingTabContent />
        </TabsContent>

        <TabsContent value="wallets" className="space-y-6">
          <WalletMonitor />
          <WalletsTabContent />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsTabContent />
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
