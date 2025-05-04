
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, AlertCircle, BarChart, TrendingUp, MessageSquare, Twitter } from 'lucide-react';
import { getTweetSentiment, analyzeSentiment } from '@/utils/sentimentUtils';
import { useToast } from '@/hooks/use-toast';

// Tweet interface
interface Tweet {
  id: string;
  text: string;
  username: string;
  displayName: string;
  createdAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  keywords: string[];
}

// Keywords to track in tweets
const ALERT_KEYWORDS = [
  'rug', 'scam', 'moon', 'bullish', 'dev gone', 'ape', 'pump', 'dump', 
  'send it', '100x', 'dev sold', 'dev bot', 'larp', 'degen', 
  'trenches', 'trenching', 'bearish', 'warning'
];

const TwitterSentimentScanner = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [sentimentSummary, setSentimentSummary] = useState<{
    positive: number;
    negative: number;
    neutral: number;
    totalScore: number;
    viralityScore: number;
  }>({
    positive: 0,
    negative: 0,
    neutral: 0,
    totalScore: 0,
    viralityScore: 0
  });
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [keywordCounts, setKeywordCounts] = useState<Record<string, number>>({});
  
  const { toast } = useToast();
  
  // Function to search for tweets and analyze sentiment
  const searchTweets = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      // In a real implementation, this would call an API to get tweets
      // For now, we'll simulate the response with mock data
      const response = await getTweetSentiment(searchTerm);
      
      if (response && response.tweets) {
        setTweets(response.tweets);
        setSentimentSummary(response.summary);
        
        // Count keyword occurrences
        const keywordMap: Record<string, number> = {};
        ALERT_KEYWORDS.forEach(keyword => {
          keywordMap[keyword] = 0;
        });
        
        response.tweets.forEach((tweet: Tweet) => {
          ALERT_KEYWORDS.forEach(keyword => {
            if (tweet.text.toLowerCase().includes(keyword.toLowerCase())) {
              keywordMap[keyword] = (keywordMap[keyword] || 0) + 1;
            }
          });
        });
        
        setKeywordCounts(keywordMap);
        
        // Add to search history if not already there
        if (!searchHistory.includes(searchTerm)) {
          setSearchHistory(prev => [searchTerm, ...prev.slice(0, 4)]);
        }
      } else {
        toast({
          title: "No results found",
          description: "No tweets found for this search term.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching tweets:", error);
      toast({
        title: "Error searching tweets",
        description: "Could not retrieve tweet data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Get sentiment color based on score
  const getSentimentColor = (score: number) => {
    if (score >= 0.5) return "bg-green-500 text-white";
    if (score >= 0) return "bg-green-300 text-green-900";
    if (score >= -0.5) return "bg-red-300 text-red-900";
    return "bg-red-500 text-white";
  };
  
  // Get overall sentiment tone description
  const getSentimentTone = (score: number) => {
    if (score >= 0.7) return "Extremely Bullish";
    if (score >= 0.4) return "Bullish";
    if (score >= 0.1) return "Slightly Bullish";
    if (score >= -0.1) return "Neutral";
    if (score >= -0.4) return "Slightly Bearish";
    if (score >= -0.7) return "Bearish";
    return "Extremely Bearish";
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Twitter Sentiment Scanner</CardTitle>
          <CardDescription>
            Analyze social sentiment for Solana tokens and get insights from Crypto Twitter
          </CardDescription>
          
          <div className="mt-4 flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Enter token symbol, name, or contract address..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchTweets()}
              />
            </div>
            <Button onClick={searchTweets} disabled={loading}>
              {loading ? "Scanning..." : "Analyze Sentiment"}
            </Button>
          </div>
          
          {searchHistory.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs text-gray-500">Recent:</span>
              {searchHistory.map((term) => (
                <Badge 
                  key={term} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => {
                    setSearchTerm(term);
                    searchTweets();
                  }}
                >
                  {term}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
      </Card>
      
      {tweets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sentiment Summary Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="mr-2 h-5 w-5" />
                Sentiment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {sentimentSummary.totalScore.toFixed(2)}
                </div>
                <div className={`inline-block px-3 py-1 rounded-full mt-1 ${
                  getSentimentColor(sentimentSummary.totalScore)
                }`}>
                  {getSentimentTone(sentimentSummary.totalScore)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Positive</span>
                  <span className="text-green-500">{sentimentSummary.positive}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${sentimentSummary.positive}%` }}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Neutral</span>
                  <span className="text-gray-500">{sentimentSummary.neutral}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div className="bg-gray-500 h-2.5 rounded-full" style={{ width: `${sentimentSummary.neutral}%` }}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Negative</span>
                  <span className="text-red-500">{sentimentSummary.negative}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${sentimentSummary.negative}%` }}></div>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Virality Score</span>
                  <Badge variant={sentimentSummary.viralityScore > 70 ? "default" : "secondary"}>
                    {sentimentSummary.viralityScore}/100
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Based on mentions, engagement, and velocity
                </div>
              </div>
              
              <Alert variant="outline" className="mt-4">
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  {sentimentSummary.totalScore > 0.3 
                    ? "Strong positive sentiment detected. Token is trending bullish on Twitter." 
                    : sentimentSummary.totalScore < -0.3 
                    ? "Warning: Negative sentiment detected. Monitor closely for potential issues."
                    : "Neutral sentiment detected. Average social interest."}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          
          {/* Alert Keywords Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                Alert Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(keywordCounts)
                  .filter(([_, count]) => count > 0)
                  .sort(([_, countA], [__, countB]) => countB - countA)
                  .slice(0, 10)
                  .map(([keyword, count]) => (
                    <Badge 
                      key={keyword}
                      variant="outline" 
                      className={`
                        ${keyword.toLowerCase().includes('rug') || 
                          keyword.toLowerCase().includes('scam') || 
                          keyword.toLowerCase().includes('dev gone') || 
                          keyword.toLowerCase().includes('bearish')
                          ? 'border-red-500 text-red-500'
                          : keyword.toLowerCase().includes('moon') || 
                            keyword.toLowerCase().includes('bullish') || 
                            keyword.toLowerCase().includes('100x')
                            ? 'border-green-500 text-green-500'
                            : 'border-yellow-500 text-yellow-500'
                        }
                      `}
                    >
                      {keyword} ({count})
                    </Badge>
                  ))}
                {Object.values(keywordCounts).every(count => count === 0) && (
                  <div className="text-gray-500 text-sm">No alert keywords detected in tweets</div>
                )}
              </div>
              
              <div className="text-sm text-gray-500 mt-6">
                <div className="font-medium mb-1">Common alert patterns:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Multiple "rug" or "scam" mentions may indicate risk</li>
                  <li>High "moon" + "ape" suggests speculative interest</li>
                  <li>"Dev gone" or "dev sold" are serious red flags</li>
                  <li>Sudden spike in "bullish" may signal momentum</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          {/* Tweet Feed Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Twitter className="mr-2 h-5 w-5" />
                Recent Tweets
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto p-0">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {tweets.map((tweet) => (
                  <div key={tweet.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors">
                    <div className="flex justify-between">
                      <div className="font-medium">{tweet.displayName}</div>
                      <Badge 
                        className={`${
                          tweet.sentiment === 'positive' ? 'bg-green-100 text-green-800' : 
                          tweet.sentiment === 'negative' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {tweet.sentiment}
                      </Badge>
                    </div>
                    <div className="text-gray-500 text-xs mb-1">@{tweet.username}</div>
                    <div className="text-sm mt-1">{tweet.text}</div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-gray-500">
                        {new Date(tweet.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex gap-1">
                        {tweet.keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {tweets.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No tweets to display. Try a different search term.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TwitterSentimentScanner;
