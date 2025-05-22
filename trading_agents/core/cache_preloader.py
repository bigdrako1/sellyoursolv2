"""
Cache preloader for proactively loading frequently accessed data.

This module provides a cache preloader that can be configured to
periodically load data into the cache before it's needed, reducing
latency for common requests.
"""
import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union

from .resource_pool import ResourcePool

logger = logging.getLogger(__name__)

class CachePreloader:
    """
    Proactively loads frequently accessed data into the cache.

    This class manages a set of preload tasks that periodically
    fetch data and store it in the cache, ensuring that commonly
    accessed data is always available with minimal latency.

    Attributes:
        resource_pool: Shared resource pool
        preload_tasks: Dictionary of preload task configurations
        running_tasks: Set of currently running task names
        _stop_event: Event to signal stopping
    """

    def __init__(self, resource_pool: ResourcePool):
        """
        Initialize the cache preloader.

        Args:
            resource_pool: Shared resource pool
        """
        self.resource_pool = resource_pool
        self.preload_tasks: Dict[str, Dict[str, Any]] = {}
        self.running_tasks: Set[str] = set()
        self._stop_event = asyncio.Event()
        self._task_locks: Dict[str, asyncio.Lock] = {}

        # Statistics
        self._preload_count = 0
        self._preload_error_count = 0
        self._last_preload_times: Dict[str, datetime] = {}

        logger.info("Cache preloader initialized")

    async def start(self):
        """Start the cache preloader."""
        logger.info("Starting cache preloader")
        self._stop_event.clear()

        # Start all registered tasks
        for task_name in self.preload_tasks:
            asyncio.create_task(self._run_preload_task(task_name))

        logger.info(f"Cache preloader started with {len(self.preload_tasks)} tasks")

    async def stop(self):
        """Stop the cache preloader."""
        logger.info("Stopping cache preloader")
        self._stop_event.set()

        # Wait for tasks to stop
        while self.running_tasks:
            await asyncio.sleep(0.1)

        logger.info("Cache preloader stopped")

    def register_task(
        self,
        name: str,
        loader_func: Callable,
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
        self.preload_tasks[name] = {
            "loader_func": loader_func,
            "interval": interval,
            "args": args or [],
            "kwargs": kwargs or {},
            "cache_key": cache_key,
            "cache_ttl": cache_ttl,
            "tags": tags or [],
            "enabled": enabled,
            "last_run": None,
            "last_success": None,
            "error_count": 0
        }

        # Create lock for this task
        self._task_locks[name] = asyncio.Lock()

        logger.info(f"Registered preload task: {name} (interval: {interval}s)")

    def unregister_task(self, name: str):
        """
        Unregister a preload task.

        Args:
            name: Task name
        """
        if name in self.preload_tasks:
            del self.preload_tasks[name]

            if name in self._task_locks:
                del self._task_locks[name]

            logger.info(f"Unregistered preload task: {name}")

    def enable_task(self, name: str):
        """
        Enable a preload task.

        Args:
            name: Task name
        """
        if name in self.preload_tasks:
            self.preload_tasks[name]["enabled"] = True
            logger.info(f"Enabled preload task: {name}")

    def disable_task(self, name: str):
        """
        Disable a preload task.

        Args:
            name: Task name
        """
        if name in self.preload_tasks:
            self.preload_tasks[name]["enabled"] = False
            logger.info(f"Disabled preload task: {name}")

    async def run_task_now(self, name: str) -> bool:
        """
        Run a preload task immediately.

        Args:
            name: Task name

        Returns:
            True if the task was run, False otherwise
        """
        if name not in self.preload_tasks:
            logger.warning(f"Preload task not found: {name}")
            return False

        # Get lock for this task
        lock = self._task_locks.get(name)
        if not lock:
            lock = asyncio.Lock()
            self._task_locks[name] = lock

        # Run the task if not already running
        if not lock.locked():
            asyncio.create_task(self._run_task_once(name))
            return True

        return False

    async def get_stats(self) -> Dict[str, Any]:
        """
        Get cache preloader statistics.

        Returns:
            Dictionary of statistics
        """
        stats = {
            "tasks": len(self.preload_tasks),
            "running_tasks": len(self.running_tasks),
            "preload_count": self._preload_count,
            "preload_error_count": self._preload_error_count,
            "task_stats": {}
        }

        # Add stats for each task
        for name, task in self.preload_tasks.items():
            stats["task_stats"][name] = {
                "enabled": task["enabled"],
                "interval": task["interval"],
                "last_run": task["last_run"].isoformat() if task["last_run"] else None,
                "last_success": task["last_success"].isoformat() if task["last_success"] else None,
                "error_count": task["error_count"],
                "is_running": name in self.running_tasks
            }

        return stats

    async def _run_preload_task(self, name: str):
        """
        Run a preload task periodically.

        Args:
            name: Task name
        """
        if name not in self.preload_tasks:
            logger.warning(f"Preload task not found: {name}")
            return

        task = self.preload_tasks[name]

        # Add to running tasks
        self.running_tasks.add(name)

        try:
            while not self._stop_event.is_set():
                # Skip if disabled
                if not task["enabled"]:
                    await asyncio.sleep(1)
                    continue

                # Run the task
                await self._run_task_once(name)

                # Wait for the next interval
                await asyncio.sleep(task["interval"])
        except asyncio.CancelledError:
            logger.info(f"Preload task cancelled: {name}")
        except Exception as e:
            logger.error(f"Error in preload task {name}: {str(e)}")
        finally:
            # Remove from running tasks
            if name in self.running_tasks:
                self.running_tasks.remove(name)

    async def _run_task_once(self, name: str):
        """
        Run a preload task once.

        Args:
            name: Task name
        """
        if name not in self.preload_tasks:
            logger.warning(f"Preload task not found: {name}")
            return

        task = self.preload_tasks[name]

        # Get lock for this task
        lock = self._task_locks.get(name)
        if not lock:
            lock = asyncio.Lock()
            self._task_locks[name] = lock

        # Run with lock to prevent concurrent execution
        async with lock:
            # Update last run time
            task["last_run"] = datetime.now()
            self._last_preload_times[name] = task["last_run"]

            try:
                # Call the loader function
                start_time = time.time()
                result = await task["loader_func"](
                    *task["args"],
                    **task["kwargs"]
                )

                # Cache the result if a cache key is specified
                if task["cache_key"] and result is not None:
                    await self.resource_pool.cache_set(
                        key=task["cache_key"],
                        value=result,
                        ttl=task["cache_ttl"],
                        tags=task["tags"]
                    )

                # Update statistics
                self._preload_count += 1
                task["last_success"] = datetime.now()

                # Log success
                elapsed = time.time() - start_time
                logger.debug(f"Preload task {name} completed in {elapsed:.2f}s")

            except Exception as e:
                # Update error statistics
                self._preload_error_count += 1
                task["error_count"] += 1

                # Log error
                logger.error(f"Error in preload task {name}: {str(e)}")

    async def preload_market_data(
        self,
        symbol: str,
        timeframe: str,
        api_name: str,
        url: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Optional[Any]:
        """
        Preload market data.

        Args:
            symbol: Market symbol
            timeframe: Timeframe
            api_name: API name
            url: API URL
            params: API parameters

        Returns:
            Market data or None if failed
        """
        try:
            # Make API request
            status, data = await self.resource_pool.http_request(
                method="GET",
                url=url,
                api_name=api_name,
                params=params
            )

            if status != 200:
                logger.warning(f"Error preloading market data for {symbol}/{timeframe}: {data}")
                return None

            return data
        except Exception as e:
            logger.error(f"Error preloading market data for {symbol}/{timeframe}: {str(e)}")
            return None
