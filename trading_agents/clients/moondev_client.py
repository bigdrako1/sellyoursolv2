"""
Client for the MoonDev API.
"""
import aiohttp
import asyncio
import logging
from typing import Dict, Any, List, Optional, Tuple
import time
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class MoonDevClient:
    """
    Client for the MoonDev API.
    Provides methods for accessing liquidation data, wallet transactions, and other MoonDev services.
    """
    
    BASE_URL = "https://api.moondev.ai"  # Replace with actual MoonDev API URL
    
    def __init__(self, api_key: str):
        """
        Initialize the MoonDev client.
        
        Args:
            api_key: MoonDev API key
        """
        self.api_key = api_key
        self.session = None
        self.rate_limit_remaining = 100
        self.rate_limit_reset = 0
        self.cache = {}
        self.cache_ttl = 60  # Default cache TTL in seconds
        
    async def _ensure_session(self):
        """
        Ensure that an aiohttp session exists.
        """
        if self.session is None:
            self.session = aiohttp.ClientSession(headers={
                "Authorization": f"Bearer {self.api_key}"
            })
            
    async def _make_request(self, method: str, endpoint: str, params: Optional[Dict[str, Any]] = None, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Make a request to the MoonDev API.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint
            params: Query parameters
            data: Request body for POST requests
            
        Returns:
            API response
        """
        await self._ensure_session()
        
        # Check rate limit
        if self.rate_limit_remaining <= 0:
            wait_time = max(0, self.rate_limit_reset - time.time())
            if wait_time > 0:
                logger.warning(f"Rate limit exceeded. Waiting {wait_time:.2f} seconds.")
                await asyncio.sleep(wait_time)
        
        # Check cache for GET requests
        if method == "GET" and params:
            cache_key = f"{method}:{endpoint}:{str(params)}"
            if cache_key in self.cache:
                cache_entry = self.cache[cache_key]
                if cache_entry["expires"] > time.time():
                    return cache_entry["data"]
        
        # Make request
        url = f"{self.BASE_URL}{endpoint}"
        
        try:
            async with self.session.request(method, url, params=params, json=data) as response:
                # Update rate limit info
                self.rate_limit_remaining = int(response.headers.get("X-RateLimit-Remaining", 100))
                self.rate_limit_reset = int(response.headers.get("X-RateLimit-Reset", 0))
                
                # Check response
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"MoonDev API error: {response.status} - {error_text}")
                    raise Exception(f"MoonDev API error: {response.status} - {error_text}")
                
                data = await response.json()
                
                # Cache GET responses
                if method == "GET" and params:
                    cache_key = f"{method}:{endpoint}:{str(params)}"
                    self.cache[cache_key] = {
                        "data": data,
                        "expires": time.time() + self.cache_ttl
                    }
                
                return data
        except aiohttp.ClientError as e:
            logger.error(f"MoonDev API request error: {str(e)}")
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
        endpoint = "/v1/liquidations"
        params = {
            "symbol": symbol,
            "timeWindow": time_window_mins
        }
        
        response = await self._make_request("GET", endpoint, params)
        
        # Extract liquidation amount and price
        liquidation_amount = response.get("data", {}).get("amount", 0.0)
        liquidation_price = response.get("data", {}).get("price", 0.0)
        
        return liquidation_amount, liquidation_price
        
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
        endpoint = "/v1/wallets/transactions"
        params = {
            "address": wallet_address,
            "limit": limit
        }
        
        if since:
            params["since"] = since.isoformat()
        
        response = await self._make_request("GET", endpoint, params)
        return response.get("data", {}).get("transactions", [])
        
    async def get_token_sentiment(self, token_address: str) -> Dict[str, Any]:
        """
        Get sentiment data for a token.
        
        Args:
            token_address: Token address
            
        Returns:
            Token sentiment data
        """
        endpoint = "/v1/tokens/sentiment"
        params = {
            "address": token_address
        }
        
        response = await self._make_request("GET", endpoint, params)
        return response.get("data", {})
        
    async def get_whale_activity(self, token_address: str, time_window_hours: int = 24) -> List[Dict[str, Any]]:
        """
        Get whale activity for a token.
        
        Args:
            token_address: Token address
            time_window_hours: Time window in hours
            
        Returns:
            List of whale activities
        """
        endpoint = "/v1/whales/activity"
        params = {
            "address": token_address,
            "timeWindow": time_window_hours
        }
        
        response = await self._make_request("GET", endpoint, params)
        return response.get("data", {}).get("activities", [])
        
    async def get_market_overview(self) -> Dict[str, Any]:
        """
        Get market overview.
        
        Returns:
            Market overview data
        """
        endpoint = "/v1/market/overview"
        
        response = await self._make_request("GET", endpoint)
        return response.get("data", {})
        
    async def close(self):
        """
        Close the client session.
        """
        if self.session:
            await self.session.close()
            self.session = None
