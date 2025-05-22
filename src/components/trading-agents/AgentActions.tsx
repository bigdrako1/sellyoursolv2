/**
 * Component for executing agent actions.
 */
import { useState } from 'react';
import { Agent } from '../../services/tradingAgentService';
import { useTradingAgentStore } from '../../store/tradingAgentStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AgentActionsProps {
  agent: Agent;
}

const AgentActions = ({ agent }: AgentActionsProps) => {
  const { toast } = useToast();
  const { executeAgentAction } = useTradingAgentStore();
  
  const [actionType, setActionType] = useState('');
  const [parameters, setParameters] = useState('{}');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Function to execute action
  const handleExecuteAction = async () => {
    if (!actionType.trim()) {
      toast({
        title: 'Error',
        description: 'Action type is required.',
        variant: 'destructive',
      });
      return;
    }
    
    let parsedParameters = {};
    try {
      parsedParameters = parameters.trim() ? JSON.parse(parameters) : {};
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Invalid JSON in parameters.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsExecuting(true);
    setResult(null);
    
    try {
      const response = await executeAgentAction(agent.id, actionType, parsedParameters);
      setResult(response);
      
      toast({
        title: response.success ? 'Success' : 'Error',
        description: response.message || (response.success ? 'Action executed successfully.' : 'Action execution failed.'),
        variant: response.success ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to execute action.',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Function to get predefined actions based on agent type
  const getPredefinedActions = () => {
    switch (agent.type) {
      case 'copy_trading':
        return [
          { type: 'add_wallet', label: 'Add Wallet', parameters: { wallet: 'wallet_address_here' } },
          { type: 'remove_wallet', label: 'Remove Wallet', parameters: { wallet: 'wallet_address_here' } },
          { type: 'close_position', label: 'Close Position', parameters: { position_id: 'position_id_here' } },
          { type: 'get_trending_tokens', label: 'Get Trending Tokens', parameters: {} },
        ];
        
      case 'liquidation':
        return [
          { type: 'add_symbol', label: 'Add Symbol', parameters: { symbol: 'BTC', config: { liquidation_threshold: 1000000, time_window_mins: 5 } } },
          { type: 'remove_symbol', label: 'Remove Symbol', parameters: { symbol: 'BTC' } },
          { type: 'update_symbol_config', label: 'Update Symbol Config', parameters: { symbol: 'BTC', config: { liquidation_threshold: 1000000 } } },
          { type: 'close_position', label: 'Close Position', parameters: { position_id: 'position_id_here' } },
          { type: 'get_liquidation_data', label: 'Get Liquidation Data', parameters: { symbol: 'BTC', time_window_mins: 5 } },
        ];
        
      case 'scanner':
        return [
          { type: 'get_trending_tokens', label: 'Get Trending Tokens', parameters: {} },
          { type: 'get_new_tokens', label: 'Get New Tokens', parameters: {} },
          { type: 'get_top_traders', label: 'Get Top Traders', parameters: {} },
          { type: 'add_super_cycle_token', label: 'Add Super Cycle Token', parameters: { token_address: 'token_address_here' } },
          { type: 'remove_super_cycle_token', label: 'Remove Super Cycle Token', parameters: { token_address: 'token_address_here' } },
          { type: 'filter_promising_tokens', label: 'Filter Promising Tokens', parameters: { min_liquidity: 10000, min_volume: 5000 } },
        ];
        
      case 'sniper':
        return [
          { type: 'get_potential_tokens', label: 'Get Potential Tokens', parameters: {} },
          { type: 'add_to_do_not_trade_list', label: 'Add to Do Not Trade List', parameters: { token_address: 'token_address_here' } },
          { type: 'remove_from_do_not_trade_list', label: 'Remove from Do Not Trade List', parameters: { token_address: 'token_address_here' } },
          { type: 'close_position', label: 'Close Position', parameters: { position_id: 'position_id_here' } },
        ];
        
      default:
        return [];
    }
  };
  
  const predefinedActions = getPredefinedActions();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Execute Action</CardTitle>
          <CardDescription>
            Execute a custom action on the agent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="actionType">Action Type</Label>
            <Input
              id="actionType"
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              placeholder="Enter action type"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="parameters">Parameters (JSON)</Label>
            <Textarea
              id="parameters"
              value={parameters}
              onChange={(e) => setParameters(e.target.value)}
              placeholder="{}"
              rows={5}
            />
          </div>
          
          <Button
            onClick={handleExecuteAction}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : (
              'Execute Action'
            )}
          </Button>
        </CardContent>
      </Card>
      
      {predefinedActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Predefined Actions</CardTitle>
            <CardDescription>
              Common actions for {agent.type.replace(/_/g, ' ')} agents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predefinedActions.map((action) => (
                <Button
                  key={action.type}
                  variant="outline"
                  onClick={() => {
                    setActionType(action.type);
                    setParameters(JSON.stringify(action.parameters, null, 2));
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Action Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[300px]">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgentActions;
