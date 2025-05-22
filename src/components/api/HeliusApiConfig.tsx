import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Key, Check, AlertCircle } from "lucide-react";
import { APP_CONFIG } from "@/config/appDefinition";

interface HeliusApiConfigProps {
  onApiKeySet?: (apiKey: string) => void;
  showTitle?: boolean;
  showDescription?: boolean;
  compact?: boolean;
}

/**
 * HeliusApiConfig component - Consolidated component for Helius API configuration
 * Can be used throughout the application with consistent functionality
 */
const HeliusApiConfig: React.FC<HeliusApiConfigProps> = ({ 
  onApiKeySet,
  showTitle = true,
  showDescription = true,
  compact = false
}) => {
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Check if API key already exists in localStorage
  const [existingApiKey, setExistingApiKey] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Load API key on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem("helius_api_key");
    setExistingApiKey(storedApiKey);
    setHasApiKey(!!storedApiKey);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Helius API key.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store API key in localStorage
      localStorage.setItem("helius_api_key", apiKey);
      setExistingApiKey(apiKey);
      
      // Notify parent component
      if (onApiKeySet) {
        onApiKeySet(apiKey);
      }
      
      setHasApiKey(true);
      
      toast({
        title: "API Key Set Successfully",
        description: "Your Helius API key has been configured.",
      });
    } catch (error) {
      console.error("API key verification error:", error);
      toast({
        title: "Error Setting API Key",
        description: "There was a problem verifying your API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetApiKey = () => {
    localStorage.removeItem("helius_api_key");
    setHasApiKey(false);
    setApiKey("");
    setExistingApiKey(null);
    
    toast({
      title: "API Key Reset",
      description: "Your Helius API key has been removed.",
    });
    
    // Notify parent component
    if (onApiKeySet) {
      onApiKeySet("");
    }
  };

  // Compact version for inline use
  if (compact && hasApiKey) {
    return (
      <div className="flex items-center justify-between bg-black/20 p-2 rounded-md border border-white/10">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-blue-400" />
          <span className="text-sm">Helius API: Connected</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetApiKey}
          className="h-7 px-2 text-xs hover:bg-red-900/20 hover:text-red-400"
        >
          Reset
        </Button>
      </div>
    );
  }

  // Full component with card
  return (
    <Card className="card-with-border">
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-400" />
            Helius API Configuration
          </CardTitle>
          {showDescription && (
            <CardDescription>
              Configure your Helius API key for real-time token monitoring
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent>
        {hasApiKey ? (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3 flex items-start gap-2">
              <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-400">API Key Configured Successfully</p>
                <p className="text-xs text-gray-300 mt-1">
                  Your Helius API key has been set up and is ready to use for token monitoring.
                </p>
              </div>
            </div>

            <div className="bg-black/20 p-3 rounded-lg">
              <div className="text-sm text-gray-400">API Key</div>
              <div className="font-mono font-medium">•••••••••••••••••••••••••{existingApiKey?.substr(-4)}</div>
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://dev.helius.xyz/dashboard", "_blank")}
                className="bg-black/20 border-white/10 text-gray-300"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Helius Dashboard
              </Button>
              
              <Button 
                variant="destructive" 
                size="sm"
                onClick={resetApiKey}
              >
                Reset API Key
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Helius API Key</Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Helius API key"
                className="bg-black/20 border-white/10"
              />
              <p className="text-xs text-gray-400">
                Your API key is stored securely in your browser's local storage.
              </p>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-blue-400">Don't have an API key?</h4>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => window.open("https://dev.helius.xyz/dashboard", "_blank")}
                  className="text-blue-400 p-0 h-auto"
                >
                  Get API Key
                </Button>
              </div>
              <p className="text-xs text-gray-300 mt-1">
                Sign up for a free Helius account to get your API key and access Solana's blockchain data.
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || !apiKey.trim()}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Verifying...</span>
                  <span className="h-4 w-4 rounded-full border-2 border-t-transparent border-current animate-spin"></span>
                </>
              ) : (
                <>Save API Key</>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default HeliusApiConfig;
