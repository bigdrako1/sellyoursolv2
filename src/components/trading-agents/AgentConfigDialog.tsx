import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Save, X } from 'lucide-react';
import { TradingAgent, AgentConfig, AgentConfigUpdate } from '@/services/tradingAgentsService';

interface AgentConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: TradingAgent | null;
  onSave: (config: AgentConfig | AgentConfigUpdate) => Promise<void>;
  isLoading?: boolean;
}

interface ConfigField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'select' | 'percentage';
  label: string;
  description?: string;
  min?: number;
  max?: number;
  options?: string[];
  required?: boolean;
}

const AgentConfigDialog: React.FC<AgentConfigDialogProps> = ({
  isOpen,
  onClose,
  agent,
  onSave,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!agent;

  // Configuration schemas for different agent types
  const getConfigSchema = (agentType: string): ConfigField[] => {
    switch (agentType) {
      case 'copy_trading':
        return [
          { key: 'max_positions', type: 'number', label: 'Max Positions', description: 'Maximum number of open positions', min: 1, max: 50, required: true },
          { key: 'usdc_size', type: 'number', label: 'USDC Size', description: 'USDC size per trade', min: 10, max: 10000, required: true },
          { key: 'days_back', type: 'number', label: 'Days Back', description: 'Days back to analyze transactions', min: 0, max: 7, required: true },
          { key: 'tp_multiplier', type: 'number', label: 'Take Profit Multiplier', description: 'Take profit multiplier', min: 1.1, max: 10, required: true },
          { key: 'sl_percentage', type: 'percentage', label: 'Stop Loss %', description: 'Stop loss percentage (1-90)', min: 1, max: 90, required: true }
        ];
      case 'sol_scanner':
        return [
          { key: 'new_token_hours', type: 'number', label: 'New Token Hours', description: 'Hours to look back for new tokens', min: 1, max: 24, required: true },
          { key: 'min_liquidity', type: 'number', label: 'Min Liquidity', description: 'Minimum liquidity threshold', min: 1000, max: 1000000, required: true },
          { key: 'max_top10_holder_percent', type: 'percentage', label: 'Max Top 10 Holder %', description: 'Maximum top 10 holder percentage (1-90)', min: 1, max: 90, required: true },
          { key: 'drop_if_no_website', type: 'boolean', label: 'Drop if No Website', description: 'Drop tokens without website' },
          { key: 'drop_if_no_twitter', type: 'boolean', label: 'Drop if No Twitter', description: 'Drop tokens without Twitter' }
        ];
      case 'hyperliquid_trading':
        return [
          { key: 'order_usd_size', type: 'number', label: 'Order USD Size', description: 'Order size in USD', min: 1, max: 1000, required: true },
          { key: 'leverage', type: 'number', label: 'Leverage', description: 'Trading leverage', min: 1, max: 10, required: true },
          { key: 'timeframe', type: 'select', label: 'Timeframe', description: 'Trading timeframe', options: ['1m', '5m', '15m', '1h', '4h', '1d'], required: true },
          { key: 'liquidation_threshold', type: 'number', label: 'Liquidation Threshold', description: 'Liquidation threshold', min: 1000, max: 1000000, required: true }
        ];
      case 'sniper':
        return [
          { key: 'usdc_size', type: 'number', label: 'USDC Size', description: 'USDC size per snipe', min: 10, max: 10000, required: true },
          { key: 'max_positions', type: 'number', label: 'Max Positions', description: 'Maximum open positions', min: 1, max: 20, required: true },
          { key: 'sell_at_multiple', type: 'number', label: 'Sell at Multiple', description: 'Sell at multiple', min: 1.5, max: 20, required: true },
          { key: 'sell_amount_perc', type: 'percentage', label: 'Sell Amount %', description: 'Percentage to sell (1-100)', min: 1, max: 100, required: true },
          { key: 'max_top10_holder_percent', type: 'percentage', label: 'Max Top 10 Holder %', description: 'Max top 10 holder % (1-90)', min: 1, max: 90, required: true },
          { key: 'drop_if_mutable_metadata', type: 'boolean', label: 'Drop if Mutable Metadata', description: 'Drop if mutable metadata' }
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (isEditing && agent) {
        setFormData({
          name: agent.name,
          agent_type: agent.agent_type,
          ...agent.config
        });
      } else {
        setFormData({
          name: '',
          agent_type: 'copy_trading',
          // Default values will be set when agent_type changes
        });
      }
      setErrors({});
    }
  }, [isOpen, agent, isEditing]);

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Agent name is required';
    }

    if (!isEditing && !formData.agent_type) {
      newErrors.agent_type = 'Agent type is required';
    }

    const schema = getConfigSchema(formData.agent_type);
    schema.forEach(field => {
      if (field.required && (formData[field.key] === undefined || formData[field.key] === '')) {
        newErrors[field.key] = `${field.label} is required`;
      }

      if ((field.type === 'number' || field.type === 'percentage') && formData[field.key] !== undefined) {
        const value = Number(formData[field.key]);
        if (isNaN(value)) {
          newErrors[field.key] = `${field.label} must be a number`;
        } else {
          if (field.min !== undefined && value < field.min) {
            newErrors[field.key] = `${field.label} must be at least ${field.min}`;
          }
          if (field.max !== undefined && value > field.max) {
            newErrors[field.key] = `${field.label} must be at most ${field.max}`;
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const { name, agent_type, ...config } = formData;

      if (isEditing) {
        await onSave({ name, config });
      } else {
        await onSave({ name, agent_type, config });
      }

      onClose();
    } catch (error) {
      console.error('Error saving agent configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (field: ConfigField) => {
    const value = formData[field.key];
    const error = errors[field.key];

    switch (field.type) {
      case 'boolean':
        return (
          <div key={field.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.key} className="text-white">{field.label}</Label>
              <Switch
                id={field.key}
                checked={value || false}
                onCheckedChange={(checked) => handleInputChange(field.key, checked)}
              />
            </div>
            {field.description && (
              <p className="text-xs text-gray-400">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key} className="text-white">{field.label}</Label>
            <Select value={value || ''} onValueChange={(val) => handleInputChange(field.key, val)}>
              <SelectTrigger className="bg-trading-darkAccent border-white/10">
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent className="bg-trading-darkAccent border-white/10">
                {field.options?.map(option => (
                  <SelectItem key={option} value={option} className="text-white hover:bg-white/10">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && (
              <p className="text-xs text-gray-400">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        );

      case 'percentage':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key} className="text-white">{field.label}</Label>
            <div className="relative">
              <Input
                id={field.key}
                type="number"
                value={value || ''}
                onChange={(e) => handleInputChange(field.key, Number(e.target.value))}
                className="bg-trading-darkAccent border-white/10 text-white pr-8"
                min={field.min}
                max={field.max}
                step="1"
                placeholder="Enter percentage"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
            {field.description && (
              <p className="text-xs text-gray-400">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        );

      default:
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key} className="text-white">{field.label}</Label>
            <Input
              id={field.key}
              type={field.type === 'number' ? 'number' : 'text'}
              value={value || ''}
              onChange={(e) => handleInputChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
              className="bg-trading-darkAccent border-white/10 text-white"
              min={field.min}
              max={field.max}
              step={field.type === 'number' ? 'any' : undefined}
            />
            {field.description && (
              <p className="text-xs text-gray-400">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        );
    }
  };

  const configSchema = getConfigSchema(formData.agent_type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-trading-darkAccent border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Agent Configuration' : 'Create New Trading Agent'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {isEditing
              ? 'Modify the configuration for your trading agent'
              : 'Configure a new automated trading agent'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Agent Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Agent Name</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="bg-trading-darkAccent border-white/10 text-white"
              placeholder="Enter agent name"
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
          </div>

          {/* Agent Type (only for new agents) */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="agent_type" className="text-white">Agent Type</Label>
              <Select value={formData.agent_type || ''} onValueChange={(val) => handleInputChange('agent_type', val)}>
                <SelectTrigger className="bg-trading-darkAccent border-white/10">
                  <SelectValue placeholder="Select agent type" />
                </SelectTrigger>
                <SelectContent className="bg-trading-darkAccent border-white/10">
                  <SelectItem value="copy_trading" className="text-white hover:bg-white/10">Copy Trading Bot</SelectItem>
                  <SelectItem value="sol_scanner" className="text-white hover:bg-white/10">SOL Scanner</SelectItem>
                  <SelectItem value="hyperliquid_trading" className="text-white hover:bg-white/10">HyperLiquid Trading Bot</SelectItem>
                  <SelectItem value="sniper" className="text-white hover:bg-white/10">Sniper Bot</SelectItem>
                </SelectContent>
              </Select>
              {errors.agent_type && <p className="text-xs text-red-400">{errors.agent_type}</p>}
            </div>
          )}

          {/* Configuration Fields */}
          {configSchema.length > 0 && (
            <div className="space-y-4 border-t border-white/10 pt-4">
              <h4 className="text-lg font-medium text-white">Configuration</h4>
              {configSchema.map(renderField)}
            </div>
          )}

          {Object.keys(errors).length > 0 && (
            <Alert className="bg-red-500/20 border-red-500/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-300">
                Please fix the errors above before saving.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="bg-trading-darkAccent border-white/10 text-white hover:bg-white/10"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-trading-highlight hover:bg-trading-highlight/80"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : isEditing ? 'Update Agent' : 'Create Agent'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgentConfigDialog;
