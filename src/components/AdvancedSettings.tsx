
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Settings, 
  AlertTriangle,
  Database, 
  Trash, 
  RefreshCw, 
  Terminal,
  Download,
  Upload
} from "lucide-react";
import { toast } from "sonner";

const AdvancedSettings = () => {
  const [debugMode, setDebugMode] = useState(false);
  const [extendedLogging, setExtendedLogging] = useState(false);
  const [cacheTTL, setCacheTTL] = useState(900); // 15 minutes in seconds
  const [rpcEndpoint, setRpcEndpoint] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const handleResetAllSettings = () => {
    toast({
      title: "Settings reset confirmation",
      description: "This action will reset all settings to default values. Are you sure?",
      action: {
        label: "Reset All",
        onClick: () => {
          toast.success("Settings reset successfully");
        },
      },
    });
  };
  
  const handleClearCache = () => {
    toast.success("Cache cleared successfully");
  };
  
  const handleExportData = () => {
    setIsExporting(true);
    
    // Simulating export process
    setTimeout(() => {
      setIsExporting(false);
      toast.success("Data exported successfully", {
        description: "Your data has been exported to settings.json"
      });
      
      // Trigger fake download
      const dummyLink = document.createElement('a');
      dummyLink.download = "settings.json";
      dummyLink.href = "#";
      dummyLink.click();
    }, 1500);
  };
  
  const handleImportData = () => {
    // In a real implementation, we would open a file selector here
    setIsImporting(true);
    
    // Simulating import process
    setTimeout(() => {
      setIsImporting(false);
      toast.success("Data imported successfully");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <Card className="card-with-border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5 text-purple-400" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-green-400" />
                <Label htmlFor="debugMode">Debug Mode</Label>
              </div>
              <Switch
                id="debugMode"
                checked={debugMode}
                onCheckedChange={setDebugMode}
              />
            </div>
            
            {debugMode && (
              <div className="pl-6">
                <div className="flex items-center justify-between mt-2">
                  <Label htmlFor="extendedLogging">Extended Logging</Label>
                  <Switch
                    id="extendedLogging"
                    checked={extendedLogging}
                    onCheckedChange={setExtendedLogging}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2 pt-4 border-t border-white/10">
              <Label htmlFor="cacheTTL">Cache Time-to-Live (seconds)</Label>
              <Input
                id="cacheTTL"
                type="number"
                value={cacheTTL}
                onChange={(e) => setCacheTTL(parseInt(e.target.value))}
                className="bg-black/30 border-gray-700"
              />
              <p className="text-xs text-gray-400">
                How long to keep API responses in cache. Default is 900 seconds (15 minutes).
              </p>
            </div>
            
            <div className="space-y-2 pt-4 border-t border-white/10">
              <Label htmlFor="rpcEndpoint">Custom RPC Endpoint (Advanced)</Label>
              <Input
                id="rpcEndpoint"
                placeholder="https://your-custom-rpc.example.com"
                value={rpcEndpoint}
                onChange={(e) => setRpcEndpoint(e.target.value)}
                className="bg-black/30 border-gray-700"
              />
              <p className="text-xs text-gray-400">
                Only change this if you're experiencing issues with the default RPC.
              </p>
            </div>
            
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-sm font-medium mb-3">Data Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button 
                  variant="outline"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> 
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" /> 
                      Export Settings
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleImportData}
                  disabled={isImporting}
                  className="flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> 
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" /> 
                      Import Settings
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-sm font-medium mb-3">System Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleClearCache}
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  Clear Cache
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleResetAllSettings}
                  className="flex items-center gap-2"
                >
                  <Trash className="h-4 w-4" />
                  Reset All Settings
                </Button>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-md">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                <p className="text-xs text-yellow-200">
                  Warning: Making changes to advanced settings may affect system performance or stability. 
                  Only modify these settings if you understand the implications.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedSettings;
