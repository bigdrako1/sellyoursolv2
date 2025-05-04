
/**
 * Trade Grading Utilities for SellYourSOL V2 AI
 * Provides functions to analyze trade performance and offer improvement tips
 */

export type GradeLevel = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface TradeGrade {
  score: number;
  grade: GradeLevel;
  strengths: string[];
  weaknesses: string[];
  tips: string[];
}

/**
 * Calculate a grade based on a numeric score
 * @param score Numeric score (0-100)
 * @returns Letter grade
 */
export const calculateGrade = (score: number): GradeLevel => {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  if (score >= 55) return 'D';
  return 'F';
};

/**
 * Grade trading performance based on various metrics
 * @param metrics Trading metrics to evaluate
 * @returns Grading results with strengths, weaknesses and improvement tips
 */
export const gradeTradePerformance = (metrics: {
  winRate: number;
  profitFactor: number;
  averageReturn: number;
  maxDrawdown: number;
  tradeFrequency: number;
  successRate: number;
  sharpeRatio: number;
}): TradeGrade => {
  const { winRate, profitFactor, averageReturn, maxDrawdown, tradeFrequency, successRate, sharpeRatio } = metrics;
  
  // Calculate weighted score
  const score = Math.min(100, Math.max(0, 
    winRate * 0.25 + 
    profitFactor * 10 * 0.2 + 
    (averageReturn * 100) * 0.15 + 
    (100 - maxDrawdown * 2) * 0.15 + 
    Math.min(100, tradeFrequency * 0.5) * 0.05 +
    successRate * 0.1 +
    sharpeRatio * 10 * 0.1
  ));
  
  const grade = calculateGrade(score);
  
  // Identify strengths
  const strengths: string[] = [];
  if (winRate > 65) strengths.push("High win rate");
  if (profitFactor > 1.5) strengths.push("Excellent profit factor");
  if (averageReturn > 0.03) strengths.push("Strong average returns");
  if (maxDrawdown < 20) strengths.push("Managed risk with low drawdowns");
  if (sharpeRatio > 1.5) strengths.push("Good risk-adjusted returns");
  
  // Identify weaknesses
  const weaknesses: string[] = [];
  if (winRate < 50) weaknesses.push("Low win rate");
  if (profitFactor < 1.2) weaknesses.push("Low profit factor");
  if (averageReturn < 0.01) weaknesses.push("Low average returns");
  if (maxDrawdown > 30) weaknesses.push("High drawdowns indicate risk management issues");
  if (sharpeRatio < 1) weaknesses.push("Poor risk-adjusted returns");
  
  // Generate improvement tips
  const tips: string[] = [];
  if (winRate < 50) {
    tips.push("Focus on improving entry criteria to increase win rate");
    tips.push("Consider using smaller position sizes until win rate improves");
  }
  
  if (profitFactor < 1.2) {
    tips.push("Allow profitable trades to run longer");
    tips.push("Cut losing trades more quickly");
  }
  
  if (maxDrawdown > 30) {
    tips.push("Implement stricter stop-loss rules");
    tips.push("Reduce position size to limit drawdowns");
  }
  
  if (sharpeRatio < 1) {
    tips.push("Diversify strategies to improve risk-adjusted returns");
    tips.push("Focus on consistent small wins rather than occasional large gains");
  }
  
  if (tradeFrequency < 10) {
    tips.push("Increase trading activity to gather more data points");
  } else if (tradeFrequency > 100) {
    tips.push("Consider reducing trade frequency to focus on quality setups");
  }
  
  // Always provide at least one tip
  if (tips.length === 0) {
    tips.push("Continue refining your strategy and maintain disciplined execution");
  }
  
  return {
    score,
    grade,
    strengths: strengths.length > 0 ? strengths : ["No significant strengths identified"],
    weaknesses: weaknesses.length > 0 ? weaknesses : ["No significant weaknesses identified"],
    tips
  };
};

/**
 * Generate comparison between two time periods
 * @param currentMetrics Current period metrics
 * @param previousMetrics Previous period metrics
 * @returns Object with improvement percentages
 */
export const compareTradePerformance = (
  currentMetrics: Record<string, number>,
  previousMetrics: Record<string, number>
): Record<string, number> => {
  const comparison: Record<string, number> = {};
  
  for (const [key, currentValue] of Object.entries(currentMetrics)) {
    if (previousMetrics.hasOwnProperty(key)) {
      const previousValue = previousMetrics[key];
      if (previousValue === 0) {
        comparison[key] = currentValue > 0 ? 100 : 0;
      } else {
        const percentChange = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
        comparison[key] = parseFloat(percentChange.toFixed(2));
      }
    }
  }
  
  return comparison;
};
