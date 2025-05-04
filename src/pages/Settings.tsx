import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCurrencyStore } from "@/store/currencyStore";
import { 
  Bell, 
  Volume2, 
  Shield, 
  Monitor, 
  Laptop, 
  AlertCircle, 
  Undo2,
  Save,
  UserRound,
  Key,
  Lock,
  CircleDollarSign,
  Loader2
} from "lucide-react";
import { getConnectedWallet, connectWallet, disconnectWallet } from "@/utils/walletUtils";
import { useAuth } from "@/contexts/AuthContext";
import { getUserSettings, updateUserSettings } from "@/services/settingsService";
import { UserSettings } from "@/types/database.types";

const Settings = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [systemActive, setSystemActive] = useState(true);
  const [systemLatency, setSystemLatency] = useState(25);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [riskLevel, setRiskLevel] = useState([50]);
  const [apiKey, setApiKey] = useState("");
  const [heliusApiKey, setHeliusApiKey] = useState("a18d2c93-d9fa-4db2-8419-707a4f1782f7");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [tfaCode, setTfaCode] = useState("");
  const [tfaVerifying, setTfaVerifying] = useState(false);
  
  const { toast } = useToast();
  const { currency, setCurrency } = useCurrencyStore();
  const { user, isAuthenticated } = useAuth();
  
  // Load settings from Supabase
  useEffect(() => {
    const loadSettings = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const settings = await getUserSettings(user.id);
          if (settings) {
            setNotificationsEnabled(settings.notifications_enabled);
            setSoundEnabled(settings.sound_enabled);
            setAutoTradeEnabled(settings.auto_trade_enabled);
            setDarkMode(settings.dark_mode);
            setRiskLevel([settings.risk_level]);
            setCurrency(settings.currency);
            setSystemActive(settings.system_active);
            setSystemLatency(settings.system_latency);
            setApiKey(settings.api_key || "");
            setHeliusApiKey(settings.helius_api_key || "a18d2c93-d9fa-4db2-8419-707a4f1782f7");
          }
        } catch (error) {
          console.error("Error loading settings:", error);
          toast({
            title: "Failed to load settings",
            description: "Your settings could not be loaded. Using defaults.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadSettings();
    
    // Check for connected wallet on mount
    const savedWallet = getConnectedWallet();
    if (savedWallet) {
      setWalletAddress(savedWallet);
    }
  }, [user, setCurrency, toast]);
  
  const handleSaveSettings = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const updatedSettings = {
        notifications_enabled: notificationsEnabled,
        sound_enabled: soundEnabled,
        auto_trade_enabled: autoTradeEnabled,
        dark_mode: darkMode,
        risk_level: riskLevel[0],
        currency,
        system_active: systemActive,
        system_latency: systemLatency,
        api_key: apiKey,
        helius_api_key: heliusApiKey
      };
      
      await updateUserSettings(updatedSettings, user.id);
      
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Failed to save settings",
        description: "Your settings could not be saved. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleResetSettings = () => {
    setNotificationsEnabled(true);
    setSoundEnabled(true);
    setAutoTradeEnabled(false);
    setDarkMode(true);
    setRiskLevel([50]);
    setCurrency("USD");
    
    toast({
      title: "Settings reset",
      description: "All settings have been restored to defaults.",
    });
  };

  const handleConnectWallet = async () => {
    setConnecting(true);
    try {
      const result = await connectWallet("Phantom");
      if (result.success) {
        setWalletAddress(result.address);
        toast({
          title: "Wallet Connected",
          description: "Successfully connected wallet: " + result.address,
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectWallet = async () => {
    setDisconnecting(true);
    try {
      await disconnectWallet();
      setWalletAddress(null);
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been successfully disconnected.",
      });
    } catch (error) {
      toast({
        title: "Disconnection Failed", 
        description: "Failed to disconnect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSetup2FA = () => {
    if (!twoFactorEnabled) {
      toast({
        title: "2FA Setup Initiated",
        description: "Scan the QR code with your authenticator app to set up 2FA.",
      });
    } else {
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled.",
      });
    }
    setTwoFactorEnabled(!twoFactorEnabled);
  };

  const handleVerify2FA = () => {
    setTfaVerifying(true);
    setTimeout(() => {
      if (tfaCode.length === 6) {
        toast({
          title: "2FA Verified",
          description: "Two-factor authentication has been successfully set up.",
        });
        setTwoFactorEnabled(true);
      } else {
        toast({
          title: "Verification Failed",
          description: "Invalid authentication code. Please try again.",
          variant: "destructive",
        });
      }
      setTfaVerifying(false);
      setTfaCode("");
    }, 1000);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-trading-dark text-white">
        <Header walletAddress={walletAddress || ""} />
        <main className="flex-grow container mx-auto px-4 pb-10 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-trading-highlight" />
            <p className="mt-4 text-gray-400">Loading settings...</p>
          </div>
        </main>
        <Footer systemActive={systemActive} systemLatency={systemLatency} />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-trading-dark text-white">
      <Header walletAddress={walletAddress || ""} />
      
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

                    <div className="space-y-2">
                      <Label htmlFor="currency">Display Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="bg-trading-dark border-trading-highlight/30">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent className="bg-trading-dark border-trading-highlight/30">
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="JPY">JPY (¥)</SelectItem>
                          <SelectItem value="KES">KES (KSh)</SelectItem>
                        </SelectContent>
                      </Select>
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
                        value={walletAddress || ""}
                        readOnly
                        className="bg-trading-dark border-trading-highlight/30"
                      />
                      {walletAddress ? (
                        <Button 
                          variant="outline" 
                          className="shrink-0 border-trading-danger/30 text-trading-danger hover:bg-trading-danger/10"
                          onClick={handleDisconnectWallet}
                          disabled={disconnecting}
                        >
                          {disconnecting ? "Disconnecting..." : "Disconnect"}
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="shrink-0 bg-trading-highlight text-white hover:bg-trading-highlight/80"
                          onClick={handleConnectWallet}
                          disabled={connecting}
                        >
                          {connecting ? "Connecting..." : "Connect"}
                        </Button>
                      )}
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
                    Manage your API keys for trading operations and integrations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="heliusApiKey">Helius API Key</Label>
                    <Input 
                      id="heliusApiKey" 
                      value={heliusApiKey}
                      onChange={(e) => setHeliusApiKey(e.target.value)}
                      className="bg-trading-dark border-trading-highlight/30"
                    />
                    <p className="text-xs text-gray-400">Used for Solana blockchain interactions and on-chain data</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Personal API Key</Label>
                    <Input 
                      id="apiKey" 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Generate your personal API key"
                      className="bg-trading-dark border-trading-highlight/30"
                    />
                    <p className="text-xs text-gray-400">Used for authenticating with your account when using external integrations</p>
                    <div className="flex justify-end mt-2">
                      <Button 
                        onClick={() => {
                          setApiKey(`syl_${Math.random().toString(36).substring(2, 15)}`);
                          toast({
                            title: "API Key Generated",
                            description: "Your new API key has been generated. Keep it secure!",
                          });
                        }}
                        className="bg-trading-highlight hover:bg-trading-highlight/80"
                        size="sm"
                      >
                        Generate Key
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <Label>Connected services</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-sm text-blue-300 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        Solana RPC
                      </div>
                      <div className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-sm text-purple-300 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                        Helius API
                      </div>
                      <div className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-sm text-orange-300 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                        Webhooks
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
                    <Button
                      onClick={handleSetup2FA}
                      variant={twoFactorEnabled ? "destructive" : "outline"}
                      className={twoFactorEnabled ? "" : "bg-trading-highlight hover:bg-trading-highlight/80 text-white"}
                    >
                      {twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
                    </Button>
                  </div>
                  
                  {twoFactorEnabled && (
                    <div className="mt-4 p-4 bg-black/30 rounded-lg border border-trading-highlight/20">
                      <div className="text-center mb-4">
                        <div className="bg-white p-4 rounded-lg inline-block mb-2">
                          {/* This would be a QR code in a real app */}
                          <div className="w-32 h-32 bg-black relative overflow-hidden">
                            <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
                              {Array.from({ length: 25 }).map((_, i) => (
                                <div 
                                  key={i} 
                                  className={`${Math.random() > 0.5 ? 'bg-white' : 'bg-black'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300">Scan this QR code with your authenticator app</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tfa-code">Enter verification code</Label>
                        <div className="flex gap-2">
                          <Input
                            id="tfa-code"
                            value={tfaCode}
                            onChange={(e) => setTfaCode(e.target.value)}
                            placeholder="000000"
                            maxLength={6}
                            className="bg-trading-dark border-trading-highlight/30"
                          />
                          <Button
                            onClick={handleVerify2FA}
                            disabled={tfaVerifying || tfaCode.length !== 6}
                            className="bg-trading-highlight hover:bg-trading-highlight/80"
                          >
                            {tfaVerifying ? "Verifying..." : "Verify"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
              disabled={isSaving}
            >
              <Undo2 className="w-4 h-4 mr-2" /> Reset to defaults
            </Button>
            
            <Button 
              onClick={handleSaveSettings}
              className="bg-trading-highlight hover:bg-trading-highlight/80"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save settings
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
      
      <Footer systemActive={systemActive} systemLatency={systemLatency} />
    </div>
  );
};

export default Settings;
