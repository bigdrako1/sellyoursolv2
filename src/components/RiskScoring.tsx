
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Check } from 'lucide-react';

interface RiskFactor {
  name: string;
  score: number; // 0-100, 0 being least risky
  impact: 'high' | 'medium' | 'low';
  description: string;
}

interface RiskScoringProps {
  tokenAddress?: string;
  tokenName?: string;
  tokenSymbol?: string;
  riskFactors?: RiskFactor[];
  overallRiskScore?: number;
}

const RiskScoring: React.FC<RiskScoringProps> = ({ 
  tokenAddress, 
  tokenName = "Unknown Token", 
  tokenSymbol = "???", 
  riskFactors = [],
  overallRiskScore
}) => {
  // If no risk factors provided, use default empty state
  const hasData = riskFactors.length > 0 || overallRiskScore !== undefined;
  
  // Calculate overall risk score if not provided
  const calculatedRiskScore = overallRiskScore !== undefined ? 
    overallRiskScore : 
    riskFactors.length > 0 ? 
      Math.round(riskFactors.reduce((sum, factor) => sum + factor.score, 0) / riskFactors.length) :
      50; // Default to medium risk if no data
  
  // Get risk level and color based on score
  const getRiskLevel = (score: number) => {
    if (score <= 20) return { level: 'Very Low Risk', color: 'bg-green-500', textColor: 'text-green-500' };
    if (score <= 40) return { level: 'Low Risk', color: 'bg-green-400', textColor: 'text-green-400' };
    if (score <= 60) return { level: 'Medium Risk', color: 'bg-yellow-400', textColor: 'text-yellow-400' };
    if (score <= 80) return { level: 'High Risk', color: 'bg-red-400', textColor: 'text-red-400' };
    return { level: 'Extreme Risk', color: 'bg-red-600', textColor: 'text-red-600' };
  };
  
  const riskInfo = getRiskLevel(calculatedRiskScore);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" /> 
          Risk Score Analysis
        </CardTitle>
        <CardDescription>
          {hasData ? 
            `Comprehensive risk assessment for ${tokenName} (${tokenSymbol})` :
            "Enter a token address or symbol to perform risk analysis"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Risk Score */}
        {hasData && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Overall Risk Score</span>
              <Badge className={`${calculatedRiskScore > 60 ? 'bg-red-500' : calculatedRiskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}>
                {calculatedRiskScore}/100
              </Badge>
            </div>
            <Progress 
              value={calculatedRiskScore} 
              className={`h-3 ${riskInfo.color}`}
            />
            <div className="flex justify-between mt-1 text-xs">
              <span className="text-green-500">Safe</span>
              <span className={riskInfo.textColor}>{riskInfo.level}</span>
              <span className="text-red-500">Risky</span>
            </div>
            
            {/* Risk summary alert */}
            <Alert className="mt-4 border-l-4" 
              style={{ borderLeftColor: calculatedRiskScore > 60 ? 'rgb(239, 68, 68)' : 
                                        calculatedRiskScore > 40 ? 'rgb(250, 204, 21)' : 
                                        'rgb(34, 197, 94)' }}
            >
              {calculatedRiskScore > 60 ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : calculatedRiskScore > 40 ? (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ) : (
                <Check className="h-4 w-4 text-green-500" />
              )}
              <AlertDescription>
                {calculatedRiskScore > 80 ? 
                  `${tokenSymbol} shows extremely high risk signals. Exercise extreme caution.` :
                calculatedRiskScore > 60 ?
                  `${tokenSymbol} has multiple high risk factors. Careful consideration advised.` :
                calculatedRiskScore > 40 ?
                  `${tokenSymbol} shows moderate risk. Use caution and research further.` :
                calculatedRiskScore > 20 ?
                  `${tokenSymbol} appears to be low risk, but always verify before investing.` :
                  `${tokenSymbol} shows minimal risk signals. Generally considered safe.`}
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {/* Risk Factors */}
        {riskFactors.length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-medium">Risk Factor Breakdown</h3>
            <div className="space-y-3">
              {riskFactors.map((factor, index) => {
                const factorRisk = getRiskLevel(factor.score);
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ${factorRisk.color} mr-2`}></div>
                        <span className="text-sm">{factor.name}</span>
                      </div>
                      <Badge variant={factor.impact === 'high' ? 'destructive' : 'default'}>
                        {factor.impact} impact
                      </Badge>
                    </div>
                    <Progress value={factor.score} className="h-1.5" />
                    <p className="text-xs text-gray-500">{factor.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {!hasData && (
          <div className="text-center py-8 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No risk data available</p>
            <p className="text-xs mt-1">
              Search for a token to view detailed risk analysis
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RiskScoring;
