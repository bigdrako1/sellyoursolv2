
// Regular expression pattern for contract address extraction
const CONTRACT_ADDRESS_PATTERN = /\b([A-Za-z0-9]{32,44}(?:pump)?)\b/;

// Pattern for "Smart Money Buying" alert detection
const SMART_MONEY_PATTERN = /Smart Money Buying/i;

// Global sets to track tokens
let seenTokens = new Set<string>();
let smartMoneyTokens = new Set<string>();

/**
 * Reset token tracking sets
 */
export const resetTokenTracking = (): void => {
  seenTokens = new Set<string>();
  smartMoneyTokens = new Set<string>();
};

/**
 * Extract contract addresses from message text
 */
export const extractContractAddresses = (text: string): string[] => {
  const matches = text.match(new RegExp(CONTRACT_ADDRESS_PATTERN, 'g'));
  return matches ? [...new Set(matches)] : [];
};

/**
 * Process message text for token detection
 * Returns extracted tokens and whether they should be processed
 */
export const processMessageForTokens = (
  sourceId: string, 
  text: string
): { tokens: string[], shouldProcess: boolean } => {
  const tokens = extractContractAddresses(text);
  if (!tokens.length) {
    return { tokens: [], shouldProcess: false };
  }
  
  const isSmartMoneyAlert = SMART_MONEY_PATTERN.test(text);
  const newTokens: string[] = [];
  
  for (const token of tokens) {
    // Check if we've seen this token before
    if (seenTokens.has(token)) {
      continue;
    }
    
    // Check if this is a smart money alert for a token we've already seen a smart money alert for
    if (isSmartMoneyAlert && smartMoneyTokens.has(token)) {
      continue;
    }
    
    // Add to tracking sets
    seenTokens.add(token);
    if (isSmartMoneyAlert) {
      smartMoneyTokens.add(token);
    }
    
    newTokens.push(token);
  }
  
  return {
    tokens: newTokens,
    shouldProcess: newTokens.length > 0
  };
};

/**
 * Check if message contains suspicious token name patterns
 */
export const hasSuspiciousTokenPattern = (text: string): boolean => {
  const suspiciousPatterns = [
    /scam/i, /rug/i, /honeypot/i, /ponzi/i, 
    /fake/i, /test/i, /airdrop/i, /free/i, 
    /giveaway/i, /claim/i, /bot/i, /hack/i, 
    /steal/i, /phish/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(text));
};

/**
 * Extract message metadata for token detection
 */
export const extractMessageMetadata = (message: any): {
  messageId: string;
  source: string;
  text: string;
  timestamp: number;
} => {
  return {
    messageId: message.id || `msg_${Date.now()}`,
    source: message.chatId || message.channelId || "unknown",
    text: message.text || "",
    timestamp: message.timestamp || Date.now(),
  };
};
