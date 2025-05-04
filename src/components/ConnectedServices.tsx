
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import APP_CONFIG from "@/config/appDefinition";

interface ConnectedServicesProps {
  servicesStatus: {
    solanaRpc: boolean;
    heliusApi: boolean;
    webhooks: boolean;
  };
}

const ConnectedServices: React.FC<ConnectedServicesProps> = ({ servicesStatus }) => {
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
      id: "webhooks",
      ...APP_CONFIG.connectedServices.webhooks,
      active: servicesStatus.webhooks,
    },
  ];

  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle>Connected Services</CardTitle>
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
