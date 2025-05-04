
// Twitter sentiment analysis utility functions

export interface Tweet {
  id: string;
  text: string;
  username: string;
  displayName: string;
  createdAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  keywords: string[];
}

export interface SentimentSummary {
  positive: number;
  negative: number;
  neutral: number;
  totalScore: number;
  viralityScore: number;
}

// List of alert keywords to track
export const ALERT_KEYWORDS = [
  'rug', 'scam', 'moon', 'bullish', 'dev gone', 'ape', 'pump', 'dump', 
  'send it', '100x', 'dev sold', 'dev bot', 'larp', 'degen', 
  'trenches', 'trenching', 'bearish', 'warning'
];

// Mock function to analyze sentiment of text
export const analyzeSentiment = (text: string): { score: number; sentiment: 'positive' | 'negative' | 'neutral'; keywords: string[] } => {
  // In a real implementation, this would use NLP or a sentiment analysis API
  // For now, we'll use a simple keyword-based approach
  
  const lowerText = text.toLowerCase();
  let score = 0;
  
  // Positive keywords
  const positiveWords = ['bullish', 'moon', 'pump', 'ape', '100x', 'send it', 'runner', 'degen', 'trenches'];
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) {
      score += 0.2;
    }
  });
  
  // Negative keywords
  const negativeWords = ['rug', 'scam', 'dump', 'dev gone', 'dev sold', 'bearish', 'warning', 'honeypot'];
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) {
      score -= 0.3;
    }
  });
  
  // Adjust score to be between -1 and 1
  score = Math.max(-1, Math.min(1, score));
  
  // Find matching alert keywords
  const keywords = ALERT_KEYWORDS.filter(keyword => 
    lowerText.includes(keyword.toLowerCase())
  ).slice(0, 3); // Limit to top 3 keywords
  
  return {
    score,
    sentiment: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral',
    keywords
  };
};

// Mock function to get tweet sentiment for a token
export const getTweetSentiment = async (searchTerm: string): Promise<{tweets: Tweet[], summary: SentimentSummary}> => {
  try {
    // In a real implementation, this would call a Twitter API
    // For now, we'll generate mock data
    const mockTweets = generateMockTweets(searchTerm);
    
    // Analyze sentiment for each tweet
    const analyzedTweets = mockTweets.map(tweet => {
      const analysis = analyzeSentiment(tweet.text);
      return {
        ...tweet,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.score,
        keywords: analysis.keywords
      };
    });
    
    // Calculate sentiment summary
    const summary = calculateSentimentSummary(analyzedTweets);
    
    return {
      tweets: analyzedTweets,
      summary
    };
  } catch (error) {
    console.error("Error getting tweet sentiment:", error);
    throw error;
  }
};

