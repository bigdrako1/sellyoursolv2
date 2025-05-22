# Execution Engine Integration Guide

## Overview

This guide explains how to integrate the Execution Engine with the existing trading agents system. The Execution Engine optimizes agent execution by centralizing task scheduling, sharing resources, and prioritizing critical operations.

## Integration Steps

### 1. Update Agent Registry

The `AgentRegistry` class has been updated to use the Execution Engine:

```python
from core.execution_engine import ExecutionEngine, TaskPriority

class AgentRegistry:
    _instance = None
    _execution_engine = None
    
    @classmethod
    def get_instance(cls):
        """Get or create the singleton instance."""
        if cls._instance is None:
            cls._instance = AgentRegistry()
        return cls._instance
    
    @classmethod
    def get_execution_engine(cls):
        """Get the execution engine."""
        if cls._instance is None:
            return None
        return cls._instance._execution_engine

    def __init__(self):
        """Initialize the agent registry."""
        self.agents = {}
        self._execution_engine = ExecutionEngine()
```

### 2. Start and Stop Methods

The registry now includes methods to start and stop the execution engine:

```python
async def start(self):
    """Start the registry and execution engine."""
    logger.info("Starting agent registry and execution engine")
    await self._execution_engine.start()
    logger.info("Agent registry and execution engine started")
    
async def stop(self):
    """Stop the registry and execution engine."""
    logger.info("Stopping agent registry and execution engine")
    
    # Stop all agents first
    await self.stop_all_agents()
    
    # Then stop the execution engine
    await self._execution_engine.stop()
    
    logger.info("Agent registry and execution engine stopped")
```

### 3. Agent Start and Stop Methods

The agent start and stop methods now use the execution engine:

```python
async def start_agent(self, agent_id: str) -> Dict[str, Any]:
    """Start an agent."""
    # Check if agent_id exists
    if agent_id not in self.agents:
        raise ValueError(f"Agent with ID {agent_id} does not exist")

    agent = self.agents[agent_id]

    try:
        # Start the agent
        await agent.start()
        
        # Schedule the first cycle if the agent is running
        if agent.status == AgentStatus.RUNNING:
            await self._execution_engine.schedule_agent_cycle(agent)
            logger.info(f"Scheduled first cycle for agent {agent_id}")
            
        return {"success": True, "status": agent.status.value}
    except Exception as e:
        logger.error(f"Error starting agent {agent_id}: {str(e)}")
        return {"success": False, "error": str(e), "status": agent.status.value}
```

### 4. API Routes

The API routes have been updated to use the singleton registry instance:

```python
async def get_agent_registry() -> AgentRegistry:
    """Get the agent registry."""
    # Get the singleton instance
    return AgentRegistry.get_instance()
```

### 5. Application Startup

The application startup code initializes the execution engine:

```python
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("Initializing services...")
    
    try:
        # Initialize database
        await initialize_database()
        
        # Initialize and start agent registry
        registry = AgentRegistry.get_instance()
        await registry.start()
        
        # Configure execution engine
        execution_engine = registry.get_execution_engine()
        execution_engine.max_concurrent_tasks = 20
        execution_engine.task_timeout_multiplier = 1.5
        
        # Configure resource pool
        resource_pool = execution_engine.resource_pool
        resource_pool.http_pool_size = 30
        resource_pool.cache_ttl = 120
        
        # Configure adaptive scheduler
        scheduler = execution_engine.scheduler
        scheduler.market_weight = 0.5
        scheduler.performance_weight = 0.3
        scheduler.system_weight = 0.2
        
        logger.info("Services initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing services: {str(e)}")
```

## Agent Implementation

Agents need to implement the `_run_cycle` method to work with the execution engine:

```python
async def _run_cycle(self, resource_pool: ResourcePool) -> Dict[str, Any]:
    """
    Run a single agent execution cycle.
    
    Args:
        resource_pool: Shared resource pool
        
    Returns:
        Cycle results
    """
    # Use the resource pool for API requests
    status, data = await resource_pool.http_request(
        method="GET",
        url="https://api.example.com/data",
        api_name="example",
        rate_limit=60
    )
    
    # Process data
    # ...
    
    return {"processed_items": len(data)}
```

## Configuration Options

### Execution Engine Configuration

```python
# Configure execution engine
execution_engine = registry.get_execution_engine()
execution_engine.max_concurrent_tasks = 20  # Maximum concurrent tasks
execution_engine.task_timeout_multiplier = 1.5  # Timeout multiplier
```

### Resource Pool Configuration

```python
# Configure resource pool
resource_pool = execution_engine.resource_pool
resource_pool.http_pool_size = 30  # HTTP client pool size
resource_pool.cache_ttl = 120  # Cache TTL in seconds
```

### Adaptive Scheduler Configuration

```python
# Configure adaptive scheduler
scheduler = execution_engine.scheduler
scheduler.market_weight = 0.5  # Weight for market conditions
scheduler.performance_weight = 0.3  # Weight for performance metrics
scheduler.system_weight = 0.2  # Weight for system load
```

## Task Scheduling

### Scheduling Agent Cycles

