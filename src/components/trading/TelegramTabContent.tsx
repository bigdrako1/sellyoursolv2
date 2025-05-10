
import React from 'react';
import TelegramAuthentication from '@/components/TelegramAuthentication';
import TelegramChannelMonitor from '@/components/TelegramMonitor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from '@/components/ui/card';

const TelegramTabContent = () => {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <Tabs defaultValue="monitor" className="space-y-4">
          <TabsList>
            <TabsTrigger value="monitor">Channel Monitor</TabsTrigger>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monitor" className="space-y-4">
            <TelegramChannelMonitor />
          </TabsContent>
          
          <TabsContent value="auth">
            <TelegramAuthentication />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default TelegramTabContent;
