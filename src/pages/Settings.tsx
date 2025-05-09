
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import ApiKeyDescription from "@/components/ApiKeyDescription";
import SystemControls from "@/components/SystemControls";
import { Button } from "@/components/ui/button";
import ApiUsageMonitor from "@/components/ApiUsageMonitor";
import HeliusSetup from "@/components/HeliusSetup";
import ConnectedServices from "@/components/ConnectedServices";
import TokenDetectionBotControl from "@/components/TokenDetectionBotControl";
import SmartMoneyDetectionSystem from "@/components/SmartMoneyDetectionSystem";
import WebhookMonitor from "@/components/WebhookMonitor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

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
    if (hash && ["general", "apis", "detection", "notifications", "advanced"].includes(hash)) {
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
        <TabsList className="w-full mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="apis">API Keys</TabsTrigger>
          <TabsTrigger value="detection">Detection</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
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
          <TokenDetectionBotControl />
          <SmartMoneyDetectionSystem />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <WebhookMonitor />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Advanced Settings</h3>
            <p className="mb-4">
              Warning: Changing these settings can affect system performance.
            </p>
            <Button variant="destructive">Reset All Settings</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
