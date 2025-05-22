/**
 * Modal for creating a new agent.
 */
import { useState, useEffect } from 'react';
import { useTradingAgentStore } from '../../store/tradingAgentStore';
import { AgentType } from '../../services/tradingAgentService';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateAgentModal = ({ isOpen, onClose }: CreateAgentModalProps) => {
  const { toast } = useToast();
  const { 
    agentTypes, 
    isLoadingAgentTypes, 
    fetchAgentTypes, 
    fetchAgentType,
    createAgent 
  } = useTradingAgentStore();
  
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [configJson, setConfigJson] = useState('{}');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAgentType, setSelectedAgentType] = useState<AgentType | null>(null);
  const [isLoadingAgentType, setIsLoadingAgentType] = useState(false);
  
  // Fetch agent types on mount
  useEffect(() => {
    if (isOpen && agentTypes.length === 0) {
      fetchAgentTypes();
    }
  }, [isOpen, agentTypes.length, fetchAgentTypes]);
  
  // Fetch agent type details when a type is selected
  useEffect(() => {
    const fetchTypeDetails = async () => {
      if (!selectedType) {
        setSelectedAgentType(null);
        return;
      }
      
      setIsLoadingAgentType(true);
      try {
        const agentType = await fetchAgentType(selectedType);
        setSelectedAgentType(agentType);
        
        // Set default config if available
        if (agentType?.configSchema) {
          // In a real implementation, we would generate a default config from the schema
          // For now, we'll just use an empty object
          setConfigJson('{}');
        }
      } catch (error) {
        console.error(`Error fetching agent type ${selectedType}:`, error);
      } finally {
        setIsLoadingAgentType(false);
      }
    };
    
    fetchTypeDetails();
  }, [selectedType, fetchAgentType]);
  
  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setSelectedType('');
      setConfigJson('{}');
      setIsCreating(false);
      setSelectedAgentType(null);
    }
  }, [isOpen]);
  
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
    
    if (!selectedType) {
      toast({
        title: 'Error',
        description: 'Agent type is required.',
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
    
    // Create agent
    setIsCreating(true);
    try {
      const agent = await createAgent(name, selectedType, config);
      
      if (agent) {
        toast({
          title: 'Success',
          description: `Agent "${name}" created successfully.`,
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create agent.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  // Function to get agent type description
  const getAgentTypeDescription = (type: string) => {
    const agentType = agentTypes.find(t => t.type === type);
    return agentType?.description || '';
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>
            Create a new trading agent to automate your trading strategies.
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
            <Label htmlFor="type">Agent Type</Label>
            <Select
              value={selectedType}
              onValueChange={setSelectedType}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select agent type" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingAgentTypes ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </div>
                ) : agentTypes.length === 0 ? (
                  <div className="p-2 text-center text-muted-foreground">
                    No agent types found
                  </div>
                ) : (
                  agentTypes.map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      {type.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            {selectedType && (
              <p className="text-sm text-muted-foreground mt-1">
                {getAgentTypeDescription(selectedType)}
              </p>
            )}
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
              Enter the agent configuration as a JSON object.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Agent'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAgentModal;
