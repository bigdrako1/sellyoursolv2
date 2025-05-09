
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Brain,
  Wallet,
  Zap,
  Radio,
  TrendingUp,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  ExternalLink,
} from "lucide-react";

interface SmartWallet {
  address: string;
  label: string;
  category: "whale" | "institutional" | "developer" | "influencer";
  trackingScore: number;
  lastActivity?: string;
}

interface PatternDetection {
  name: string;
  description: string;
  enabled: boolean;
  sensitivity: number;
}

const DEFAULT_SMART_WALLETS: SmartWallet[] = [
  {
    address: "B8oMRGgLETGQcksXBawvTDXvr5NLKX1jsBL2bAhXHyQT",
    label: "Known Whale 1",
    category: "whale",
    trackingScore: 95,
    lastActivity: "2 hours ago",
  },
  {
    address: "DWkZXkZKuqeM1aM991Kz6BVLuGgzWEyK9K4YqgJV6EEU",
    label: "Protocol Developer",
    category: "developer",
    trackingScore: 88,
    lastActivity: "1 day ago",
  },
  {
    address: "3QuXKBcmcdawDo5QHdYvYBzKxn4RzB8KzNuQwQH7PzYd",
    label: "Institutional Trader",
    category: "institutional",
    trackingScore: 92,
    lastActivity: "5 hours ago",
  },
];

const DEFAULT_PATTERNS: PatternDetection[] = [
  {
    name: "Accumulation Pattern",
    description: "Detects gradual accumulation of tokens over time",
    enabled: true,
    sensitivity: 70,
  },
  {
    name: "Whale Dump Prediction",
    description: "Analyzes patterns preceding large sell-offs",
    enabled: true,
    sensitivity: 60,
  },
  {
    name: "Smart Money Movement",
    description: "Tracks coordinated movements between related wallets",
    enabled: false,
    sensitivity: 80,
  },
  {
    name: "Dev Wallet Activity",
    description: "Monitors project developer wallet activity",
    enabled: true,
    sensitivity: 90,
  },
];

const SmartMoneyDetectionSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState("wallets");
  const [systemEnabled, setSystemEnabled] = useState(true);
  const [smartWallets, setSmartWallets] = useState<SmartWallet[]>(DEFAULT_SMART_WALLETS);
  const [patterns, setPatterns] = useState<PatternDetection[]>(DEFAULT_PATTERNS);
  
  // New wallet form state
  const [newWallet, setNewWallet] = useState({
    address: "",
    label: "",
    category: "whale" as SmartWallet["category"],
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedWallets = localStorage.getItem("smart_money_wallets");
    if (savedWallets) {
      setSmartWallets(JSON.parse(savedWallets));
    }

    const savedPatterns = localStorage.getItem("smart_money_patterns");
    if (savedPatterns) {
      setPatterns(JSON.parse(savedPatterns));
    }

    const systemState = localStorage.getItem("smart_money_system_enabled");
    if (systemState !== null) {
      setSystemEnabled(JSON.parse(systemState));
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem("smart_money_wallets", JSON.stringify(smartWallets));
    localStorage.setItem("smart_money_patterns", JSON.stringify(patterns));
    localStorage.setItem("smart_money_system_enabled", JSON.stringify(systemEnabled));

    toast("Smart Money Detection settings saved", {
      description: "Your detection preferences have been updated.",
    });
  };

  const handleAddWallet = () => {
    if (!newWallet.address || !newWallet.label) {
      toast.error("Please enter both wallet address and label");
      return;
    }

    if (newWallet.address.length < 32) {
      toast.error("Please enter a valid Solana wallet address");
      return;
    }

    const walletExists = smartWallets.some(
      (wallet) => wallet.address === newWallet.address
    );

    if (walletExists) {
      toast.error("This wallet is already being tracked");
      return;
    }

    const newSmartWallet: SmartWallet = {
      ...newWallet,
      trackingScore: Math.floor(Math.random() * 20) + 80, // Random score between 80-100
    };

    setSmartWallets([...smartWallets, newSmartWallet]);
    setNewWallet({ address: "", label: "", category: "whale" });

    toast("Wallet added to tracking", {
      description: "The wallet will now be monitored for smart money activity.",
    });
  };

  const handleRemoveWallet = (address: string) => {
    setSmartWallets(smartWallets.filter((wallet) => wallet.address !== address));
    toast("Wallet removed from tracking", {
      description: "The wallet will no longer be monitored.",
    });
  };

  const handleTogglePattern = (index: number) => {
    const updatedPatterns = [...patterns];
    updatedPatterns[index].enabled = !updatedPatterns[index].enabled;
    setPatterns(updatedPatterns);
  };

  const handlePatternSensitivity = (index: number, value: number) => {
    const updatedPatterns = [...patterns];
    updatedPatterns[index].sensitivity = value;
    setPatterns(updatedPatterns);
  };

  const getCategoryBadge = (category: SmartWallet["category"]) => {
    switch (category) {
      case "whale":
        return <Badge className="bg-blue-600">Whale</Badge>;
      case "institutional":
        return <Badge className="bg-purple-600">Institutional</Badge>;
      case "developer":
        return <Badge className="bg-green-600">Developer</Badge>;
      case "influencer":
        return <Badge className="bg-amber-600">Influencer</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card className="card-with-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-400" />
            Smart Money Detection System
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={systemEnabled ? "bg-green-600" : "bg-gray-600"}>
              {systemEnabled ? "Active" : "Inactive"}
            </Badge>
            <Switch
              checked={systemEnabled}
              onCheckedChange={(checked) => {
                setSystemEnabled(checked);
                toast(
                  checked
                    ? "Smart Money Detection activated"
                    : "Smart Money Detection deactivated"
                );
              }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="wallets">Smart Wallets</TabsTrigger>
              <TabsTrigger value="patterns">Pattern Detection</TabsTrigger>
              <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="wallets" className="space-y-4">
              <div className="bg-black/20 border border-white/10 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-medium">Add Smart Money Wallet</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Wallet Address"
                    value={newWallet.address}
                    onChange={(e) =>
                      setNewWallet({ ...newWallet, address: e.target.value })
                    }
                    className="bg-black/30 border-white/10"
                  />
                  <Input
                    placeholder="Label (e.g. Whale Trader)"
                    value={newWallet.label}
                    onChange={(e) =>
                      setNewWallet({ ...newWallet, label: e.target.value })
                    }
                    className="bg-black/30 border-white/10"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setNewWallet({ ...newWallet, category: "whale" })
                      }
                      className={`text-xs px-2 py-1 h-7 ${
                        newWallet.category === "whale"
                          ? "bg-blue-900/30 border-blue-500/50"
                          : "bg-black/20 border-white/10"
                      }`}
                    >
                      Whale
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setNewWallet({
                          ...newWallet,
                          category: "institutional",
                        })
                      }
                      className={`text-xs px-2 py-1 h-7 ${
                        newWallet.category === "institutional"
                          ? "bg-purple-900/30 border-purple-500/50"
                          : "bg-black/20 border-white/10"
                      }`}
                    >
                      Institutional
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setNewWallet({ ...newWallet, category: "developer" })
                      }
                      className={`text-xs px-2 py-1 h-7 ${
                        newWallet.category === "developer"
                          ? "bg-green-900/30 border-green-500/50"
                          : "bg-black/20 border-white/10"
                      }`}
                    >
                      Developer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setNewWallet({ ...newWallet, category: "influencer" })
                      }
                      className={`text-xs px-2 py-1 h-7 ${
                        newWallet.category === "influencer"
                          ? "bg-amber-900/30 border-amber-500/50"
                          : "bg-black/20 border-white/10"
                      }`}
                    >
                      Influencer
                    </Button>
                  </div>

                  <Button onClick={handleAddWallet} size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add Wallet
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {smartWallets.length > 0 ? (
                  smartWallets.map((wallet) => (
                    <div
                      key={wallet.address}
                      className="bg-black/20 border border-white/10 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {wallet.label}
                          </span>
                          {getCategoryBadge(wallet.category)}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400">
                            {truncateAddress(wallet.address)}
                          </span>
                          {wallet.lastActivity && (
                            <span className="text-blue-400">
                              • Active {wallet.lastActivity}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-900/30 border border-blue-500/50 text-blue-300">
                          Score: {wallet.trackingScore}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            window.open(
                              `https://solscan.io/account/${wallet.address}`,
                              "_blank"
                            )
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={() => handleRemoveWallet(wallet.address)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    No smart wallets added yet
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="patterns" className="space-y-4">
              {patterns.map((pattern, index) => (
                <div
                  key={pattern.name}
                  className="bg-black/20 border border-white/10 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                      <span className="font-medium">{pattern.name}</span>
                    </div>
                    <Switch
                      checked={pattern.enabled}
                      onCheckedChange={() => handleTogglePattern(index)}
                    />
                  </div>

                  <p className="text-xs text-gray-400 mt-1 ml-7">
                    {pattern.description}
                  </p>

                  {pattern.enabled && (
                    <div className="mt-3 ml-7">
                      <div className="flex justify-between mb-1">
                        <Label className="text-xs text-gray-400">
                          Sensitivity
                        </Label>
                        <span className="text-xs font-medium">
                          {pattern.sensitivity}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Low</span>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          step="5"
                          value={pattern.sensitivity}
                          onChange={(e) =>
                            handlePatternSensitivity(
                              index,
                              parseInt(e.target.value)
                            )
                          }
                          className="flex-1 h-1.5 bg-black/40 rounded-full appearance-none cursor-pointer"
                        />
                        <span className="text-xs text-gray-500">High</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <div className="bg-black/20 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Brain className="h-6 w-6 text-blue-400 mt-1" />
                  <div>
                    <h3 className="font-medium mb-1">AI Analysis Settings</h3>
                    <p className="text-xs text-gray-400">
                      The AI system analyzes patterns from monitored wallets to
                      identify potential trading opportunities. Configure the
                      settings below to customize the analysis.
                    </p>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="realtime">Realtime Analysis</Label>
                        <Switch id="realtime" defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="notifications">
                          Pattern Notifications
                        </Label>
                        <Switch id="notifications" defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="autoTrade">
                          Auto-Trade on Strong Signals
                        </Label>
                        <Switch id="autoTrade" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Radio className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-sm mb-1">Signal Quality</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-black/30 p-2 rounded text-center">
                        <div className="text-xs text-gray-400">Precision</div>
                        <div className="text-sm font-medium">87%</div>
                      </div>
                      <div className="bg-black/30 p-2 rounded text-center">
                        <div className="text-xs text-gray-400">Recall</div>
                        <div className="text-sm font-medium">92%</div>
                      </div>
                      <div className="bg-black/30 p-2 rounded text-center">
                        <div className="text-xs text-gray-400">Accuracy</div>
                        <div className="text-sm font-medium">81%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-900/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-200">
                  AI detection models require consistent training data to
                  maintain accuracy. The system will perform better the longer it
                  tracks wallet behavior patterns. Consider adding more wallets
                  to improve detection quality.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-4">
            <Button onClick={saveSettings}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartMoneyDetectionSystem;