// Generate mock tweets for demonstration purposes
const generateMockTweets = (searchTerm: string): Tweet[] => {
  const tweetTemplates = [
    "Just bought some $TERM! Looking very bullish right now, could moon soon. #Solana #Crypto",
    "$TERM is the next 100x gem on Solana! Devs are based and liquidity is locked. Time to ape in! 🚀 #SOL",
    "Watching $TERM closely. Chart looks decent but not sure about the team. DYOR. #Solana",
    "Warning: $TERM looks like a potential rug. Dev wallet holding too many tokens. Stay safe! #Scamalert",
    "I'm bullish on $TERM. Great tokenomics and active community. This could be huge! 🔥",
    "Just dumped my $TERM bags. Dev team not delivering on roadmap. Moving on to better projects.",
    "$TERM definitely in the trenches right now but could recover. Diamond hands will be rewarded! 💎",
    "The $TERM chart is looking bearish. Might be time to secure profits. #SolanaNFT",
    "Huge whale just bought $TERM! Smart money knows something we don't? 🐳 #Solana",
    "$TERM looking like a solid degen play right now. Risk/reward ratio is tempting! #SolanaDegens",
    "Dev team just locked $TERM liquidity for 1 year. Very bullish signal! 🔒",
    "$TERM getting some attention from influencers. Could pump soon! #CryptoTwitter",
    "Be careful with $TERM, lots of bots pumping it right now. Classic p&d pattern.",
    "$TERM is absolutely sending it! Up 40% in an hour! FOMO kicking in 🚀",
    "Looks like the $TERM dev might have sold. Price tanking. Always use a stop loss guys!"
  ];
  
  // Create between 5-15 mock tweets
  const count = Math.floor(Math.random() * 10) + 5;
  const term = searchTerm.toUpperCase();
  
  return Array(count).fill(0).map((_, i) => {
    const templateIndex = Math.floor(Math.random() * tweetTemplates.length);
    const text = tweetTemplates[templateIndex].replace('TERM', term);
    
    // Generate random dates within the past week
    const date = new Date();
    date.setDate(date.getDate() - Math.random() * 7);
    
    const usernames = ['solana_whale', 'crypto_hunter', 'degen_trader', 'nft_collector', 
                       'sol_maximalist', 'meme_investor', 'blockchain_guru', 'token_sniffer', 
                       'rugpull_detector', 'solanabull', 'traderman', 'defi_analyst'];
    
    const userIndex = Math.floor(Math.random() * usernames.length);
    
    return {
      id: `tweet-${i}-${Date.now()}`,
      text,
      username: usernames[userIndex],
      displayName: usernames[userIndex].split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      createdAt: date.toISOString(),
      sentiment: 'neutral', // Will be updated by analyzeSentiment
      sentimentScore: 0,    // Will be updated by analyzeSentiment
      keywords: []          // Will be updated by analyzeSentiment
    };
  });
};

// Calculate sentiment summary from analyzed tweets
const calculateSentimentSummary = (tweets: Tweet[]): SentimentSummary => {
  const totalTweets = tweets.length;
  
  if (totalTweets === 0) {
    return {
      positive: 0,
      negative: 0,
      neutral: 0,
      totalScore: 0,
      viralityScore: 0
    };
  }
  
  // Count sentiment types
  const sentimentCounts = tweets.reduce((counts, tweet) => {
    counts[tweet.sentiment]++;
    return counts;
  }, { positive: 0, negative: 0, neutral: 0 });
  
  // Calculate percentages
  const positive = Math.round((sentimentCounts.positive / totalTweets) * 100);
  const negative = Math.round((sentimentCounts.negative / totalTweets) * 100);
  // Ensure percentages add up to 100%
  const neutral = 100 - positive - negative;
  
  // Calculate average sentiment score
  const totalScore = tweets.reduce((sum, tweet) => sum + tweet.sentimentScore, 0) / totalTweets;
  
  // Calculate virality score (0-100)
  // Based on tweet count, keyword density, and sentiment intensity
  const tweetCountFactor = Math.min(totalTweets / 20, 1) * 40;
  
  const keywordDensity = tweets.reduce((sum, tweet) => sum + tweet.keywords.length, 0) / (totalTweets * 3);
  const keywordFactor = keywordDensity * 30;
  
  const sentimentIntensity = tweets.reduce((sum, tweet) => sum + Math.abs(tweet.sentimentScore), 0) / totalTweets;
  const intensityFactor = sentimentIntensity * 30;
  
  const viralityScore = Math.min(Math.round(tweetCountFactor + keywordFactor + intensityFactor), 100);
  
  return {
    positive,
    negative,
    neutral,
    totalScore,
    viralityScore
  };
};

// Get sentiment category based on score
export const getSentimentCategory = (score: number): string => {
  if (score >= 0.7) return "Extremely Bullish";
  if (score >= 0.4) return "Bullish";
  if (score >= 0.1) return "Slightly Bullish";
  if (score >= -0.1) return "Neutral";
  if (score >= -0.4) return "Slightly Bearish";
  if (score >= -0.7) return "Bearish";
  return "Extremely Bearish";
};
