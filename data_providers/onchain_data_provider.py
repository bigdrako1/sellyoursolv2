"""
On-chain data provider for blockchain data.

This module provides integration with blockchain data sources to fetch on-chain metrics.
"""
import logging
import asyncio
import time
from typing import Dict, List, Any, Optional, Tuple, Union
from datetime import datetime, timedelta
import aiohttp
import pandas as pd

from data_providers.base_data_provider import BaseDataProvider

logger = logging.getLogger(__name__)

class OnChainDataProvider(BaseDataProvider):
    """Provider for on-chain blockchain data."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the on-chain data provider.
        
        Args:
            config: Provider configuration
        """
        super().__init__(config)
        
        # Provider name
        self.name = "onchain"
        
        # API configuration
        self.api_keys = {
            "glassnode": config.get("glassnode_api_key", ""),
            "cryptoquant": config.get("cryptoquant_api_key", ""),
            "intotheblock": config.get("intotheblock_api_key", "")
        }
        
        # API endpoints
        self.api_urls = {
            "glassnode": "https://api.glassnode.com/v1",
            "cryptoquant": "https://api.cryptoquant.com/v1",
            "intotheblock": "https://api.intotheblock.com/v1"
        }
        
        # Default data source
        self.default_source = config.get("default_source", "glassnode")
        
        # Rate limiting
        self.rate_limits = {
            "glassnode": 10,  # Requests per minute
            "cryptoquant": 60,
            "intotheblock": 30
        }
        
        self.last_request_times = {
            "glassnode": 0,
            "cryptoquant": 0,
            "intotheblock": 0
        }
        
        # HTTP session
        self.session = None
        
        # Cache
        self.cache = {}
        self.cache_ttl = config.get("cache_ttl", 3600)  # 1 hour
        
    async def initialize(self) -> bool:
        """
        Initialize the data provider.
        
        Returns:
            True if initialization was successful, False otherwise
        """
        try:
            # Create HTTP session
            self.session = aiohttp.ClientSession()
            
            # Test connection
            await self.fetch_metrics_list()
            
            logger.info(f"Initialized OnChainDataProvider")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing OnChainDataProvider: {str(e)}")
            return False
            
    async def close(self) -> bool:
        """
        Close the data provider connection.
        
        Returns:
            True if closing was successful, False otherwise
        """
        try:
            if self.session:
                await self.session.close()
                self.session = None
                
            logger.info(f"Closed OnChainDataProvider")
            return True
            
        except Exception as e:
            logger.error(f"Error closing OnChainDataProvider: {str(e)}")
            return False
            
    async def fetch_metrics_list(self, source: str = None) -> List[Dict[str, Any]]:
        """
        Fetch list of available metrics.
        
        Args:
            source: Data source (glassnode, cryptoquant, intotheblock)
            
        Returns:
            List of available metrics
        """
        source = source or self.default_source
        
        try:
            # Check cache
            cache_key = f"metrics_list_{source}"
            cached_data = self._get_from_cache(cache_key)
            if cached_data:
                return cached_data
                
            # Make API request
            if source == "glassnode":
                url = f"{self.api_urls['glassnode']}/metrics"
                params = {"api_key": self.api_keys["glassnode"]}
                
                # Apply rate limiting
                await self._apply_rate_limit(source)
                
                async with self.session.get(url, params=params) as response:
                    if response.status != 200:
                        raise Exception(f"API request failed with status {response.status}")
                        
                    data = await response.json()
                    
                    # Cache data
                    self._add_to_cache(cache_key, data)
                    
                    return data
                    
            elif source == "cryptoquant":
                url = f"{self.api_urls['cryptoquant']}/metrics"
                params = {"api_key": self.api_keys["cryptoquant"]}
                
                # Apply rate limiting
                await self._apply_rate_limit(source)
                
                async with self.session.get(url, params=params) as response:
                    if response.status != 200:
                        raise Exception(f"API request failed with status {response.status}")
                        
                    data = await response.json()
                    
                    # Cache data
                    self._add_to_cache(cache_key, data)
                    
                    return data
                    
            elif source == "intotheblock":
                url = f"{self.api_urls['intotheblock']}/metrics"
                params = {"api_key": self.api_keys["intotheblock"]}
                
                # Apply rate limiting
                await self._apply_rate_limit(source)
                
                async with self.session.get(url, params=params) as response:
                    if response.status != 200:
                        raise Exception(f"API request failed with status {response.status}")
                        
                    data = await response.json()
                    
                    # Cache data
                    self._add_to_cache(cache_key, data)
                    
                    return data
                    
            else:
                raise Exception(f"Unknown data source: {source}")
                
        except Exception as e:
            logger.error(f"Error fetching metrics list from {source}: {str(e)}")
            return []
            
    async def fetch_metric(self, metric: str, asset: str, since: int = None, until: int = None, resolution: str = "1d", source: str = None) -> pd.DataFrame:
        """
        Fetch on-chain metric data.
        
        Args:
            metric: Metric name
            asset: Asset symbol (BTC, ETH, etc.)
            since: Start timestamp in milliseconds
            until: End timestamp in milliseconds
            resolution: Data resolution (1h, 1d, etc.)
            source: Data source (glassnode, cryptoquant, intotheblock)
            
        Returns:
            DataFrame with metric data
        """
        source = source or self.default_source
        
        try:
            # Set default time range if not provided
            if not since:
                since = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)
                
            if not until:
                until = int(datetime.now().timestamp() * 1000)
                
            # Check cache
            cache_key = f"metric_{source}_{metric}_{asset}_{since}_{until}_{resolution}"
            cached_data = self._get_from_cache(cache_key)
            if cached_data is not None:
                return cached_data
                
            # Make API request
            if source == "glassnode":
                url = f"{self.api_urls['glassnode']}/metrics/{metric}"
                params = {
                    "api_key": self.api_keys["glassnode"],
                    "a": asset,
                    "s": int(since / 1000),
                    "u": int(until / 1000),
                    "i": resolution
                }
                
                # Apply rate limiting
                await self._apply_rate_limit(source)
                
                async with self.session.get(url, params=params) as response:
                    if response.status != 200:
                        raise Exception(f"API request failed with status {response.status}")
                        
                    data = await response.json()
                    
                    # Convert to DataFrame
                    df = pd.DataFrame(data)
                    if not df.empty:
                        df["t"] = pd.to_datetime(df["t"], unit="s")
                        df = df.rename(columns={"t": "timestamp", "v": "value"})
                        df = df.set_index("timestamp")
                        
                        # Cache data
                        self._add_to_cache(cache_key, df)
                        
                        return df
                    else:
                        return pd.DataFrame()
                        
            elif source == "cryptoquant":
                url = f"{self.api_urls['cryptoquant']}/metrics/{metric}"
                params = {
                    "api_key": self.api_keys["cryptoquant"],
                    "asset": asset,
                    "from": int(since / 1000),
                    "to": int(until / 1000),
                    "interval": resolution
                }
                
                # Apply rate limiting
                await self._apply_rate_limit(source)
                
                async with self.session.get(url, params=params) as response:
                    if response.status != 200:
                        raise Exception(f"API request failed with status {response.status}")
                        
                    data = await response.json()
                    
                    # Convert to DataFrame
                    df = pd.DataFrame(data.get("data", []))
                    if not df.empty:
                        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="s")
                        df = df.set_index("timestamp")
                        
                        # Cache data
                        self._add_to_cache(cache_key, df)
                        
                        return df
                    else:
                        return pd.DataFrame()
                        
            elif source == "intotheblock":
                url = f"{self.api_urls['intotheblock']}/metrics/{metric}"
                params = {
                    "api_key": self.api_keys["intotheblock"],
                    "symbol": asset,
                    "from": int(since / 1000),
                    "to": int(until / 1000),
                    "resolution": resolution
                }
                
                # Apply rate limiting
                await self._apply_rate_limit(source)
                
                async with self.session.get(url, params=params) as response:
                    if response.status != 200:
                        raise Exception(f"API request failed with status {response.status}")
                        
                    data = await response.json()
                    
                    # Convert to DataFrame
                    df = pd.DataFrame(data.get("data", []))
                    if not df.empty:
                        df["date"] = pd.to_datetime(df["date"])
                        df = df.rename(columns={"date": "timestamp"})
                        df = df.set_index("timestamp")
                        
                        # Cache data
                        self._add_to_cache(cache_key, df)
                        
                        return df
                    else:
                        return pd.DataFrame()
                        
            else:
                raise Exception(f"Unknown data source: {source}")
                
        except Exception as e:
            logger.error(f"Error fetching metric {metric} for {asset} from {source}: {str(e)}")
            return pd.DataFrame()
            
    async def fetch_multiple_metrics(self, metrics: List[str], asset: str, since: int = None, until: int = None, resolution: str = "1d", source: str = None) -> Dict[str, pd.DataFrame]:
        """
        Fetch multiple on-chain metrics.
        
        Args:
            metrics: List of metric names
            asset: Asset symbol (BTC, ETH, etc.)
            since: Start timestamp in milliseconds
            until: End timestamp in milliseconds
            resolution: Data resolution (1h, 1d, etc.)
            source: Data source (glassnode, cryptoquant, intotheblock)
            
        Returns:
            Dictionary of DataFrames with metric data
        """
        source = source or self.default_source
        
        try:
            # Fetch each metric
            results = {}
            for metric in metrics:
                df = await self.fetch_metric(metric, asset, since, until, resolution, source)
                results[metric] = df
                
            return results
            
        except Exception as e:
            logger.error(f"Error fetching multiple metrics for {asset} from {source}: {str(e)}")
            return {}
            
    async def fetch_assets_list(self, source: str = None) -> List[str]:
        """
        Fetch list of available assets.
        
        Args:
            source: Data source (glassnode, cryptoquant, intotheblock)
            
        Returns:
            List of available assets
        """
        source = source or self.default_source
        
        try:
            # Check cache
            cache_key = f"assets_list_{source}"
            cached_data = self._get_from_cache(cache_key)
            if cached_data:
                return cached_data
                
            # Make API request
            if source == "glassnode":
                url = f"{self.api_urls['glassnode']}/assets"
                params = {"api_key": self.api_keys["glassnode"]}
                
                # Apply rate limiting
                await self._apply_rate_limit(source)
                
                async with self.session.get(url, params=params) as response:
                    if response.status != 200:
                        raise Exception(f"API request failed with status {response.status}")
                        
                    data = await response.json()
                    
                    # Extract asset symbols
                    assets = [asset["symbol"] for asset in data]
                    
                    # Cache data
                    self._add_to_cache(cache_key, assets)
                    
                    return assets
                    
            elif source == "cryptoquant":
                url = f"{self.api_urls['cryptoquant']}/assets"
                params = {"api_key": self.api_keys["cryptoquant"]}
                
                # Apply rate limiting
                await self._apply_rate_limit(source)
                
                async with self.session.get(url, params=params) as response:
                    if response.status != 200:
                        raise Exception(f"API request failed with status {response.status}")
                        
                    data = await response.json()
                    
                    # Extract asset symbols
                    assets = [asset["symbol"] for asset in data.get("data", [])]
                    
                    # Cache data
                    self._add_to_cache(cache_key, assets)
                    
                    return assets
                    
            elif source == "intotheblock":
                url = f"{self.api_urls['intotheblock']}/assets"
                params = {"api_key": self.api_keys["intotheblock"]}
                
                # Apply rate limiting
                await self._apply_rate_limit(source)
                
                async with self.session.get(url, params=params) as response:
                    if response.status != 200:
                        raise Exception(f"API request failed with status {response.status}")
                        
                    data = await response.json()
                    
                    # Extract asset symbols
                    assets = [asset["symbol"] for asset in data.get("data", [])]
                    
                    # Cache data
                    self._add_to_cache(cache_key, assets)
                    
                    return assets
                    
            else:
                raise Exception(f"Unknown data source: {source}")
                
        except Exception as e:
            logger.error(f"Error fetching assets list from {source}: {str(e)}")
            return []
            
    async def _apply_rate_limit(self, source: str):
        """
        Apply rate limiting to API requests.
        
        Args:
            source: Data source
        """
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_times.get(source, 0)
        
        # Calculate delay based on rate limit
        rate_limit = self.rate_limits.get(source, 10)
        delay = 60.0 / rate_limit  # Convert to seconds per request
        
        if time_since_last_request < delay:
            await asyncio.sleep(delay - time_since_last_request)
            
        self.last_request_times[source] = time.time()
        
    def _add_to_cache(self, key: str, data: Any):
        """
        Add data to cache.
        
        Args:
            key: Cache key
            data: Data to cache
        """
        self.cache[key] = {
            "data": data,
            "timestamp": time.time()
        }
        
    def _get_from_cache(self, key: str) -> Any:
        """
        Get data from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached data or None if not found or expired
        """
        if key in self.cache:
            cache_entry = self.cache[key]
            if time.time() - cache_entry["timestamp"] < self.cache_ttl:
                return cache_entry["data"]
                
        return None
