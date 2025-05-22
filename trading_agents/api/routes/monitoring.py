"""
Monitoring API routes for the trading agents system.

This module provides API endpoints for accessing performance metrics and alerts.
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from enum import Enum
import logging
import json
from datetime import datetime

from core.performance_monitor import PerformanceMonitor, AlertLevel

# Create router
router = APIRouter(prefix="/monitoring", tags=["monitoring"])

# Logger
logger = logging.getLogger(__name__)

# Performance monitor instance
_performance_monitor: Optional[PerformanceMonitor] = None

class MetricsResponse(BaseModel):
    """Response model for metrics endpoints."""
    timestamp: str = Field(..., description="Timestamp of the response")
    metrics: Dict[str, Any] = Field(..., description="Performance metrics")

class AlertsResponse(BaseModel):
    """Response model for alerts endpoints."""
    timestamp: str = Field(..., description="Timestamp of the response")
    alerts: List[Dict[str, Any]] = Field(..., description="Performance alerts")
    count: int = Field(..., description="Number of alerts")

class AlertLevelEnum(str, Enum):
    """Alert level enum for API."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

async def get_performance_monitor() -> PerformanceMonitor:
    """
    Get the performance monitor instance.

    Returns:
        Performance monitor instance
    """
    global _performance_monitor

    if _performance_monitor is None:
        # This should be initialized during application startup
        raise HTTPException(
            status_code=503,
            detail="Performance monitoring not initialized"
        )

    return _performance_monitor

def initialize_monitoring(
    resource_pool=None,
    execution_engine=None,
    config: Dict[str, Any] = None
):
    """
    Initialize the performance monitor.

    Args:
        resource_pool: Shared resource pool
        execution_engine: Execution engine
        config: Monitor configuration
    """
    global _performance_monitor

    if _performance_monitor is not None:
        logger.warning("Performance monitor already initialized")
        return

    logger.info("Initializing performance monitor")
    _performance_monitor = PerformanceMonitor(
        resource_pool=resource_pool,
        execution_engine=execution_engine,
        config=config
    )

async def start_monitoring():
    """Start the performance monitor."""
    global _performance_monitor

    if _performance_monitor is None:
        logger.warning("Performance monitor not initialized")
        return

    await _performance_monitor.start()

async def stop_monitoring():
    """Stop the performance monitor."""
    global _performance_monitor

    if _performance_monitor is None:
        logger.warning("Performance monitor not initialized")
        return

    await _performance_monitor.stop()

@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics(
    category: Optional[str] = Query(None, description="Metrics category"),
    limit: Optional[int] = Query(10, description="Maximum number of metrics to return per category"),
    monitor: PerformanceMonitor = Depends(get_performance_monitor)
):
    """
    Get performance metrics.

    Args:
        category: Metrics category (None for all)
        limit: Maximum number of metrics to return per category
        monitor: Performance monitor instance

    Returns:
        Performance metrics
    """
    metrics = monitor.get_metrics(category=category, limit=limit)

    return {
        "timestamp": datetime.now().isoformat(),
        "metrics": metrics
    }

@router.get("/alerts", response_model=AlertsResponse)
async def get_alerts(
    level: Optional[AlertLevelEnum] = Query(None, description="Alert level"),
    limit: Optional[int] = Query(100, description="Maximum number of alerts to return"),
    monitor: PerformanceMonitor = Depends(get_performance_monitor)
):
    """
    Get performance alerts.

    Args:
        level: Alert level (None for all)
        limit: Maximum number of alerts to return
        monitor: Performance monitor instance

    Returns:
        Performance alerts
    """
    # Convert API enum to internal enum
    alert_level = None
    if level:
        alert_level = AlertLevel(level.value)

    alerts = monitor.get_alerts(level=alert_level, limit=limit)

    return {
        "timestamp": datetime.now().isoformat(),
        "alerts": alerts,
        "count": len(alerts)
    }

@router.post("/save")
async def save_metrics(
    background_tasks: BackgroundTasks,
    filename: Optional[str] = Query(None, description="Output filename"),
    monitor: PerformanceMonitor = Depends(get_performance_monitor)
):
    """
    Save metrics to a file.

    Args:
        background_tasks: Background tasks
        filename: Output filename
        monitor: Performance monitor instance

    Returns:
        Success message
    """
    # Save metrics in the background
    background_tasks.add_task(monitor.save_metrics, filename)

    return {
        "message": "Saving metrics in the background",
        "timestamp": datetime.now().isoformat()
    }

@router.post("/clear-alerts")
async def clear_alerts(
    monitor: PerformanceMonitor = Depends(get_performance_monitor)
):
    """
    Clear all alerts.

    Args:
        monitor: Performance monitor instance

    Returns:
        Success message
    """
    monitor.alerts.clear()

    return {
        "message": "Alerts cleared",
        "timestamp": datetime.now().isoformat()
    }
