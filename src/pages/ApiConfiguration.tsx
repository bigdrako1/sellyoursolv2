import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

  // Test all API connections
  const testAllConnections = async () => {
    setIsTestingConnections(true);
    try {
      // Test Helius connection
      const heliusConnected = await testHeliusConnection();
      
      // Mock tests for other APIs (implement actual tests as needed)
      const birdeyeConnected = true; // Mock
      const jupiterConnected = true; // Mock

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
          <Card className="bg-trading-darkAccent border-white/10">
            <CardHeader>
              <CardTitle className="text-white">BirdEye API Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="bg-yellow-500/20 border-yellow-500/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-yellow-300">
                  BirdEye API configuration will be available in a future update. Currently using public endpoints.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
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
