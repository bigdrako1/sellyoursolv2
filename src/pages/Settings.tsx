import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Volume2, 
  Shield, 
  Monitor, 
  Laptop, 
  AlertCircle, 
  Undo2,
  Save,
  CheckCircle2,
  UserRound,
  Key,
  Lock
} from "lucide-react";

const Settings = () => {
  const [walletAddress, setWalletAddress] = useState("DWTA6...h9Ro");
  const [systemActive, setSystemActive] = useState(true);
  const [systemLatency, setSystemLatency] = useState(25);
  
  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [riskLevel, setRiskLevel] = useState([50]);
  const [apiKey, setApiKey] = useState("••••••••••••••••");
  const [secret, setSecret] = useState("••••••••••••••••••••••••••");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  const { toast } = useToast();
  
  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };
  
  const handleResetSettings = () => {
    setNotificationsEnabled(true);
    setSoundEnabled(true);
    setAutoTradeEnabled(false);
    setDarkMode(true);
    setRiskLevel([50]);
    
    toast({
      title: "Settings reset",
      description: "All settings have been restored to defaults.",
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-trading-dark text-white">
      <Header walletAddress={walletAddress} />
      
      <main className="flex-grow container mx-auto px-4 pb-10">
        <div className="py-6">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          
          <Tabs defaultValue="preferences" className="w-full">
            <TabsList className="bg-trading-darkAccent mb-6">
              <TabsTrigger value="preferences" className="data-[state=active]:bg-trading-highlight/20">
                Preferences
              </TabsTrigger>
              <TabsTrigger value="account" className="data-[state=active]:bg-trading-highlight/20">
                Account
              </TabsTrigger>
              <TabsTrigger value="api" className="data-[state=active]:bg-trading-highlight/20">
                API Keys
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-trading-highlight/20">
                Security
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="preferences">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-trading-darkAccent border-trading-highlight/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-trading-highlight" />
                      Notifications
                    </CardTitle>
                    <CardDescription>
                      Configure how you want to be notified about trading activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notifications">Enable notifications</Label>
                      <Switch 
                        id="notifications" 
                        checked={notificationsEnabled} 
                        onCheckedChange={setNotificationsEnabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sound">Sound alerts</Label>
                      <Switch 
                        id="sound" 
                        checked={soundEnabled} 
                        onCheckedChange={setSoundEnabled}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-trading-darkAccent border-trading-highlight/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-trading-highlight" />
                      Display
                    </CardTitle>
                    <CardDescription>
                      Customize how the application looks and feels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dark-mode">Dark mode</Label>
                      <Switch 
                        id="dark-mode" 
                        checked={darkMode} 
                        onCheckedChange={setDarkMode}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-trading-darkAccent border-trading-highlight/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-trading-highlight" />
                      Trading Risk
                    </CardTitle>
                    <CardDescription>
                      Configure your risk tolerance for automated trading
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-trade">Auto-trading</Label>
                      <Switch 
                        id="auto-trade" 
                        checked={autoTradeEnabled} 
                        onCheckedChange={setAutoTradeEnabled}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="risk-level">Risk level</Label>
                        <span className="text-sm">{riskLevel}%</span>
                      </div>
                      <Slider 
                        id="risk-level" 
                        value={riskLevel} 
                        onValueChange={setRiskLevel}
                        disabled={!autoTradeEnabled}
                        className="[&>.SliderTrack]:bg-trading-highlight/20 [&>.SliderRange]:bg-trading-highlight" 
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Conservative</span>
                        <span>Aggressive</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-trading-darkAccent border-trading-highlight/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Laptop className="h-5 w-5 text-trading-highlight" />
                      System
                    </CardTitle>
                    <CardDescription>
                      Platform performance and system settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="system-active">System active</Label>
                      <Switch 
                        id="system-active" 
                        checked={systemActive} 
                        onCheckedChange={setSystemActive}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="latency">Target latency (ms)</Label>
                        <span className="text-sm">{systemLatency} ms</span>
                      </div>
                      <Input 
                        id="latency" 
                        type="number" 
                        value={systemLatency}
                        onChange={(e) => setSystemLatency(Number(e.target.value))}
                        className="bg-trading-dark border-trading-highlight/30"
                        min={10}
                        max={500}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="account">
              <Card className="bg-trading-darkAccent border-trading-highlight/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserRound className="h-5 w-5 text-trading-highlight" />
                    Account Information
                  </CardTitle>
                  <CardDescription>
                    Update your account details and wallet information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      value="Trader42"
                      className="bg-trading-dark border-trading-highlight/30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value="trader@example.com"
                      className="bg-trading-dark border-trading-highlight/30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="walletAddress">Wallet address</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="walletAddress" 
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="bg-trading-dark border-trading-highlight/30"
                      />
                      <Button variant="outline" className="shrink-0">
                        Connect
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">Connected wallet for trading operations</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="api">
              <Card className="bg-trading-darkAccent border-trading-highlight/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-trading-highlight" />
                    API Configuration
                  </CardTitle>
                  <CardDescription>
                    Manage your API keys for connected exchanges
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input 
                      id="apiKey" 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="bg-trading-dark border-trading-highlight/30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="apiSecret">API Secret</Label>
                    <Input 
                      id="apiSecret" 
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      type="password"
                      className="bg-trading-dark border-trading-highlight/30"
                    />
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <Label>Connected exchanges</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <div className="px-3 py-1 rounded-full bg-trading-highlight/20 border border-trading-highlight/30 text-sm">
                        Binance
                      </div>
                      <div className="px-3 py-1 rounded-full bg-trading-highlight/20 border border-trading-highlight/30 text-sm">
                        Solana DEX
                      </div>
                      <div className="px-3 py-1 rounded-full bg-gray-700 border border-gray-600 text-sm text-gray-400">
                        FTX (Disconnected)
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card className="bg-trading-darkAccent border-trading-highlight/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-trading-highlight" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account security and verification methods
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="2fa" className="block">Two-factor authentication</Label>
                      <p className="text-sm text-gray-400">Add an additional layer of security</p>
                    </div>
                    <Switch 
                      id="2fa" 
                      checked={twoFactorEnabled} 
                      onCheckedChange={setTwoFactorEnabled}
                    />
                  </div>
                  
                  <Separator className="bg-trading-highlight/20 my-4" />
                  
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current password</Label>
                    <Input 
                      id="current-password" 
                      type="password"
                      className="bg-trading-dark border-trading-highlight/30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New password</Label>
                    <Input 
                      id="new-password" 
                      type="password"
                      className="bg-trading-dark border-trading-highlight/30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm new password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password"
                      className="bg-trading-dark border-trading-highlight/30"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="default" className="bg-trading-highlight hover:bg-trading-highlight/80">
                    Change password
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-4 mt-6">
            <Button 
              variant="outline" 
              className="border-trading-highlight/30 hover:bg-trading-highlight/10" 
              onClick={handleResetSettings}
            >
              <Undo2 className="w-4 h-4 mr-2" /> Reset to defaults
            </Button>
            
            <Button 
              onClick={handleSaveSettings}
              className="bg-trading-highlight hover:bg-trading-highlight/80"
            >
              <Save className="w-4 h-4 mr-2" /> Save settings
            </Button>
          </div>
        </div>
      </main>
      
      <Footer systemActive={systemActive} systemLatency={systemLatency} />
    </div>
  );
};

export default Settings;
