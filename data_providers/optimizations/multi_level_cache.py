"""
Multi-level caching for on-chain data.

This module provides multi-level caching for on-chain data to reduce API calls.
"""
import logging
import time
import hashlib
import pickle
import os
import json
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd

logger = logging.getLogger(__name__)

class CacheLevel:
    """Cache level for multi-level cache."""
    
    def __init__(self, name: str, ttl: int):
        """
        Initialize the cache level.
        
        Args:
            name: Cache level name
            ttl: Time-to-live in seconds
        """
        self.name = name
        self.ttl = ttl
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.stats = {
            "hits": 0,
            "misses": 0,
            "puts": 0,
            "invalidations": 0
        }
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get data from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached data or None if not found
        """
        if key in self.cache:
            entry = self.cache[key]
            if time.time() - entry["timestamp"] < self.ttl:
                self.stats["hits"] += 1
                logger.debug(f"Cache hit for {key} in {self.name} level")
                return entry["data"]
        
        self.stats["misses"] += 1
        logger.debug(f"Cache miss for {key} in {self.name} level")
        return None
    
    def put(self, key: str, data: Any):
        """
        Put data in cache.
        
        Args:
            key: Cache key
            data: Data to cache
        """
        self.cache[key] = {
            "data": data,
            "timestamp": time.time()
        }
        self.stats["puts"] += 1
        logger.debug(f"Cached data for {key} in {self.name} level")
    
    def invalidate(self, key: str):
        """
        Invalidate cache entry.
        
        Args:
            key: Cache key
        """
        if key in self.cache:
            del self.cache[key]
            self.stats["invalidations"] += 1
            logger.debug(f"Invalidated cache entry {key} in {self.name} level")
    
    def clear(self):
        """Clear all cache entries."""
        self.cache.clear()
        logger.info(f"Cleared {self.name} level cache")
    
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
            "puts": self.stats["puts"],
            "invalidations": self.stats["invalidations"],
            "hit_ratio": hit_ratio,
            "size": len(self.cache)
        }

class DiskCache:
    """Disk cache for multi-level cache."""
    
    def __init__(self, name: str, ttl: int, cache_dir: str):
        """
        Initialize the disk cache.
        
        Args:
            name: Cache level name
            ttl: Time-to-live in seconds
            cache_dir: Cache directory
        """
        self.name = name
        self.ttl = ttl
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)
        
        self.stats = {
            "hits": 0,
            "misses": 0,
            "puts": 0,
            "invalidations": 0
        }
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get data from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached data or None if not found
        """
        cache_path = os.path.join(self.cache_dir, f"{key}.pkl")
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "rb") as f:
                    entry = pickle.load(f)
                
                if time.time() - entry["timestamp"] < self.ttl:
                    self.stats["hits"] += 1
                    logger.debug(f"Cache hit for {key} in {self.name} level")
                    return entry["data"]
            except Exception as e:
                logger.error(f"Error loading cache entry {key} from {self.name} level: {str(e)}")
        
        self.stats["misses"] += 1
        logger.debug(f"Cache miss for {key} in {self.name} level")
        return None
    
    def put(self, key: str, data: Any):
        """
        Put data in cache.
        
        Args:
            key: Cache key
            data: Data to cache
        """
        cache_path = os.path.join(self.cache_dir, f"{key}.pkl")
        try:
            with open(cache_path, "wb") as f:
                pickle.dump({
                    "data": data,
                    "timestamp": time.time()
                }, f)
            self.stats["puts"] += 1
            logger.debug(f"Cached data for {key} in {self.name} level")
        except Exception as e:
            logger.error(f"Error caching data for {key} in {self.name} level: {str(e)}")
    
    def invalidate(self, key: str):
        """
        Invalidate cache entry.
        
        Args:
            key: Cache key
        """
        cache_path = os.path.join(self.cache_dir, f"{key}.pkl")
        if os.path.exists(cache_path):
            try:
                os.remove(cache_path)
                self.stats["invalidations"] += 1
                logger.debug(f"Invalidated cache entry {key} in {self.name} level")
            except Exception as e:
                logger.error(f"Error invalidating cache entry {key} in {self.name} level: {str(e)}")
    
    def clear(self):
        """Clear all cache entries."""
        for filename in os.listdir(self.cache_dir):
            if filename.endswith(".pkl"):
                try:
                    os.remove(os.path.join(self.cache_dir, filename))
                except Exception as e:
                    logger.error(f"Error removing cache file {filename} from {self.name} level: {str(e)}")
        
        logger.info(f"Cleared {self.name} level cache")
    
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
            "puts": self.stats["puts"],
            "invalidations": self.stats["invalidations"],
            "hit_ratio": hit_ratio,
            "size": len([f for f in os.listdir(self.cache_dir) if f.endswith(".pkl")])
        }

