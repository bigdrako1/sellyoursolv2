
import { Token } from "@/types/token.types";
import { toast } from "@/hooks/use-toast";

export interface TokenQualityConfig {
  minLiquidity: number;
  minHolders: number;
  maxRiskLevel: number;
}

// Default quality filter configuration
const defaultQualityConfig: TokenQualityConfig = {
  minLiquidity: 10000,
  minHolders: 50,
  maxRiskLevel: 70
};

/**
 * Calculate token quality score (0-100)
 */
export const calculateTokenQualityScore = (token: Partial<Token>): number => {
  let score = 50; // Start with neutral score
  
  // Liquidity factor (0-20 points)
  if (token.liquidity) {
    if (token.liquidity >= 1000000) score += 20;
    else if (token.liquidity >= 500000) score += 15;
    else if (token.liquidity >= 100000) score += 10;
    else if (token.liquidity >= 50000) score += 5;
    else if (token.liquidity < 25000) score -= 10;
  }
  
  // Holders factor (0-15 points)
  if (token.holders) {
    if (token.holders >= 1000) score += 15;
    else if (token.holders >= 500) score += 10;
    else if (token.holders >= 100) score += 5;
    else if (token.holders < 25) score -= 10;
  }
  
  // Risk level factor (0-20 points)
  if (token.riskLevel !== undefined) {
    if (token.riskLevel < 20) score += 20;
    else if (token.riskLevel < 40) score += 10;
    else if (token.riskLevel < 60) score += 0;
    else if (token.riskLevel < 80) score -= 10;
    else score -= 20;
  }
  
  // Trending factor (0-10 points)
  if (token.trendingScore) {
    if (Array.isArray(token.trendingScore)) {
      if (token.trendingScore.length > 0) score += 10;
    } else if (token.trendingScore > 0) {
      score += 10;
    }
  }
  
  // Ensure score stays within 0-100 range
  return Math.max(0, Math.min(100, score));
};

/**
 * Check if a token meets basic quality requirements
 */
export const isQualityToken = (
  token: Partial<Token>, 
  config: TokenQualityConfig = defaultQualityConfig
): boolean => {
  // Check minimum liquidity
  if (token.liquidity !== undefined && token.liquidity < config.minLiquidity) {
    console.log(`Token ${token.symbol} rejected: Low liquidity $${token.liquidity}`);
    return false;
  }
  
  // Check minimum holders
  if (token.holders !== undefined && token.holders < config.minHolders) {
    console.log(`Token ${token.symbol} rejected: Low holder count ${token.holders}`);
    return false;
  }
  
  // Check risk level (if available)
  if (token.riskLevel !== undefined && token.riskLevel > config.maxRiskLevel) {
    console.log(`Token ${token.symbol} rejected: High risk level ${token.riskLevel}`);
    return false;
  }
  
  return true;
};

/**
 * Monitor a token for significant events
 */
export const monitorToken = async (token: Token): Promise<void> => {
  try {
    console.log(`Starting monitoring for ${token.symbol} (${token.address})`);
    
    // Calculate quality score if not already present
    if (!token.qualityScore) {
      token.qualityScore = calculateTokenQualityScore(token);
    }
    
    // Check if token meets quality requirements
    if (!isQualityToken(token)) {
      console.log(`Token ${token.symbol} doesn't meet quality requirements`);
      return;
    }
    
    // Example: Alert on high quality tokens
    if (token.qualityScore >= 80) {
      toast({
        title: "High Quality Token Detected",
        description: `${token.name} (${token.symbol}) - Quality Score: ${token.qualityScore}`,
        variant: "default",
      });
    }
    
    // Future: Implement real-time monitoring logic here
    
  } catch (error) {
    console.error("Error monitoring token:", error);
  }
};

/**
 * Get a human-readable quality summary
 */
export const getQualitySummary = (qualityScore: number): string => {
  if (qualityScore >= 80) return "High Quality 🌟";
  if (qualityScore >= 60) return "Good Quality ✅";
  if (qualityScore >= 40) return "Average Quality ⚠️";
  if (qualityScore >= 20) return "Low Quality ⚠️";
  return "Poor Quality ❌";
};

/**
 * Get risk level emoji based on quality score
 */
export const getRiskEmoji = (qualityScore: number): string => {
  if (qualityScore >= 80) return "🟢"; // Low risk
  if (qualityScore >= 60) return "🟡"; // Medium risk
  if (qualityScore >= 40) return "🟠"; // High risk
  return "🔴"; // Very high risk
};
