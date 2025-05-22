# Monitoring Guide

## Overview

This guide explains how to set up and use the monitoring system for the trading agents platform. The monitoring system provides real-time visibility into system performance, resource usage, and potential issues.

## Components

The monitoring system consists of the following components:

1. **Performance Monitor**: Collects metrics and generates alerts
2. **Monitoring API**: Provides access to metrics and alerts
3. **Alert Handlers**: Process and notify about alerts

## Setting Up Monitoring

### Initializing the Performance Monitor

The performance monitor should be initialized during application startup:

```python
from core.performance_monitor import PerformanceMonitor
from api.routes.monitoring import initialize_monitoring, start_monitoring

# Initialize components
resource_pool = ResourcePool()
execution_engine = ExecutionEngine(resource_pool=resource_pool)

# Initialize monitoring
monitor_config = {
    "collection_interval": 60,  # seconds
    "retention_period": 24 * 60 * 60,  # 24 hours
    "alert_thresholds": {
        "cpu_usage": 80.0,  # percent
        "memory_usage": 80.0,  # percent
        "disk_usage": 80.0,  # percent
        "cache_hit_rate_min": 50.0,  # percent
        "http_error_rate_max": 5.0,  # percent
        "response_time_max": 1000.0  # ms
    }
}

# Initialize monitoring with components
initialize_monitoring(
    resource_pool=resource_pool,
    execution_engine=execution_engine,
    config=monitor_config
)

# Start monitoring
await start_monitoring()
```

### Registering Alert Handlers

You can register custom alert handlers to process alerts:

```python
from core.performance_monitor import PerformanceMonitor, AlertLevel

# Get the performance monitor instance
monitor = PerformanceMonitor.get_instance()

# Define an alert handler
def email_alert_handler(alert):
    """Send critical alerts via email."""
    if alert["level"] == AlertLevel.CRITICAL.value:
        # Send email
        send_email(
            subject=f"CRITICAL ALERT: {alert['message']}",
            body=f"Alert details: {alert['details']}"
        )

# Register the handler
monitor.register_alert_handler(email_alert_handler)
```

### Including the Monitoring API

Include the monitoring API in your FastAPI application:

```python
from fastapi import FastAPI
from api.routes.monitoring import router as monitoring_router

app = FastAPI()

# Include the monitoring router
app.include_router(monitoring_router)
```

## Using the Monitoring API

### Getting Metrics

To get performance metrics:

```bash
# Get all metrics (limited to 10 entries per category)
curl -X GET "http://localhost:8000/monitoring/metrics"

# Get specific category metrics
curl -X GET "http://localhost:8000/monitoring/metrics?category=system"

# Get more historical data
curl -X GET "http://localhost:8000/monitoring/metrics?limit=50"
```

Example response:

```json
{
  "timestamp": "2023-06-01T12:34:56.789Z",
  "metrics": {
    "system": [
      {
        "timestamp": "2023-06-01T12:33:56.789Z",
        "process": {
          "cpu_percent": 15.2,
          "memory_rss": 102400000,
          "memory_vms": 204800000,
          "memory_percent": 5.3,
          "threads": 8
        },
        "system": {
          "cpu_percent": 25.7,
          "memory_total": 8589934592,
          "memory_available": 4294967296,
          "memory_percent": 50.0,
          "disk_total": 107374182400,
          "disk_used": 53687091200,
          "disk_free": 53687091200,
          "disk_percent": 50.0
        }
      }
    ]
  }
}
```

### Getting Alerts

To get performance alerts:

```bash
# Get all alerts
curl -X GET "http://localhost:8000/monitoring/alerts"

# Get alerts by level
curl -X GET "http://localhost:8000/monitoring/alerts?level=warning"

# Limit the number of alerts
curl -X GET "http://localhost:8000/monitoring/alerts?limit=20"
```

Example response:

```json
{
  "timestamp": "2023-06-01T12:34:56.789Z",
  "alerts": [
    {
      "timestamp": "2023-06-01T12:30:56.789Z",
      "level": "warning",
      "source": "system",
      "message": "System CPU usage is high: 85.3% (threshold: 80.0%)",
      "details": {
        "metric": "system_cpu_usage",
        "value": 85.3,
        "threshold": 80.0
      }
    }
  ],
  "count": 1
}
```

### Saving Metrics

To save metrics to a file:

```bash
# Save metrics with default filename
curl -X POST "http://localhost:8000/monitoring/save"

# Save metrics with custom filename
curl -X POST "http://localhost:8000/monitoring/save?filename=metrics_2023_06_01.json"
```

### Clearing Alerts

To clear all alerts:

```bash
curl -X POST "http://localhost:8000/monitoring/clear-alerts"
```

## Alert Levels

The monitoring system uses the following alert levels:

- **INFO**: Informational alerts that don't require action
- **WARNING**: Potential issues that should be investigated
- **ERROR**: Serious issues that require attention
- **CRITICAL**: Critical issues that require immediate action

## Metrics Categories

### System Metrics

System metrics provide information about system resource usage:

- **CPU Usage**: Process and system CPU usage
- **Memory Usage**: Process and system memory usage
- **Disk Usage**: Disk space usage
- **Thread Count**: Number of active threads

### Cache Metrics

Cache metrics provide information about cache performance:

- **Cache Size**: Memory and disk cache size
- **Cache Hit Rate**: Percentage of cache hits
- **Cache Eviction Count**: Number of cache evictions
- **Preloader Statistics**: Cache preloader performance

### HTTP Metrics

HTTP metrics provide information about HTTP client performance:

- **HTTP Client Count**: Number of HTTP clients
- **HTTP Request Count**: Number of HTTP requests
- **HTTP Error Rate**: Percentage of HTTP errors
- **Rate-Limited APIs**: Number of rate-limited APIs

### Execution Metrics

Execution metrics provide information about execution engine performance:

- **Queued Tasks**: Number of queued tasks
- **Running Tasks**: Number of running tasks
- **Agents Tracked**: Number of tracked agents
- **Scheduler Statistics**: Scheduler performance

## Best Practices

1. **Set Appropriate Alert Thresholds**: Adjust alert thresholds based on your system's characteristics

2. **Monitor Regularly**: Check metrics and alerts regularly

3. **Investigate Warnings**: Don't ignore warning alerts

4. **Set Up Alert Handlers**: Configure alert handlers for critical alerts

5. **Save Historical Data**: Save metrics periodically for trend analysis

6. **Adjust Collection Interval**: Set an appropriate collection interval based on system load

7. **Limit Retention Period**: Set an appropriate retention period to manage memory usage

8. **Use Monitoring Dashboard**: Set up a dashboard for visualizing metrics

9. **Correlate Metrics**: Look for correlations between different metrics

10. **Automate Responses**: Automate responses to common alerts
