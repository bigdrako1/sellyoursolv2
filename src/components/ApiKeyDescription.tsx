
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import APP_CONFIG from "@/config/appDefinition";

const ApiKeyDescription: React.FC = () => {
  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Info className="mr-2 h-5 w-5" />
          Personal API Key
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-300 mb-4">
          {APP_CONFIG.api.personalApiKeyDescription}
        </p>
        <div className="text-xs text-gray-400">
          <p className="mb-2">Benefits of using your personal API key:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Higher rate limits (up to 500 requests per second)</li>
            <li>Priority request handling</li>
            <li>Access to premium blockchain data</li>
            <li>Enhanced webhook functionality</li>
            <li>Reduced latency with dedicated endpoints</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeyDescription;
