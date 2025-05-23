"""
Response caching for exchange integration.

This module provides caching for API responses to reduce the number of API calls.
"""
import logging
import time
import hashlib
import pickle
import os
from typing import Dict, List, Any, Optional, Tuple

logger = logging.getLogger(__name__)

class ResponseCache:
    """Cache for API responses."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the response cache.
        
        Args:
            config: Cache configuration
        """
        self.config = config
        
        # Cache directory
        self.cache_dir = config.get("cache_dir", "cache/responses")
        os.makedirs(self.cache_dir, exist_ok=True)
        
        # Default TTL in seconds
        self.default_ttl = config.get("default_ttl", 60)
        
        # TTL by endpoint type
        self.ttl_by_type = config.get("ttl_by_type", {
            "markets": 3600,  # 1 hour
            "ticker": 10,     # 10 seconds
            "ohlcv": 60,      # 1 minute
            "orderbook": 5,   # 5 seconds
            "trades": 30,     # 30 seconds
            "balance": 30,    # 30 seconds
            "orders": 10,     # 10 seconds
            "positions": 10   # 10 seconds
        })
        
        # Memory cache
        self.memory_cache: Dict[str, Dict[str, Any]] = {}
        
        # Cache statistics
        self.stats = {
            "hits": 0,
            "misses": 0,
            "memory_hits": 0,
            "disk_hits": 0,
            "invalidations": 0
        }
        
        logger.info(f"Initialized response cache with default TTL {self.default_ttl}s")
    
    def get(self, key: str, endpoint_type: str) -> Optional[Any]:
        """
        Get response from cache.
        
        Args:
            key: Cache key
            endpoint_type: Endpoint type
            
        Returns:
            Cached response or None if not found
        """
        # Get TTL for endpoint type
        ttl = self.ttl_by_type.get(endpoint_type, self.default_ttl)
        
        # Check memory cache
        if key in self.memory_cache:
            cache_entry = self.memory_cache[key]
            if time.time() - cache_entry["timestamp"] < ttl:
                self.stats["hits"] += 1
                self.stats["memory_hits"] += 1
                logger.debug(f"Memory cache hit for {key} ({endpoint_type})")
                return cache_entry["data"]
        
        # Check disk cache
        cache_path = os.path.join(self.cache_dir, f"{key}.pkl")
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "rb") as f:
                    cache_entry = pickle.load(f)
                
                if time.time() - cache_entry["timestamp"] < ttl:
                    # Add to memory cache
                    self.memory_cache[key] = cache_entry
                    
                    self.stats["hits"] += 1
                    self.stats["disk_hits"] += 1
                    logger.debug(f"Disk cache hit for {key} ({endpoint_type})")
                    return cache_entry["data"]
            except Exception as e:
                logger.error(f"Error loading cache entry {key}: {str(e)}")
        
        self.stats["misses"] += 1
        logger.debug(f"Cache miss for {key} ({endpoint_type})")
        return None
    
    def put(self, key: str, data: Any, endpoint_type: str):
        """
        Put response in cache.
        
        Args:
            key: Cache key
            data: Response data
            endpoint_type: Endpoint type
        """
        # Create cache entry
        cache_entry = {
            "data": data,
            "timestamp": time.time(),
            "endpoint_type": endpoint_type
        }
        
        # Add to memory cache
        self.memory_cache[key] = cache_entry
        
        # Add to disk cache
        cache_path = os.path.join(self.cache_dir, f"{key}.pkl")
        try:
            with open(cache_path, "wb") as f:
                pickle.dump(cache_entry, f)
            logger.debug(f"Cached response for {key} ({endpoint_type})")
        except Exception as e:
            logger.error(f"Error caching response for {key}: {str(e)}")
    
    def invalidate(self, key: str):
        """
        Invalidate cache entry.
        
        Args:
            key: Cache key
        """
        # Remove from memory cache
        if key in self.memory_cache:
            del self.memory_cache[key]
        
        # Remove from disk cache
        cache_path = os.path.join(self.cache_dir, f"{key}.pkl")
        if os.path.exists(cache_path):
            try:
                os.remove(cache_path)
                logger.debug(f"Invalidated cache entry {key}")
                self.stats["invalidations"] += 1
            except Exception as e:
                logger.error(f"Error invalidating cache entry {key}: {str(e)}")
    
    def invalidate_by_type(self, endpoint_type: str):
        """
        Invalidate all cache entries of a specific type.
        
        Args:
            endpoint_type: Endpoint type
        """
        # Remove from memory cache
        keys_to_remove = []
        for key, entry in self.memory_cache.items():
            if entry.get("endpoint_type") == endpoint_type:
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self.memory_cache[key]
        
        # Remove from disk cache
        for filename in os.listdir(self.cache_dir):
            if filename.endswith(".pkl"):
                try:
                    cache_path = os.path.join(self.cache_dir, filename)
                    with open(cache_path, "rb") as f:
                        cache_entry = pickle.load(f)
                    
                    if cache_entry.get("endpoint_type") == endpoint_type:
                        os.remove(cache_path)
                        self.stats["invalidations"] += 1
                except Exception as e:
                    logger.error(f"Error invalidating cache entry {filename}: {str(e)}")
        
        logger.debug(f"Invalidated all cache entries of type {endpoint_type}")
    
    def clear(self):
        """Clear all cache entries."""
        # Clear memory cache
        self.memory_cache.clear()
        
        # Clear disk cache
        for filename in os.listdir(self.cache_dir):
            if filename.endswith(".pkl"):
                try:
                    os.remove(os.path.join(self.cache_dir, filename))
                except Exception as e:
                    logger.error(f"Error removing cache file {filename}: {str(e)}")
        
        logger.info("Cleared response cache")
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        
        Returns:
            Cache statistics
        """
        total_requests = self.stats["hits"] + self.stats["misses"]
        hit_ratio = self.stats["hits"] / total_requests if total_requests > 0 else 0
        
        return {
            "hits": self.stats["hits"],
            "misses": self.stats["misses"],
            "memory_hits": self.stats["memory_hits"],
            "disk_hits": self.stats["disk_hits"],
            "invalidations": self.stats["invalidations"],
            "hit_ratio": hit_ratio,
            "memory_cache_size": len(self.memory_cache),
            "disk_cache_size": len([f for f in os.listdir(self.cache_dir) if f.endswith(".pkl")])
        }

def generate_cache_key(exchange_id: str, endpoint: str, params: Dict[str, Any]) -> str:
    """
    Generate cache key for API response.
    
    Args:
        exchange_id: Exchange ID
        endpoint: API endpoint
        params: Request parameters
        
    Returns:
        Cache key
    """
    # Create key components
    key_components = [
        exchange_id,
        endpoint,
        str(sorted(params.items()))
    ]
    
    # Create key string
    key_string = "_".join(key_components)
    
    # Hash key string
    key_hash = hashlib.md5(key_string.encode()).hexdigest()
    
    return f"{exchange_id}_{endpoint}_{key_hash}"

class CachedExchangeClient:
    """Exchange client with response caching."""
    
    def __init__(self, client, cache: ResponseCache):
        """
        Initialize the cached exchange client.
        
        Args:
            client: Exchange client
            cache: Response cache
        """
        self.client = client
        self.cache = cache
    
    async def fetch_markets(self) -> List[Dict[str, Any]]:
        """
        Fetch available markets.
        
        Returns:
            List of markets
        """
        # Generate cache key
        key = generate_cache_key(self.client.name, "markets", {})
        
        # Check cache
        cached_response = self.cache.get(key, "markets")
        if cached_response is not None:
            return cached_response
        
        # Fetch markets
        markets = await self.client.fetch_markets()
        
        # Cache response
        self.cache.put(key, markets, "markets")
        
        return markets
    
    async def fetch_ticker(self, symbol: str) -> Dict[str, Any]:
        """
        Fetch ticker for a symbol.
        
        Args:
            symbol: Trading symbol
            
        Returns:
            Ticker data
        """
        # Generate cache key
        key = generate_cache_key(self.client.name, "ticker", {"symbol": symbol})
        
        # Check cache
        cached_response = self.cache.get(key, "ticker")
        if cached_response is not None:
            return cached_response
        
        # Fetch ticker
        ticker = await self.client.fetch_ticker(symbol)
        
        # Cache response
        self.cache.put(key, ticker, "ticker")
        
        return ticker
    
    async def fetch_ohlcv(self, symbol: str, timeframe: str = "1h", since: int = None, limit: int = None) -> List[List[float]]:
        """
        Fetch OHLCV data for a symbol.
        
        Args:
            symbol: Trading symbol
            timeframe: Timeframe (1m, 5m, 15m, 30m, 1h, 4h, 1d)
            since: Timestamp in milliseconds for start time
            limit: Maximum number of candles to fetch
            
        Returns:
            List of OHLCV candles
        """
        # Generate cache key
        params = {
            "symbol": symbol,
            "timeframe": timeframe,
            "since": since,
            "limit": limit
        }
        key = generate_cache_key(self.client.name, "ohlcv", params)
        
        # Check cache
        cached_response = self.cache.get(key, "ohlcv")
        if cached_response is not None:
            return cached_response
        
        # Fetch OHLCV
        ohlcv = await self.client.fetch_ohlcv(symbol, timeframe, since, limit)
        
        # Cache response
        self.cache.put(key, ohlcv, "ohlcv")
        
        return ohlcv
    
    def __getattr__(self, name: str) -> Any:
        """
        Get attribute from wrapped client.
        
        Args:
            name: Attribute name
            
        Returns:
            Attribute value
        """
        return getattr(self.client, name)
