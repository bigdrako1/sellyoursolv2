"""
Request batching for exchange integration.

This module provides request batching functionality to reduce the number of API calls.
"""
import logging
import time
import asyncio
from typing import Dict, List, Any, Optional, Tuple, Callable
import aiohttp

from exchanges.optimizations.connection_pool import ConnectionPool

logger = logging.getLogger(__name__)

class RequestBatcher:
    """Batch multiple API requests into a single request."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the request batcher.
        
        Args:
            config: Request batcher configuration
        """
        self.config = config
        
        # Maximum batch size
        self.max_batch_size = config.get("max_batch_size", 10)
        
        # Batch wait time in seconds
        self.batch_wait_time = config.get("batch_wait_time", 0.1)
        
        # Connection pool
        self.connection_pool = ConnectionPool(config.get("connection_pool", {}))
        
        # Pending requests
        self.pending_requests: Dict[str, List[Dict[str, Any]]] = {}
        
        # Request locks
        self.request_locks: Dict[str, asyncio.Lock] = {}
        
        # Batch statistics
        self.stats = {
            "batched_requests": 0,
            "total_requests": 0,
            "batches": 0
        }
        
        logger.info(f"Initialized request batcher with max batch size {self.max_batch_size}")
    
    async def get_lock(self, endpoint: str) -> asyncio.Lock:
        """
        Get a lock for an endpoint.
        
        Args:
            endpoint: API endpoint
            
        Returns:
            Lock for the endpoint
        """
        if endpoint not in self.request_locks:
            self.request_locks[endpoint] = asyncio.Lock()
        
        return self.request_locks[endpoint]
    
    async def batch_request(self, url: str, endpoint: str, params: Dict[str, Any]) -> Any:
        """
        Add a request to a batch.
        
        Args:
            url: API URL
            endpoint: API endpoint
            params: Request parameters
            
        Returns:
            Response data
        """
        # Get lock for endpoint
        lock = await self.get_lock(endpoint)
        
        # Create request
        request = {
            "params": params,
            "future": asyncio.Future()
        }
        
        # Add request to pending requests
        async with lock:
            if endpoint not in self.pending_requests:
                self.pending_requests[endpoint] = []
            
            self.pending_requests[endpoint].append(request)
            
            # Check if batch is full
            if len(self.pending_requests[endpoint]) >= self.max_batch_size:
                # Process batch
                asyncio.create_task(self.process_batch(url, endpoint))
            else:
                # Schedule batch processing
                asyncio.create_task(self.schedule_batch(url, endpoint))
        
        # Wait for response
        return await request["future"]
    
    async def schedule_batch(self, url: str, endpoint: str):
        """
        Schedule batch processing.
        
        Args:
            url: API URL
            endpoint: API endpoint
        """
        # Wait for batch wait time
        await asyncio.sleep(self.batch_wait_time)
        
        # Get lock for endpoint
        lock = await self.get_lock(endpoint)
        
        # Check if there are pending requests
        async with lock:
            if endpoint in self.pending_requests and self.pending_requests[endpoint]:
                # Process batch
                asyncio.create_task(self.process_batch(url, endpoint))
    
    async def process_batch(self, url: str, endpoint: str):
        """
        Process a batch of requests.
        
        Args:
            url: API URL
            endpoint: API endpoint
        """
        # Get lock for endpoint
        lock = await self.get_lock(endpoint)
        
        # Get pending requests
        async with lock:
            if endpoint not in self.pending_requests or not self.pending_requests[endpoint]:
                return
            
            requests = self.pending_requests[endpoint]
            self.pending_requests[endpoint] = []
        
        # Update statistics
        self.stats["batched_requests"] += len(requests)
        self.stats["total_requests"] += 1
        self.stats["batches"] += 1
        
        # Create batch parameters
        batch_params = []
        for request in requests:
            batch_params.append(request["params"])
        
        try:
            # Make batch request
            response = await self.connection_pool.post(url, data={"batch": batch_params})
            
            # Process response
            if isinstance(response, list) and len(response) == len(requests):
                # Set results
                for i, request in enumerate(requests):
                    request["future"].set_result(response[i])
            else:
                # Set error
                for request in requests:
                    request["future"].set_exception(Exception(f"Invalid batch response: {response}"))
        except Exception as e:
            # Set error
            for request in requests:
                request["future"].set_exception(e)
    
    async def close(self):
        """Close the request batcher."""
        await self.connection_pool.close()
        logger.info("Closed request batcher")
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get request batcher statistics.
        
        Returns:
            Request batcher statistics
        """
        requests_saved = self.stats["batched_requests"] - self.stats["batches"]
        requests_saved_pct = requests_saved / self.stats["batched_requests"] * 100 if self.stats["batched_requests"] > 0 else 0
        avg_batch_size = self.stats["batched_requests"] / self.stats["batches"] if self.stats["batches"] > 0 else 0
        
        return {
            "batched_requests": self.stats["batched_requests"],
            "total_requests": self.stats["total_requests"],
            "batches": self.stats["batches"],
            "requests_saved": requests_saved,
            "requests_saved_pct": requests_saved_pct,
            "avg_batch_size": avg_batch_size,
            "connection_pool": self.connection_pool.get_stats()
        }

class BatchedExchangeClient:
    """Exchange client with request batching."""
    
    def __init__(self, client, batcher: RequestBatcher):
        """
        Initialize the batched exchange client.
        
        Args:
            client: Exchange client
            batcher: Request batcher
        """
        self.client = client
        self.batcher = batcher
    
    async def fetch_tickers(self, symbols: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Fetch tickers for multiple symbols.
        
        Args:
            symbols: List of trading symbols
            
        Returns:
            Dictionary of ticker data by symbol
        """
        # Check if exchange supports batch ticker requests
        if hasattr(self.client, "fetch_tickers") and callable(getattr(self.client, "fetch_tickers")):
            # Use native batch ticker request
            return await self.client.fetch_tickers(symbols)
        
        # Use request batcher
        url = f"{self.client.base_url}/tickers"
        endpoint = "tickers"
        
        # Create batch requests
        tasks = []
        for symbol in symbols:
            task = self.batcher.batch_request(url, endpoint, {"symbol": symbol})
            tasks.append(task)
        
        # Wait for all requests to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        tickers = {}
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error fetching ticker for {symbols[i]}: {str(result)}")
                continue
            
            tickers[symbols[i]] = result
        
        return tickers
    
    async def fetch_order_books(self, symbols: List[str], limit: int = None) -> Dict[str, Dict[str, Any]]:
        """
        Fetch order books for multiple symbols.
        
        Args:
            symbols: List of trading symbols
            limit: Maximum number of orders to fetch
            
        Returns:
            Dictionary of order book data by symbol
        """
        # Use request batcher
        url = f"{self.client.base_url}/orderbooks"
        endpoint = "orderbooks"
        
        # Create batch requests
        tasks = []
        for symbol in symbols:
            params = {"symbol": symbol}
            if limit is not None:
                params["limit"] = limit
            
            task = self.batcher.batch_request(url, endpoint, params)
            tasks.append(task)
        
        # Wait for all requests to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        order_books = {}
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error fetching order book for {symbols[i]}: {str(result)}")
                continue
            
            order_books[symbols[i]] = result
        
        return order_books
    
    async def fetch_ohlcvs(self, symbols: List[str], timeframe: str = "1h", since: int = None, limit: int = None) -> Dict[str, List[List[float]]]:
        """
        Fetch OHLCV data for multiple symbols.
        
        Args:
            symbols: List of trading symbols
            timeframe: Timeframe (1m, 5m, 15m, 30m, 1h, 4h, 1d)
            since: Timestamp in milliseconds for start time
            limit: Maximum number of candles to fetch
            
        Returns:
            Dictionary of OHLCV data by symbol
        """
        # Use request batcher
        url = f"{self.client.base_url}/ohlcv"
        endpoint = "ohlcv"
        
        # Create batch requests
        tasks = []
        for symbol in symbols:
            params = {
                "symbol": symbol,
                "timeframe": timeframe
            }
            
            if since is not None:
                params["since"] = since
            
            if limit is not None:
                params["limit"] = limit
            
            task = self.batcher.batch_request(url, endpoint, params)
            tasks.append(task)
        
        # Wait for all requests to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        ohlcvs = {}
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error fetching OHLCV for {symbols[i]}: {str(result)}")
                continue
            
            ohlcvs[symbols[i]] = result
        
        return ohlcvs
    
    def __getattr__(self, name: str) -> Any:
        """
        Get attribute from wrapped client.
        
        Args:
            name: Attribute name
            
        Returns:
            Attribute value
        """
        return getattr(self.client, name)
