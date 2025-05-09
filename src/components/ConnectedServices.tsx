
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import APP_CONFIG from "@/config/appDefinition";
import { testApiConnectivity } from "@/services/apiService";
import { HELIUS_RPC_URL, JUPITER_API_BASE } from "@/utils/apiUtils";

export interface ConnectedServicesProps {
  servicesStatus?: {
    solanaRpc?: boolean;
    heliusApi?: boolean;
    webhooks?: boolean;
  };
}

const ConnectedServices: React.FC<ConnectedServicesProps> = ({ servicesStatus: initialStatus }) => {
  const [servicesStatus, setServicesStatus] = useState(initialStatus || {
    solanaRpc: false,
    heliusApi: false,
    webhooks: false,
  });
  
  const [isCheckingConnections, setIsCheckingConnections] = useState(false);
  
  // Check connection status when component mounts
  useEffect(() => {
    const checkConnections = async () => {
      if (isCheckingConnections) return;
      setIsCheckingConnections(true);
      
      try {
        // Test Helius RPC connection
        const heliusConnected = await testApiConnectivity(HELIUS_RPC_URL);
        
        // Test Jupiter API connection
        const jupiterConnected = await testApiConnectivity(JUPITER_API_BASE);
        
        setServicesStatus({
          solanaRpc: heliusConnected,
          heliusApi: heliusConnected,
          webhooks: false, // We don't have a way to test webhooks directly
        });
      } catch (error) {
        console.error("Error checking API connections:", error);
      } finally {
        setIsCheckingConnections(false);
      }
    };
    
    checkConnections();
  }, []);
  
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
      active: servicesStatus.solanaRpc, // Assuming if Solana RPC works, Jupiter works too
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
          {isCheckingConnections && (
            <span className="text-xs font-normal text-gray-500 flex items-center">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse mr-1"></div>
              Checking...
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className={`w-2 h-2 rounded-full mr-3 ${service.active ? service.colorCode : 'bg-gray-400'}`}
                ></div>
                <span className={`font-medium ${service.active ? service.colorCode : 'text-gray-400'}`}>
                  {service.name}
                </span>
              </div>
              <span className={`text-xs font-medium ${service.active ? 'text-green-500' : 'text-gray-400'}`}>
                {service.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectedServices;