class MultiLevelCache:
    """Multi-level cache for on-chain data."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the multi-level cache.
        
        Args:
            config: Cache configuration
        """
        self.config = config
        
        # Cache directory
        self.cache_dir = config.get("cache_dir", "cache/onchain")
        os.makedirs(self.cache_dir, exist_ok=True)
        
        # Cache levels
        self.levels = [
            CacheLevel("memory_short", config.get("memory_short_ttl", 60)),     # 1 minute
            CacheLevel("memory_medium", config.get("memory_medium_ttl", 300)),  # 5 minutes
            CacheLevel("memory_long", config.get("memory_long_ttl", 3600)),     # 1 hour
            DiskCache("disk_short", config.get("disk_short_ttl", 3600), os.path.join(self.cache_dir, "short")),     # 1 hour
            DiskCache("disk_medium", config.get("disk_medium_ttl", 86400), os.path.join(self.cache_dir, "medium")), # 1 day
            DiskCache("disk_long", config.get("disk_long_ttl", 604800), os.path.join(self.cache_dir, "long"))       # 1 week
        ]
        
        logger.info(f"Initialized multi-level cache with {len(self.levels)} levels")
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get data from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached data or None if not found
        """
        # Check each level
        for level in self.levels:
            data = level.get(key)
            if data is not None:
                # Update higher levels
                for higher_level in self.levels:
                    if higher_level.name != level.name:
                        higher_level.put(key, data)
                return data
        
        return None
    
    def put(self, key: str, data: Any):
        """
        Put data in cache.
        
        Args:
            key: Cache key
            data: Data to cache
        """
        # Put in all levels
        for level in self.levels:
            level.put(key, data)
    
    def invalidate(self, key: str):
        """
        Invalidate cache entry.
        
        Args:
            key: Cache key
        """
        # Invalidate in all levels
        for level in self.levels:
            level.invalidate(key)
    
    def clear(self):
        """Clear all cache entries."""
        # Clear all levels
        for level in self.levels:
            level.clear()
    
    def get_stats(self) -> Dict[str, Dict[str, Any]]:
        """
        Get cache statistics.
        
        Returns:
            Cache statistics by level
        """
        return {level.name: level.get_stats() for level in self.levels}

def generate_cache_key(source: str, metric: str, asset: str, params: Dict[str, Any]) -> str:
    """
    Generate cache key for on-chain data.
    
    Args:
        source: Data source
        metric: Metric name
        asset: Asset symbol
        params: Request parameters
        
    Returns:
        Cache key
    """
    # Create key components
    key_components = [
        source,
        metric,
        asset,
        str(sorted(params.items()))
    ]
    
    # Create key string
    key_string = "_".join(key_components)
    
    # Hash key string
    key_hash = hashlib.md5(key_string.encode()).hexdigest()
    
    return f"{source}_{metric}_{asset}_{key_hash}"

class CachedOnChainDataProvider:
    """On-chain data provider with multi-level caching."""
    
    def __init__(self, provider, cache: MultiLevelCache):
        """
        Initialize the cached on-chain data provider.
        
        Args:
            provider: On-chain data provider
            cache: Multi-level cache
        """
        self.provider = provider
        self.cache = cache
    
    async def fetch_metric(self, metric: str, asset: str, since: int = None, until: int = None, resolution: str = "1d", source: str = None) -> pd.DataFrame:
        """
        Fetch on-chain metric data with caching.
        
        Args:
            metric: Metric name
            asset: Asset symbol
            since: Start timestamp in milliseconds
            until: End timestamp in milliseconds
            resolution: Data resolution
            source: Data source
            
        Returns:
            DataFrame with metric data
        """
        # Generate cache key
        params = {
            "since": since,
            "until": until,
            "resolution": resolution
        }
        source = source or self.provider.default_source
        key = generate_cache_key(source, metric, asset, params)
        
        # Check cache
        cached_data = self.cache.get(key)
        if cached_data is not None:
            return cached_data
        
        # Fetch data
        data = await self.provider.fetch_metric(metric, asset, since, until, resolution, source)
        
        # Cache data
        self.cache.put(key, data)
        
        return data
    
    def __getattr__(self, name: str) -> Any:
        """
        Get attribute from wrapped provider.
        
        Args:
            name: Attribute name
            
        Returns:
            Attribute value
        """
        return getattr(self.provider, name)
