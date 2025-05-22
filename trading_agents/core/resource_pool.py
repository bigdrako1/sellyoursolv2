"""
Resource Pool for sharing resources between agents.

This module provides a centralized resource pool that manages shared resources
such as API clients, database connections, and caches to optimize resource usage
and prevent redundant instantiation.
"""
import asyncio
import logging
import os
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional, Set, Tuple, Union
import aiohttp
import json

from .cache_manager import CacheManager, CacheLevel, InvalidationStrategy
from .cache_preloader import CachePreloader

logger = logging.getLogger(__name__)

class ResourcePool:
    """
    Manages shared resources for agents.

    This class provides a centralized pool of resources that can be shared
    between agents, including API clients, database connections, and caches.
    It optimizes resource usage and prevents redundant instantiation.

    Attributes:
        http_clients: Pool of HTTP clients
        api_rate_limits: Rate limit tracking for APIs
        cache: Shared cache for frequently accessed data
        db_connections: Database connection pool
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the resource pool.

        Args:
            config: Resource pool configuration
        """
        config = config or {}

        # HTTP client pool configuration
        self.http_pool_size = config.get("http_pool_size", 20)
        self.http_timeout = config.get("http_timeout", 30)
        self.http_retry_count = config.get("http_retry_count", 3)
        self.http_retry_delay = config.get("http_retry_delay", 1.0)

        # Rate limiting configuration
        self.rate_limit_window = config.get("rate_limit_window", 60)  # seconds

        # Cache configuration
        self.cache_ttl = config.get("cache_ttl", 300)  # 5 minutes default
        self.cache_max_size = config.get("cache_max_size", 10000)

        # Advanced cache configuration
        cache_config = {
            "memory_max_size": self.cache_max_size,
            "disk_max_size": config.get("disk_cache_max_size", 100 * 1024 * 1024),  # 100 MB
            "default_ttl": self.cache_ttl,
            "disk_cache_enabled": config.get("disk_cache_enabled", True),
            "disk_cache_dir": config.get("disk_cache_dir", "cache"),
            "invalidation_strategy": config.get("cache_invalidation_strategy", InvalidationStrategy.LRU.value)
        }

        # Initialize resources
        self.http_clients: Dict[str, aiohttp.ClientSession] = {}
        self.api_rate_limits: Dict[str, List[datetime]] = {}
        self.cache_manager = CacheManager(cache_config)
        self.cache_preloader = CachePreloader(self)
        self.db_connections: Dict[str, Any] = {}

        # Legacy cache for backward compatibility
        self.cache: Dict[str, Tuple[Any, datetime]] = {}

        # Locks for thread safety
        self._http_lock = asyncio.Lock()
        self._cache_lock = asyncio.Lock()
        self._rate_limit_lock = asyncio.Lock()

        # Statistics
        self._http_request_count = 0
        self._http_error_count = 0
        self._cache_hit_count = 0
        self._cache_miss_count = 0

        logger.info("Resource pool initialized with advanced caching")

    async def close(self):
        """Close all resources."""
        logger.info("Closing resource pool")

        # Close HTTP clients
        for name, client in self.http_clients.items():
            try:
                await client.close()
                logger.debug(f"Closed HTTP client: {name}")
            except Exception as e:
                logger.error(f"Error closing HTTP client {name}: {str(e)}")

        # Clear legacy cache
        async with self._cache_lock:
            self.cache.clear()

        # Clear advanced cache
        try:
            await self.cache_manager.clear()
            logger.debug("Cleared advanced cache")
        except Exception as e:
            logger.error(f"Error clearing advanced cache: {str(e)}")

        # Stop cache preloader
        try:
            await self.cache_preloader.stop()
            logger.debug("Stopped cache preloader")
        except Exception as e:
            logger.error(f"Error stopping cache preloader: {str(e)}")

        logger.info("Resource pool closed")

    async def get_http_client(self, name: str = "default") -> aiohttp.ClientSession:
        """
        Get or create an HTTP client.

        Args:
            name: Client name/identifier

        Returns:
            HTTP client session
        """
        async with self._http_lock:
            # Check if client exists and is not closed
            if name in self.http_clients and not self.http_clients[name].closed:
                return self.http_clients[name]

            # Create new client
            timeout = aiohttp.ClientTimeout(total=self.http_timeout)
            client = aiohttp.ClientSession(timeout=timeout)
            self.http_clients[name] = client

            logger.debug(f"Created new HTTP client: {name}")
            return client

    async def http_request(
        self,
        method: str,
        url: str,
        api_name: str = "default",
        rate_limit: Optional[int] = None,
        **kwargs
    ) -> Tuple[int, Any]:
        """
        Make an HTTP request with rate limiting and retries.

        Args:
            method: HTTP method (GET, POST, etc.)
            url: Request URL
            api_name: API name for rate limiting
            rate_limit: Maximum requests per minute (None for no limit)
            **kwargs: Additional arguments for the request

        Returns:
            Tuple of (status_code, response_data)

        Raises:
            Exception: If the request fails after retries
        """
        # Check rate limit
        if rate_limit is not None:
            await self._check_rate_limit(api_name, rate_limit)

        # Get HTTP client
        client = await self.get_http_client(api_name)

        # Initialize retry counter
        retry_count = 0
        last_error = None

        # Increment request count
        self._http_request_count += 1

        # Try the request with retries
        while retry_count <= self.http_retry_count:
            try:
                async with client.request(method, url, **kwargs) as response:
                    # Record the request time for rate limiting
                    await self._record_request(api_name)

                    # Get response data
                    if response.content_type == 'application/json':
                        data = await response.json()
                    else:
                        data = await response.text()

                    return response.status, data

            except asyncio.TimeoutError as e:
                last_error = e
                logger.warning(f"Timeout error for {method} {url} (retry {retry_count}/{self.http_retry_count})")

            except aiohttp.ClientError as e:
                last_error = e
                logger.warning(f"Client error for {method} {url}: {str(e)} (retry {retry_count}/{self.http_retry_count})")

            except Exception as e:
                last_error = e
                logger.error(f"Unexpected error for {method} {url}: {str(e)} (retry {retry_count}/{self.http_retry_count})")

            # Increment retry counter
            retry_count += 1

            # Increment error count
            self._http_error_count += 1

            # Wait before retrying
            if retry_count <= self.http_retry_count:
                await asyncio.sleep(self.http_retry_delay * retry_count)

        # If we get here, all retries failed
        raise last_error or Exception(f"Request failed after {self.http_retry_count} retries")

    async def _check_rate_limit(self, api_name: str, rate_limit: int):
        """
        Check if a request would exceed the rate limit.

        Args:
            api_name: API name
            rate_limit: Maximum requests per minute

        Raises:
            Exception: If the rate limit would be exceeded
        """
        async with self._rate_limit_lock:
            # Initialize rate limit tracking if needed
            if api_name not in self.api_rate_limits:
                self.api_rate_limits[api_name] = []

            # Get request timestamps
            timestamps = self.api_rate_limits[api_name]

            # Remove old timestamps
            current_time = datetime.now()
            window_start = current_time - timedelta(seconds=self.rate_limit_window)
            timestamps = [ts for ts in timestamps if ts >= window_start]
            self.api_rate_limits[api_name] = timestamps

            # Check if rate limit would be exceeded
            if len(timestamps) >= rate_limit:
                # Calculate time to wait
                oldest = timestamps[0]
                wait_time = (oldest + timedelta(seconds=self.rate_limit_window) - current_time).total_seconds()

                if wait_time > 0:
                    logger.warning(f"Rate limit reached for {api_name}, waiting {wait_time:.2f}s")
                    await asyncio.sleep(wait_time)

                    # Recursive call after waiting
                    await self._check_rate_limit(api_name, rate_limit)

    async def _record_request(self, api_name: str):
        """
        Record a request for rate limiting.

        Args:
            api_name: API name
        """
        async with self._rate_limit_lock:
            # Initialize rate limit tracking if needed
            if api_name not in self.api_rate_limits:
                self.api_rate_limits[api_name] = []

            # Add current timestamp
            self.api_rate_limits[api_name].append(datetime.now())

    async def cache_get(self, key: str) -> Optional[Any]:
        """
        Get a value from the cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found or expired
        """
        # Try to get from advanced cache first
        try:
            value = await self.cache_manager.get(key)
            if value is not None:
                return value
        except Exception as e:
            logger.warning(f"Error getting from advanced cache: {str(e)}, falling back to legacy cache")

        # Fall back to legacy cache
        async with self._cache_lock:
            # Check if key exists
            if key not in self.cache:
                self._cache_miss_count += 1
                return None

            # Get value and expiration
            value, expiration = self.cache[key]

            # Check if expired
            if expiration < datetime.now():
                # Remove expired entry
                del self.cache[key]
                self._cache_miss_count += 1
                return None

            # Return value
            self._cache_hit_count += 1
            return value

    async def cache_set(self, key: str, value: Any, ttl: Optional[int] = None, tags: Optional[List[str]] = None):
        """
        Set a value in the cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (None for default)
            tags: Optional tags for grouping and invalidation
        """
        # Store in advanced cache
        try:
            await self.cache_manager.set(key, value, ttl, CacheLevel.ALL, tags)
        except Exception as e:
            logger.warning(f"Error setting in advanced cache: {str(e)}, falling back to legacy cache")

            # Fall back to legacy cache
            async with self._cache_lock:
                # Check cache size
                if len(self.cache) >= self.cache_max_size and key not in self.cache:
                    # Remove oldest entry
                    oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k][1])
                    del self.cache[oldest_key]

                # Calculate expiration
                ttl = ttl or self.cache_ttl
                expiration = datetime.now() + timedelta(seconds=ttl)

                # Store value
                self.cache[key] = (value, expiration)

    async def cache_delete(self, key: str):
        """
        Delete a value from the cache.

        Args:
            key: Cache key
        """
        # Delete from advanced cache
        try:
            await self.cache_manager.delete(key)
        except Exception as e:
            logger.warning(f"Error deleting from advanced cache: {str(e)}")

        # Delete from legacy cache
        async with self._cache_lock:
            if key in self.cache:
                del self.cache[key]

    async def cache_clear(self):
        """Clear the entire cache."""
        # Clear advanced cache
        try:
            await self.cache_manager.clear()
        except Exception as e:
            logger.warning(f"Error clearing advanced cache: {str(e)}")

        # Clear legacy cache
        async with self._cache_lock:
            self.cache.clear()

    async def cache_invalidate_by_pattern(self, pattern: str) -> int:
        """
        Invalidate cache entries by key pattern.

        Args:
            pattern: Regex pattern to match keys

        Returns:
            Number of invalidated entries
        """
        try:
            return await self.cache_manager.invalidate_by_pattern(pattern)
        except Exception as e:
            logger.warning(f"Error invalidating by pattern: {str(e)}")
            return 0

    async def cache_invalidate_by_tag(self, tag: str) -> int:
        """
        Invalidate cache entries by tag.

        Args:
            tag: Tag to match

        Returns:
            Number of invalidated entries
        """
        try:
            return await self.cache_manager.invalidate_by_tag(tag)
        except Exception as e:
            logger.warning(f"Error invalidating by tag: {str(e)}")
            return 0

    async def health_check(self) -> Dict[str, Any]:
        """
        Perform a health check of the resource pool.

        Returns:
            Health check results
        """
        # Get advanced cache stats
        try:
            advanced_cache_stats = await self.cache_manager.get_stats()
        except Exception as e:
            logger.warning(f"Error getting advanced cache stats: {str(e)}")
            advanced_cache_stats = {}

        results = {
            "http_clients": {},
            "legacy_cache_size": len(self.cache),
            "advanced_cache": advanced_cache_stats,
            "rate_limits": {}
        }

        # Check HTTP clients
        for name, client in self.http_clients.items():
            results["http_clients"][name] = {
                "closed": client.closed
            }

        # Check rate limits
        async with self._rate_limit_lock:
            for api_name, timestamps in self.api_rate_limits.items():
                # Remove old timestamps
                current_time = datetime.now()
                window_start = current_time - timedelta(seconds=self.rate_limit_window)
                timestamps = [ts for ts in timestamps if ts >= window_start]
                self.api_rate_limits[api_name] = timestamps

                # Record current rate
                results["rate_limits"][api_name] = len(timestamps)

        return results

    async def get_stats(self) -> Dict[str, Any]:
        """
        Get resource pool statistics.

        Returns:
            Dictionary of statistics
        """
        # Calculate legacy cache hit rate
        total_cache_requests = self._cache_hit_count + self._cache_miss_count
        cache_hit_rate = self._cache_hit_count / total_cache_requests if total_cache_requests > 0 else 0

        # Calculate HTTP error rate
        http_error_rate = self._http_error_count / self._http_request_count if self._http_request_count > 0 else 0

        # Get advanced cache stats
        try:
            advanced_cache_stats = await self.cache_manager.get_stats()
        except Exception as e:
            logger.warning(f"Error getting advanced cache stats: {str(e)}")
            advanced_cache_stats = {}

        stats = {
            "http_clients": len(self.http_clients),
            "http_requests": self._http_request_count,
            "http_errors": self._http_error_count,
            "http_error_rate": http_error_rate,
            "legacy_cache_size": len(self.cache),
            "legacy_cache_hits": self._cache_hit_count,
            "legacy_cache_misses": self._cache_miss_count,
            "legacy_cache_hit_rate": cache_hit_rate,
            "rate_limited_apis": len(self.api_rate_limits)
        }

        # Add advanced cache stats
        if advanced_cache_stats:
            stats["advanced_cache"] = advanced_cache_stats

            # Add combined stats
            combined_hit_rate = 0
            combined_hits = self._cache_hit_count + advanced_cache_stats.get("memory_hit_count", 0) + advanced_cache_stats.get("disk_hit_count", 0)
            combined_misses = self._cache_miss_count + advanced_cache_stats.get("memory_miss_count", 0) + advanced_cache_stats.get("disk_miss_count", 0)
            combined_total = combined_hits + combined_misses

            if combined_total > 0:
                combined_hit_rate = combined_hits / combined_total

            stats["combined_cache_hits"] = combined_hits
            stats["combined_cache_misses"] = combined_misses
            stats["combined_cache_hit_rate"] = combined_hit_rate

        return stats

    async def start_cache_preloader(self):
        """Start the cache preloader."""
        await self.cache_preloader.start()

    async def stop_cache_preloader(self):
        """Stop the cache preloader."""
        await self.cache_preloader.stop()

    def register_preload_task(
        self,
        name: str,
        loader_func,
        interval: int,
        args: Optional[List[Any]] = None,
        kwargs: Optional[Dict[str, Any]] = None,
        cache_key: Optional[str] = None,
        cache_ttl: Optional[int] = None,
        tags: Optional[List[str]] = None,
        enabled: bool = True
    ):
        """
        Register a preload task.

        Args:
            name: Task name
            loader_func: Function to load data
            interval: Interval in seconds
            args: Arguments for the loader function
            kwargs: Keyword arguments for the loader function
            cache_key: Cache key (if None, result won't be cached)
            cache_ttl: Cache TTL in seconds
            tags: Tags for grouping and invalidation
            enabled: Whether the task is enabled
        """
        self.cache_preloader.register_task(
            name=name,
            loader_func=loader_func,
            interval=interval,
            args=args,
            kwargs=kwargs,
            cache_key=cache_key,
            cache_ttl=cache_ttl,
            tags=tags,
            enabled=enabled
        )

    def unregister_preload_task(self, name: str):
        """
        Unregister a preload task.

        Args:
            name: Task name
        """
        self.cache_preloader.unregister_task(name)

    async def run_preload_task_now(self, name: str) -> bool:
        """
        Run a preload task immediately.

        Args:
            name: Task name

        Returns:
            True if the task was run, False otherwise
        """
        return await self.cache_preloader.run_task_now(name)

    async def get_preloader_stats(self) -> Dict[str, Any]:
        """
        Get cache preloader statistics.

        Returns:
            Dictionary of statistics
        """
        return await self.cache_preloader.get_stats()
