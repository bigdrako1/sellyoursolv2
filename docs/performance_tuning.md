# Performance Tuning Guide

## Overview

This guide explains how to optimize the performance of the trading agents system. It covers performance testing, monitoring, and tuning techniques to ensure the system operates efficiently under various load conditions.

## Performance Testing

The system includes built-in performance testing tools to help identify bottlenecks and verify system stability under load.

### Load Testing

The load testing framework simulates high load on various components of the system:

```bash
# Run a basic load test
python -m trading_agents.tests.performance.load_tester

# Run with custom parameters
python -m trading_agents.tests.performance.load_tester --concurrency 20 --duration 120 --test-cache --test-http --test-execution
```

Parameters:
- `--concurrency`: Number of concurrent workers (default: 10)
- `--duration`: Test duration in seconds (default: 60)
- `--ramp-up`: Ramp-up time in seconds (default: 5)
- `--output`: Output file for results
- `--test-cache`: Test cache performance (default: true)
- `--test-http`: Test HTTP client performance (default: true)
- `--test-execution`: Test execution engine performance (default: true)
- `--log-level`: Logging level (default: INFO)

### Cache Benchmarking

The cache benchmarking tool helps optimize cache configurations:

```bash
# Run a basic cache benchmark
python -m trading_agents.tests.performance.cache_benchmark

# Run with custom parameters
python -m trading_agents.tests.performance.cache_benchmark --iterations 2000 --key-count 20000 --value-size 2048 --memory-only --disk-only --tiered
```

Parameters:
- `--iterations`: Number of iterations for each test (default: 1000)
- `--key-count`: Number of keys to use in tests (default: 10000)
- `--value-size`: Approximate size of values in bytes (default: 1024)
- `--output`: Output file for results
- `--memory-only`: Run memory-only cache tests (default: true)
- `--disk-only`: Run disk-only cache tests (default: true)
- `--tiered`: Run tiered cache tests (default: true)
- `--log-level`: Logging level (default: INFO)

## Performance Monitoring

The system includes a performance monitoring framework that collects metrics and generates alerts for potential issues.

### Monitoring API

The monitoring API provides access to performance metrics and alerts:

- `GET /monitoring/metrics`: Get performance metrics
  - Query parameters:
    - `category`: Metrics category (system, cache, http, execution)
    - `limit`: Maximum number of metrics to return per category

- `GET /monitoring/alerts`: Get performance alerts
  - Query parameters:
    - `level`: Alert level (info, warning, error, critical)
    - `limit`: Maximum number of alerts to return

- `POST /monitoring/save`: Save metrics to a file
  - Query parameters:
    - `filename`: Output filename

- `POST /monitoring/clear-alerts`: Clear all alerts

### Metrics Categories

The monitoring system collects metrics in the following categories:

#### System Metrics

- CPU usage (process and system)
- Memory usage (process and system)
- Disk usage
- Thread count

#### Cache Metrics

- Cache size (memory and disk)
- Cache hit rate
- Cache eviction count
- Preloader statistics

#### HTTP Metrics

- HTTP client count
- HTTP request count
- HTTP error rate
- Rate-limited APIs

#### Execution Metrics

- Queued tasks
- Running tasks
- Agents tracked
- Scheduler statistics

## Performance Tuning

### Cache Tuning

Based on cache benchmark results, consider the following optimizations:

1. **Memory Cache Size**: Adjust based on available system memory and working set size
   ```python
   cache_config = {
       "memory_max_size": 50000,  # Adjust based on benchmark results
   }
   ```

2. **Disk Cache Configuration**: Enable or disable based on I/O performance
   ```python
   cache_config = {
       "disk_cache_enabled": True,  # Set to False if disk I/O is a bottleneck
       "disk_max_size": 200 * 1024 * 1024,  # 200 MB, adjust based on available disk space
   }
   ```

3. **Invalidation Strategy**: Choose based on access patterns
   ```python
   cache_config = {
       "invalidation_strategy": InvalidationStrategy.LRU.value,  # Options: LRU, LFU, FIFO, TTL
   }
   ```

4. **TTL Values**: Set appropriate TTL values based on data volatility
   ```python
   # High volatility data (e.g., order book)
   await cache_manager.set(key, value, ttl=30)  # 30 seconds
   
   # Medium volatility data (e.g., recent trades)
   await cache_manager.set(key, value, ttl=300)  # 5 minutes
   
   # Low volatility data (e.g., historical data)
   await cache_manager.set(key, value, ttl=3600)  # 1 hour
   ```

### HTTP Client Tuning

1. **Pool Size**: Adjust based on expected concurrent requests
   ```python
   resource_pool.http_pool_size = 30  # Increase for higher concurrency
   ```

2. **Timeout and Retry Settings**: Adjust based on API response times
   ```python
   resource_pool.http_timeout = 30  # Seconds
   resource_pool.http_retry_count = 3
   resource_pool.http_retry_delay = 1.0  # Seconds
   ```

3. **Rate Limiting**: Configure to avoid API rate limit errors
   ```python
   # Rate limit to 60 requests per minute
   await resource_pool.http_request(
       method="GET",
       url="https://api.example.com/data",
       api_name="example",
       rate_limit=60
   )
   ```

### Execution Engine Tuning

1. **Concurrent Tasks**: Adjust based on system resources
   ```python
   execution_engine.max_concurrent_tasks = 20  # Increase for higher throughput
   ```

2. **Task Timeout**: Adjust based on expected task duration
   ```python
   execution_engine.task_timeout_multiplier = 1.5  # Increase for longer-running tasks
   ```

3. **Task Priorities**: Use appropriate priorities for different tasks
   ```python
   # Critical operations (e.g., stop loss checks)
   await execution_engine.schedule_task(
       agent_id="agent_id",
       task_type="stop_loss_check",
       coroutine=stop_loss_check,
       priority=TaskPriority.CRITICAL
   )
   
   # Regular agent cycles
   await execution_engine.schedule_agent_cycle(
       agent=agent,
       priority=TaskPriority.NORMAL
   )
   ```

## Best Practices

1. **Regular Performance Testing**: Run performance tests regularly to identify regressions

2. **Monitor System Resources**: Keep an eye on CPU, memory, and disk usage

3. **Optimize Cache Usage**: Use appropriate cache levels and TTL values

4. **Batch Operations**: Use batch operations where possible to reduce overhead

5. **Limit Task Duration**: Keep tasks short and focused

6. **Use Async/Await Properly**: Avoid blocking operations in async code

7. **Profile Code**: Use profiling tools to identify bottlenecks

8. **Optimize Database Queries**: Use indexes and efficient query patterns

9. **Load Test Before Deployment**: Always load test before deploying to production

10. **Monitor Production Performance**: Use the monitoring API to track performance in production
