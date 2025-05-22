# Caching Strategy Guide

## Overview

This guide explains the advanced caching system implemented in the trading agents platform. The caching system provides efficient data storage and retrieval, reducing latency and external API calls.

## Components

The caching system consists of three main components:

1. **CacheManager**: Provides tiered caching (memory and disk) with advanced features like invalidation strategies, pattern-based invalidation, and tagging.

2. **ResourcePool Integration**: Enhances the existing ResourcePool with the advanced caching capabilities while maintaining backward compatibility.

3. **CachePreloader**: Proactively loads frequently accessed data into the cache to reduce latency for common requests.

## Cache Manager

The `CacheManager` class provides a sophisticated caching system with the following features:

### Tiered Storage

```python
# Store in memory only
await cache_manager.set(key, value, ttl, CacheLevel.MEMORY)

# Store on disk only
await cache_manager.set(key, value, ttl, CacheLevel.DISK)

# Store in both memory and disk (default)
await cache_manager.set(key, value, ttl, CacheLevel.ALL)
```

### Invalidation Strategies

The cache manager supports multiple invalidation strategies:

- **TTL (Time to Live)**: Entries expire after a specified time.
- **LRU (Least Recently Used)**: Removes the least recently accessed entries when the cache is full.
- **LFU (Least Frequently Used)**: Removes the least frequently accessed entries when the cache is full.
- **FIFO (First In, First Out)**: Removes the oldest entries when the cache is full.

```python
# Configure the invalidation strategy
cache_config = {
    "invalidation_strategy": InvalidationStrategy.LRU.value
}
cache_manager = CacheManager(cache_config)
```

### Pattern-Based Invalidation

```python
# Invalidate all keys matching a pattern
count = await cache_manager.invalidate_by_pattern("market_data:BTC:.*")
```

### Tag-Based Invalidation

```python
# Set a value with tags
await cache_manager.set(key, value, ttl, tags=["market_data", "BTC"])

# Invalidate all entries with a specific tag
count = await cache_manager.invalidate_by_tag("BTC")
```

## Resource Pool Integration

The `ResourcePool` class has been enhanced to use the advanced caching system:

```python
# Get a value from the cache
value = await resource_pool.cache_get("market_data:BTC:1m")

# Store a value in the cache
await resource_pool.cache_set(
    key="market_data:BTC:1m",
    value=data,
    ttl=300,  # 5 minutes
    tags=["market_data", "BTC"]
)

# Delete a value from the cache
await resource_pool.cache_delete("market_data:BTC:1m")

# Clear the entire cache
await resource_pool.cache_clear()

# Invalidate by pattern
count = await resource_pool.cache_invalidate_by_pattern("market_data:BTC:.*")

# Invalidate by tag
count = await resource_pool.cache_invalidate_by_tag("BTC")
```

## Cache Preloader

The `CachePreloader` proactively loads frequently accessed data into the cache:

```python
# Register a preload task
resource_pool.register_preload_task(
    name="market_data_btc",
    loader_func=resource_pool.cache_preloader.preload_market_data,
    interval=60,  # Every minute
    args=["BTC", "1m", "binance", "https://api.binance.com/api/v3/klines"],
    kwargs={"params": {"symbol": "BTCUSDT", "interval": "1m", "limit": 100}},
    cache_key="market_data:BTC:1m",
    cache_ttl=120,  # 2 minutes
    tags=["market_data", "BTC"],
    enabled=True
)

# Run a preload task immediately
await resource_pool.run_preload_task_now("market_data_btc")

# Get preloader statistics
stats = await resource_pool.get_preloader_stats()
```

## Configuration

### Cache Manager Configuration

```python
cache_config = {
    "memory_max_size": 10000,  # Maximum number of items in memory cache
    "disk_max_size": 100 * 1024 * 1024,  # 100 MB maximum disk cache size
    "default_ttl": 300,  # 5 minutes default TTL
    "disk_cache_enabled": True,  # Enable disk cache
    "disk_cache_dir": "cache",  # Directory for disk cache
    "invalidation_strategy": "lru"  # LRU invalidation strategy
}
```

### Resource Pool Configuration

```python
# Configure resource pool
resource_pool = execution_engine.resource_pool
resource_pool.http_pool_size = 30
resource_pool.cache_ttl = 300  # 5 minutes default

# Configure advanced cache
resource_pool.cache_manager = CacheManager(cache_config)

# Start cache preloader
await resource_pool.start_cache_preloader()
```

## Best Practices

### Effective Key Naming

