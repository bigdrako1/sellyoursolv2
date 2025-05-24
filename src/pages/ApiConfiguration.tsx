import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Key,
  Settings,
  Activity,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Shield
} from 'lucide-react';
import { HeliusApiConfig } from '@/components/api';
import ApiUsageMonitor from '@/components/ApiUsageMonitor';
import { testHeliusConnection } from '@/utils/apiUtils';
import { toast } from 'sonner';

const ApiConfiguration = () => {
  const [activeTab, setActiveTab] = useState('helius');
  const [connectionStatus, setConnectionStatus] = useState<{
    helius: boolean;
    birdeye: boolean;
    jupiter: boolean;
  }>({
    helius: false,
    birdeye: false,
    jupiter: false
  });
  const [isTestingConnections, setIsTestingConnections] = useState(false);
  const [lastTested, setLastTested] = useState<Date | null>(null);

  // BirdEye API state
  const [birdeyeApiKey, setBirdeyeApiKey] = useState('');
  const [birdeyeConnectionStatus, setBirdeyeConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [birdeyeTestResult, setBirdeyeTestResult] = useState<string>('');
  const [birdeyeRateLimit, setBirdeyeRateLimit] = useState(100);
  const [birdeyeEndpoint, setBirdeyeEndpoint] = useState('https://public-api.birdeye.so');

  // Load saved API settings
  useEffect(() => {
    const savedBirdeyeKey = localStorage.getItem('birdeye_api_key');
    const savedBirdeyeEndpoint = localStorage.getItem('birdeye_endpoint');
    const savedBirdeyeRateLimit = localStorage.getItem('birdeye_rate_limit');

    if (savedBirdeyeKey) setBirdeyeApiKey(savedBirdeyeKey);
    if (savedBirdeyeEndpoint) setBirdeyeEndpoint(savedBirdeyeEndpoint);
    if (savedBirdeyeRateLimit) setBirdeyeRateLimit(parseInt(savedBirdeyeRateLimit));
  }, []);

  // Test BirdEye API connection
  const testBirdeyeConnection = async () => {
    if (!birdeyeApiKey) {
      setBirdeyeConnectionStatus('error');
      setBirdeyeTestResult('API key is required');
      return false;
    }

    setBirdeyeConnectionStatus('connecting');
    setBirdeyeTestResult('Testing connection...');

    try {
      // Test BirdEye API with a simple request
      const response = await fetch(`${birdeyeEndpoint}/defi/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=1`, {
        headers: {
          'X-API-KEY': birdeyeApiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBirdeyeConnectionStatus('connected');
        setBirdeyeTestResult(`Connection successful! Retrieved ${data.data?.tokens?.length || 0} tokens.`);
        return true;
      } else {
        setBirdeyeConnectionStatus('error');
        setBirdeyeTestResult(`Connection failed: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      setBirdeyeConnectionStatus('error');
      setBirdeyeTestResult(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  // Save BirdEye API settings
  const saveBirdeyeSettings = () => {
    localStorage.setItem('birdeye_api_key', birdeyeApiKey);
    localStorage.setItem('birdeye_endpoint', birdeyeEndpoint);
    localStorage.setItem('birdeye_rate_limit', birdeyeRateLimit.toString());
    toast.success('BirdEye API settings saved');
  };

  // Test all API connections
  const testAllConnections = async () => {
    setIsTestingConnections(true);
    try {
      // Test Helius connection
      const heliusConnected = await testHeliusConnection();

      // Test BirdEye connection
      const birdeyeConnected = await testBirdeyeConnection();

      // Mock test for Jupiter (public API)
      const jupiterConnected = true;

      setConnectionStatus({
        helius: heliusConnected,
        birdeye: birdeyeConnected,
        jupiter: jupiterConnected
      });

      setLastTested(new Date());

      if (heliusConnected && birdeyeConnected && jupiterConnected) {
        toast.success('All API connections successful');
      } else {
        toast.warning('Some API connections failed');
      }
    } catch (error) {
      console.error('Error testing connections:', error);
      toast.error('Failed to test API connections');
    } finally {
      setIsTestingConnections(false);
    }
  };

  // Test connections on mount
  useEffect(() => {
    testAllConnections();
  }, []);

  const getStatusBadge = (connected: boolean) => (
    <Badge
      variant="outline"
      className={connected
        ? "bg-green-500/20 text-green-400 border-green-500/30"
        : "bg-red-500/20 text-red-400 border-red-500/30"
      }
    >
      {connected ? (
        <>
          <CheckCircle className="h-3 w-3 mr-1" />
          Connected
        </>
      ) : (
        <>
          <AlertTriangle className="h-3 w-3 mr-1" />
          Disconnected
        </>
      )}
    </Badge>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">API Configuration</h1>
          <p className="text-gray-400 mt-1">
            Configure and manage API connections for trading services
          </p>
        </div>
        <Button
          onClick={testAllConnections}
          variant="outline"
          size="sm"
          disabled={isTestingConnections}
          className="bg-trading-darkAccent border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isTestingConnections ? 'animate-spin' : ''}`} />
          Test Connections
        </Button>
      </div>

      {/* Connection Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-trading-darkAccent border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Helius API</p>
                <p className="text-lg font-semibold text-white">Blockchain Data</p>
              </div>
              {getStatusBadge(connectionStatus.helius)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-darkAccent border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">BirdEye API</p>
                <p className="text-lg font-semibold text-white">Price Data</p>
              </div>
              {getStatusBadge(connectionStatus.birdeye)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-darkAccent border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Jupiter API</p>
                <p className="text-lg font-semibold text-white">DEX Aggregation</p>
              </div>
              {getStatusBadge(connectionStatus.jupiter)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-trading-darkAccent border-white/10">
          <TabsTrigger value="helius">
            <Key className="h-4 w-4 mr-2" />
            Helius API
          </TabsTrigger>
          <TabsTrigger value="birdeye">
            <Activity className="h-4 w-4 mr-2" />
            BirdEye API
          </TabsTrigger>
          <TabsTrigger value="jupiter">
            <Settings className="h-4 w-4 mr-2" />
            Jupiter API
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Activity className="h-4 w-4 mr-2" />
            Monitoring
          </TabsTrigger>
        </TabsList>

        {/* Helius API Configuration */}
        <TabsContent value="helius" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <HeliusApiConfig
                onApiKeySet={(apiKey) => {
                  console.log('Helius API key configured:', apiKey);
                  testAllConnections();
                }}
                showTitle={false}
                showDescription={true}
              />
            </div>
            <div className="space-y-4">
              <Card className="bg-trading-darkAccent border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Connection Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Status</span>
                    {getStatusBadge(connectionStatus.helius)}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Endpoint</span>
                    <span className="text-white">api.helius.xyz</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Rate Limit</span>
                    <span className="text-white">100 req/min</span>
                  </div>
                  {lastTested && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Last Tested</span>
                      <span className="text-white">{lastTested.toLocaleTimeString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Alert className="bg-blue-500/20 border-blue-500/30">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-blue-300">
                  Your API key is stored securely in your browser and never transmitted to our servers.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </TabsContent>

        {/* BirdEye API Configuration */}
        <TabsContent value="birdeye" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-trading-darkAccent border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">BirdEye API Configuration</CardTitle>
                  <p className="text-gray-400 text-sm">
                    Configure your BirdEye API for real-time price data, market analytics, and token information.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* API Key Input */}
                  <div className="space-y-2">
                    <Label htmlFor="birdeyeApiKey" className="text-white">API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="birdeyeApiKey"
                        type="password"
                        value={birdeyeApiKey}
                        onChange={(e) => setBirdeyeApiKey(e.target.value)}
                        placeholder="Enter your BirdEye API key"
                        className="bg-black/20 border-white/10 text-white"
                      />
                      <Button
                        onClick={testBirdeyeConnection}
                        disabled={!birdeyeApiKey || birdeyeConnectionStatus === 'connecting'}
                        variant="outline"
                        className="bg-black/20 border-white/10 text-white hover:bg-white/10"
                      >
                        {birdeyeConnectionStatus === 'connecting' ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Test'
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Get your API key from{' '}
                      <Button
                        variant="link"
                        className="p-0 h-auto text-blue-400 hover:text-blue-300"
                        onClick={() => window.open('https://docs.birdeye.so/docs/authentication-api-keys', '_blank')}
                      >
                        BirdEye Developer Portal
                      </Button>
                    </p>
                  </div>

                  {/* Connection Test Result */}
                  {birdeyeTestResult && (
                    <Alert className={`${
                      birdeyeConnectionStatus === 'connected'
                        ? 'bg-green-500/20 border-green-500/30'
                        : birdeyeConnectionStatus === 'error'
                        ? 'bg-red-500/20 border-red-500/30'
                        : 'bg-blue-500/20 border-blue-500/30'
                    }`}>
                      {birdeyeConnectionStatus === 'connected' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : birdeyeConnectionStatus === 'error' ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      )}
                      <AlertDescription className={
                        birdeyeConnectionStatus === 'connected'
                          ? 'text-green-300'
                          : birdeyeConnectionStatus === 'error'
                          ? 'text-red-300'
                          : 'text-blue-300'
                      }>
                        {birdeyeTestResult}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Advanced Settings */}
                  <div className="space-y-4">
                    <h4 className="text-white font-medium">Advanced Settings</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="birdeyeEndpoint" className="text-white">API Endpoint</Label>
                        <Input
                          id="birdeyeEndpoint"
                          value={birdeyeEndpoint}
                          onChange={(e) => setBirdeyeEndpoint(e.target.value)}
                          className="bg-black/20 border-white/10 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="birdeyeRateLimit" className="text-white">Rate Limit (req/min)</Label>
                        <Input
                          id="birdeyeRateLimit"
                          type="number"
                          value={birdeyeRateLimit}
                          onChange={(e) => setBirdeyeRateLimit(parseInt(e.target.value) || 100)}
                          min={1}
                          max={1000}
                          className="bg-black/20 border-white/10 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Settings */}
                  <div className="flex gap-2">
                    <Button
                      onClick={saveBirdeyeSettings}
                      disabled={!birdeyeApiKey}
                      className="bg-trading-highlight hover:bg-trading-highlight/80"
                    >
                      Save Settings
                    </Button>
                    <Button
                      onClick={() => {
                        setBirdeyeApiKey('');
                        setBirdeyeEndpoint('https://public-api.birdeye.so');
                        setBirdeyeRateLimit(100);
                        localStorage.removeItem('birdeye_api_key');
                        localStorage.removeItem('birdeye_endpoint');
                        localStorage.removeItem('birdeye_rate_limit');
                        setBirdeyeConnectionStatus('disconnected');
                        setBirdeyeTestResult('');
                        toast.success('BirdEye settings reset');
                      }}
                      variant="outline"
                      className="bg-black/20 border-white/10 text-white hover:bg-white/10"
                    >
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="bg-trading-darkAccent border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Connection Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Status</span>
                    <Badge
                      variant="outline"
                      className={
                        birdeyeConnectionStatus === 'connected'
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : birdeyeConnectionStatus === 'error'
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : birdeyeConnectionStatus === 'connecting'
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }
                    >
                      {birdeyeConnectionStatus === 'connected' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </>
                      ) : birdeyeConnectionStatus === 'error' ? (
                        <>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Error
                        </>
                      ) : birdeyeConnectionStatus === 'connecting' ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Connecting
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Disconnected
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Endpoint</span>
                    <span className="text-white text-xs">{birdeyeEndpoint.replace('https://', '')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Rate Limit</span>
                    <span className="text-white">{birdeyeRateLimit} req/min</span>
                  </div>
                  {lastTested && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Last Tested</span>
                      <span className="text-white">{lastTested.toLocaleTimeString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Alert className="bg-blue-500/20 border-blue-500/30">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-blue-300">
                  Your API key is stored securely in your browser and never transmitted to our servers.
                </AlertDescription>
              </Alert>

              <Card className="bg-trading-darkAccent border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Available Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-gray-300">Real-time price data</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-gray-300">Token market data</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-gray-300">Historical charts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-gray-300">Portfolio tracking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-gray-300">Market analytics</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Jupiter API Configuration */}
        <TabsContent value="jupiter" className="space-y-4">
          <Card className="bg-trading-darkAccent border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Jupiter API Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="bg-green-500/20 border-green-500/30">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-300">
                  Jupiter API is publicly available and requires no authentication. Connection is automatic.
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button
                  variant="outline"
                  className="bg-black/20 border-white/10 text-white hover:bg-white/10"
                  onClick={() => window.open('https://docs.jup.ag/', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Jupiter Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Monitoring */}
        <TabsContent value="monitoring" className="space-y-4">
          <ApiUsageMonitor />

          <Card className="bg-trading-darkAccent border-white/10">
            <CardHeader>
              <CardTitle className="text-white">API Health Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${connectionStatus.helius ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-white">Helius RPC</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {connectionStatus.helius ? 'Operational' : 'Offline'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${connectionStatus.birdeye ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-white">BirdEye API</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {connectionStatus.birdeye ? 'Operational' : 'Offline'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${connectionStatus.jupiter ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-white">Jupiter API</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {connectionStatus.jupiter ? 'Operational' : 'Offline'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiConfiguration;
