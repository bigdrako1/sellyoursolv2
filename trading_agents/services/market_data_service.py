"""
Market data service for accessing and normalizing data from various sources.
"""
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import asyncio

from clients.birdeye_client import BirdeyeClient
from clients.moondev_client import MoonDevClient

logger = logging.getLogger(__name__)

class MarketDataService:
    """
    Service for accessing and normalizing market data from various sources.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the market data service.
        
        Args:
            config: Service configuration
        """
        self.config = config
        
        # Initialize clients
        self.birdeye_client = BirdeyeClient(config.get("birdeye_api_key", ""))
        self.moondev_client = MoonDevClient(config.get("moondev_api_key", ""))
        
        # Cache settings
        self.cache_ttl = config.get("cache_ttl", 60)  # Default cache TTL in seconds
        self.cache = {}
        
    async def get_token_price(self, token_address: str) -> float:
        """
        Get current price for a token.
        
        Args:
            token_address: Token address
            
        Returns:
            Token price
        """
        cache_key = f"price:{token_address}"
        if cache_key in self.cache:
            cache_entry = self.cache[cache_key]
            if cache_entry["expires"] > datetime.now().timestamp():
                return cache_entry["data"]
        
        try:
            price_data = await self.birdeye_client.get_token_price(token_address)
            price = price_data.get("value", 0.0)
            
            # Cache the result
            self.cache[cache_key] = {
                "data": price,
                "expires": datetime.now().timestamp() + self.cache_ttl
            }
            
            return price
        except Exception as e:
            logger.error(f"Failed to get token price for {token_address}: {str(e)}")
            raise
            
    async def get_token_details(self, token_address: str) -> Dict[str, Any]:
        """
        Get comprehensive details for a token.
        
        Args:
            token_address: Token address
            
        Returns:
            Token details
        """
        cache_key = f"details:{token_address}"
        if cache_key in self.cache:
            cache_entry = self.cache[cache_key]
            if cache_entry["expires"] > datetime.now().timestamp():
                return cache_entry["data"]
        
        try:
            # Get data from multiple sources in parallel
            price_task = self.birdeye_client.get_token_price(token_address)
            metadata_task = self.birdeye_client.get_token_metadata(token_address)
            liquidity_task = self.birdeye_client.get_token_liquidity(token_address)
            holders_task = self.birdeye_client.get_token_holders(token_address, 10)
            sentiment_task = self.moondev_client.get_token_sentiment(token_address)
            
            # Wait for all tasks to complete
            price_data, metadata, liquidity, holders, sentiment = await asyncio.gather(
                price_task, metadata_task, liquidity_task, holders_task, sentiment_task,
                return_exceptions=True
            )
            
            # Handle exceptions
            if isinstance(price_data, Exception):
                logger.error(f"Failed to get token price: {str(price_data)}")
                price_data = {"value": 0.0}
                
            if isinstance(metadata, Exception):
                logger.error(f"Failed to get token metadata: {str(metadata)}")
                metadata = {}
                
            if isinstance(liquidity, Exception):
                logger.error(f"Failed to get token liquidity: {str(liquidity)}")
                liquidity = {"value": 0.0}
                
            if isinstance(holders, Exception):
                logger.error(f"Failed to get token holders: {str(holders)}")
                holders = []
                
            if isinstance(sentiment, Exception):
                logger.error(f"Failed to get token sentiment: {str(sentiment)}")
                sentiment = {}
            
            # Calculate top holder percentage
            top_holder_percentage = 0.0
            if holders and len(holders) > 0:
                total_supply = metadata.get("supply", 0.0)
                if total_supply > 0:
                    top_holder_amount = sum(holder.get("amount", 0.0) for holder in holders[:3])
                    top_holder_percentage = top_holder_amount / total_supply
            
            # Combine data
            token_details = {
                "address": token_address,
                "name": metadata.get("name", "Unknown"),
                "symbol": metadata.get("symbol", "UNKNOWN"),
                "price": price_data.get("value", 0.0),
                "liquidity": liquidity.get("value", 0.0),
                "market_cap": price_data.get("value", 0.0) * metadata.get("supply", 0.0),
                "total_supply": metadata.get("supply", 0.0),
                "holders_count": metadata.get("holders", 0),
                "top_holder_percentage": top_holder_percentage,
                "sentiment_score": sentiment.get("score", 0.0),
                "is_honeypot": sentiment.get("is_honeypot", False),
                "is_blacklisted": sentiment.get("is_blacklisted", False),
                "social_presence": sentiment.get("social_presence", 0.0),
                "updated_at": datetime.now().isoformat()
            }
            
            # Cache the result
            self.cache[cache_key] = {
                "data": token_details,
                "expires": datetime.now().timestamp() + self.cache_ttl
            }
            
            return token_details
        except Exception as e:
            logger.error(f"Failed to get token details for {token_address}: {str(e)}")
            raise
            
    async def get_trending_tokens(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get trending tokens.
        
        Args:
            limit: Maximum number of tokens to return
            
        Returns:
            List of trending tokens
        """
        cache_key = f"trending:{limit}"
        if cache_key in self.cache:
            cache_entry = self.cache[cache_key]
            if cache_entry["expires"] > datetime.now().timestamp():
                return cache_entry["data"]
        
        try:
            tokens = await self.birdeye_client.get_trending_tokens(limit)
            
            # Normalize data
            normalized_tokens = []
            for token in tokens:
                normalized_tokens.append({
                    "address": token.get("address", ""),
                    "name": token.get("name", "Unknown"),
                    "symbol": token.get("symbol", "UNKNOWN"),
                    "price": token.get("price", 0.0),
                    "price_change_24h": token.get("priceChange24h", 0.0),
                    "volume_24h": token.get("volume24h", 0.0),
                    "market_cap": token.get("marketCap", 0.0),
                    "liquidity": token.get("liquidity", 0.0)
                })
            
            # Cache the result
            self.cache[cache_key] = {
                "data": normalized_tokens,
                "expires": datetime.now().timestamp() + self.cache_ttl
            }
            
            return normalized_tokens
        except Exception as e:
            logger.error(f"Failed to get trending tokens: {str(e)}")
            raise
            
    async def get_liquidation_data(self, symbol: str, time_window_mins: int) -> Tuple[float, float]:
        """
        Get liquidation data for a symbol.
        
        Args:
            symbol: Trading symbol (e.g., "BTC", "ETH")
            time_window_mins: Time window in minutes
            
        Returns:
            Tuple of (liquidation_amount, liquidation_price)
        """
        cache_key = f"liquidation:{symbol}:{time_window_mins}"
        if cache_key in self.cache:
            cache_entry = self.cache[cache_key]
            if cache_entry["expires"] > datetime.now().timestamp():
                return cache_entry["data"]
        
        try:
            liquidation_amount, liquidation_price = await self.moondev_client.get_liquidation_data(
                symbol, time_window_mins
            )
            
            # Cache the result
            self.cache[cache_key] = {
                "data": (liquidation_amount, liquidation_price),
                "expires": datetime.now().timestamp() + self.cache_ttl
            }
            
            return liquidation_amount, liquidation_price
        except Exception as e:
            logger.error(f"Failed to get liquidation data for {symbol}: {str(e)}")
            raise
            
    async def get_wallet_transactions(self, wallet_address: str, limit: int = 100, since: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Get transactions for a wallet.
        
        Args:
            wallet_address: Wallet address
            limit: Maximum number of transactions to return
            since: Only return transactions after this time
            
        Returns:
            List of transactions
        """
        try:
            transactions = await self.moondev_client.get_wallet_transactions(
                wallet_address, limit, since
            )
            
            # Normalize data
            normalized_transactions = []
            for tx in transactions:
                normalized_transactions.append({
                    "tx_hash": tx.get("hash", ""),
                    "block_number": tx.get("blockNumber", 0),
                    "timestamp": tx.get("timestamp", ""),
                    "type": tx.get("type", "unknown"),
                    "token_address": tx.get("tokenAddress", ""),
                    "token_symbol": tx.get("tokenSymbol", ""),
                    "amount": tx.get("amount", 0.0),
                    "price": tx.get("price", 0.0),
                    "value_usd": tx.get("valueUsd", 0.0)
                })
            
            return normalized_transactions
        except Exception as e:
            logger.error(f"Failed to get wallet transactions for {wallet_address}: {str(e)}")
            raise
            
    async def close(self):
        """
        Close all client connections.
        """
        await asyncio.gather(
            self.birdeye_client.close(),
            self.moondev_client.close()
        )
