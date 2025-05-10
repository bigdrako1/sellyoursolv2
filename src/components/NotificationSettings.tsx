
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  BellRing, 
  Smartphone, 
  Mail, 
  Save, 
  Webhook 
} from "lucide-react";
import { toast } from "sonner";

const NotificationSettings = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [alertVolume, setAlertVolume] = useState(50);
  const [notificationFrequency, setNotificationFrequency] = useState(2); // 1=Low, 2=Medium, 3=High
  const [emailAddress, setEmailAddress] = useState("");
  const [telegramHandle, setTelegramHandle] = useState("");
  
  const handleSaveSettings = () => {
    toast.success("Notification settings saved", {
      description: "Your notification preferences have been updated"
    });
  };

  const getFrequencyLabel = () => {
    switch (notificationFrequency) {
      case 1: return "Low (important alerts only)";
      case 2: return "Medium (balanced)";
      case 3: return "High (all alerts)";
      default: return "Medium";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="card-with-border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BellRing className="mr-2 h-5 w-5 text-yellow-400" />
            Alert Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <Label htmlFor="emailToggle">Email Notifications</Label>
                </div>
                <Switch
                  id="emailToggle"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              {emailNotifications && (
                <div className="pl-6 mt-2">
                  <Input
                    placeholder="Email address for notifications"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="bg-black/30 border-gray-700"
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-green-400" />
                  <Label htmlFor="pushToggle">Push Notifications</Label>
                </div>
                <Switch
                  id="pushToggle"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Webhook className="h-4 w-4 text-purple-400" />
                  <Label htmlFor="telegramToggle">Telegram Notifications</Label>
                </div>
                <Switch
                  id="telegramToggle"
                  checked={telegramHandle !== ""}
                />
              </div>
              
              {telegramHandle !== "" || true && (
                <div className="pl-6 mt-2">
                  <Input
                    placeholder="Telegram handle (e.g. @username)"
                    value={telegramHandle}
                    onChange={(e) => setTelegramHandle(e.target.value)}
                    className="bg-black/30 border-gray-700"
                  />
                </div>
              )}
              
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-sm font-medium mb-3">Notification Frequency</h3>
                <div className="mt-2">
                  <Slider 
                    value={[notificationFrequency]} 
                    min={1} 
                    max={3} 
                    step={1} 
                    onValueChange={(value) => setNotificationFrequency(value[0])}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                  <p className="text-sm mt-1 text-gray-300">
                    Current: <span className="font-medium">{getFrequencyLabel()}</span>
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-sm font-medium mb-3">Sound Settings</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="sound-volume">Alert Volume</Label>
                    <span className="text-sm">{alertVolume}%</span>
                  </div>
                  <Slider
                    id="sound-volume"
                    min={0}
                    max={100}
                    step={5}
                    value={[alertVolume]}
                    onValueChange={(value) => setAlertVolume(value[0])}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Silent</span>
                    <span>Max</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveSettings} className="flex items-center gap-2">
                  <Save size={16} />
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
