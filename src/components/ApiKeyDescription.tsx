import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ApiKeyDescription: React.FC = () => {
  const { toast } = useToast();

  const handleConfigureClick = () => {
    toast({
      title: 'Settings',
      description: 'Redirecting to API key configuration page',
    });
    // In a real implementation, this would navigate to the settings page
    window.location.href = '/settings';
  };

  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-black/20 rounded-lg border border-white/5">
            <h3 className="text-sm font-medium mb-2">API Keys Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Helius API</span>
                </div>
                <span className="text-xs text-gray-400">Active</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Jupiter API</span>
                </div>
                <span className="text-xs text-gray-400">Active</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Sentiment API</span>
                </div>
                <span className="text-xs text-gray-400">Using Fallback</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm">Configure additional API keys to enhance functionality</p>
              <p className="text-xs text-gray-400 mt-1">Some features use fallback implementations when APIs are not configured</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={handleConfigureClick}
            >
              Configure
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeyDescription;
