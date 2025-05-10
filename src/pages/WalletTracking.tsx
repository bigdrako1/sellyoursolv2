import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  BarChart3,
  MoreHorizontal,
  Copy,
  Trash2,
  Eye,
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface TrackedWallet {
  id: number;
  address: string;
  alias: string;
  chain: "solana" | "binance";
  balance: number;
  activities: number;
  successRate: number;
  tracked: boolean;
}

const mockWallets: TrackedWallet[] = [
  {
    id: 1,
    address: "3FTHyP7TLcqd6C969eGHQ2QfnpRFmfqbKA2MnzTcf3j9",
    alias: "Whale Trader 1",
    chain: "solana",
    balance: 1250000,
    activities: 47,
    successRate: 88,
    tracked: true
  },
  {
    id: 2,
    address: "6Dkr4HJLo9XavxrJpsMcky2rKzKJP3wgpuP9mJbYekbV",
    alias: "Smart Money",
    chain: "solana",
    balance: 780000,
    activities: 32,
    successRate: 76,
    tracked: true
  },
  {
    id: 3,
    address: "9AYmFnSdDDYEa5EaZJU8yCQmxpGwhEbgKU7SdeQDiEsZ",
    alias: "Alpha Hunter",
    chain: "solana",
    balance: 1850000,
    activities: 65,
    successRate: 92,
    tracked: true
  }
];

