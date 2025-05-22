"""
Resource Pool for sharing resources between agents.

This module provides a centralized resource pool that manages shared resources
such as API clients, database connections, and caches to optimize resource usage
and prevent redundant instantiation.
"""
import asyncio
import logging
import time
from typing import Dict, Any, List, Optional, Set, Tuple
from datetime import datetime, timedelta
import aiohttp
import json

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
        self.cache_ttl = config.get("cache_ttl", 60)  # seconds
        self.cache_max_size = config.get("cache_max_size", 10000)
        
        # Initialize resources
        self.http_clients: Dict[str, aiohttp.ClientSession] = {}
        self.api_rate_limits: Dict[str, List[datetime]] = {}
        self.cache: Dict[str, Tuple[Any, datetime]] = {}
        self.db_connections: Dict[str, Any] = {}
        
        # Locks for thread safety
        self._http_lock = asyncio.Lock()
        self._cache_lock = asyncio.Lock()
        self._rate_limit_lock = asyncio.Lock()
        
        # Statistics
        self._http_request_count = 0
        self._http_error_count = 0
        self._cache_hit_count = 0
        self._cache_miss_count = 0
        
        logger.info("Resource pool initialized")
        
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
                
        # Clear cache
        async with self._cache_lock:
            self.cache.clear()
            
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
            
    async def cache_set(self, key: str, value: Any, ttl: Optional[int] = None):
        """
        Set a value in the cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (None for default)
        """
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
        async with self._cache_lock:
            if key in self.cache:
                del self.cache[key]
                
    async def cache_clear(self):
        """Clear the entire cache."""
        async with self._cache_lock:
            self.cache.clear()
            
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform a health check of the resource pool.
        
        Returns:
            Health check results
        """
        results = {
            "http_clients": {},
            "cache_size": len(self.cache),
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
        
    def get_stats(self) -> Dict[str, Any]:
        """
        Get resource pool statistics.
        
        Returns:
            Dictionary of statistics
        """
        # Calculate cache hit rate
        total_cache_requests = self._cache_hit_count + self._cache_miss_count
        cache_hit_rate = self._cache_hit_count / total_cache_requests if total_cache_requests > 0 else 0
        
        # Calculate HTTP error rate
        http_error_rate = self._http_error_count / self._http_request_count if self._http_request_count > 0 else 0
        
        return {
            "http_clients": len(self.http_clients),
            "http_requests": self._http_request_count,
            "http_errors": self._http_error_count,
            "http_error_rate": http_error_rate,
            "cache_size": len(self.cache),
            "cache_hits": self._cache_hit_count,
            "cache_misses": self._cache_miss_count,
            "cache_hit_rate": cache_hit_rate,
            "rate_limited_apis": len(self.api_rate_limits)
        }
