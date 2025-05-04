
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { gradeTradePerformance, type TradeGrade, type GradeLevel } from "@/utils/gradeUtils";
import { CheckCircle, AlertCircle, Lightbulb } from "lucide-react";

interface TradePerformanceGradeProps {
  metrics: {
    winRate: number;
    profitFactor: number;
    averageReturn: number;
    maxDrawdown: number;
    tradeFrequency: number;
    successRate: number;
    sharpeRatio: number;
  };
}

const TradePerformanceGrade: React.FC<TradePerformanceGradeProps> = ({ metrics }) => {
  const [gradeData, setGradeData] = useState<TradeGrade | null>(null);
  
  useEffect(() => {
    const grade = gradeTradePerformance(metrics);
    setGradeData(grade);
  }, [metrics]);
  
  if (!gradeData) return null;
  
  // Define color based on grade
  const getGradeColor = (grade: GradeLevel): string => {
    switch(grade) {
      case 'A+': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'A': return 'bg-green-400/20 text-green-400 border-green-400/30';
      case 'B': return 'bg-blue-400/20 text-blue-400 border-blue-400/30';
      case 'C': return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30';
      case 'D': return 'bg-orange-400/20 text-orange-400 border-orange-400/30';
      case 'F': return 'bg-red-500/20 text-red-500 border-red-500/30';
      default: return 'bg-gray-400/20 text-gray-400 border-gray-400/30';
    }
  };
  
  return (
    <Card className="trading-card p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold">Trading Performance Grade</h3>
          <p className="text-sm text-gray-400">Analysis of your trading strategy effectiveness</p>
        </div>
        <Badge variant="outline" className={`text-lg px-3 py-1 ${getGradeColor(gradeData.grade)}`}>
          {gradeData.grade}
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-trading-darkAccent p-3 rounded-md text-center">
          <div className="text-sm text-gray-400">Score</div>
          <div className="text-xl font-bold">{Math.round(gradeData.score)}/100</div>
        </div>
        <div className="bg-trading-darkAccent p-3 rounded-md text-center">
          <div className="text-sm text-gray-400">Win Rate</div>
          <div className="text-xl font-bold">{metrics.winRate.toFixed(1)}%</div>
        </div>
        <div className="bg-trading-darkAccent p-3 rounded-md text-center">
          <div className="text-sm text-gray-400">Profit Factor</div>
          <div className="text-xl font-bold">{metrics.profitFactor.toFixed(2)}</div>
        </div>
      </div>
      
      <Tabs defaultValue="strengths">
        <TabsList className="bg-trading-dark w-full mb-4">
          <TabsTrigger value="strengths" className="flex-1">Strengths</TabsTrigger>
          <TabsTrigger value="weaknesses" className="flex-1">Weaknesses</TabsTrigger>
          <TabsTrigger value="tips" className="flex-1">Improvement Tips</TabsTrigger>
        </TabsList>
        
        <TabsContent value="strengths" className="mt-0">
          <div className="space-y-2">
            {gradeData.strengths.map((strength, index) => (
              <div key={index} className="flex items-start gap-2 bg-trading-darkAccent/50 p-2 rounded-md">
                <CheckCircle className="text-green-500 mt-0.5" size={16} />
                <span>{strength}</span>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="weaknesses" className="mt-0">
          <div className="space-y-2">
            {gradeData.weaknesses.map((weakness, index) => (
              <div key={index} className="flex items-start gap-2 bg-trading-darkAccent/50 p-2 rounded-md">
                <AlertCircle className="text-orange-500 mt-0.5" size={16} />
                <span>{weakness}</span>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="tips" className="mt-0">
          <div className="space-y-2">
            {gradeData.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2 bg-trading-darkAccent/50 p-2 rounded-md">
                <Lightbulb className="text-trading-highlight mt-0.5" size={16} />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default TradePerformanceGrade;