Use a consistent key naming convention to make pattern-based invalidation effective:

```
<data_type>:<entity>:<parameters>
```

Examples:
- `market_data:BTC:1m`
- `order_book:ETH:depth_20`
- `wallet_transactions:0x1234:last_24h`

### Appropriate TTL Values

Set appropriate TTL values based on data volatility:

- **High volatility data** (e.g., order book): 10-30 seconds
- **Medium volatility data** (e.g., recent trades): 1-5 minutes
- **Low volatility data** (e.g., historical data): 15-60 minutes

### Using Tags

Use tags to group related data for easy invalidation:

```python
# Tag by data type and entity
await resource_pool.cache_set(
    key="market_data:BTC:1m",
    value=data,
    tags=["market_data", "BTC", "1m"]
)

# Invalidate all BTC data
await resource_pool.cache_invalidate_by_tag("BTC")
```

### Preloading Common Data

Preload commonly accessed data to reduce latency:

```python
# Preload market data for popular symbols
resource_pool.register_preload_task(
    name="market_data_btc",
    loader_func=resource_pool.cache_preloader.preload_market_data,
    interval=60,  # Every minute
    args=["BTC", "1m", "binance", "https://api.binance.com/api/v3/klines"],
    kwargs={"params": {"symbol": "BTCUSDT", "interval": "1m", "limit": 100}},
    cache_key="market_data:BTC:1m",
    cache_ttl=120,  # 2 minutes
    tags=["market_data", "BTC"],
    enabled=True
)
```

## Agent Implementation

Agents should use the cache to reduce API calls and improve performance:

```python
async def _run_cycle(self, resource_pool: ResourcePool) -> Dict[str, Any]:
    """Run a single agent execution cycle."""
    # Try to get data from cache
    cache_key = f"market_data:{self.symbol}:{self.timeframe}"
    market_data = await resource_pool.cache_get(cache_key)
    
    if market_data is None:
        # Data not in cache, fetch it
        status, market_data = await resource_pool.http_request(
            method="GET",
            url=f"https://api.example.com/market/{self.symbol}/{self.timeframe}",
            api_name="example"
        )
        
        if status == 200:
            # Cache the data
            await resource_pool.cache_set(
                key=cache_key,
                value=market_data,
                ttl=300,  # 5 minutes
                tags=["market_data", self.symbol, self.timeframe]
            )
        else:
            logger.error(f"Error fetching market data: {market_data}")
            return {"error": "Failed to fetch market data"}
    
    # Process the data
    # ...
    
    return {"processed": True}
```

## Monitoring

### Cache Statistics

```python
# Get cache statistics
stats = await resource_pool.get_stats()

print(f"Memory cache size: {stats['advanced_cache']['memory_size']}")
print(f"Memory cache hit rate: {stats['advanced_cache']['memory_hit_rate']:.2%}")
print(f"Disk cache size: {stats['advanced_cache']['disk_size']} bytes")
print(f"Disk cache hit rate: {stats['advanced_cache']['disk_hit_rate']:.2%}")
print(f"Combined hit rate: {stats['combined_cache_hit_rate']:.2%}")
```

### Preloader Statistics

```python
# Get preloader statistics
stats = await resource_pool.get_preloader_stats()

print(f"Preload tasks: {stats['tasks']}")
print(f"Running tasks: {stats['running_tasks']}")
print(f"Preload count: {stats['preload_count']}")
print(f"Preload error count: {stats['preload_error_count']}")

# Print task-specific stats
for name, task_stats in stats["task_stats"].items():
    print(f"Task {name}:")
    print(f"  Enabled: {task_stats['enabled']}")
    print(f"  Interval: {task_stats['interval']}s")
    print(f"  Last run: {task_stats['last_run']}")
    print(f"  Error count: {task_stats['error_count']}")
```

## Troubleshooting

### Cache Miss Issues

If you're experiencing high cache miss rates:

1. Check that TTL values are appropriate for the data volatility.
2. Verify that cache keys are consistent across the application.
3. Consider preloading frequently accessed data.
4. Check for unnecessary cache invalidation.

### Disk Cache Issues

If you're experiencing issues with the disk cache:

1. Check that the cache directory exists and is writable.
2. Verify that there's enough disk space.
3. Check for file permission issues.
4. Consider disabling the disk cache if not needed.

### Preloader Issues

If preload tasks are failing:

1. Check the logs for error messages.
2. Verify that the loader function is working correctly.
3. Check that the API endpoints are accessible.
4. Consider reducing the preload interval if the API has rate limits.
