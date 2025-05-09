
import { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";

// Types
export interface TwitterAccount {
  username: string;
  displayName: string;
  lastChecked: Date;
  enabled: boolean;
}

export interface ScrapedToken {
  contractAddress: string;
  tweetId: string;
  username: string;
  displayName: string;
  text: string;
  timestamp: Date;
  processed: boolean;
}

// Default Twitter accounts to monitor
export const DEFAULT_TWITTER_ACCOUNTS: TwitterAccount[] = [
  { username: 'CYRILXBT', displayName: 'CYRIL XBT', lastChecked: new Date(), enabled: true },
  { username: 'MAGIC1000x', displayName: 'MAGIC1000X', lastChecked: new Date(), enabled: true },
  { username: 'GMGN_ALERTS', displayName: 'GMGN ALERT BOT', lastChecked: new Date(), enabled: true },
  { username: 'SMART_MONEY_BUYS', displayName: 'SMART MONEY BUYS', lastChecked: new Date(), enabled: true },
  { username: 'MEME1000X', displayName: 'MEME1000X', lastChecked: new Date(), enabled: true },
  { username: 'SolanaActivity', displayName: 'Solana Activity Tracker', lastChecked: new Date(), enabled: true },
  { username: 'BugsieChannel', displayName: 'BUGSIE CHANNEL', lastChecked: new Date(), enabled: true },
  { username: 'TreysChannel', displayName: 'TREYS', lastChecked: new Date(), enabled: true },
];

// In-memory storage for scraped tokens
let scrapedTokens: ScrapedToken[] = [];

/**
 * Extract contract addresses from text
 * Matches standard Solana addresses (base58, 32-44 chars)
 * Also captures Pump.fun addresses that may end with 'pump' or 'boop'
 */
export const extractContractAddresses = (text: string): string[] => {
  // Pattern to match Solana addresses, including those ending with 'pump' or 'boop'
  const regex = /\b([A-Za-z0-9]{32,44}(?:pump|boop)?)\b/g;
  const matches = text.match(regex) || [];
  return [...new Set(matches)]; // Return unique addresses only
};

/**
 * Simulate fetching tweets (since we don't have direct Twitter API access)
 * In a real implementation, this would call the Twitter API
 */
const fetchMockTweets = async (username: string): Promise<any[]> => {
  // Generate 0-3 mock tweets
  const count = Math.floor(Math.random() * 4);
  
  const tokenAddresses = [
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
    'MEMEXQWzNMLG4t5UtUVqbXEhJSxssCwYVTT1dosXKz7', // MEME
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'So11111111111111111111111111111111111111112', // Wrapped SOL
    'daiskPLEbNUvVq1k8bCrdo7r9SuCDNYJyXnj1FJP8', // DAISY
    'nofbptzYyFWCacYzLzTQ5dK1qPkQCVB1xKt6nyfxf5H' // NFA
  ];
  
  const tweetTexts = [
    `Just found this amazing token $TOKEN looking very bullish! Contract: {{TOKEN_ADDRESS}}`,
    `Smart money is buying $TOKEN now! Check it out: {{TOKEN_ADDRESS}} #Solana #100x`,
    `$TOKEN just launched! Get in early: {{TOKEN_ADDRESS}} Liquidity locked for 6 months.`,
    `🚀 NEW GEM ALERT 🚀 $TOKEN: {{TOKEN_ADDRESS}} Already 3x since launch and just getting started!`,
    `⚠️ POTENTIAL RUNNER ⚠️\nToken: $TOKEN\nContract: {{TOKEN_ADDRESS}}\nLiquidity: $50K+\nBullish!`
  ];
  
  return Array(count).fill(0).map((_, i) => {
    // Pick a random token and tweet template
    const tokenAddress = tokenAddresses[Math.floor(Math.random() * tokenAddresses.length)];
    const tweetTemplate = tweetTexts[Math.floor(Math.random() * tweetTexts.length)];
    const tokenSymbol = ['BONK', 'MEME', 'USDC', 'SOL', 'DAISY', 'NFA'][Math.floor(Math.random() * 6)];
    
    // Generate the tweet text
    const text = tweetTemplate
      .replace('$TOKEN', tokenSymbol)
      .replace('{{TOKEN_ADDRESS}}', tokenAddress);
      
    // Generate a random ID and timestamp within the last hour
    const tweetId = `tweet-${Date.now()}-${i}`;
    const timestamp = new Date(Date.now() - Math.random() * 60 * 60 * 1000);
    
    return {
      id: tweetId,
      text,
      timestamp,
      user: {
        username,
        displayName: username.toUpperCase()
      }
    };
  });
};

/**
 * Check for new tweets containing contract addresses
 * @param account Twitter account to check
 */
export const checkForNewTokens = async (account: TwitterAccount): Promise<ScrapedToken[]> => {
  try {
    // In a real implementation, this would call the Twitter API
    const tweets = await fetchMockTweets(account.username);
    
    // Process each tweet and extract contract addresses
    const newScrapedTokens: ScrapedToken[] = [];
    
    for (const tweet of tweets) {
      const contractAddresses = extractContractAddresses(tweet.text);
      
      // Add each found contract address as a scraped token
      for (const contractAddress of contractAddresses) {
        const newToken: ScrapedToken = {
          contractAddress,
          tweetId: tweet.id,
          username: account.username,
          displayName: tweet.user.displayName,
          text: tweet.text,
          timestamp: new Date(tweet.timestamp),
          processed: false
        };
        
        // Check if we've already seen this contract address
        const isDuplicate = scrapedTokens.some(t => 
          t.contractAddress === contractAddress && 
          t.username === account.username
        );
        
        if (!isDuplicate) {
          newScrapedTokens.push(newToken);
          scrapedTokens.push(newToken);
        }
      }
    }
    
    // Update the last checked timestamp
    account.lastChecked = new Date();
    
    return newScrapedTokens;
  } catch (error) {
    console.error(`Error checking for new tokens from ${account.username}:`, error);
    return [];
  }
};

/**
 * Get all scraped tokens
 */
export const getAllScrapedTokens = (): ScrapedToken[] => {
  return [...scrapedTokens];
};

/**
 * React hook for using the Twitter scraper service
 */
export const useTwitterScraper = (
  checkIntervalMs = 120000 // Default: check every 2 minutes
) => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<TwitterAccount[]>(DEFAULT_TWITTER_ACCOUNTS);
  const [tokens, setTokens] = useState<ScrapedToken[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const [isChecking, setIsChecking] = useState(false);
  
  // Initialize with stored tokens
  useEffect(() => {
    if (!isInitialized) {
      setTokens(getAllScrapedTokens());
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Function to check all accounts
  const checkAllAccounts = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      let newTokensFound = 0;
      
      // Check each enabled account
      for (const account of accounts.filter(a => a.enabled)) {
        const newTokens = await checkForNewTokens(account);
        if (newTokens.length > 0) {
          newTokensFound += newTokens.length;
          
          // Show a toast for the first new token
          if (newTokens.length > 0) {
            toast({
              title: `${newTokens.length} new token${newTokens.length > 1 ? 's' : ''} from ${account.displayName}`,
              description: `Found ${newTokens.length} new token${newTokens.length > 1 ? 's' : ''} in recent tweets`,
            });
          }
        }
      }
      
      // Update the tokens state with all current tokens
      setTokens(getAllScrapedTokens());
      setLastCheckTime(new Date());
      
      // Show summary toast if multiple tokens found
      if (newTokensFound > 0) {
        console.log(`Found ${newTokensFound} new tokens from Twitter scanning`);
      }
    } catch (error) {
      console.error("Error checking Twitter accounts:", error);
    } finally {
      setIsChecking(false);
    }
  };
  
  // Set up interval for regular checking
  useEffect(() => {
    // Perform initial check
    checkAllAccounts();
    
    // Set up interval for regular checks
    const intervalId = setInterval(checkAllAccounts, checkIntervalMs);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [checkIntervalMs]);
  
  // Update accounts
  const updateAccount = (username: string, updates: Partial<TwitterAccount>) => {
    setAccounts(currentAccounts => 
      currentAccounts.map(account => 
        account.username === username 
          ? { ...account, ...updates } 
          : account
      )
    );
  };
  
  // Add new account
  const addAccount = (account: TwitterAccount) => {
    setAccounts(currentAccounts => [...currentAccounts, account]);
  };
  
  // Remove account
  const removeAccount = (username: string) => {
    setAccounts(currentAccounts => 
      currentAccounts.filter(account => account.username !== username)
    );
  };
  
  // Mark token as processed
  const markTokenAsProcessed = (contractAddress: string, tweetId: string) => {
    // Update in-memory storage
    scrapedTokens = scrapedTokens.map(token => 
      token.contractAddress === contractAddress && token.tweetId === tweetId
        ? { ...token, processed: true }
        : token
    );
    
    // Update state
    setTokens(getAllScrapedTokens());
  };
  
  return {
    accounts,
    tokens,
    lastCheckTime,
    isChecking,
    checkAllAccounts,
    updateAccount,
    addAccount,
    removeAccount,
    markTokenAsProcessed
  };
};
