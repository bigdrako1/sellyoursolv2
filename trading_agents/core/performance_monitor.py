"""
Performance monitoring for the trading agents system.

This module provides tools for monitoring system performance, collecting metrics,
and detecting performance issues.
"""
import asyncio
import logging
import time
import os
import psutil
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Set, Callable
import json
import statistics
from enum import Enum
import threading

from .resource_pool import ResourcePool
from .execution_engine import ExecutionEngine
from .cache_manager import CacheManager

logger = logging.getLogger(__name__)

class AlertLevel(Enum):
    """Alert levels for performance issues."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class PerformanceMonitor:
    """
    Performance monitoring for the trading agents system.

    This class provides methods to monitor system performance, collect metrics,
    and detect performance issues.

    Attributes:
        resource_pool: Shared resource pool
        execution_engine: Execution engine
        metrics: Collected performance metrics
        alerts: Performance alerts
    """

    def __init__(
        self,
        resource_pool: Optional[ResourcePool] = None,
        execution_engine: Optional[ExecutionEngine] = None,
        config: Dict[str, Any] = None
    ):
        """
        Initialize the performance monitor.

        Args:
            resource_pool: Shared resource pool (optional)
            execution_engine: Execution engine (optional)
            config: Monitor configuration
        """
        config = config or {}

        # Components to monitor
        self.resource_pool = resource_pool
        self.execution_engine = execution_engine

        # Configuration
        self.collection_interval = config.get("collection_interval", 60)  # seconds
        self.retention_period = config.get("retention_period", 24 * 60 * 60)  # 24 hours
        self.alert_thresholds = config.get("alert_thresholds", {
            "cpu_usage": 80.0,  # percent
            "memory_usage": 80.0,  # percent
            "disk_usage": 80.0,  # percent
            "cache_hit_rate_min": 50.0,  # percent
            "http_error_rate_max": 5.0,  # percent
            "response_time_max": 1000.0  # ms
        })

        # Metrics storage
        self.metrics: Dict[str, List[Dict[str, Any]]] = {
            "system": [],
            "cache": [],
            "http": [],
            "execution": []
        }

        # Alerts
        self.alerts: List[Dict[str, Any]] = []
        self.alert_handlers: List[Callable[[Dict[str, Any]], None]] = []

        # State
        self._running = False
        self._stop_event = asyncio.Event()
        self._collection_task = None

        logger.info("Performance monitor initialized")

    async def start(self):
        """Start the performance monitor."""
        if self._running:
            logger.warning("Performance monitor already running")
            return

        logger.info("Starting performance monitor")
        self._running = True
        self._stop_event.clear()

        # Start the collection task
        self._collection_task = asyncio.create_task(self._collection_loop())

    async def stop(self):
        """Stop the performance monitor."""
        if not self._running:
            logger.warning("Performance monitor not running")
            return

        logger.info("Stopping performance monitor")
        self._running = False
        self._stop_event.set()

        # Wait for the collection task to complete
        if self._collection_task:
            try:
                await asyncio.wait_for(self._collection_task, timeout=10.0)
            except asyncio.TimeoutError:
                logger.warning("Collection loop did not stop gracefully, cancelling")
                self._collection_task.cancel()

        logger.info("Performance monitor stopped")

    def register_alert_handler(self, handler: Callable[[Dict[str, Any]], None]):
        """
        Register an alert handler.

        Args:
            handler: Function to call when an alert is triggered
        """
        self.alert_handlers.append(handler)
        logger.debug(f"Registered alert handler: {handler.__name__}")

    def unregister_alert_handler(self, handler: Callable[[Dict[str, Any]], None]):
        """
        Unregister an alert handler.

        Args:
            handler: Handler to unregister
        """
        if handler in self.alert_handlers:
            self.alert_handlers.remove(handler)
            logger.debug(f"Unregistered alert handler: {handler.__name__}")

    async def _collection_loop(self):
        """Periodic collection loop."""
        logger.info("Collection loop started")

        try:
            while self._running:
                # Check if we should stop
                if self._stop_event.is_set():
                    break

                # Collect metrics
                await self._collect_metrics()

                # Check for alerts
                await self._check_alerts()

                # Prune old metrics
                self._prune_metrics()

                # Wait for next collection
                await asyncio.sleep(self.collection_interval)

        except asyncio.CancelledError:
            logger.info("Collection loop cancelled")
            raise
        except Exception as e:
            logger.error(f"Error in collection loop: {str(e)}", exc_info=True)
            raise
        finally:
            logger.info("Collection loop stopped")

    async def _collect_metrics(self):
        """Collect performance metrics."""
        try:
            # Collect system metrics
            system_metrics = self._collect_system_metrics()
            self.metrics["system"].append(system_metrics)

            # Collect cache metrics if resource pool is available
            if self.resource_pool:
                cache_metrics = await self._collect_cache_metrics()
                self.metrics["cache"].append(cache_metrics)

                http_metrics = await self._collect_http_metrics()
                self.metrics["http"].append(http_metrics)

            # Collect execution metrics if execution engine is available
            if self.execution_engine:
                execution_metrics = await self._collect_execution_metrics()
                self.metrics["execution"].append(execution_metrics)

            logger.debug("Collected performance metrics")

        except Exception as e:
            logger.error(f"Error collecting metrics: {str(e)}", exc_info=True)

    def _collect_system_metrics(self) -> Dict[str, Any]:
        """
        Collect system metrics.

        Returns:
            Dictionary of system metrics
        """
        # Get process info
        process = psutil.Process(os.getpid())

        # Collect metrics
        cpu_percent = process.cpu_percent()
        memory_info = process.memory_info()
        memory_percent = process.memory_percent()

        # Get disk usage for the current directory
        disk_usage = psutil.disk_usage(os.getcwd())

        # Get system-wide CPU and memory usage
        system_cpu_percent = psutil.cpu_percent()
        system_memory = psutil.virtual_memory()

        return {
            "timestamp": datetime.now().isoformat(),
            "process": {
                "cpu_percent": cpu_percent,
                "memory_rss": memory_info.rss,
                "memory_vms": memory_info.vms,
                "memory_percent": memory_percent,
                "threads": threading.active_count()
            },
            "system": {
                "cpu_percent": system_cpu_percent,
                "memory_total": system_memory.total,
                "memory_available": system_memory.available,
                "memory_percent": system_memory.percent,
                "disk_total": disk_usage.total,
                "disk_used": disk_usage.used,
                "disk_free": disk_usage.free,
                "disk_percent": disk_usage.percent
            }
        }

    async def _collect_cache_metrics(self) -> Dict[str, Any]:
        """
        Collect cache metrics.

        Returns:
            Dictionary of cache metrics
        """
        if not self.resource_pool:
            return {"timestamp": datetime.now().isoformat()}

        try:
            # Get cache stats
            stats = await self.resource_pool.get_stats()

            # Extract cache metrics
            cache_metrics = {
                "timestamp": datetime.now().isoformat()
            }

            # Add legacy cache metrics
            cache_metrics["legacy_cache"] = {
                "size": stats.get("legacy_cache_size", 0),
                "hits": stats.get("legacy_cache_hits", 0),
                "misses": stats.get("legacy_cache_misses", 0),
                "hit_rate": stats.get("legacy_cache_hit_rate", 0)
            }

            # Add advanced cache metrics if available
            if "advanced_cache" in stats:
                advanced_cache = stats["advanced_cache"]
                cache_metrics["advanced_cache"] = {
                    "memory_size": advanced_cache.get("memory_size", 0),
                    "memory_max_size": advanced_cache.get("memory_max_size", 0),
                    "memory_usage": advanced_cache.get("memory_usage", 0),
                    "memory_hit_rate": advanced_cache.get("memory_hit_rate", 0),
                    "disk_size": advanced_cache.get("disk_size", 0),
                    "disk_max_size": advanced_cache.get("disk_max_size", 0),
                    "disk_usage": advanced_cache.get("disk_usage", 0),
                    "disk_hit_rate": advanced_cache.get("disk_hit_rate", 0),
                    "eviction_count": advanced_cache.get("eviction_count", 0)
                }

            # Add combined metrics if available
            if "combined_cache_hit_rate" in stats:
                cache_metrics["combined"] = {
                    "hits": stats.get("combined_cache_hits", 0),
                    "misses": stats.get("combined_cache_misses", 0),
                    "hit_rate": stats.get("combined_cache_hit_rate", 0)
                }

            # Add preloader stats if available
            try:
                preloader_stats = await self.resource_pool.get_preloader_stats()
                cache_metrics["preloader"] = {
                    "tasks": preloader_stats.get("tasks", 0),
                    "running_tasks": preloader_stats.get("running_tasks", 0),
                    "preload_count": preloader_stats.get("preload_count", 0),
                    "preload_error_count": preloader_stats.get("preload_error_count", 0)
                }
            except Exception as e:
                logger.warning(f"Error getting preloader stats: {str(e)}")

            return cache_metrics

        except Exception as e:
            logger.error(f"Error collecting cache metrics: {str(e)}")
            return {"timestamp": datetime.now().isoformat(), "error": str(e)}

    async def _collect_http_metrics(self) -> Dict[str, Any]:
        """
        Collect HTTP metrics.

        Returns:
            Dictionary of HTTP metrics
        """
        if not self.resource_pool:
            return {"timestamp": datetime.now().isoformat()}

        try:
            # Get resource pool stats
            stats = await self.resource_pool.get_stats()

            # Extract HTTP metrics
            http_metrics = {
                "timestamp": datetime.now().isoformat(),
                "clients": stats.get("http_clients", 0),
                "requests": stats.get("http_requests", 0),
                "errors": stats.get("http_errors", 0),
                "error_rate": stats.get("http_error_rate", 0),
                "rate_limited_apis": stats.get("rate_limited_apis", 0)
            }

            return http_metrics

        except Exception as e:
            logger.error(f"Error collecting HTTP metrics: {str(e)}")
            return {"timestamp": datetime.now().isoformat(), "error": str(e)}

    async def _collect_execution_metrics(self) -> Dict[str, Any]:
        """
        Collect execution engine metrics.

        Returns:
            Dictionary of execution engine metrics
        """
        if not self.execution_engine:
            return {"timestamp": datetime.now().isoformat()}

        try:
            # Get execution engine stats
            stats = self.execution_engine.get_stats()

            # Extract execution metrics
            execution_metrics = {
                "timestamp": datetime.now().isoformat(),
                "running": stats.get("running", False),
                "queued_tasks": stats.get("queued_tasks", 0),
                "running_tasks": stats.get("running_tasks", 0),
                "agents_tracked": stats.get("agents_tracked", 0)
            }

            # Add scheduler stats if available
            if "scheduler_stats" in stats:
                scheduler_stats = stats["scheduler_stats"]
                execution_metrics["scheduler"] = {
                    "agents_tracked": scheduler_stats.get("agents_tracked", 0),
                    "interval_adjustments": scheduler_stats.get("interval_adjustments", 0)
                }

            return execution_metrics

        except Exception as e:
            logger.error(f"Error collecting execution metrics: {str(e)}")
            return {"timestamp": datetime.now().isoformat(), "error": str(e)}

    async def _check_alerts(self):
        """Check for performance alerts."""
        try:
            # Check system metrics
            await self._check_system_alerts()

            # Check cache metrics
            await self._check_cache_alerts()

            # Check HTTP metrics
            await self._check_http_alerts()

            # Check execution metrics
            await self._check_execution_alerts()

        except Exception as e:
            logger.error(f"Error checking alerts: {str(e)}", exc_info=True)

    async def _check_system_alerts(self):
        """Check for system performance alerts."""
        if not self.metrics["system"]:
            return

        # Get latest system metrics
        latest = self.metrics["system"][-1]

        # Check CPU usage
        cpu_threshold = self.alert_thresholds.get("cpu_usage", 80.0)
        process_cpu = latest["process"]["cpu_percent"]
        system_cpu = latest["system"]["cpu_percent"]

        if process_cpu > cpu_threshold:
            self._add_alert(
                level=AlertLevel.WARNING,
                source="system",
                message=f"Process CPU usage is high: {process_cpu:.1f}% (threshold: {cpu_threshold:.1f}%)",
                details={
                    "metric": "cpu_usage",
                    "value": process_cpu,
                    "threshold": cpu_threshold
                }
            )

        if system_cpu > cpu_threshold:
            self._add_alert(
                level=AlertLevel.WARNING,
                source="system",
                message=f"System CPU usage is high: {system_cpu:.1f}% (threshold: {cpu_threshold:.1f}%)",
                details={
                    "metric": "system_cpu_usage",
                    "value": system_cpu,
                    "threshold": cpu_threshold
                }
            )

        # Check memory usage
        memory_threshold = self.alert_thresholds.get("memory_usage", 80.0)
        process_memory = latest["process"]["memory_percent"]
        system_memory = latest["system"]["memory_percent"]

        if process_memory > memory_threshold:
            self._add_alert(
                level=AlertLevel.WARNING,
                source="system",
                message=f"Process memory usage is high: {process_memory:.1f}% (threshold: {memory_threshold:.1f}%)",
                details={
                    "metric": "memory_usage",
                    "value": process_memory,
                    "threshold": memory_threshold
                }
            )

        if system_memory > memory_threshold:
            self._add_alert(
                level=AlertLevel.WARNING,
                source="system",
                message=f"System memory usage is high: {system_memory:.1f}% (threshold: {memory_threshold:.1f}%)",
                details={
                    "metric": "system_memory_usage",
                    "value": system_memory,
                    "threshold": memory_threshold
                }
            )

        # Check disk usage
        disk_threshold = self.alert_thresholds.get("disk_usage", 80.0)
        disk_usage = latest["system"]["disk_percent"]

        if disk_usage > disk_threshold:
            self._add_alert(
                level=AlertLevel.WARNING,
                source="system",
                message=f"Disk usage is high: {disk_usage:.1f}% (threshold: {disk_threshold:.1f}%)",
                details={
                    "metric": "disk_usage",
                    "value": disk_usage,
                    "threshold": disk_threshold
                }
            )

    async def _check_cache_alerts(self):
        """Check for cache performance alerts."""
        if not self.metrics["cache"]:
            return

        # Get latest cache metrics
        latest = self.metrics["cache"][-1]

        # Check for error
        if "error" in latest:
            self._add_alert(
                level=AlertLevel.ERROR,
                source="cache",
                message=f"Error collecting cache metrics: {latest['error']}",
                details={"error": latest["error"]}
            )
            return

        # Check cache hit rate
        hit_rate_threshold = self.alert_thresholds.get("cache_hit_rate_min", 50.0)

        # Check advanced cache hit rate if available
        if "advanced_cache" in latest:
            memory_hit_rate = latest["advanced_cache"].get("memory_hit_rate", 0) * 100
            disk_hit_rate = latest["advanced_cache"].get("disk_hit_rate", 0) * 100

            if memory_hit_rate < hit_rate_threshold:
                self._add_alert(
                    level=AlertLevel.WARNING,
                    source="cache",
                    message=f"Memory cache hit rate is low: {memory_hit_rate:.1f}% (threshold: {hit_rate_threshold:.1f}%)",
                    details={
                        "metric": "memory_hit_rate",
                        "value": memory_hit_rate,
                        "threshold": hit_rate_threshold
                    }
                )

            if disk_hit_rate < hit_rate_threshold:
                self._add_alert(
                    level=AlertLevel.WARNING,
                    source="cache",
                    message=f"Disk cache hit rate is low: {disk_hit_rate:.1f}% (threshold: {hit_rate_threshold:.1f}%)",
                    details={
                        "metric": "disk_hit_rate",
                        "value": disk_hit_rate,
                        "threshold": hit_rate_threshold
                    }
                )

        # Check combined hit rate if available
        if "combined" in latest:
            combined_hit_rate = latest["combined"].get("hit_rate", 0) * 100

            if combined_hit_rate < hit_rate_threshold:
                self._add_alert(
                    level=AlertLevel.WARNING,
                    source="cache",
                    message=f"Combined cache hit rate is low: {combined_hit_rate:.1f}% (threshold: {hit_rate_threshold:.1f}%)",
                    details={
                        "metric": "combined_hit_rate",
                        "value": combined_hit_rate,
                        "threshold": hit_rate_threshold
                    }
                )

        # Check preloader errors if available
        if "preloader" in latest:
            preload_error_count = latest["preloader"].get("preload_error_count", 0)

            if preload_error_count > 0:
                self._add_alert(
                    level=AlertLevel.WARNING,
                    source="cache",
                    message=f"Cache preloader has errors: {preload_error_count} errors",
                    details={
                        "metric": "preload_error_count",
                        "value": preload_error_count
                    }
                )

    async def _check_http_alerts(self):
        """Check for HTTP performance alerts."""
        if not self.metrics["http"]:
            return

        # Get latest HTTP metrics
        latest = self.metrics["http"][-1]

        # Check for error
        if "error" in latest:
            self._add_alert(
                level=AlertLevel.ERROR,
                source="http",
                message=f"Error collecting HTTP metrics: {latest['error']}",
                details={"error": latest["error"]}
            )
            return

        # Check HTTP error rate
        error_rate_threshold = self.alert_thresholds.get("http_error_rate_max", 5.0)
        error_rate = latest.get("error_rate", 0) * 100

        if error_rate > error_rate_threshold:
            self._add_alert(
                level=AlertLevel.WARNING,
                source="http",
                message=f"HTTP error rate is high: {error_rate:.1f}% (threshold: {error_rate_threshold:.1f}%)",
                details={
                    "metric": "http_error_rate",
                    "value": error_rate,
                    "threshold": error_rate_threshold
                }
            )

    async def _check_execution_alerts(self):
        """Check for execution engine performance alerts."""
        if not self.metrics["execution"]:
            return

        # Get latest execution metrics
        latest = self.metrics["execution"][-1]

        # Check for error
        if "error" in latest:
            self._add_alert(
                level=AlertLevel.ERROR,
                source="execution",
                message=f"Error collecting execution metrics: {latest['error']}",
                details={"error": latest["error"]}
            )
            return

        # Check if execution engine is running
        if not latest.get("running", False):
            self._add_alert(
                level=AlertLevel.ERROR,
                source="execution",
                message="Execution engine is not running",
                details={"metric": "running", "value": False}
            )

        # Check queued tasks
        queued_tasks = latest.get("queued_tasks", 0)
        if queued_tasks > 100:  # Arbitrary threshold
            self._add_alert(
                level=AlertLevel.WARNING,
                source="execution",
                message=f"High number of queued tasks: {queued_tasks}",
                details={"metric": "queued_tasks", "value": queued_tasks}
            )

    def _add_alert(self, level: AlertLevel, source: str, message: str, details: Dict[str, Any] = None):
        """
        Add a performance alert.

        Args:
            level: Alert level
            source: Alert source
            message: Alert message
            details: Additional details
        """
        # Create alert
        alert = {
            "timestamp": datetime.now().isoformat(),
            "level": level.value,
            "source": source,
            "message": message,
            "details": details or {}
        }

        # Add to alerts list
        self.alerts.append(alert)

        # Log alert
        log_method = getattr(logger, level.value, logger.warning)
        log_method(f"Performance alert: {message}")

        # Notify handlers
        for handler in self.alert_handlers:
            try:
                handler(alert)
            except Exception as e:
                logger.error(f"Error in alert handler: {str(e)}")

    def _prune_metrics(self):
        """Prune old metrics based on retention period."""
        if self.retention_period <= 0:
            return

        # Calculate cutoff time
        cutoff = datetime.now() - timedelta(seconds=self.retention_period)
        cutoff_str = cutoff.isoformat()

        # Prune metrics
        for category in self.metrics:
            self.metrics[category] = [
                m for m in self.metrics[category]
                if m.get("timestamp", "") >= cutoff_str
            ]

        # Prune alerts
        self.alerts = [
            a for a in self.alerts
            if a.get("timestamp", "") >= cutoff_str
        ]

    def get_metrics(self, category: Optional[str] = None, limit: Optional[int] = None) -> Dict[str, Any]:
        """
        Get collected metrics.

        Args:
            category: Metrics category (None for all)
            limit: Maximum number of metrics to return per category

        Returns:
            Dictionary of metrics
        """
        if category:
            if category not in self.metrics:
                return {}

            metrics = self.metrics[category]
            if limit:
                metrics = metrics[-limit:]

            return {category: metrics}

        if limit:
            return {
                cat: metrics[-limit:]
                for cat, metrics in self.metrics.items()
            }

        return self.metrics

    def get_alerts(self, level: Optional[AlertLevel] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get performance alerts.

        Args:
            level: Filter by alert level (None for all)
            limit: Maximum number of alerts to return

        Returns:
            List of alerts
        """
        if level:
            alerts = [a for a in self.alerts if a.get("level") == level.value]
        else:
            alerts = self.alerts

        if limit:
            alerts = alerts[-limit:]

        return alerts

    def save_metrics(self, filename: str = None):
        """
        Save metrics to a file.

        Args:
            filename: Output filename (default: performance_metrics_{timestamp}.json)
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"performance_metrics_{timestamp}.json"

        data = {
            "metrics": self.metrics,
            "alerts": self.alerts,
            "timestamp": datetime.now().isoformat()
        }

        with open(filename, "w") as f:
            json.dump(data, f, indent=2)

        logger.info(f"Metrics saved to {filename}")
