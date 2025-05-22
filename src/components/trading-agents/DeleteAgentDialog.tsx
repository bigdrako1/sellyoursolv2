/**
 * Dialog for confirming agent deletion.
 */
import { useState } from 'react';
import { Agent } from '../../services/tradingAgentService';
import { useTradingAgentStore } from '../../store/tradingAgentStore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface DeleteAgentDialogProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
}

const DeleteAgentDialog = ({ agent, isOpen, onClose }: DeleteAgentDialogProps) => {
  const { toast } = useToast();
  const { deleteAgent } = useTradingAgentStore();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Function to handle agent deletion
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteAgent(agent.id);
      
      if (success) {
        toast({
          title: 'Success',
          description: `Agent "${agent.name}" deleted successfully.`,
        });
        onClose();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete agent.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete agent.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Agent</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the agent "{agent.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAgentDialog;
