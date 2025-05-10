import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// Lazy load the NetworkGraph component
const NetworkGraph = lazy(() => import('@/components/NetworkGraph'));
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  Eye,
  EyeOff,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign,
  Users,
  Network
} from 'lucide-react';
import { formatCurrency, formatAddress, formatNumber } from '@/utils/formatters';

// Helper function to format percentage values
const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Sample smart money data
const SAMPLE_WALLETS = [
  {
    id: 'wallet-1',
    address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    label: 'Whale 1',
    category: 'whale',
    profitability: 87.5,
    totalValue: 12500000,
    recentActivity: [
      { type: 'buy', token: 'SOL', amount: 15000, value: 1350000, timestamp: '2023-12-15T10:30:00Z' },
      { type: 'sell', token: 'ETH', amount: 120, value: 240000, timestamp: '2023-12-14T14:45:00Z' },
      { type: 'buy', token: 'BONK', amount: 150000000, value: 75000, timestamp: '2023-12-12T09:15:00Z' }
    ],
    successRate: 92,
    avgHoldingPeriod: 14, // days
    connections: 8,
    isTracked: true
  },
  {
    id: 'wallet-2',
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    label: 'Smart Trader',
    category: 'trader',
    profitability: 65.2,
    totalValue: 3800000,
    recentActivity: [
      { type: 'buy', token: 'JUP', amount: 25000, value: 125000, timestamp: '2023-12-15T11:20:00Z' },
      { type: 'buy', token: 'PYTH', amount: 18000, value: 90000, timestamp: '2023-12-13T16:30:00Z' },
      { type: 'sell', token: 'BONK', amount: 85000000, value: 42500, timestamp: '2023-12-10T08:45:00Z' }
    ],
    successRate: 78,
    avgHoldingPeriod: 5, // days
    connections: 12,
    isTracked: true
  },
  {
    id: 'wallet-3',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    label: 'Institutional',
    category: 'institution',
    profitability: 42.8,
    totalValue: 75000000,
    recentActivity: [
      { type: 'buy', token: 'BTC', amount: 15, value: 600000, timestamp: '2023-12-14T09:10:00Z' },
      { type: 'buy', token: 'ETH', amount: 250, value: 500000, timestamp: '2023-12-12T13:25:00Z' },
      { type: 'sell', token: 'SOL', amount: 12000, value: 1080000, timestamp: '2023-12-08T15:40:00Z' }
    ],
    successRate: 65,
    avgHoldingPeriod: 45, // days
    connections: 3,
    isTracked: false
  },
  {
    id: 'wallet-4',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    label: 'Early Adopter',
    category: 'early_adopter',
    profitability: 95.3,
    totalValue: 1200000,
    recentActivity: [
      { type: 'buy', token: 'JTO', amount: 50000, value: 150000, timestamp: '2023-12-15T08:15:00Z' },
      { type: 'buy', token: 'RENDER', amount: 15000, value: 75000, timestamp: '2023-12-11T10:30:00Z' },
      { type: 'sell', token: 'PYTH', amount: 25000, value: 125000, timestamp: '2023-12-07T14:20:00Z' }
    ],
    successRate: 85,
    avgHoldingPeriod: 8, // days
    connections: 15,
    isTracked: true
  }
];

// Sample token accumulation data
const TOKEN_ACCUMULATION_DATA = [
  { token: 'SOL', whales: 25, institutions: 15, traders: 35, earlyAdopters: 25 },
  { token: 'JUP', whales: 15, institutions: 5, traders: 45, earlyAdopters: 35 },
  { token: 'BONK', whales: 10, institutions: 0, traders: 50, earlyAdopters: 40 },
  { token: 'JTO', whales: 20, institutions: 10, traders: 30, earlyAdopters: 40 },
  { token: 'PYTH', whales: 30, institutions: 25, traders: 25, earlyAdopters: 20 }
];

// Sample network data for visualization
const NETWORK_DATA = {
  nodes: [
    { id: 'wallet-1', value: 50, label: 'Whale 1', group: 'whale' },
    { id: 'wallet-2', value: 30, label: 'Smart Trader', group: 'trader' },
    { id: 'wallet-3', value: 70, label: 'Institutional', group: 'institution' },
    { id: 'wallet-4', value: 25, label: 'Early Adopter', group: 'early_adopter' },
    { id: 'token-1', value: 40, label: 'SOL', group: 'token' },
    { id: 'token-2', value: 35, label: 'JUP', group: 'token' },
    { id: 'token-3', value: 20, label: 'BONK', group: 'token' },
    { id: 'token-4', value: 30, label: 'JTO', group: 'token' },
    { id: 'token-5', value: 25, label: 'PYTH', group: 'token' }
  ],
  links: [
    { source: 'wallet-1', target: 'token-1', value: 5 },
    { source: 'wallet-1', target: 'token-3', value: 3 },
    { source: 'wallet-2', target: 'token-2', value: 4 },
    { source: 'wallet-2', target: 'token-5', value: 3 },
    { source: 'wallet-3', target: 'token-1', value: 4 },
    { source: 'wallet-3', target: 'token-4', value: 2 },
    { source: 'wallet-4', target: 'token-4', value: 5 },
    { source: 'wallet-4', target: 'token-5', value: 3 },
    { source: 'wallet-4', target: 'token-2', value: 2 },
    { source: 'wallet-1', target: 'wallet-2', value: 1 },
    { source: 'wallet-2', target: 'wallet-4', value: 2 },
    { source: 'wallet-3', target: 'wallet-1', value: 1 }
  ]
};