const WalletTracking: React.FC = () => {
  const [wallets, setWallets] = useState<TrackedWallet[]>(mockWallets);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [newWalletAlias, setNewWalletAlias] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const addWallet = () => {
    if (newWalletAddress && newWalletAlias) {
      const newWallet: TrackedWallet = {
        id: wallets.length + 1,
        address: newWalletAddress,
        alias: newWalletAlias,
        chain: newWalletAddress.startsWith("0x") ? "binance" : "solana",
        balance: 0,
        activities: 0,
        successRate: 0,
        tracked: true
      };

      setWallets([newWallet, ...wallets]);
      setNewWalletAddress("");
      setNewWalletAlias("");
      setShowAddWallet(false);

      toast("Wallet Added", {
        description: "New wallet has been added to tracking list."
      });
    } else {
      toast("Missing Information", {
        description: "Please provide both wallet address and alias."
      });
    }
  };

  const toggleTracking = (id: number) => {
    setWallets(wallets.map(wallet =>
      wallet.id === id ? { ...wallet, tracked: !wallet.tracked } : wallet
    ));

    const wallet = wallets.find(w => w.id === id);
    if (wallet) {
      toast(wallet.tracked ? "Tracking Stopped" : "Tracking Started", {
        description: `${wallet.alias} is now ${wallet.tracked ? 'no longer being tracked' : 'being tracked'}.`
      });
    }
  };

  const deleteWallet = (id: number) => {
    const wallet = wallets.find(w => w.id === id);
    setWallets(wallets.filter(wallet => wallet.id !== id));

    if (wallet) {
      toast("Wallet Removed", {
        description: `${wallet.alias} has been removed from tracking.`
      });
    }
  };

  const formatBalance = (balance: number) => {
    if (balance >= 1000000) {
      return `$${(balance / 1000000).toFixed(2)}M`;
    } else if (balance >= 1000) {
      return `$${(balance / 1000).toFixed(2)}K`;
    } else {
      return `$${balance.toFixed(2)}`;
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: "Auto Trading", path: "/auto-trading" },
        { label: "Wallet Tracking", path: "/wallet-tracking" }
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wallet Tracking</h1>
          <p className="text-sm text-gray-400 mt-1">
            Track and analyze smart money wallets for trading signals
          </p>
        </div>

        <div className="flex gap-2">
          <Link to="/wallet-tracking/analytics">
            <Button variant="outline" className="bg-trading-darkAccent border-white/10 hover:bg-white/10">
              <BarChart3 size={16} className="mr-2" />
              Analytics
            </Button>
          </Link>

          <Button onClick={() => setShowAddWallet(!showAddWallet)}>
            <Plus size={16} className="mr-2" />
            Add Wallet
          </Button>
        </div>
      </div>

      {showAddWallet && (
        <Card className="border-trading-highlight/30 bg-trading-darkAccent">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Wallet Alias</label>
                <Input
                  placeholder="Enter a name for this wallet"
                  value={newWalletAlias}
                  onChange={(e) => setNewWalletAlias(e.target.value)}
                  className="bg-black/30 border-white/10"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Wallet Address</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter Solana wallet address"
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    className="bg-black/30 border-white/10"
                  />
                  <Button onClick={addWallet}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddWallet(false);
                  setNewWalletAddress("");
                  setNewWalletAlias("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-black/20 border-white/10 border">
          <TabsTrigger value="all">All Wallets</TabsTrigger>
          <TabsTrigger value="active">Active Tracking</TabsTrigger>
          <TabsTrigger value="smart">Smart Money</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tracked Wallets</CardTitle>
              <CardDescription>
                Monitor wallet activities and trading patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black/20 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-white/5">
                        <th className="px-4 py-2 text-left">Wallet</th>
                        <th className="px-4 py-2 text-left">Chain</th>
                        <th className="px-4 py-2 text-right">Balance</th>
                        <th className="px-4 py-2 text-right">Activities</th>
                        <th className="px-4 py-2 text-right">Success Rate</th>
                        <th className="px-4 py-2 text-right">Status</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wallets.map((wallet) => (
                        <tr key={wallet.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Wallet size={14} className="text-trading-highlight" />
                              <div>
                                <div className="font-medium">{wallet.alias}</div>
                                <div className="text-xs text-gray-400">{wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 8)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="bg-purple-900/20 text-purple-300 border-purple-500/20">
                              {wallet.chain === "solana" ? "Solana" : "Binance"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatBalance(wallet.balance)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {wallet.activities}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={wallet.successRate > 80 ? "text-green-500" : wallet.successRate > 60 ? "text-yellow-500" : "text-gray-400"}>
                              {wallet.successRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Badge variant={wallet.tracked ? "default" : "secondary"} className={wallet.tracked ? "bg-green-900/30 text-green-400 hover:bg-green-900/40" : "bg-gray-800 text-gray-400"}>
                              {wallet.tracked ? 'Tracking' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal size={14} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-trading-darkAccent border-white/10">
                                <DropdownMenuItem onClick={() => toggleTracking(wallet.id)} className="cursor-pointer">
                                  <Eye size={14} className="mr-2" />
                                  {wallet.tracked ? 'Stop Tracking' : 'Start Tracking'}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                  <Copy size={14} className="mr-2" />
                                  Copy Address
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                  <ArrowUpRight size={14} className="mr-2" />
                                  View on Explorer
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                  <Link to="/wallet-tracking/analytics" className="flex items-center w-full">
                                    <BarChart3 size={14} className="mr-2" />
                                    View Analytics
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem onClick={() => deleteWallet(wallet.id)} className="cursor-pointer text-red-500 hover:text-red-400">
                                  <Trash2 size={14} className="mr-2" />
                                  Remove Wallet
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Tracking</CardTitle>
              <CardDescription>
                Wallets currently being actively monitored
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black/20 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-white/5">
                        <th className="px-4 py-2 text-left">Wallet</th>
                        <th className="px-4 py-2 text-right">Last Activity</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wallets.filter(w => w.tracked).map((wallet) => (
                        <tr key={wallet.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Wallet size={14} className="text-trading-highlight" />
                              <div>
                                <div className="font-medium">{wallet.alias}</div>
                                <div className="text-xs text-gray-400">{wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 8)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            {Math.floor(Math.random() * 24)} hours ago
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="outline" size="sm" className="bg-black/20 border-white/10 hover:bg-white/10">
                              <RefreshCw size={14} className="mr-2" />
                              Refresh
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smart" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Smart Money Wallets</CardTitle>
              <CardDescription>
                High-performance wallets with proven track records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wallets.filter(w => w.successRate > 75).map((wallet) => (
                  <Card key={wallet.id} className="bg-trading-darkAccent border-white/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Wallet size={16} className="text-trading-highlight" />
                          <div className="font-medium">{wallet.alias}</div>
                        </div>
                        <Badge variant="outline" className="bg-purple-900/20 text-purple-300 border-purple-500/20">
                          {wallet.chain === "solana" ? "Solana" : "Binance"}
                        </Badge>
                      </div>

                      <div className="text-xs text-gray-400 mb-2">Wallet Address</div>
                      <div className="font-mono text-sm mb-4">{wallet.address.substring(0, 12)}...{wallet.address.substring(wallet.address.length - 12)}</div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-black/20 p-2 rounded">
                          <div className="text-xs text-gray-400">Success</div>
                          <div className="text-green-500 font-medium">{wallet.successRate}%</div>
                        </div>
                        <div className="bg-black/20 p-2 rounded">
                          <div className="text-xs text-gray-400">Balance</div>
                          <div className="font-medium">{formatBalance(wallet.balance)}</div>
                        </div>
                        <div className="bg-black/20 p-2 rounded">
                          <div className="text-xs text-gray-400">Trades</div>
                          <div className="font-medium">{wallet.activities}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Link to="/wallet-tracking/analytics">
                          <Button variant="outline" size="sm" className="bg-black/20 border-white/10 hover:bg-white/10">
                            <BarChart3 size={14} className="mr-2" />
                            Analytics
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletTracking;
