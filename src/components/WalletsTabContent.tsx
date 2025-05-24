
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WalletBalances from "@/components/WalletBalances";
import {
  Wallet,
  Plus,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  TrendingUp,
  Activity,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const WalletsTabContent = () => {
  const [showPrivateKeys, setShowPrivateKeys] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [activeWalletTab, setActiveWalletTab] = useState("overview");

  // Mock wallet data
  const connectedWallets = [
    {
      id: 1,
      name: "Main Trading Wallet",
      address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      balance: 12.45,
      usdValue: 1847.32,
      type: "Connected",
      status: "active",
      lastActivity: "2 minutes ago",
      transactions: 156,
      pnl: 234.56
    },
    {
      id: 2,
      name: "DCA Wallet",
      address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      balance: 8.23,
      usdValue: 1221.45,
      type: "Imported",
      status: "active",
      lastActivity: "1 hour ago",
      transactions: 89,
      pnl: -45.23
    },
    {
      id: 3,
      name: "Backup Wallet",
      address: "4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi",
      balance: 0.12,
      usdValue: 17.82,
      type: "Watch-only",
      status: "inactive",
      lastActivity: "3 days ago",
      transactions: 12,
      pnl: 5.67
    }
  ];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-400">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-500/20 text-gray-400">Inactive</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Connected":
        return <Badge className="bg-blue-500/20 text-blue-400">Connected</Badge>;
      case "Imported":
        return <Badge className="bg-purple-500/20 text-purple-400">Imported</Badge>;
      case "Watch-only":
        return <Badge className="bg-orange-500/20 text-orange-400">Watch-only</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeWalletTab} onValueChange={setActiveWalletTab}>
        <TabsList className="bg-black/20 border-white/10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Wallet Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-trading-darkAccent border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Balance</p>
                    <div className="flex items-baseline mt-1">
                      <h3 className="text-2xl font-bold">20.80 SOL</h3>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">$3,086.59</p>
                  </div>
                  <div className="p-2 rounded-full bg-blue-500/20">
                    <DollarSign className="text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-trading-darkAccent border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Wallets</p>
                    <div className="flex items-baseline mt-1">
                      <h3 className="text-2xl font-bold">2</h3>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">1 watch-only</p>
                  </div>
                  <div className="p-2 rounded-full bg-green-500/20">
                    <Wallet className="text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-trading-darkAccent border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total P&L</p>
                    <div className="flex items-baseline mt-1">
                      <h3 className="text-2xl font-bold text-green-400">+$195.00</h3>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">+6.7% overall</p>
                  </div>
                  <div className="p-2 rounded-full bg-green-500/20">
                    <TrendingUp className="text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Wallet Balances */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-400" />
                Current Wallet Balances
              </CardTitle>
              <CardDescription>
                Real-time balance information for your connected wallets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WalletBalances />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          {/* Add New Wallet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-400" />
                Add New Wallet
              </CardTitle>
              <CardDescription>
                Connect, import, or add watch-only wallets to your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-20 flex flex-col items-center justify-center bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/20">
                  <Wallet className="h-6 w-6 mb-2 text-blue-400" />
                  <span className="text-sm">Connect Wallet</span>
                </Button>
                <Button className="h-20 flex flex-col items-center justify-center bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/20">
                  <Plus className="h-6 w-6 mb-2 text-purple-400" />
                  <span className="text-sm">Import Wallet</span>
                </Button>
                <Button className="h-20 flex flex-col items-center justify-center bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/20">
                  <Eye className="h-6 w-6 mb-2 text-orange-400" />
                  <span className="text-sm">Watch Address</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Wallet List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-400" />
                Connected Wallets
              </CardTitle>
              <CardDescription>
                Manage your connected wallets and their settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connectedWallets.map((wallet) => (
                  <div key={wallet.id} className="p-4 rounded-lg bg-black/20 border border-white/5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{wallet.name}</h4>
                          {getTypeBadge(wallet.type)}
                          {getStatusBadge(wallet.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                          <span className="font-mono">{wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(wallet.address, "Address")}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Balance:</span>
                            <div className="font-medium">{wallet.balance} SOL</div>
                          </div>
                          <div>
                            <span className="text-gray-400">USD Value:</span>
                            <div className="font-medium">${wallet.usdValue.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">P&L:</span>
                            <div className={`font-medium ${wallet.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {wallet.pnl >= 0 ? '+' : ''}${wallet.pnl.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-400">Last Activity:</span>
                            <div className="font-medium">{wallet.lastActivity}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="bg-black/20 border-white/10">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="bg-black/20 border-white/10">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-400" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage security settings for your wallets and transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-white/5">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <div>
                      <h4 className="font-medium">Transaction Confirmation</h4>
                      <p className="text-sm text-gray-400">Require confirmation for all transactions</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-white/5">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                    <div>
                      <h4 className="font-medium">Large Transaction Alerts</h4>
                      <p className="text-sm text-gray-400">Alert for transactions over 1 SOL</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-400">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-400" />
                    <div>
                      <h4 className="font-medium">Session Timeout</h4>
                      <p className="text-sm text-gray-400">Auto-disconnect after 30 minutes of inactivity</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400">30 min</Badge>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Private Key Visibility</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPrivateKeys(!showPrivateKeys)}
                    className="bg-black/20 border-white/10"
                  >
                    {showPrivateKeys ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showPrivateKeys ? 'Hide' : 'Show'} Keys
                  </Button>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">Security Warning</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Never share your private keys with anyone. Store them securely and only access them when necessary.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common wallet management actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/wallet-tracking">
                  <Button className="w-full h-16 flex flex-col items-center justify-center bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/20">
                    <Activity className="h-6 w-6 mb-2 text-blue-400" />
                    <span className="text-sm">Wallet Tracking</span>
                  </Button>
                </Link>
                <Link to="/portfolio">
                  <Button className="w-full h-16 flex flex-col items-center justify-center bg-green-500/20 hover:bg-green-500/30 border border-green-500/20">
                    <TrendingUp className="h-6 w-6 mb-2 text-green-400" />
                    <span className="text-sm">Portfolio View</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletsTabContent;
