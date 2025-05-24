
import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ApiKeyDescription from "@/components/ApiKeyDescription";
import ApiUsageMonitor from "@/components/ApiUsageMonitor";
import ConnectedServices from "@/components/ConnectedServices";
import WebhookMonitor from "@/components/WebhookMonitor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import DebugPanel from "@/components/DebugPanel";
import NotificationSettings from "@/components/NotificationSettings";
import AdvancedSettings from "@/components/AdvancedSettings";
import { useSettingsStore } from "@/store/settingsStore";
import { useOutletContext, useSearchParams, Link } from "react-router-dom";
import { AlertTriangle, Settings } from "lucide-react";
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
  const [searchParams] = useSearchParams();

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
    // Check for URL query parameter or hash to set active tab
    const tabParam = searchParams.get('tab');
    const hash = window.location.hash?.substring(1);

    // Query parameter takes precedence over hash
    if (tabParam && ["general", "apis", "notifications", "advanced", "diagnostics"].includes(tabParam)) {
      setActiveSettingsTab(tabParam);
    } else if (hash && ["general", "apis", "notifications", "advanced", "diagnostics"].includes(hash)) {
      setActiveSettingsTab(hash);
    }
  }, [setActiveSettingsTab, searchParams]);

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
          <Card className="bg-trading-darkAccent border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-400" />
                API Configuration
              </CardTitle>
              <CardDescription className="text-gray-400">
                API configuration has been moved to a dedicated page for better organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">Moved to Dedicated Page</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    All API configurations (Helius, BirdEye, Jupiter) are now managed in the dedicated API Configuration page.
                  </p>
                  <Link to="/api-config">
                    <Button className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/20 text-blue-400">
                      <Settings className="h-4 w-4 mr-2" />
                      Go to API Configuration
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
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
