/**
 * Component for displaying agent configuration.
 */
import { useState } from 'react';
import { Agent } from '../../services/tradingAgentService';
import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Clipboard, Check } from 'lucide-react';

interface AgentConfigProps {
  agent: Agent;
}

const AgentConfig = ({ agent }: AgentConfigProps) => {
  const [copied, setCopied] = useState(false);
  
  // Function to copy config to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(agent.config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Function to format config value
  const formatConfigValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'null';
    }
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return '[]';
        }
        return `[${value.length} items]`;
      }
      return '{...}';
    }
    
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    
    return String(value);
  };
  
  // Function to render config recursively
  const renderConfig = (config: Record<string, any>, path: string = '') => {
    return Object.entries(config).map(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        return (
          <div key={currentPath} className="mb-4">
            <div className="font-medium mb-2">{key}:</div>
            <div className="pl-4 border-l-2 border-border">
              {Array.isArray(value) ? (
                value.length === 0 ? (
                  <div className="text-muted-foreground">Empty array</div>
                ) : (
                  <>
                    {value.map((item, index) => (
                      <div key={`${currentPath}.${index}`} className="mb-2">
                        <div className="font-medium">[{index}]:</div>
                        <div className="pl-4">
                          {typeof item === 'object' && item !== null ? (
                            renderConfig(item, `${currentPath}[${index}]`)
                          ) : (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">value:</span>
                              <span>{formatConfigValue(item)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )
              ) : (
                renderConfig(value, currentPath)
              )}
            </div>
          </div>
        );
      }
      
      return (
        <div key={currentPath} className="flex justify-between mb-2">
          <span className="text-muted-foreground">{key}:</span>
          <span>{formatConfigValue(value)}</span>
        </div>
      );
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Configuration</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied
            </>
          ) : (
            <>
              <Clipboard className="h-4 w-4 mr-2" />
              Copy JSON
            </>
          )}
        </Button>
      </div>
      
      <Card className="p-4">
        <ScrollArea className="h-[400px]">
          {Object.keys(agent.config).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No configuration found.
            </div>
          ) : (
            <div className="space-y-2">
              {renderConfig(agent.config)}
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
};

export default AgentConfig;
