"""
Feature computation caching for machine learning components.

This module provides caching for feature computation to avoid redundant calculations.
"""
import logging
import time
import hashlib
import pickle
import os
from typing import Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

class FeatureCache:
    """Cache for feature computation."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the feature cache.
        
        Args:
            config: Cache configuration
        """
        self.config = config
        
        # Cache directory
        self.cache_dir = config.get("cache_dir", "cache/features")
        os.makedirs(self.cache_dir, exist_ok=True)
        
        # Cache TTL in seconds
        self.cache_ttl = config.get("cache_ttl", 3600)  # 1 hour
        
        # Memory cache
        self.memory_cache: Dict[str, Dict[str, Any]] = {}
        
        # Cache statistics
        self.stats = {
            "hits": 0,
            "misses": 0,
            "memory_hits": 0,
            "disk_hits": 0
        }
        
        logger.info(f"Initialized feature cache with TTL {self.cache_ttl}s")
    
    def get(self, key: str) -> Optional[pd.DataFrame]:
        """
        Get features from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached features or None if not found
        """
        # Check memory cache
        if key in self.memory_cache:
            cache_entry = self.memory_cache[key]
            if time.time() - cache_entry["timestamp"] < self.cache_ttl:
                self.stats["hits"] += 1
                self.stats["memory_hits"] += 1
                logger.debug(f"Memory cache hit for {key}")
                return cache_entry["data"]
        
        # Check disk cache
        cache_path = os.path.join(self.cache_dir, f"{key}.pkl")
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "rb") as f:
                    cache_entry = pickle.load(f)
                
                if time.time() - cache_entry["timestamp"] < self.cache_ttl:
                    # Add to memory cache
                    self.memory_cache[key] = cache_entry
                    
                    self.stats["hits"] += 1
                    self.stats["disk_hits"] += 1
                    logger.debug(f"Disk cache hit for {key}")
                    return cache_entry["data"]
            except Exception as e:
                logger.error(f"Error loading cache entry {key}: {str(e)}")
        
        self.stats["misses"] += 1
        logger.debug(f"Cache miss for {key}")
        return None
    
    def put(self, key: str, data: pd.DataFrame):
        """
        Put features in cache.
        
        Args:
            key: Cache key
            data: Features to cache
        """
        # Create cache entry
        cache_entry = {
            "data": data,
            "timestamp": time.time()
        }
        
        # Add to memory cache
        self.memory_cache[key] = cache_entry
        
        # Add to disk cache
        cache_path = os.path.join(self.cache_dir, f"{key}.pkl")
        try:
            with open(cache_path, "wb") as f:
                pickle.dump(cache_entry, f)
            logger.debug(f"Cached features for {key}")
        except Exception as e:
            logger.error(f"Error caching features for {key}: {str(e)}")
    
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
            except Exception as e:
                logger.error(f"Error invalidating cache entry {key}: {str(e)}")
    
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
        
        logger.info("Cleared feature cache")
    
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
            "hit_ratio": hit_ratio,
            "memory_cache_size": len(self.memory_cache),
            "disk_cache_size": len([f for f in os.listdir(self.cache_dir) if f.endswith(".pkl")])
        }

def generate_cache_key(data: pd.DataFrame, extractor_name: str, params: Dict[str, Any]) -> str:
    """
    Generate cache key for feature computation.
    
    Args:
        data: Input data
        extractor_name: Feature extractor name
        params: Feature extractor parameters
        
    Returns:
        Cache key
    """
    # Create key components
    key_components = [
        extractor_name,
        str(data.index[0]),
        str(data.index[-1]),
        str(len(data)),
        str(sorted(data.columns.tolist())),
        str(sorted(params.items()))
    ]
    
    # Create key string
    key_string = "_".join(key_components)
    
    # Hash key string
    key_hash = hashlib.md5(key_string.encode()).hexdigest()
    
    return f"{extractor_name}_{key_hash}"

class CachedFeatureExtractor:
    """Feature extractor with caching."""
    
    def __init__(self, extractor, cache: FeatureCache):
        """
        Initialize the cached feature extractor.
        
        Args:
            extractor: Feature extractor
            cache: Feature cache
        """
        self.extractor = extractor
        self.cache = cache
    
    def extract(self, data: pd.DataFrame, **params) -> pd.DataFrame:
        """
        Extract features from data with caching.
        
        Args:
            data: Input data
            **params: Additional parameters
            
        Returns:
            Extracted features
        """
        # Generate cache key
        cache_key = generate_cache_key(data, self.extractor.name, params)
        
        # Check cache
        cached_features = self.cache.get(cache_key)
        if cached_features is not None:
            return cached_features
        
        # Extract features
        start_time = time.time()
        features = self.extractor.extract(data, **params)
        extraction_time = time.time() - start_time
        
        # Cache features
        self.cache.put(cache_key, features)
        
        logger.debug(f"Extracted features with {self.extractor.name} in {extraction_time:.2f}s")
        
        return features
    
    def __getattr__(self, name: str) -> Any:
        """
        Get attribute from wrapped extractor.
        
        Args:
            name: Attribute name
            
        Returns:
            Attribute value
        """
        return getattr(self.extractor, name)
