
import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { testHeliusConnection } from '@/utils/apiUtils';
import { testApiConnectivity } from '@/services/apiService';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { HELIUS_RPC_URL, HELIUS_API_BASE, JUPITER_API_BASE } from '@/utils/apiUtils';

// Component to test API connectivity and show results
const DebugPanel = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  // Test connection to all APIs
  const testConnections = async () => {
    setIsChecking(true);
    const testResults: Record<string, boolean> = {};
    
    try {
      // Test Helius connection using our utils
      testResults.heliusConnection = await testHeliusConnection();
      
      // Test direct API endpoints
      testResults.heliusApi = await testApiConnectivity(HELIUS_API_BASE);
      testResults.heliusRpc = await testApiConnectivity(HELIUS_RPC_URL);
      testResults.jupiterApi = await testApiConnectivity(JUPITER_API_BASE);
      
      setResults(testResults);
      
      // Count successes
      const successCount = Object.values(testResults).filter(Boolean).length;
      const totalTests = Object.values(testResults).length;
      
      toast({
        title: `API Connectivity Results: ${successCount}/${totalTests} passed`,
        description: `${successCount} out of ${totalTests} API endpoints are reachable.`,
        variant: successCount === totalTests ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error testing connections:', error);
      toast({
        title: 'Connection Test Error',
        description: 'An error occurred while testing API connections.',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  const getStatusIcon = (status: boolean | undefined) => {
    if (status === undefined) return <AlertCircle className="h-4 w-4 text-gray-400" />;
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">API Connection Tests</CardTitle>
        <CardDescription>
          Test connectivity to essential API services
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {Object.keys(results).length > 0 && (
          <div className="space-y-2">
            {Object.entries(results).map(([name, status]) => (
              <div key={name} className="flex items-center justify-between py-1">
                <div className="flex items-center">
                  {getStatusIcon(status)}
                  <span className="ml-2 capitalize">
                    {name.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <Badge variant={status ? "success" : "destructive"}>
                  {status ? 'Connected' : 'Failed'}
                </Badge>
              </div>
            ))}
          </div>
        )}
        
        {Object.keys(results).length === 0 && !isChecking && (
          <div className="py-4 text-center text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No tests run yet. Click the button below to test connections.</p>
          </div>
        )}
        
        {isChecking && (
          <div className="py-4 text-center">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-blue-500" />
            <p>Testing API connections...</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={testConnections} 
          disabled={isChecking}
        >
          {isChecking ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>Test API Connections</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DebugPanel;
