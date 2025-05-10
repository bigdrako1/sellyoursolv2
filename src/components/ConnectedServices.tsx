
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import APP_CONFIG from "@/config/appDefinition";
import { testApiConnectivity } from "@/services/apiService";
import { HELIUS_RPC_URL, JUPITER_API_BASE } from "@/utils/apiUtils";

export interface ConnectedServicesProps {
  servicesStatus?: {
    solanaRpc?: boolean;
    heliusApi?: boolean;
    jupiterApi?: boolean;
    webhooks?: boolean;
  };
}

const ConnectedServices: React.FC<ConnectedServicesProps> = ({ servicesStatus: initialStatus }) => {
  const [servicesStatus, setServicesStatus] = useState(initialStatus || {
    solanaRpc: false,
    heliusApi: false,
    jupiterApi: false,
    webhooks: false,
  });
  
  const [isCheckingConnections, setIsCheckingConnections] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  // Check connection status when component mounts
  useEffect(() => {
    checkConnections();
    
    // Periodically check connections
    const interval = setInterval(() => {
      checkConnections(false); // Silent check
    }, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, []);
  
  const checkConnections = async (showToast = true) => {
    if (isCheckingConnections) return;
    setIsCheckingConnections(true);
    
    try {
      // Test Helius RPC connection
      const heliusConnected = await testApiConnectivity(HELIUS_RPC_URL);
      
      // Test Jupiter API connection
      const jupiterConnected = await testApiConnectivity(JUPITER_API_BASE);
      
      setServicesStatus({
        solanaRpc: heliusConnected, // Using Helius for Solana RPC
        heliusApi: heliusConnected,
        jupiterApi: jupiterConnected,
        webhooks: false, // We don't have a way to test webhooks directly
      });
      
      setLastChecked(new Date());
      
      if (showToast) {
        toast("Connection check complete", {
          description: `Connected to ${[heliusConnected && 'Helius', jupiterConnected && 'Jupiter'].filter(Boolean).join(', ') || 'No services'}`,
        });
      }
    } catch (error) {
      console.error("Error checking API connections:", error);
      if (showToast) {
        toast("Connection check failed", {
          description: "Unable to verify API connections. Check console for details.",
          variant: "destructive",
        });
      }
    } finally {
      setIsCheckingConnections(false);
    }
  };
  
  const getActiveServicesCount = () => {
    return Object.values(servicesStatus).filter(Boolean).length;
  };
  
  const totalServices = Object.keys(servicesStatus).length;
  const activeServices = getActiveServicesCount();
  
  const services = [
    {
      id: "solanaRpc",
      ...APP_CONFIG.connectedServices.solanaRpc,
      active: servicesStatus.solanaRpc,
    },
    {
      id: "heliusApi",
      ...APP_CONFIG.connectedServices.heliusApi,
      active: servicesStatus.heliusApi,
    },
    {
      id: "jupiterApi",
      ...APP_CONFIG.connectedServices.jupiterApi,
      active: servicesStatus.jupiterApi,
    },
    {
      id: "webhooks",
      ...APP_CONFIG.connectedServices.webhooks,
      active: servicesStatus.webhooks,
    },
  ];

  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Connected Services</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-normal text-gray-400">
              {activeServices}/{totalServices} active
            </span>
            {isCheckingConnections ? (
              <span className="text-xs font-normal text-gray-500 flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse mr-1"></div>
                Checking...
              </span>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-gray-400"
                onClick={() => checkConnections()}
                title="Refresh connections"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className={`w-2 h-2 rounded-full mr-3 ${service.active ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <span className={`font-medium ${service.active ? 'text-white' : 'text-gray-400'}`}>
                  {service.name}
                </span>
              </div>
              <span className={`text-xs font-medium ${service.active ? 'text-green-500' : 'text-red-500'} flex items-center gap-1`}>
                {service.active ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    Inactive
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
        
        {lastChecked && (
          <div className="text-xs text-gray-500 mt-4 flex justify-end">
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectedServices;