interface SmartMoneyTrackerProps {
  onWalletTrack?: (walletId: string, isTracked: boolean) => void;
}

const SmartMoneyTracker: React.FC<SmartMoneyTrackerProps> = ({ onWalletTrack }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('wallets');
  const [wallets, setWallets] = useState(SAMPLE_WALLETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  // Filter wallets based on search query and category
  const filteredWallets = wallets.filter(wallet => {
    const matchesSearch =
      wallet.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallet.label.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || wallet.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Handle wallet tracking toggle
  const handleTrackWallet = (walletId: string, isTracked: boolean) => {
    const updatedWallets = wallets.map(wallet =>
      wallet.id === walletId ? { ...wallet, isTracked } : wallet
    );

    setWallets(updatedWallets);

    const wallet = updatedWallets.find(w => w.id === walletId);

    toast({
      title: isTracked ? 'Wallet Tracked' : 'Wallet Untracked',
      description: `${wallet?.label} (${formatAddress(wallet?.address)}) has been ${isTracked ? 'added to' : 'removed from'} your tracking list.`,
    });

    if (onWalletTrack) {
      onWalletTrack(walletId, isTracked);
    }
  };

  // Get wallet category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'whale': return 'bg-blue-500';
      case 'trader': return 'bg-green-500';
      case 'institution': return 'bg-purple-500';
      case 'early_adopter': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  // Get wallet category label
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'whale': return 'Whale';
      case 'trader': return 'Trader';
      case 'institution': return 'Institution';
      case 'early_adopter': return 'Early Adopter';
      default: return 'Unknown';
    }
  };

  // Get activity type icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'buy': return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'sell': return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Prepare data for profitability chart
  const profitabilityData = wallets.map(wallet => ({
    name: wallet.label,
    profitability: wallet.profitability,
    successRate: wallet.successRate,
    totalValue: wallet.totalValue,
    category: wallet.category
  }));

  // Colors for charts
  const COLORS = ['#6366f1', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Smart Money Tracking
          </div>
          <div className="flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs bg-black/20 border-white/10">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="whale">Whales</SelectItem>
                <SelectItem value="trader">Traders</SelectItem>
                <SelectItem value="institution">Institutions</SelectItem>
                <SelectItem value="early_adopter">Early Adopters</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
        <CardDescription>
          Track and analyze smart money wallets and their activities
        </CardDescription>
        <div className="mt-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by address or label..."
              className="pl-8 bg-black/20 border-white/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="wallets">Wallets</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="tokens">Token Accumulation</TabsTrigger>
            <TabsTrigger value="network">Network Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="wallets">
            <div className="space-y-4">
              {filteredWallets.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No wallets found matching your criteria.</p>
                </div>
              ) : (
                filteredWallets.map(wallet => (
                  <Card key={wallet.id} className="bg-black/20 border-white/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${wallet.isTracked ? 'bg-green-500' : 'bg-gray-500'}`} />
                          <h3 className="font-medium">{wallet.label}</h3>
                          <Badge className={getCategoryColor(wallet.category)}>
                            {getCategoryLabel(wallet.category)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 bg-black/30 border-white/10"
                            onClick={() => setSelectedWallet(wallet.id === selectedWallet ? null : wallet.id)}
                          >
                            {wallet.id === selectedWallet ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Switch
                            checked={wallet.isTracked}
                            onCheckedChange={(checked) => handleTrackWallet(wallet.id, checked)}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-xs text-gray-400 mb-1">Wallet Address</div>
                        <div className="text-sm font-mono">{formatAddress(wallet.address, 8, 8)}</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Profitability</div>
                          <div className="text-lg font-medium text-green-500">
                            {formatPercent(wallet.profitability)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-400 mb-1">Success Rate</div>
                          <div className="text-lg font-medium">
                            {formatPercent(wallet.successRate)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-400 mb-1">Total Value</div>
                          <div className="text-lg font-medium">
                            {formatCurrency(wallet.totalValue)}
                          </div>
                        </div>
                      </div>

                      {wallet.id === selectedWallet && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
                          <div className="space-y-2">
                            {wallet.recentActivity.map((activity, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  {getActivityIcon(activity.type)}
                                  <span>{activity.type === 'buy' ? 'Bought' : 'Sold'} {formatNumber(activity.amount)} {activity.token}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span>{formatCurrency(activity.value)}</span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(activity.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <div className="text-xs text-gray-400 mb-1">Avg. Holding Period</div>
                              <div className="text-sm">{wallet.avgHoldingPeriod} days</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 mb-1">Connected Wallets</div>
                              <div className="text-sm">{wallet.connections}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <div className="space-y-6">
              <Card className="bg-black/20 border-white/5">
                <CardHeader>
                  <CardTitle>Profitability by Wallet Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={profitabilityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" tick={{ fill: '#999' }} />
                        <YAxis tick={{ fill: '#999' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1f2937', borderColor: '#333' }}
                          formatter={(value: any) => [`${value}%`, 'Profitability']}
                        />
                        <Bar dataKey="profitability" fill="#6366f1" name="Profitability %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-black/20 border-white/5">
                  <CardHeader>
                    <CardTitle>Success Rate by Wallet</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={profitabilityData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="successRate"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {profitabilityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => [`${value}%`, 'Success Rate']}
                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#333' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/20 border-white/5">
                  <CardHeader>
                    <CardTitle>Total Value by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={profitabilityData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="totalValue"
                            nameKey="category"
                            label={({ name, percent }) => `${getCategoryLabel(name)}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {profitabilityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => [formatCurrency(value), 'Total Value']}
                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#333' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tokens">
            <Card className="bg-black/20 border-white/5">
              <CardHeader>
                <CardTitle>Token Accumulation by Wallet Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={TOKEN_ACCUMULATION_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="token" tick={{ fill: '#999' }} />
                      <YAxis tick={{ fill: '#999' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#333' }}
                        formatter={(value: any) => [`${value}%`, '']}
                      />
                      <Legend />
                      <Bar dataKey="whales" stackId="a" fill="#6366f1" name="Whales" />
                      <Bar dataKey="institutions" stackId="a" fill="#8b5cf6" name="Institutions" />
                      <Bar dataKey="traders" stackId="a" fill="#10b981" name="Traders" />
                      <Bar dataKey="earlyAdopters" stackId="a" fill="#f59e0b" name="Early Adopters" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-3 bg-black/30 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm mb-1">High accumulation detected for JTO by early adopters</p>
                      <p className="text-xs text-gray-400">This could indicate a potential upcoming price movement.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network">
            <Card className="bg-black/20 border-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Wallet Network Analysis
                </CardTitle>
                <CardDescription>
                  Visualize connections between wallets and tokens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex items-center justify-center bg-black/30 rounded-lg mb-4">
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-full w-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-trading-highlight"></div>
                    </div>
                  }>
                    <NetworkGraph
                      nodes={NETWORK_DATA.nodes}
                      links={NETWORK_DATA.links}
                      width={800}
                      height={400}
                    />
                  </Suspense>
                </div>
                <div className="p-3 bg-black/30 rounded-lg mb-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm mb-1">Strong connection detected between Early Adopter and JTO token</p>
                      <p className="text-xs text-gray-400">This wallet has been accumulating JTO consistently over the past week.</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="p-4 bg-black/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      <h3 className="font-medium">Connected Wallets</h3>
                    </div>
                    <p className="text-2xl font-bold">24</p>
                    <p className="text-xs text-gray-400">Wallets with significant connections</p>
                  </div>

                  <div className="p-4 bg-black/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <h3 className="font-medium">Influence Score</h3>
                    </div>
                    <p className="text-2xl font-bold">78%</p>
                    <p className="text-xs text-gray-400">Market influence of tracked wallets</p>
                  </div>

                  <div className="p-4 bg-black/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-purple-500" />
                      <h3 className="font-medium">Total Value</h3>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(92500000)}</p>
                    <p className="text-xs text-gray-400">Combined value of tracked wallets</p>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-3">Network Insights</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-blue-500/20">
                          <Users className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Whale Cluster Detected</div>
                          <div className="text-xs text-gray-400">3 whale wallets showing similar trading patterns</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 bg-black/30 border-white/10">
                        View Details
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-green-500/20">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Smart Money Flow</div>
                          <div className="text-xs text-gray-400">Increased flow from traders to JUP token</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 bg-black/30 border-white/10">
                        View Details
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-purple-500/20">
                          <Network className="h-4 w-4 text-purple-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Centrality Analysis</div>
                          <div className="text-xs text-gray-400">Wallet-2 has highest betweenness centrality</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 bg-black/30 border-white/10">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SmartMoneyTracker;
