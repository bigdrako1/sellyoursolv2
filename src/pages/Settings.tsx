
import React, { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ApiKeyDescription from "@/components/ApiKeyDescription";
import ApiUsageMonitor from "@/components/ApiUsageMonitor";
import { HeliusApiConfig } from "@/components/api";
import ConnectedServices from "@/components/ConnectedServices";
import WebhookMonitor from "@/components/WebhookMonitor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import DebugPanel from "@/components/DebugPanel";
import NotificationSettings from "@/components/NotificationSettings";
import AdvancedSettings from "@/components/AdvancedSettings";
import { useSettingsStore } from "@/store/settingsStore";
import { useOutletContext } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import SystemControls from "@/components/SystemControls";

// Define the type for the outlet context
interface LayoutContext {
  systemActive: boolean;
  toggleSystemActive: () => void;
  isSettingsPage: boolean;
}

const Settings = () => {
  const { user } = useAuth();
  const { systemActive, toggleSystemActive } = useOutletContext<LayoutContext>();

  // Get settings from our store
  const {
    uiState,
    setActiveSettingsTab,
  } = useSettingsStore((state) => ({
    uiState: state.uiState,
    setActiveSettingsTab: state.setActiveSettingsTab,
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
    if (hash && ["general", "apis", "notifications", "advanced", "diagnostics"].includes(hash)) {
      setActiveSettingsTab(hash);
    }
  }, [setActiveSettingsTab]);

  const handleTabChange = (value: string) => {
    setActiveSettingsTab(value);
    window.location.hash = value;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <h2 className="text-3xl font-bold">Settings</h2>

        {/* System Active/Pause Toggle Button */}
        <div className="mt-4 md:mt-0">
          <Button
            onClick={toggleSystemActive}
            variant="outline"
            size="lg"
            className={`gap-2 transition-all duration-300 ${
              systemActive
                ? "bg-trading-success/20 text-trading-success hover:bg-trading-success/30 border-trading-success/30"
                : "bg-trading-danger/20 text-trading-danger hover:bg-trading-danger/30 border-trading-danger/30"
            }`}
          >
            {systemActive ? (
              <>
                <div className="w-2 h-2 rounded-full bg-trading-success animate-pulse"></div>
                System Active
              </>
            ) : (
              <>
                <AlertTriangle size={16} />
                System Paused
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={uiState.activeSettingsTab} onValueChange={handleTabChange} className="mb-8">
        <TabsList className="w-full mb-6 flex flex-wrap gap-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="apis">API Keys</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <SystemControls
            systemActive={systemActive}
            toggleSystemActive={toggleSystemActive}
            showFullControls={true}
          />
          <ConnectedServices servicesStatus={servicesStatus} />
        </TabsContent>

        <TabsContent value="apis" className="space-y-6">
          <ApiKeyDescription />
          <HeliusApiConfig showConnectionStatus={true} />
          <ApiUsageMonitor />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
          <WebhookMonitor />
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
