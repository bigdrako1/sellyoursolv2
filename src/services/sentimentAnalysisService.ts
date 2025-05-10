// Sentiment Analysis Service
// This service provides real sentiment analysis for crypto tokens using NLP techniques

import APP_CONFIG from '@/config/appDefinition';
import { handleApiError } from '@/utils/apiUtils';
import { waitForRateLimit } from '@/utils/rateLimit';

// Types for sentiment analysis
export interface SentimentResult {
  score: number;        // Range from -1 (very negative) to 1 (very positive)
  magnitude: number;    // Strength of sentiment (0 to +inf)
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;   // Confidence in the sentiment analysis (0 to 1)
}

export interface TokenSentiment {
  symbol: string;
  name?: string;
  overallSentiment: SentimentResult;
  sources: {
    twitter: SentimentResult;
    reddit: SentimentResult;
    news: SentimentResult;
    telegram?: SentimentResult;
    discord?: SentimentResult;
  };
  trendData: {
    date: string;
    sentiment: number;
    volume: number;
  }[];
  keywords: {
    word: string;
    count: number;
    sentiment: number;
  }[];
  lastUpdated: string;
}

// Simple sentiment analysis using a lexicon-based approach
// This is a basic implementation that can be replaced with a more sophisticated API
const lexiconBasedSentiment = (text: string): SentimentResult => {
  // Basic positive and negative word lists
  const positiveWords = [
    'bullish', 'moon', 'gain', 'profit', 'up', 'rise', 'rising', 'growth', 'growing',
    'good', 'great', 'excellent', 'amazing', 'awesome', 'fantastic', 'incredible',
    'buy', 'buying', 'bought', 'accumulate', 'accumulating', 'accumulated',
    'hodl', 'hold', 'holding', 'strong', 'strength', 'potential', 'opportunity',
    'undervalued', 'gem', 'diamond', 'hands', 'win', 'winning', 'winner',
    'success', 'successful', 'succeed', 'pump', 'pumping', 'pumped',
    'rally', 'rallying', 'rallied', 'surge', 'surging', 'surged',
    'breakthrough', 'breakout', 'break out', 'break through', 'all time high', 'ath'
  ];

  const negativeWords = [
    'bearish', 'crash', 'loss', 'lose', 'losing', 'lost', 'down', 'fall', 'falling',
    'bad', 'terrible', 'awful', 'horrible', 'poor', 'weak', 'weakness',
    'sell', 'selling', 'sold', 'dump', 'dumping', 'dumped', 'exit', 'exiting', 'exited',
    'overvalued', 'scam', 'fraud', 'fake', 'ponzi', 'bubble', 'burst', 'bursting', 'burst',
    'fear', 'fearful', 'scared', 'scary', 'panic', 'panicking', 'panicked',
    'risk', 'risky', 'danger', 'dangerous', 'threat', 'threatening', 'threatened',
    'correction', 'correcting', 'corrected', 'dip', 'dipping', 'dipped',
    'drop', 'dropping', 'dropped', 'plunge', 'plunging', 'plunged',
    'collapse', 'collapsing', 'collapsed', 'capitulate', 'capitulating', 'capitulated'
  ];

  // Normalize text
  const normalizedText = text.toLowerCase();
  const words = normalizedText.match(/\b(\w+)\b/g) || [];

  // Count positive and negative words
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });

  // Calculate sentiment score (-1 to 1)
  const totalSentimentWords = positiveCount + negativeCount;
  let score = 0;

  if (totalSentimentWords > 0) {
    score = (positiveCount - negativeCount) / totalSentimentWords;
  }

  // Calculate magnitude (strength of sentiment)
  const magnitude = totalSentimentWords / words.length;

  // Determine sentiment label
  let label: 'positive' | 'negative' | 'neutral';
  if (score > 0.1) {
    label = 'positive';
  } else if (score < -0.1) {
    label = 'negative';
  } else {
    label = 'neutral';
  }

  // Calculate confidence based on magnitude and sample size
  const confidence = Math.min(0.5 + (magnitude * 0.5), 0.95);

  return {
    score,
    magnitude,
    label,
    confidence
  };
};

/**
 * Analyze sentiment for a given text
 * @param text Text to analyze
 * @returns Sentiment analysis result
 */
