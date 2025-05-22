/**
 * Dialog for updating agent configuration.
 */
import { useState, useEffect } from 'react';
import { Agent } from '../../services/tradingAgentService';
import { useTradingAgentStore } from '../../store/tradingAgentStore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface UpdateAgentDialogProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
}

const UpdateAgentDialog = ({ agent, isOpen, onClose }: UpdateAgentDialogProps) => {
  const { toast } = useToast();
  const { updateAgent } = useTradingAgentStore();
  
  const [name, setName] = useState(agent.name);
  const [configJson, setConfigJson] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName(agent.name);
      setConfigJson(JSON.stringify(agent.config, null, 2));
    }
  }, [isOpen, agent]);
  
  // Function to handle form submission
  const handleSubmit = async () => {
    // Validate form
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Agent name is required.',
        variant: 'destructive',
      });
      return;
    }
    
    // Parse config JSON
    let config = {};
    try {
      config = JSON.parse(configJson);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Invalid JSON in configuration.',
        variant: 'destructive',
      });
      return;
    }
    
    // Update agent
    setIsUpdating(true);
    try {
      const updatedAgent = await updateAgent(agent.id, name, config);
      
      if (updatedAgent) {
        toast({
          title: 'Success',
          description: `Agent "${name}" updated successfully.`,
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update agent.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Update Agent</DialogTitle>
          <DialogDescription>
            Update the configuration for agent "{agent.name}".
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter agent name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="config">Configuration (JSON)</Label>
            <Textarea
              id="config"
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              placeholder="{}"
              rows={10}
            />
            <p className="text-xs text-muted-foreground">
              Edit the agent configuration as a JSON object.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Agent'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateAgentDialog;
