"""
Connection pooling for exchange integration.

This module provides connection pooling for HTTP requests to exchanges.
"""
import logging
import time
import asyncio
from typing import Dict, List, Any, Optional, Tuple
import aiohttp

logger = logging.getLogger(__name__)

class ConnectionPool:
    """Connection pool for HTTP requests."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the connection pool.
        
        Args:
            config: Connection pool configuration
        """
        self.config = config
        
        # Maximum number of connections
        self.max_connections = config.get("max_connections", 10)
        
        # Connection timeout in seconds
        self.connection_timeout = config.get("connection_timeout", 10.0)
        
        # Request timeout in seconds
        self.request_timeout = config.get("request_timeout", 30.0)
        
        # Connection pools by host
        self.pools: Dict[str, aiohttp.ClientSession] = {}
        
        # Connection pool statistics
        self.stats = {
            "requests": 0,
            "errors": 0,
            "total_time": 0.0
        }
        
        logger.info(f"Initialized connection pool with max {self.max_connections} connections")
    
    async def get_session(self, host: str) -> aiohttp.ClientSession:
        """
        Get a session for a host.
        
        Args:
            host: Host name
            
        Returns:
            Client session
        """
        if host not in self.pools:
            # Create TCP connector with connection limit
            connector = aiohttp.TCPConnector(
                limit=self.max_connections,
                limit_per_host=self.max_connections,
                ssl=False
            )
            
            # Create session
            self.pools[host] = aiohttp.ClientSession(
                connector=connector,
                timeout=aiohttp.ClientTimeout(
                    total=self.request_timeout,
                    connect=self.connection_timeout
                )
            )
            
            logger.debug(f"Created connection pool for {host}")
        
        return self.pools[host]
    
    async def get(self, url: str, params: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Make a GET request.
        
        Args:
            url: URL to request
            params: Request parameters
            headers: Request headers
            
        Returns:
            Response data
        """
        # Get host from URL
        host = url.split("://")[1].split("/")[0]
        
        # Get session
        session = await self.get_session(host)
        
        # Make request
        start_time = time.time()
        try:
            async with session.get(url, params=params, headers=headers) as response:
                # Check response
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Request failed with status {response.status}: {error_text}")
                
                # Parse response
                data = await response.json()
                
                # Update statistics
                self.stats["requests"] += 1
                self.stats["total_time"] += time.time() - start_time
                
                return data
        except Exception as e:
            # Update statistics
            self.stats["errors"] += 1
            self.stats["total_time"] += time.time() - start_time
            
            # Re-raise exception
            raise e
    
    async def post(self, url: str, data: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Make a POST request.
        
        Args:
            url: URL to request
            data: Request data
            headers: Request headers
            
        Returns:
            Response data
        """
        # Get host from URL
        host = url.split("://")[1].split("/")[0]
        
        # Get session
        session = await self.get_session(host)
        
        # Make request
        start_time = time.time()
        try:
            async with session.post(url, json=data, headers=headers) as response:
                # Check response
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Request failed with status {response.status}: {error_text}")
                
                # Parse response
                data = await response.json()
                
                # Update statistics
                self.stats["requests"] += 1
                self.stats["total_time"] += time.time() - start_time
                
                return data
        except Exception as e:
            # Update statistics
            self.stats["errors"] += 1
            self.stats["total_time"] += time.time() - start_time
            
            # Re-raise exception
            raise e
    
    async def close(self):
        """Close all connections."""
        for host, session in self.pools.items():
            await session.close()
            logger.debug(f"Closed connection pool for {host}")
        
        self.pools.clear()
        logger.info("Closed all connection pools")
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get connection pool statistics.
        
        Returns:
            Connection pool statistics
        """
        avg_request_time = self.stats["total_time"] / self.stats["requests"] if self.stats["requests"] > 0 else 0
        error_rate = self.stats["errors"] / self.stats["requests"] if self.stats["requests"] > 0 else 0
        
        return {
            "requests": self.stats["requests"],
            "errors": self.stats["errors"],
            "error_rate": error_rate,
            "total_time": self.stats["total_time"],
            "avg_request_time": avg_request_time,
            "active_pools": len(self.pools)
        }

class ConnectionPoolManager:
    """Manager for connection pools."""
    
    _instance = None
    
    @classmethod
    def get_instance(cls, config: Optional[Dict[str, Any]] = None) -> 'ConnectionPoolManager':
        """
        Get the singleton instance.
        
        Args:
            config: Connection pool configuration
            
        Returns:
            Connection pool manager instance
        """
        if cls._instance is None:
            cls._instance = cls(config or {})
        return cls._instance
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the connection pool manager.
        
        Args:
            config: Connection pool configuration
        """
        self.config = config
        
        # Connection pools by name
        self.pools: Dict[str, ConnectionPool] = {}
        
        logger.info("Initialized connection pool manager")
    
    def get_pool(self, name: str, config: Optional[Dict[str, Any]] = None) -> ConnectionPool:
        """
        Get a connection pool.
        
        Args:
            name: Pool name
            config: Pool configuration
            
        Returns:
            Connection pool
        """
        if name not in self.pools:
            # Create pool
            self.pools[name] = ConnectionPool(config or self.config)
            logger.debug(f"Created connection pool {name}")
        
        return self.pools[name]
    
    async def close_all(self):
        """Close all connection pools."""
        for name, pool in self.pools.items():
            await pool.close()
            logger.debug(f"Closed connection pool {name}")
        
        self.pools.clear()
        logger.info("Closed all connection pools")
    
    def get_stats(self) -> Dict[str, Dict[str, Any]]:
        """
        Get statistics for all connection pools.
        
        Returns:
            Statistics for all connection pools
        """
        return {name: pool.get_stats() for name, pool in self.pools.items()}
