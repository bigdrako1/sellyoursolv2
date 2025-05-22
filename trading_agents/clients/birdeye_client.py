"""
Client for the Birdeye API.
"""
import aiohttp
import asyncio
import logging
from typing import Dict, Any, List, Optional
import time
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class BirdeyeClient:
    """
    Client for the Birdeye API.
    Provides methods for accessing token data, market data, and other Birdeye services.
    """
    
    BASE_URL = "https://public-api.birdeye.so"
    
    def __init__(self, api_key: str):
        """
        Initialize the Birdeye client.
        
        Args:
            api_key: Birdeye API key
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
                "X-API-KEY": self.api_key
            })
            
    async def _make_request(self, method: str, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Make a request to the Birdeye API.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint
            params: Query parameters
            
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
        
        # Check cache
        cache_key = f"{method}:{endpoint}:{str(params)}"
        if cache_key in self.cache:
            cache_entry = self.cache[cache_key]
            if cache_entry["expires"] > time.time():
                return cache_entry["data"]
        
        # Make request
        url = f"{self.BASE_URL}{endpoint}"
        
        try:
            async with self.session.request(method, url, params=params) as response:
                # Update rate limit info
                self.rate_limit_remaining = int(response.headers.get("X-RateLimit-Remaining", 100))
                self.rate_limit_reset = int(response.headers.get("X-RateLimit-Reset", 0))
                
                # Check response
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Birdeye API error: {response.status} - {error_text}")
                    raise Exception(f"Birdeye API error: {response.status} - {error_text}")
                
                data = await response.json()
                
                # Cache response
                self.cache[cache_key] = {
                    "data": data,
                    "expires": time.time() + self.cache_ttl
                }
                
                return data
        except aiohttp.ClientError as e:
            logger.error(f"Birdeye API request error: {str(e)}")
            raise
            
    async def get_token_price(self, token_address: str) -> Dict[str, Any]:
        """
        Get token price information.
        
        Args:
            token_address: Token address
            
        Returns:
            Token price information
        """
        endpoint = f"/v1/token/price"
        params = {
            "address": token_address
        }
        
        response = await self._make_request("GET", endpoint, params)
        return response.get("data", {})
        
    async def get_token_metadata(self, token_address: str) -> Dict[str, Any]:
        """
        Get token metadata.
        
        Args:
            token_address: Token address
            
        Returns:
            Token metadata
        """
        endpoint = f"/v1/token/meta"
        params = {
            "address": token_address
        }
        
        response = await self._make_request("GET", endpoint, params)
        return response.get("data", {})
        
    async def get_token_holders(self, token_address: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get token holders.
        
        Args:
            token_address: Token address
            limit: Maximum number of holders to return
            
        Returns:
            List of token holders
        """
        endpoint = f"/v1/token/holders"
        params = {
            "address": token_address,
            "limit": limit
        }
        
        response = await self._make_request("GET", endpoint, params)
        return response.get("data", {}).get("items", [])
        
    async def get_token_price_history(
        self, 
        token_address: str, 
        resolution: str = "1D", 
        count: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Get token price history.
        
        Args:
            token_address: Token address
            resolution: Time resolution (1H, 4H, 1D, 1W, etc.)
            count: Number of data points to return
            
        Returns:
            List of price data points
        """
        endpoint = f"/v1/token/price_history"
        params = {
            "address": token_address,
            "type": resolution,
            "count": count
        }
        
        response = await self._make_request("GET", endpoint, params)
        return response.get("data", {}).get("items", [])
        
    async def get_trending_tokens(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get trending tokens.
        
        Args:
            limit: Maximum number of tokens to return
            
        Returns:
            List of trending tokens
        """
        endpoint = f"/v1/token/trending"
        params = {
            "limit": limit
        }
        
        response = await self._make_request("GET", endpoint, params)
        return response.get("data", {}).get("items", [])
        
    async def get_token_liquidity(self, token_address: str) -> Dict[str, Any]:
        """
        Get token liquidity information.
        
        Args:
            token_address: Token address
            
        Returns:
            Token liquidity information
        """
        endpoint = f"/v1/token/liquidity"
        params = {
            "address": token_address
        }
        
        response = await self._make_request("GET", endpoint, params)
        return response.get("data", {})
        
    async def close(self):
        """
        Close the client session.
        """
        if self.session:
            await self.session.close()
            self.session = None