The execution engine automatically schedules agent cycles when an agent is started:

```python
# Schedule the first cycle if the agent is running
if agent.status == AgentStatus.RUNNING:
    await self._execution_engine.schedule_agent_cycle(agent)
```

Agents can also schedule their own cycles:

```python
async def _run_cycle(self, resource_pool: ResourcePool) -> Dict[str, Any]:
    # ... agent logic ...
    
    # Schedule the next cycle
    from core.agent_registry import AgentRegistry
    execution_engine = AgentRegistry.get_execution_engine()
    
    if execution_engine:
        # Schedule the next cycle with a delay
        await execution_engine.schedule_agent_cycle(
            agent=self,
            priority=TaskPriority.NORMAL,
            delay=60.0  # 1 minute delay
        )
    
    return {"result": "success"}
```

### Scheduling Custom Tasks

Agents can schedule custom tasks:

```python
async def _run_cycle(self, resource_pool: ResourcePool) -> Dict[str, Any]:
    # ... agent logic ...
    
    # Schedule a custom task
    from core.agent_registry import AgentRegistry
    execution_engine = AgentRegistry.get_execution_engine()
    
    if execution_engine:
        await execution_engine.schedule_task(
            agent_id=self.agent_id,
            task_type="check_positions",
            coroutine=self._check_positions_task,
            priority=TaskPriority.HIGH,
            delay=30.0,  # 30 second delay
            timeout=60.0  # 1 minute timeout
        )
    
    return {"result": "success"}
```

## Resource Pool Usage

### Making HTTP Requests

```python
async def _run_cycle(self, resource_pool: ResourcePool) -> Dict[str, Any]:
    # Make an HTTP request
    status, data = await resource_pool.http_request(
        method="GET",
        url="https://api.example.com/data",
        api_name="example",
        rate_limit=60  # 60 requests per minute
    )
    
    return {"status": status, "data": data}
```

### Using the Cache

```python
async def _run_cycle(self, resource_pool: ResourcePool) -> Dict[str, Any]:
    # Try to get data from cache
    cache_key = "market_data:BTC"
    cached_data = await resource_pool.cache_get(cache_key)
    
    if cached_data is None:
        # Data not in cache, fetch it
        status, data = await resource_pool.http_request(
            method="GET",
            url="https://api.example.com/market/BTC",
            api_name="example"
        )
        
        # Cache the data
        await resource_pool.cache_set(cache_key, data, ttl=300)  # 5 minute TTL
    else:
        # Use cached data
        data = cached_data
    
    return {"data": data}
```

## Monitoring

### Execution Engine Statistics

```python
# Get execution engine stats
execution_engine = AgentRegistry.get_execution_engine()
stats = execution_engine.get_stats()

print(f"Running: {stats['running']}")
print(f"Queued tasks: {stats['queued_tasks']}")
print(f"Running tasks: {stats['running_tasks']}")
print(f"Agents tracked: {stats['agents_tracked']}")
```

### Resource Pool Statistics

```python
# Get resource pool stats
resource_pool = execution_engine.resource_pool
stats = resource_pool.get_stats()

print(f"HTTP clients: {stats['http_clients']}")
print(f"HTTP requests: {stats['http_requests']}")
print(f"HTTP error rate: {stats['http_error_rate']:.2%}")
print(f"Cache size: {stats['cache_size']}")
print(f"Cache hit rate: {stats['cache_hit_rate']:.2%}")
```

### Scheduler Statistics

```python
# Get scheduler stats
scheduler = execution_engine.scheduler
stats = scheduler.get_stats()

print(f"Agents tracked: {stats['agents_tracked']}")
print(f"Interval adjustments: {stats['interval_adjustments']}")
```

## Best Practices

1. **Use the Resource Pool**: Always use the resource pool for external API calls and caching.

2. **Implement _run_cycle**: Make sure all agents implement the `_run_cycle` method.

3. **Handle Errors**: Catch and log exceptions in your agent code.

4. **Use Appropriate Priorities**: Use the right priority level for different tasks:
   - `CRITICAL`: Time-sensitive operations like stop loss checks
   - `HIGH`: Important operations that should run soon
   - `NORMAL`: Regular agent cycles
   - `LOW`: Background tasks
   - `IDLE`: Maintenance tasks

5. **Limit Task Duration**: Keep tasks short and focused. For long-running operations, break them into smaller tasks.

6. **Monitor Performance**: Track execution times and adjust configurations as needed.

## Troubleshooting

### Agent Not Running Cycles

If an agent is not running cycles:

1. Check that the agent is in the `RUNNING` state.
2. Verify that the first cycle was scheduled when the agent was started.
3. Check that the `_run_cycle` method is implemented correctly.
4. Look for errors in the agent logs.

### Execution Engine Not Starting

If the execution engine fails to start:

1. Check the application logs for errors.
2. Verify that the `start` method is called during application startup.
3. Check that the execution engine is properly configured.

### Resource Pool Errors

If there are errors with the resource pool:

1. Check that API endpoints are accessible.
2. Verify that rate limits are set correctly.
3. Check for network connectivity issues.
4. Look for errors in the resource pool logs.
