import { TokenInfo } from "@/types/database.types";
import { HeliusTokenData, HeliusTokenResponse } from "@/utils/heliusTypes";

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

async function fetchTokenInfoFromHelius(mintAddress: string): Promise<HeliusTokenData | null> {
  try {
    const response = await fetch(`https://api.helius.xyz/v0/token-metadata?mint=${mintAddress}`);
    if (!response.ok) {
      console.warn(`Helius API failed for ${mintAddress}: ${response.status} ${response.statusText}`);
      return null;
    }
    const data: HeliusTokenData[] = await response.json();
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error fetching token info from Helius:', error);
    return null;
  }
}

async function fetchTokenPriceFromCoingecko(coingeckoId: string): Promise<number | null> {
    try {
        const response = await fetch(`${COINGECKO_API_URL}/coins/${coingeckoId}`);
        if (!response.ok) {
            console.warn(`Coingecko API failed for ${coingeckoId}: ${response.status} ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        return data?.market_data?.current_price?.usd || null;
    } catch (error) {
        console.error('Error fetching token price from Coingecko:', error);
        return null;
    }
}

export async function getTokenInfo(mintAddress: string): Promise<TokenInfo | null> {
  try {
    // First try Helius API
    const heliusData = await fetchTokenInfoFromHelius(mintAddress);
    
    if (heliusData) {
      const supply = heliusData.supply || "0";
      const decimals = heliusData.decimals || 0;
      
      // Convert supply to a standardized format
      const totalSupply = typeof supply === 'string' ? supply : supply.toString();
      
      return {
        address: mintAddress,
        name: heliusData.name || 'Unknown Token',
        symbol: heliusData.symbol || 'UNKNOWN',
        logoURI: heliusData.logoURI || '',
        decimals: decimals,
        supply: totalSupply,
        coingeckoId: heliusData.extensions?.coingeckoId || null,
        lastUpdatedAt: heliusData.lastUpdatedAt || null,
        description: heliusData.description || null,
        twitter: heliusData.twitter || null,
        website: heliusData.website || null,
      };
    }
    
    // Fallback: If Helius doesn't have the data, return null
    console.warn(`No token data found in Helius for mint address: ${mintAddress}`);
    return null;
    
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
}

export async function getTokenPrice(coingeckoId: string): Promise<number | null> {
    if (!coingeckoId) {
        console.warn('No Coingecko ID provided, skipping price fetch.');
        return null;
    }

    try {
        const price = await fetchTokenPriceFromCoingecko(coingeckoId);
        return price;
    } catch (error) {
        console.error('Error fetching token price:', error);
        return null;
    }
}
