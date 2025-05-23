"""
Cache preloader for proactively loading frequently accessed data.

This module provides a cache preloader that can be configured to
periodically load data into the cache before it's needed, reducing
latency for common requests. It also supports startup warming to
preload critical data when the system starts.
"""
import asyncio
import logging
import time
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Set
from enum import Enum

from .resource_pool import ResourcePool

logger = logging.getLogger(__name__)

class TaskPriority(Enum):
    """Priority levels for preload tasks."""
    CRITICAL = 0  # Must be loaded before system is ready
    HIGH = 1      # Should be loaded early
    NORMAL = 2    # Standard priority
    LOW = 3       # Load when resources are available

class StartupPhase(Enum):
    """Startup phases for the cache preloader."""
    NOT_STARTED = 0
    WARMING = 1
    READY = 2

class CachePreloader:
    """
    Proactively loads frequently accessed data into the cache.

    This class manages a set of preload tasks that periodically
    fetch data and store it in the cache, ensuring that commonly
    accessed data is always available with minimal latency.
    It also supports startup warming to preload critical data
    when the system starts.

    Attributes:
        resource_pool: Shared resource pool
        preload_tasks: Dictionary of preload task configurations
        running_tasks: Set of currently running task names
        _stop_event: Event to signal stopping
        startup_phase: Current startup phase
        startup_progress: Progress of startup warming (0-100)
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

        # Startup warming
        self.startup_phase = StartupPhase.NOT_STARTED
        self.startup_progress = 0
        self.startup_tasks: Dict[str, Dict[str, Any]] = {}
        self._startup_complete_event = asyncio.Event()
        self._startup_dependencies: Dict[str, List[str]] = {}  # task -> dependencies
        self._startup_dependents: Dict[str, List[str]] = {}    # task -> dependents

        # Statistics
        self._preload_count = 0
        self._preload_error_count = 0
        self._last_preload_times: Dict[str, datetime] = {}
        self._startup_stats = {
            "total_tasks": 0,
            "completed_tasks": 0,
            "failed_tasks": 0,
            "start_time": None,
            "end_time": None,
            "duration": 0
        }

        logger.info("Cache preloader initialized")

    async def start(self, run_startup_warming: bool = True):
        """
        Start the cache preloader.

        Args:
            run_startup_warming: Whether to run startup warming
        """
        logger.info("Starting cache preloader")
        self._stop_event.clear()
        self._startup_complete_event.clear()

        # Run startup warming if enabled and there are startup tasks
        if run_startup_warming and self.startup_tasks:
            self.startup_phase = StartupPhase.WARMING
            self._startup_stats["start_time"] = datetime.now()

            # Run startup warming
            logger.info(f"Running startup warming with {len(self.startup_tasks)} tasks")
            await self._run_startup_warming()

            # Mark startup as complete
            self.startup_phase = StartupPhase.READY
            self._startup_complete_event.set()
            self._startup_stats["end_time"] = datetime.now()

            if self._startup_stats["start_time"]:
                self._startup_stats["duration"] = (
                    self._startup_stats["end_time"] - self._startup_stats["start_time"]
                ).total_seconds()

            logger.info(
                f"Startup warming completed in {self._startup_stats['duration']:.2f}s: "
                f"{self._startup_stats['completed_tasks']}/{self._startup_stats['total_tasks']} tasks completed, "
                f"{self._startup_stats['failed_tasks']} tasks failed"
            )
        else:
            # Skip startup warming
            self.startup_phase = StartupPhase.READY
            self._startup_complete_event.set()

        # Start all registered periodic tasks
        for task_name in self.preload_tasks:
            asyncio.create_task(self._run_preload_task(task_name))

        logger.info(f"Cache preloader started with {len(self.preload_tasks)} periodic tasks")

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
        Register a periodic preload task.

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

        logger.info(f"Registered periodic preload task: {name} (interval: {interval}s)")

    def register_startup_task(
        self,
        name: str,
        loader_func: Callable,
        args: Optional[List[Any]] = None,
        kwargs: Optional[Dict[str, Any]] = None,
        cache_key: Optional[str] = None,
        cache_ttl: Optional[int] = None,
        tags: Optional[List[str]] = None,
        priority: TaskPriority = TaskPriority.NORMAL,
        depends_on: Optional[List[str]] = None,
        register_as_periodic: bool = False,
        periodic_interval: Optional[int] = None
    ):
        """
        Register a startup warming task.

        Args:
            name: Task name
            loader_func: Function to load data
            args: Arguments for the loader function
            kwargs: Keyword arguments for the loader function
            cache_key: Cache key (if None, result won't be cached)
            cache_ttl: Cache TTL in seconds
            tags: Tags for grouping and invalidation
            priority: Task priority
            depends_on: List of task names this task depends on
            register_as_periodic: Whether to also register as a periodic task
            periodic_interval: Interval for periodic task (if register_as_periodic is True)
        """
        self.startup_tasks[name] = {
            "loader_func": loader_func,
            "args": args or [],
            "kwargs": kwargs or {},
            "cache_key": cache_key,
            "cache_ttl": cache_ttl,
            "tags": tags or [],
            "priority": priority,
            "completed": False,
            "error": None
        }

        # Update statistics
        self._startup_stats["total_tasks"] += 1

        # Track dependencies
        depends_on = depends_on or []
        if depends_on:
            self._startup_dependencies[name] = depends_on

            # Update dependents
            for dependency in depends_on:
                if dependency not in self._startup_dependents:
                    self._startup_dependents[dependency] = []
                self._startup_dependents[dependency].append(name)

        # Create lock for this task
        if name not in self._task_locks:
            self._task_locks[name] = asyncio.Lock()

        # Also register as a periodic task if requested
        if register_as_periodic:
            interval = periodic_interval or 300  # Default to 5 minutes
            self.register_task(
                name=name,
                loader_func=loader_func,
                interval=interval,
                args=args,
                kwargs=kwargs,
                cache_key=cache_key,
                cache_ttl=cache_ttl,
                tags=tags,
                enabled=True
            )

        logger.info(f"Registered startup task: {name} (priority: {priority.name})")

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
            "task_stats": {},
            "startup_phase": self.startup_phase.name,
            "startup_progress": self.startup_progress,
            "startup_tasks_count": len(self.startup_tasks)
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

        # Add startup stats if available
        if self._startup_stats["total_tasks"] > 0:
            startup_stats = self._startup_stats.copy()

            # Convert datetime objects to ISO format
            if startup_stats["start_time"]:
                startup_stats["start_time"] = startup_stats["start_time"].isoformat()
            if startup_stats["end_time"]:
                startup_stats["end_time"] = startup_stats["end_time"].isoformat()

            stats["startup"] = startup_stats

            # Add stats for startup tasks
            stats["startup_task_stats"] = {}
            for name, task in self.startup_tasks.items():
                stats["startup_task_stats"][name] = {
                    "priority": task["priority"].name,
                    "completed": task["completed"],
                    "error": str(task["error"]) if task["error"] else None,
                    "dependencies": self._startup_dependencies.get(name, []),
                    "dependents": self._startup_dependents.get(name, [])
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

    async def _run_startup_warming(self):
        """Run startup warming tasks."""
        if not self.startup_tasks:
            logger.info("No startup tasks to run")
            return

        # Reset progress
        self.startup_progress = 0

        # Group tasks by priority
        tasks_by_priority = {}
        for name, config in self.startup_tasks.items():
            priority = config["priority"]
            if priority not in tasks_by_priority:
                tasks_by_priority[priority] = []
            tasks_by_priority[priority].append(name)

        # Sort priorities
        priorities = sorted(tasks_by_priority.keys(), key=lambda p: p.value)

        # Process tasks by priority
        for priority in priorities:
            task_names = tasks_by_priority[priority]
            logger.info(f"Processing {len(task_names)} {priority.name} priority startup tasks")

            # Create a set of tasks that are ready to run (no dependencies or all dependencies satisfied)
            ready_tasks = []
            for name in task_names:
                if self._can_run_startup_task(name):
                    ready_tasks.append(name)

            # Run tasks in batches
            while ready_tasks:
                # Run a batch of tasks concurrently
                batch = ready_tasks[:10]  # Process up to 10 tasks at once
                ready_tasks = ready_tasks[10:]

                # Create tasks
                tasks = [self._run_startup_task(name) for name in batch]

                # Wait for all tasks to complete
                await asyncio.gather(*tasks)

                # Update progress
                completed = sum(1 for config in self.startup_tasks.values() if config["completed"])
                self.startup_progress = int(100 * completed / len(self.startup_tasks))

                # Check for new ready tasks
                for name in task_names:
                    if name not in ready_tasks and self._can_run_startup_task(name):
                        ready_tasks.append(name)

        # Final progress update
        self.startup_progress = 100

    def _can_run_startup_task(self, name: str) -> bool:
        """
        Check if a startup task can be run.

        Args:
            name: Task name

        Returns:
            True if the task can be run, False otherwise
        """
        # If task is already completed, it can't be run again
        if self.startup_tasks[name]["completed"]:
            return False

        # If task has no dependencies, it can be run
        if name not in self._startup_dependencies:
            return True

        # Check if all dependencies are completed
        for dependency in self._startup_dependencies[name]:
            if dependency not in self.startup_tasks:
                logger.warning(f"Dependency {dependency} not found for task {name}")
                return False

            if not self.startup_tasks[dependency]["completed"]:
                return False

        return True

    async def _run_startup_task(self, name: str):
        """
        Run a startup task.

        Args:
            name: Task name
        """
        if name not in self.startup_tasks:
            logger.warning(f"Startup task not found: {name}")
            return

        task = self.startup_tasks[name]

        # Get lock for this task
        lock = self._task_locks.get(name)
        if not lock:
            lock = asyncio.Lock()
            self._task_locks[name] = lock

        # Run with lock to prevent concurrent execution
        async with lock:
            # Skip if already completed
            if task["completed"]:
                return

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

                # Update task status
                task["completed"] = True
                task["error"] = None

                # Update statistics
                self._startup_stats["completed_tasks"] += 1

                # Log success
                elapsed = time.time() - start_time
                logger.info(f"Startup task {name} completed in {elapsed:.2f}s")

            except Exception as e:
                # Update task status
                task["completed"] = False
                task["error"] = e

                # Update statistics
                self._startup_stats["failed_tasks"] += 1

                # Log error
                logger.error(f"Error in startup task {name}: {str(e)}")

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
