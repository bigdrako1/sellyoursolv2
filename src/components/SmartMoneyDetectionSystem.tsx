import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ChevronDown, ChevronUp, ExternalLink, Info, PlusCircle, Settings, Wallet, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

// Safe wallet address truncation function
const truncateAddress = (address: string | undefined): string => {
  if (!address) return "Unknown";
  if (address.length < 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

interface SmartMoneyWallet {
  address: string;
  label: string;
  description: string;
  tags: string[];
  active: boolean;
}

const SAMPLE_WALLETS: SmartMoneyWallet[] = [
  {
    address: "DPSFnxgYRd6PGAaEHDvLun9YmKSNFQ4zYNST3r2yBpdZ",
    label: "Alameda Research",
    description: "Institutional crypto trading firm founded by SBF",
    tags: ["institutional", "large trades", "high impact"],
    active: true
  },
  {
    address: "DtxthD4GJQRyxhhq7Xpq6HQBCthvXBhXZKQrUVxMYNJ2",
    label: "Solana Foundation Wallet",
    description: "Official wallet of the Solana Foundation",
    tags: ["official", "foundation", "grants"],
    active: false
  },
  {
    address: "Hf84mVvtxmsZyV8n5SQKPzirXehWsJ4JE6q7h7GS2h6j",
    label: "RoboCapital",
    description: "Algorithmic trading bot for Solana meme coins",
    tags: ["bot", "rapid trades", "high volume"],
    active: true
  }
];

interface DetectionRule {
  id: string;
  name: string;
  description: string;
  threshold: number;
  enabled: boolean;
}

const DETECTION_RULES: DetectionRule[] = [
  {
    id: "wallet-accumulation",
    name: "Smart Money Accumulation",
    description: "Detect when tracked wallets accumulate a token",
    threshold: 50,
    enabled: true
  },
  {
    id: "volume-spike",
    name: "Volume Spike Detection",
    description: "Detect unusual volume increases for tokens",
    threshold: 75,
    enabled: true
  },
  {
    id: "whale-activity",
    name: "Whale Activity Tracking",
    description: "Alert when large wallets make significant trades",
    threshold: 25,
    enabled: false
  }
];

const SmartMoneyDetectionSystem: React.FC = () => {
  const [isActive, setIsActive] = useState(true);
  const [notificationLevel, setNotificationLevel] = useState(2);
  const [wallets, setWallets] = useState<SmartMoneyWallet[]>(SAMPLE_WALLETS);
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [newWalletLabel, setNewWalletLabel] = useState("");
  const [activeTab, setActiveTab] = useState("wallets");
  const [detectionRules, setDetectionRules] = useState<DetectionRule[]>(DETECTION_RULES);
  const [expandedWallet, setExpandedWallet] = useState<string | null>(null);
  
  const toggleSystem = () => {
    setIsActive(!isActive);
    
    toast(isActive ? "Smart Money Detection disabled" : "Smart Money Detection enabled", {
      description: isActive 
        ? "You will no longer receive smart money alerts" 
        : "You will now receive smart money alerts"
    });
  };
  
  const toggleWalletActive = (address: string) => {
    setWallets(wallets.map(wallet => 
      wallet.address === address 
        ? { ...wallet, active: !wallet.active }
        : wallet
    ));
  };
  
  const addWallet = () => {
    if (!newWalletAddress || !newWalletLabel) {
      toast.error("Please provide both address and label");
      return;
    }
    
    setWallets([
      ...wallets,
      {
        address: newWalletAddress,
        label: newWalletLabel,
        description: "",
        tags: ["custom"],
        active: true
      }
    ]);
    
    setNewWalletAddress("");
    setNewWalletLabel("");
    
    toast.success("Wallet added successfully", {
      description: `${newWalletLabel} will now be tracked for smart money signals`
    });
  };
  
  const removeWallet = (address: string) => {
    setWallets(wallets.filter(wallet => wallet.address !== address));
    
    toast("Wallet removed", {
      description: "Wallet will no longer be tracked"
    });
  };
  
  const toggleWalletExpanded = (address: string) => {
    setExpandedWallet(expandedWallet === address ? null : address);
  };
  
  const updateDetectionRule = (id: string, enabled: boolean) => {
    setDetectionRules(detectionRules.map(rule => 
      rule.id === id ? { ...rule, enabled } : rule
    ));
  };
  
  const updateRuleThreshold = (id: string, threshold: number) => {
    setDetectionRules(detectionRules.map(rule => 
      rule.id === id ? { ...rule, threshold } : rule
    ));
  };
  
  const getActiveWalletsCount = () => {
    return wallets.filter(wallet => wallet.active).length;
  };
  
  const getActiveRulesCount = () => {
    return detectionRules.filter(rule => rule.enabled).length;
  };
  
  const getNotificationLevelLabel = () => {
    switch (notificationLevel) {
      case 1: return "Low (important alerts only)";
      case 2: return "Medium (balanced)";
      case 3: return "High (all signals)";
      default: return "Medium";
    }
  };

  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-400" />
            <span>Smart Money Detection</span>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={toggleSystem}
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={!isActive ? "opacity-50 pointer-events-none" : ""}>
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-md p-3 mb-4">
            <div className="flex items-start">
              <Info className="h-4 w-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-300">
                Smart money detection monitors wallets of known profitable traders and institutional addresses. 
                Add wallets to track or enable automatic detection of profitable patterns.
              </p>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="wallets" className="flex items-center justify-center gap-1">
                <Wallet className="h-3.5 w-3.5" />
                <span>Tracked Wallets ({getActiveWalletsCount()})</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center justify-center gap-1">
                <Settings className="h-3.5 w-3.5" />
                <span>Detection Settings</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="wallets" className="pt-4">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  {wallets.map((wallet) => (
                    <div key={wallet.address} className="border border-gray-800 rounded-md overflow-hidden">
                      <div 
                        className={`flex items-center justify-between p-3 cursor-pointer ${wallet.active ? 'bg-gray-800/50' : 'bg-gray-900'}`}
                        onClick={() => toggleWalletExpanded(wallet.address)}
                      >
                        <div className="flex items-center">
                          <div 
                            className={`w-2 h-2 rounded-full mr-2 ${wallet.active ? 'bg-green-500' : 'bg-gray-500'}`}
                          ></div>
                          <div>
                            <div className="font-medium">{wallet.label}</div>
                            <div className="text-xs text-gray-400">{truncateAddress(wallet.address)}</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Switch
                            checked={wallet.active}
                            onCheckedChange={(checked) => {
                              toggleWalletActive(wallet.address);
                              // Stop event propagation
                              event?.stopPropagation();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mr-2"
                          />
                          {expandedWallet === wallet.address ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                      
                      {expandedWallet === wallet.address && (
                        <div className="p-3 border-t border-gray-800 bg-gray-900">
                          <p className="text-sm text-gray-300 mb-2">
                            {wallet.description || "No description available."}
                          </p>
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            {wallet.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-gray-800">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex justify-between">
                            <a 
                              href={`https://solscan.io/address/${wallet.address}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 flex items-center"
                            >
                              View on Explorer <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeWallet(wallet.address);
                              }}
                              className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <X className="h-3 w-3 mr-1" /> Remove
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="bg-black/20 p-3 rounded-md">
                  <div className="text-sm font-medium mb-2">Add New Wallet</div>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <Label htmlFor="address" className="text-xs mb-1">Wallet Address</Label>
                      <Input 
                        id="address"
                        placeholder="Enter Solana address"
                        value={newWalletAddress}
                        onChange={(e) => setNewWalletAddress(e.target.value)}
                        className="bg-black/30 border-gray-700"
                      />
                    </div>
                    <div>
                      <Label htmlFor="label" className="text-xs mb-1">Label</Label>
                      <Input 
                        id="label"
                        placeholder="Enter wallet label"
                        value={newWalletLabel}
                        onChange={(e) => setNewWalletLabel(e.target.value)}
                        className="bg-black/30 border-gray-700"
                      />
                    </div>
                    <Button onClick={addWallet} className="w-full">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Wallet
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="pt-4">
              <div className="space-y-5">
                <div>
                  <Label className="text-sm mb-1">Notification Level</Label>
                  <div className="mt-2">
                    <Slider 
                      value={[notificationLevel]} 
                      min={1} 
                      max={3} 
                      step={1} 
                      onValueChange={(value) => setNotificationLevel(value[0])}
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                    <p className="text-sm mt-1 text-gray-300">
                      Current: <span className="font-medium">{getNotificationLevelLabel()}</span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm mb-2">Detection Rules</Label>
                  <div className="space-y-3">
                    {detectionRules.map((rule) => (
                      <div key={rule.id} className="bg-black/20 p-3 rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{rule.name}</span>
                          <Switch 
                            checked={rule.enabled}
                            onCheckedChange={(checked) => updateDetectionRule(rule.id, checked)}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1 mb-2">
                          {rule.description}
                        </p>
                        
                        <div className={`mt-3 ${!rule.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Sensitivity</span>
                            <span>{rule.threshold}%</span>
                          </div>
                          
                          <Slider 
                            disabled={!rule.enabled}
                            value={[rule.threshold]} 
                            min={0} 
                            max={100} 
                            step={5}
                            onValueChange={(value) => updateRuleThreshold(rule.id, value[0])}
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Low</span>
                            <span>High</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-800/50 p-3 rounded-md">
                  <div className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-yellow-300">
                        Active Rules: {getActiveRulesCount()}/{detectionRules.length}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        The system will monitor {getActiveWalletsCount()} wallets using {getActiveRulesCount()} detection rules.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartMoneyDetectionSystem;
