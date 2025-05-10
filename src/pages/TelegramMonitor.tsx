
import React from "react";
import TelegramMonitor from "@/components/TelegramMonitor";
import TelegramChannelMonitor from "@/components/TelegramChannelMonitor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TelegramAuthentication from "@/components/TelegramAuthentication";

const TelegramMonitorPage = () => {
  return (
    <div className="container mx-auto py-6">
      <h2 className="text-3xl font-bold mb-6">Telegram Monitoring</h2>
      
      <Tabs defaultValue="main" className="space-y-6">
        <TabsList>
          <TabsTrigger value="main">Main Monitor</TabsTrigger>
          <TabsTrigger value="channels">Channel Monitor</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
        </TabsList>
        
        <TabsContent value="main">
          <TelegramMonitor />
        </TabsContent>
        
        <TabsContent value="channels">
          <TelegramChannelMonitor />
        </TabsContent>
        
        <TabsContent value="auth">
          <div className="max-w-md mx-auto">
            <TelegramAuthentication />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TelegramMonitorPage;