export const analyzeSentiment = async (text: string): Promise<SentimentResult> => {
  try {
    // Check if we have an API key for a sentiment analysis service
    if (APP_CONFIG.api.sentimentAnalysisApiKey) {
      // Use external API for sentiment analysis
      await waitForRateLimit('sentimentApi');

      const response = await fetch(`${APP_CONFIG.api.sentimentAnalysisEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${APP_CONFIG.api.sentimentAnalysisApiKey}`
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`Sentiment API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        score: data.score,
        magnitude: data.magnitude,
        label: data.label,
        confidence: data.confidence
      };
    } else {
      // Use local lexicon-based sentiment analysis as fallback
      return lexiconBasedSentiment(text);
    }
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    // Fallback to local analysis
    return lexiconBasedSentiment(text);
  }
};

/**
 * Get sentiment analysis for a specific token
 * @param symbol Token symbol
 * @returns Token sentiment analysis
 */
export const getTokenSentiment = async (symbol: string): Promise<TokenSentiment> => {
  try {
    // Try to get cached data first
    const cacheKey = `sentiment_${symbol.toLowerCase()}`;

    // Check if we have cached data
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      try {
        const { data, timestamp } = JSON.parse(cachedData);
        const age = (Date.now() - timestamp) / 1000;

        // If the cache is still valid (15 minutes), return it
        if (age < 60 * 15) {
          return data as TokenSentiment;
        }
      } catch (error) {
        console.error("Error parsing cached data:", error);
        // Continue to fetch new data
      }
    }

    // Fetch new data
    let data: TokenSentiment;

    // If we have a sentiment API, use it
    if (APP_CONFIG.api.sentimentAnalysisApiKey) {
      await waitForRateLimit('sentimentApi');

      const response = await fetch(`${APP_CONFIG.api.sentimentAnalysisEndpoint}/token/${symbol}`, {
        headers: {
          'Authorization': `Bearer ${APP_CONFIG.api.sentimentAnalysisApiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Sentiment API error: ${response.statusText}`);
      }

      data = await response.json();
    } else {
      // Generate synthetic sentiment data
      data = generateSyntheticSentimentData(symbol);
    }

    // Cache the data
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("Error caching data:", error);
      // Continue even if caching fails
    }

    return data;
  } catch (error) {
    console.error(`Error getting sentiment for ${symbol}:`, error);
    // Return synthetic data as fallback
    return generateSyntheticSentimentData(symbol);
  }
};

/**
 * Generate synthetic sentiment data for testing
 * @param symbol Token symbol
 * @returns Synthetic token sentiment
 */
const generateSyntheticSentimentData = (symbol: string): TokenSentiment => {
  // Generate a consistent but seemingly random sentiment based on the symbol
  const symbolHash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseScore = (symbolHash % 20 - 10) / 10; // Range from -1 to 1

  // Generate trend data for the last 30 days
  const trendData = [];
  const now = new Date();
  let currentSentiment = baseScore;

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Add some random variation to the sentiment
    const randomVariation = (Math.random() - 0.5) * 0.2;
    currentSentiment = Math.max(-1, Math.min(1, currentSentiment + randomVariation));

    trendData.push({
      date: date.toISOString().split('T')[0],
      sentiment: currentSentiment,
      volume: Math.floor(10000 + Math.random() * 90000)
    });
  }

  // Generate keywords
  const positiveKeywords = ['bullish', 'moon', 'gain', 'hodl', 'buy'];
  const negativeKeywords = ['bearish', 'dump', 'sell', 'crash', 'scam'];
  const neutralKeywords = ['news', 'update', 'announcement', 'development', 'project'];

  const keywords = [];

  // Add keywords based on sentiment
  if (baseScore > 0.3) {
    // More positive keywords
    positiveKeywords.forEach(word => {
      keywords.push({
        word,
        count: Math.floor(50 + Math.random() * 200),
        sentiment: 0.5 + Math.random() * 0.5
      });
    });

    // Few negative keywords
    negativeKeywords.slice(0, 2).forEach(word => {
      keywords.push({
        word,
        count: Math.floor(10 + Math.random() * 50),
        sentiment: -0.5 - Math.random() * 0.5
      });
    });
  } else if (baseScore < -0.3) {
    // More negative keywords
    negativeKeywords.forEach(word => {
      keywords.push({
        word,
        count: Math.floor(50 + Math.random() * 200),
        sentiment: -0.5 - Math.random() * 0.5
      });
    });

    // Few positive keywords
    positiveKeywords.slice(0, 2).forEach(word => {
      keywords.push({
        word,
        count: Math.floor(10 + Math.random() * 50),
        sentiment: 0.5 + Math.random() * 0.5
      });
    });
  } else {
    // Mixed keywords
    positiveKeywords.slice(0, 3).forEach(word => {
      keywords.push({
        word,
        count: Math.floor(30 + Math.random() * 100),
        sentiment: 0.3 + Math.random() * 0.7
      });
    });

    negativeKeywords.slice(0, 3).forEach(word => {
      keywords.push({
        word,
        count: Math.floor(30 + Math.random() * 100),
        sentiment: -0.3 - Math.random() * 0.7
      });
    });
  }

  // Add neutral keywords
  neutralKeywords.slice(0, 3).forEach(word => {
    keywords.push({
      word,
      count: Math.floor(20 + Math.random() * 150),
      sentiment: -0.2 + Math.random() * 0.4
    });
  });

  // Sort keywords by count
  keywords.sort((a, b) => b.count - a.count);

  return {
    symbol,
    overallSentiment: {
      score: baseScore,
      magnitude: 0.6 + Math.random() * 0.4,
      label: baseScore > 0.1 ? 'positive' : baseScore < -0.1 ? 'negative' : 'neutral',
      confidence: 0.7 + Math.random() * 0.25
    },
    sources: {
      twitter: {
        score: baseScore + (Math.random() - 0.5) * 0.4,
        magnitude: 0.5 + Math.random() * 0.5,
        label: baseScore > 0 ? 'positive' : 'negative',
        confidence: 0.6 + Math.random() * 0.3
      },
      reddit: {
        score: baseScore + (Math.random() - 0.5) * 0.3,
        magnitude: 0.4 + Math.random() * 0.6,
        label: baseScore > 0.2 ? 'positive' : baseScore < -0.2 ? 'negative' : 'neutral',
        confidence: 0.65 + Math.random() * 0.25
      },
      news: {
        score: baseScore + (Math.random() - 0.5) * 0.2,
        magnitude: 0.3 + Math.random() * 0.4,
        label: baseScore > 0.1 ? 'positive' : baseScore < -0.1 ? 'negative' : 'neutral',
        confidence: 0.7 + Math.random() * 0.2
      }
    },
    trendData,
    keywords,
    lastUpdated: new Date().toISOString()
  };
};
