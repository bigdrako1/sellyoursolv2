import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Filter, Check, AlertTriangle, Trash2, Save, TrendingUp } from 'lucide-react';
import RiskScoring from '../RiskScoring';

interface FilterCriteria {
  name: string;
  enabled: boolean;
  value: number;
  min: number;
  max: number;
  unit: string;
  description: string;
}

/**
 * TokenQualityFilter component for filtering tokens based on quality criteria
 */
const TokenQualityFilter = () => {
  const [filters, setFilters] = useState<FilterCriteria[]>([
    {
      name: 'Min Liquidity',
      enabled: true,
      value: 10000,
      min: 1000,
      max: 100000,
      unit: '$',
      description: 'Minimum liquidity required in pools'
    },
    {
      name: 'Min Holders',
      enabled: true,
      value: 50,
      min: 10,
      max: 500,
      unit: '',
      description: 'Minimum number of token holders'
    },
    {
      name: 'Max Risk Score',
      enabled: true,
      value: 60,
      min: 0,
      max: 100,
      unit: '',
      description: 'Maximum acceptable risk score'
    },
    {
      name: 'Min Age (hours)',
      enabled: false,
      value: 0,
      min: 0,
      max: 72,
      unit: 'h',
      description: 'Minimum token age in hours'
    },
    {
      name: 'Max Price Impact',
      enabled: true,
      value: 15,
      min: 1,
      max: 50,
      unit: '%',
      description: 'Maximum price impact for $100 swap'
    }
  ]);

  const [showSuspiciousNames, setShowSuspiciousNames] = useState(false);
  const [showRugPullRisk, setShowRugPullRisk] = useState(true);
  const [honeypotDetection, setHoneypotDetection] = useState(true);
  const [savedFilterName, setSavedFilterName] = useState('');
  const [quickFilterSelected, setQuickFilterSelected] = useState('custom');

  const suspiciousPatterns = [
    'scam', 'rug', 'honeypot', 'ponzi', 'fake', 
    'test', 'airdrop', 'free', 'giveaway'
  ];

  const handleFilterChange = (index: number, field: keyof FilterCriteria, value: any) => {
    const newFilters = [...filters];
    newFilters[index] = {
      ...newFilters[index],
      [field]: value
    };
    setFilters(newFilters);
  };

  const applyQuickFilter = (preset: string) => {
    setQuickFilterSelected(preset);
    
    let newFilters = [...filters];
    
    switch(preset) {
      case 'conservative':
        newFilters = newFilters.map(filter => {
          if (filter.name === 'Min Liquidity') return { ...filter, enabled: true, value: 50000 };
          if (filter.name === 'Min Holders') return { ...filter, enabled: true, value: 100 };
          if (filter.name === 'Max Risk Score') return { ...filter, enabled: true, value: 40 };
          if (filter.name === 'Min Age (hours)') return { ...filter, enabled: true, value: 24 };
          if (filter.name === 'Max Price Impact') return { ...filter, enabled: true, value: 5 };
          return filter;
        });
        setShowSuspiciousNames(true);
        setShowRugPullRisk(true);
        setHoneypotDetection(true);
        break;
      
      case 'balanced':
        newFilters = newFilters.map(filter => {
          if (filter.name === 'Min Liquidity') return { ...filter, enabled: true, value: 10000 };
          if (filter.name === 'Min Holders') return { ...filter, enabled: true, value: 50 };
          if (filter.name === 'Max Risk Score') return { ...filter, enabled: true, value: 60 };
          if (filter.name === 'Min Age (hours)') return { ...filter, enabled: false, value: 0 };
          if (filter.name === 'Max Price Impact') return { ...filter, enabled: true, value: 15 };
          return filter;
        });
        setShowSuspiciousNames(true);
        setShowRugPullRisk(true);
        setHoneypotDetection(true);
        break;
      
      case 'aggressive':
        newFilters = newFilters.map(filter => {
          if (filter.name === 'Min Liquidity') return { ...filter, enabled: true, value: 5000 };
          if (filter.name === 'Min Holders') return { ...filter, enabled: true, value: 20 };
          if (filter.name === 'Max Risk Score') return { ...filter, enabled: true, value: 75 };
          if (filter.name === 'Min Age (hours)') return { ...filter, enabled: false, value: 0 };
          if (filter.name === 'Max Price Impact') return { ...filter, enabled: true, value: 25 };
          return filter;
        });
        setShowSuspiciousNames(false);
        setShowRugPullRisk(true);
        setHoneypotDetection(true);
        break;
      
      case 'custom':
        // Keep current settings
        break;
    }
    
    setFilters(newFilters);
  };

  const saveFilterPreset = () => {
    // In a real implementation, this would save to user settings in Supabase
    console.log('Filter preset saved:', savedFilterName, filters);
    // Show a toast notification or success message
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Token Quality Filters
          </CardTitle>
          <CardDescription>
            Set token quality filters to detect promising tokens and filter out potential scams
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {/* Quick Filter Presets */}
            <div className="space-y-2">
              <Label>Quick Filter Presets</Label>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  className={`cursor-pointer px-3 py-1 ${quickFilterSelected === 'conservative' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-500/20 hover:bg-blue-500/30'}`} 
                  onClick={() => applyQuickFilter('conservative')}
                >
                  Conservative
                </Badge>
                <Badge 
                  className={`cursor-pointer px-3 py-1 ${quickFilterSelected === 'balanced' ? 'bg-green-500 hover:bg-green-600' : 'bg-green-500/20 hover:bg-green-500/30'}`} 
                  onClick={() => applyQuickFilter('balanced')}
                >
                  Balanced
                </Badge>
                <Badge 
                  className={`cursor-pointer px-3 py-1 ${quickFilterSelected === 'aggressive' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-orange-500/20 hover:bg-orange-500/30'}`} 
                  onClick={() => applyQuickFilter('aggressive')}
                >
                  Aggressive
                </Badge>
                <Badge 
                  className={`cursor-pointer px-3 py-1 ${quickFilterSelected === 'custom' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-purple-500/20 hover:bg-purple-500/30'}`} 
                  onClick={() => applyQuickFilter('custom')}
                >
                  Custom
                </Badge>
              </div>
            </div>
            
            {/* Filter Sliders */}
            <div className="space-y-4">
              <Label>Filter Criteria</Label>
              {filters.map((filter, index) => (
                <div key={filter.name} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5 flex items-center">
                    <Switch
                      checked={filter.enabled}
                      onCheckedChange={(checked) => handleFilterChange(index, 'enabled', checked)}
                      className="mr-2"
                    />
                    <span className={`text-sm ${!filter.enabled ? 'text-gray-500' : ''}`}>
                      {filter.name}
                    </span>
                  </div>
                  <div className="col-span-5">
                    <Slider
                      value={[filter.value]}
                      min={filter.min}
                      max={filter.max}
                      step={filter.name.includes('Liquidity') ? 1000 : 1}
                      onValueChange={(values) => handleFilterChange(index, 'value', values[0])}
                      disabled={!filter.enabled}
                      className="[&>.SliderTrack]:bg-trading-highlight/20 [&>.SliderRange]:bg-trading-highlight"
                    />
                  </div>
                  <div className="col-span-2 text-right">
                    <span className={`text-sm ${!filter.enabled ? 'text-gray-500' : ''}`}>
                      {filter.unit === '$' ? '$' : ''}{filter.value.toLocaleString()}{filter.unit !== '$' ? filter.unit : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Additional Security Filters */}
            <div className="space-y-4">
              <Label>Security Filters</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm">Filter suspicious token names</span>
                  </div>
                  <Switch 
                    checked={showSuspiciousNames} 
                    onCheckedChange={setShowSuspiciousNames}
                  />
                </div>
                
                {showSuspiciousNames && (
                  <div className="ml-6 text-xs text-gray-400 flex flex-wrap gap-1 mt-1">
                    <span>Filtering:</span>
                    {suspiciousPatterns.map(pattern => (
                      <Badge key={pattern} variant="outline" className="text-xs bg-yellow-500/10 border-yellow-500/20">
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-sm">Rug pull risk detection</span>
                </div>
                <Switch 
                  checked={showRugPullRisk} 
                  onCheckedChange={setShowRugPullRisk}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-sm">Honeypot detection</span>
                </div>
                <Switch 
                  checked={honeypotDetection} 
                  onCheckedChange={setHoneypotDetection}
                />
              </div>
            </div>
            
            {/* Save Filter Preset */}
            <div className="pt-2 border-t border-gray-700/30">
              <div className="flex gap-2">
                <Input 
                  placeholder="Preset name" 
                  value={savedFilterName}
                  onChange={(e) => setSavedFilterName(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={saveFilterPreset} 
                  disabled={!savedFilterName.trim()}
                  className="bg-trading-highlight hover:bg-trading-highlight/80"
                >
                  <Save className="h-4 w-4 mr-1" /> Save Preset
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenQualityFilter;
