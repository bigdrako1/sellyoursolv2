"""
Parallel requests for on-chain data.

This module provides parallel request functionality to reduce overall latency.
"""
import logging
import time
import asyncio
from typing import Dict, List, Any, Optional, Tuple, Callable
import pandas as pd
import aiohttp

from exchanges.optimizations.connection_pool import ConnectionPool

logger = logging.getLogger(__name__)

class ParallelRequestManager:
    """Manager for parallel requests."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the parallel request manager.
        
        Args:
            config: Parallel request manager configuration
        """
        self.config = config
        
        # Maximum number of concurrent requests
        self.max_concurrent_requests = config.get("max_concurrent_requests", 10)
        
        # Request timeout in seconds
        self.request_timeout = config.get("request_timeout", 30.0)
        
        # Connection pool
        self.connection_pool = ConnectionPool(config.get("connection_pool", {}))
        
        # Semaphore for limiting concurrent requests
        self.semaphore = asyncio.Semaphore(self.max_concurrent_requests)
        
        # Request statistics
        self.stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "total_time": 0.0
        }
        
        logger.info(f"Initialized parallel request manager with max {self.max_concurrent_requests} concurrent requests")
    
    async def fetch(self, url: str, params: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None) -> Any:
        """
        Fetch data from a URL with rate limiting.
        
        Args:
            url: URL to fetch
            params: Request parameters
            headers: Request headers
            
        Returns:
            Response data
        """
        async with self.semaphore:
            start_time = time.time()
            self.stats["total_requests"] += 1
            
            try:
                response = await self.connection_pool.get(url, params=params, headers=headers)
                self.stats["successful_requests"] += 1
                return response
            except Exception as e:
                self.stats["failed_requests"] += 1
                raise e
            finally:
                self.stats["total_time"] += time.time() - start_time
    
    async def fetch_all(self, requests: List[Dict[str, Any]]) -> List[Any]:
        """
        Fetch data from multiple URLs in parallel.
        
        Args:
            requests: List of request parameters
            
        Returns:
            List of response data
        """
        tasks = []
        for request in requests:
            url = request["url"]
            params = request.get("params")
            headers = request.get("headers")
            
            task = self.fetch(url, params=params, headers=headers)
            tasks.append(task)
        
        return await asyncio.gather(*tasks, return_exceptions=True)
    
    async def close(self):
        """Close the parallel request manager."""
        await self.connection_pool.close()
        logger.info("Closed parallel request manager")
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get parallel request manager statistics.
        
        Returns:
            Parallel request manager statistics
        """
        avg_request_time = self.stats["total_time"] / self.stats["total_requests"] if self.stats["total_requests"] > 0 else 0
        success_rate = self.stats["successful_requests"] / self.stats["total_requests"] * 100 if self.stats["total_requests"] > 0 else 0
        
        return {
            "total_requests": self.stats["total_requests"],
            "successful_requests": self.stats["successful_requests"],
            "failed_requests": self.stats["failed_requests"],
            "total_time": self.stats["total_time"],
            "avg_request_time": avg_request_time,
            "success_rate": success_rate,
            "connection_pool": self.connection_pool.get_stats()
        }

class ParallelOnChainDataProvider:
    """On-chain data provider with parallel requests."""
    
    def __init__(self, provider, request_manager: ParallelRequestManager):
        """
        Initialize the parallel on-chain data provider.
        
        Args:
            provider: On-chain data provider
            request_manager: Parallel request manager
        """
        self.provider = provider
        self.request_manager = request_manager
    
    async def fetch_metrics(self, metrics: List[str], asset: str, since: int = None, until: int = None, resolution: str = "1d", source: str = None) -> Dict[str, pd.DataFrame]:
        """
        Fetch multiple on-chain metrics in parallel.
        
        Args:
            metrics: List of metric names
            asset: Asset symbol
            since: Start timestamp in milliseconds
            until: End timestamp in milliseconds
            resolution: Data resolution
            source: Data source
            
        Returns:
            Dictionary of DataFrames with metric data
        """
        # Use default source if not specified
        source = source or self.provider.default_source
        
        # Create requests
        requests = []
        for metric in metrics:
            url = self.provider.get_metric_url(metric, asset, source)
            params = {
                "resolution": resolution
            }
            
            if since is not None:
                params["since"] = since
            
            if until is not None:
                params["until"] = until
            
            headers = self.provider.get_headers(source)
            
            requests.append({
                "url": url,
                "params": params,
                "headers": headers,
                "metric": metric
            })
        
        # Fetch data in parallel
        results = await self.request_manager.fetch_all(requests)
        
        # Process results
        metrics_data = {}
        for i, result in enumerate(results):
            metric = requests[i]["metric"]
            
            if isinstance(result, Exception):
                logger.error(f"Error fetching metric {metric}: {str(result)}")
                continue
            
            try:
                # Parse response
                df = self.provider.parse_metric_response(result, metric, source)
                metrics_data[metric] = df
            except Exception as e:
                logger.error(f"Error parsing response for metric {metric}: {str(e)}")
        
        return metrics_data
    
    async def fetch_assets_metrics(self, metric: str, assets: List[str], since: int = None, until: int = None, resolution: str = "1d", source: str = None) -> Dict[str, pd.DataFrame]:
        """
        Fetch a metric for multiple assets in parallel.
        
        Args:
            metric: Metric name
            assets: List of asset symbols
            since: Start timestamp in milliseconds
            until: End timestamp in milliseconds
            resolution: Data resolution
            source: Data source
            
        Returns:
            Dictionary of DataFrames with metric data by asset
        """
        # Use default source if not specified
        source = source or self.provider.default_source
        
        # Create requests
        requests = []
        for asset in assets:
            url = self.provider.get_metric_url(metric, asset, source)
            params = {
                "resolution": resolution
            }
            
            if since is not None:
                params["since"] = since
            
            if until is not None:
                params["until"] = until
            
            headers = self.provider.get_headers(source)
            
            requests.append({
                "url": url,
                "params": params,
                "headers": headers,
                "asset": asset
            })
        
        # Fetch data in parallel
        results = await self.request_manager.fetch_all(requests)
        
        # Process results
        assets_data = {}
        for i, result in enumerate(results):
            asset = requests[i]["asset"]
            
            if isinstance(result, Exception):
                logger.error(f"Error fetching metric {metric} for asset {asset}: {str(result)}")
                continue
            
            try:
                # Parse response
                df = self.provider.parse_metric_response(result, metric, source)
                assets_data[asset] = df
            except Exception as e:
                logger.error(f"Error parsing response for metric {metric} and asset {asset}: {str(e)}")
        
        return assets_data
    
    def __getattr__(self, name: str) -> Any:
        """
        Get attribute from wrapped provider.
        
        Args:
            name: Attribute name
            
        Returns:
            Attribute value
        """
        return getattr(self.provider, name)
