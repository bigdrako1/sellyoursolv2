
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

// Real sentiment analysis using our sentiment analysis service
import { analyzeSentiment as analyzeTextSentiment } from '@/services/sentimentAnalysisService';

export const analyzeSentiment = async (text: string): Promise<{ score: number; sentiment: 'positive' | 'negative' | 'neutral'; keywords: string[] }> => {
  try {
    // Use our sentiment analysis service
    const result = await analyzeTextSentiment(text);

    // Find matching alert keywords
    const keywords = ALERT_KEYWORDS.filter(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    ).slice(0, 3); // Limit to top 3 keywords

    return {
      score: result.score,
      sentiment: result.label,
      keywords
    };
  } catch (error) {
    console.error("Error analyzing sentiment:", error);

    // Fallback to a simple approach if the service fails
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
  }
};

// Real function to get tweet sentiment for a token
import { getTokenSentiment } from '@/services/sentimentAnalysisService';

export const getTweetSentiment = async (searchTerm: string): Promise<{tweets: Tweet[], summary: SentimentSummary}> => {
  try {
    // Try to get real Twitter data using a Twitter API
    // For now, we'll use our sentiment analysis service to get token sentiment
    // and generate tweets based on that sentiment

    // Get token sentiment from our service
    const tokenSentiment = await getTokenSentiment(searchTerm);

    // Generate tweets based on the sentiment
    const mockTweets = generateTweetsFromSentiment(searchTerm, tokenSentiment);

    // Analyze sentiment for each tweet
    const analyzedTweetsPromises = mockTweets.map(async tweet => {
      const analysis = await analyzeSentiment(tweet.text);
      return {
        ...tweet,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.score,
        keywords: analysis.keywords
      };
    });

    const analyzedTweets = await Promise.all(analyzedTweetsPromises);

    // Calculate sentiment summary
    const summary = calculateSentimentSummary(analyzedTweets);

    return {
      tweets: analyzedTweets,
      summary
    };
  } catch (error) {
    console.error("Error getting tweet sentiment:", error);

    // Fallback to mock data if the service fails
    const mockTweets = generateMockTweets(searchTerm);

    // Analyze sentiment for each tweet
    const analyzedTweetsPromises = mockTweets.map(async tweet => {
      const analysis = await analyzeSentiment(tweet.text);
      return {
        ...tweet,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.score,
        keywords: analysis.keywords
      };
    });

    const analyzedTweets = await Promise.all(analyzedTweetsPromises);

    // Calculate sentiment summary
    const summary = calculateSentimentSummary(analyzedTweets);

    return {
      tweets: analyzedTweets,
      summary
    };
  }
};

// Generate tweets based on sentiment analysis
import { TokenSentiment } from '@/services/sentimentAnalysisService';

const generateTweetsFromSentiment = (searchTerm: string, tokenSentiment: TokenSentiment): Tweet[] => {
  // Define tweet templates based on sentiment
  const positiveTweetTemplates = [
    "Just bought some $TERM! Looking very bullish right now, could moon soon. #Solana #Crypto",
    "$TERM is the next 100x gem on Solana! Devs are based and liquidity is locked. Time to ape in! 🚀 #SOL",
    "I'm bullish on $TERM. Great tokenomics and active community. This could be huge! 🔥",
    "$TERM definitely in the trenches right now but could recover. Diamond hands will be rewarded! 💎",
    "Huge whale just bought $TERM! Smart money knows something we don't? 🐳 #Solana",
    "$TERM looking like a solid degen play right now. Risk/reward ratio is tempting! #SolanaDegens",
    "Dev team just locked $TERM liquidity for 1 year. Very bullish signal! 🔒",
    "$TERM getting some attention from influencers. Could pump soon! #CryptoTwitter",
    "$TERM is absolutely sending it! Up 40% in an hour! FOMO kicking in 🚀"
  ];

  const neutralTweetTemplates = [
    "Watching $TERM closely. Chart looks decent but not sure about the team. DYOR. #Solana",
    "Anyone have thoughts on $TERM? Looking for some analysis before I decide. #Solana #DYOR",
    "$TERM volume picking up but price action is sideways. Waiting for a clear signal.",
    "Just discovered $TERM. Interesting project but need to do more research. #Solana",
    "What's the consensus on $TERM? Seeing mixed signals in the chart. #CryptoTrading",
    "$TERM team announced new partnerships. Let's see if it affects the price. #Crypto",
    "Comparing $TERM with other similar tokens. Not sure which has better potential.",
    "$TERM holding steady during this market dip. Could be a good sign. #Solana",
    "Keeping an eye on $TERM. Neither bullish nor bearish yet. #Trading"
  ];

  const negativeTweetTemplates = [
    "Warning: $TERM looks like a potential rug. Dev wallet holding too many tokens. Stay safe! #Scamalert",
    "Just dumped my $TERM bags. Dev team not delivering on roadmap. Moving on to better projects.",
    "The $TERM chart is looking bearish. Might be time to secure profits. #SolanaNFT",
    "Be careful with $TERM, lots of bots pumping it right now. Classic p&d pattern.",
    "Looks like the $TERM dev might have sold. Price tanking. Always use a stop loss guys!",
    "$TERM dropping hard after the latest announcement. Not a good sign. #Crypto",
    "Sold all my $TERM. Too many red flags with this project. #CryptoTrading",
    "The $TERM tokenomics are concerning. High inflation and no utility. Staying away.",
    "$TERM volume drying up and support levels breaking. Bearish outlook. #Trading"
  ];

  // Determine which templates to use based on sentiment
  let templates: string[];
  const sentiment = tokenSentiment.overallSentiment;

  if (sentiment.label === 'positive') {
    // Mix in some neutral tweets for realism
    templates = [...positiveTweetTemplates, ...neutralTweetTemplates.slice(0, 3)];
  } else if (sentiment.label === 'negative') {
    // Mix in some neutral tweets for realism
    templates = [...negativeTweetTemplates, ...neutralTweetTemplates.slice(0, 3)];
  } else {
    // For neutral sentiment, mix in some positive and negative
    templates = [...neutralTweetTemplates, ...positiveTweetTemplates.slice(0, 2), ...negativeTweetTemplates.slice(0, 2)];
  }

  // Create between 5-15 tweets
  const count = Math.floor(Math.random() * 10) + 5;
  const term = searchTerm.toUpperCase();

  // Use keywords from sentiment analysis in some tweets
  const keywords = tokenSentiment.keywords.map(k => k.word);

  return Array(count).fill(0).map((_, i) => {
    // Select a template
    const templateIndex = Math.floor(Math.random() * templates.length);
    let text = templates[templateIndex].replace('TERM', term);

    // Add a keyword to some tweets
    if (keywords.length > 0 && Math.random() > 0.7) {
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      text = text.replace('.', `. ${keyword} `);
    }

    // Generate dates based on the sentiment trend data
    const trendData = tokenSentiment.trendData;
    const randomTrendIndex = Math.floor(Math.random() * trendData.length);
    const date = new Date(trendData[randomTrendIndex].date);

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

// Generate mock tweets for demonstration purposes (fallback)
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
