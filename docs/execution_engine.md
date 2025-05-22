# Execution Engine Documentation

## Overview

The Execution Engine is a centralized component that manages the scheduling and execution of agent tasks. It optimizes resource usage, prioritizes critical operations, and provides adaptive scheduling based on agent performance and system load.

## Key Features

- **Centralized Task Management**: Manages all agent execution cycles in a single place
- **Priority-Based Scheduling**: Executes tasks based on priority levels
- **Resource Pooling**: Shares resources between agents to reduce redundancy
- **Adaptive Scheduling**: Adjusts execution intervals based on performance metrics
- **Error Handling**: Provides robust error handling and timeout management
- **Health Monitoring**: Monitors system health and agent performance

## Architecture

The Execution Engine consists of the following components:

1. **ExecutionEngine**: The main class that manages task scheduling and execution
2. **ResourcePool**: Manages shared resources like API clients and caches
3. **AdaptiveScheduler**: Adjusts execution intervals based on performance metrics
4. **BaseAgent**: Updated to work with the execution engine

### Class Diagram

```
┌─────────────────┐     ┌─────────────────┐
│  ExecutionEngine│─────┤  ResourcePool   │
└─────────────────┘     └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐
│ AdaptiveScheduler│    │    BaseAgent    │
└─────────────────┘     └─────────────────┘
```

## Integration Guide

### 1. Update Agent Registry

The first step is to update the `AgentRegistry` class to use the execution engine:

```python
from core.execution_engine import ExecutionEngine, TaskPriority

class AgentRegistry:
    """Registry for managing agents."""
    
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
        """Initialize the registry."""
        self.agents = {}
        self._execution_engine = ExecutionEngine()
        
    async def start(self):
        """Start the registry and execution engine."""
        await self._execution_engine.start()
        
    async def stop(self):
        """Stop the registry and execution engine."""
        await self._execution_engine.stop()
        
    async def register_agent(self, agent_type, agent_id, config):
        """Register an agent."""
        # Create agent
        agent = AgentFactory.create_agent(agent_type, agent_id, config)
        
        # Add to registry
        self.agents[agent_id] = agent
        
        return agent
        
    async def start_agent(self, agent_id):
        """Start an agent."""
        if agent_id not in self.agents:
            raise ValueError(f"Agent {agent_id} not found")
            
        agent = self.agents[agent_id]
        
        # Start the agent
        await agent.start()
        
        # Schedule the first cycle
        if agent.status == AgentStatus.RUNNING:
            await self._execution_engine.schedule_agent_cycle(agent)
            
        return agent
        
    async def stop_agent(self, agent_id):
        """Stop an agent."""
        if agent_id not in self.agents:
            raise ValueError(f"Agent {agent_id} not found")
            
        agent = self.agents[agent_id]
        
        # Stop the agent
        await agent.stop()
        
        return agent
```

### 2. Update API Routes

Update the API routes to use the execution engine:

```python
@router.post("/{agent_id}/start")
async def start_agent(agent_id: str):
    """Start an agent."""
    try:
        registry = AgentRegistry.get_instance()
        agent = await registry.start_agent(agent_id)
        return agent.get_status()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 3. Update Agent Implementation

Update your agent implementations to work with the execution engine:

```python
class MyCopyTradingAgent(BaseAgent):
    # ... existing code ...
    
    async def _run_cycle(self, resource_pool):
        """Run a single agent execution cycle."""
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

### 4. Configure the Execution Engine

Configure the execution engine in your application startup:

```python
async def startup():
    """Application startup."""
    # Create and start agent registry
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
```

## Usage Examples

### Scheduling Agent Cycles

```python
# Get execution engine
registry = AgentRegistry.get_instance()
execution_engine = registry.get_execution_engine()

# Schedule agent cycle
await execution_engine.schedule_agent_cycle(agent, TaskPriority.NORMAL)
```

### Scheduling Custom Tasks

```python
# Define task function
async def check_market_conditions(resource_pool):
    # ... implementation ...
    return {"market_condition": "bullish"}

# Schedule task
await execution_engine.schedule_task(
    agent_id="market_monitor",
    task_type="market_check",
    coroutine=check_market_conditions,
    priority=TaskPriority.HIGH,
    delay=0.0,
    timeout=30.0
)
```

### Using the Resource Pool

```python
async def _run_cycle(self, resource_pool):
    # Make HTTP request
    status, data = await resource_pool.http_request(
        method="GET",
        url="https://api.example.com/data",
        api_name="example",
        rate_limit=60
    )
    
    # Use cache
    cache_key = "market_data:BTC"
    cached_data = await resource_pool.cache_get(cache_key)
    
    if cached_data is None:
        # Fetch and cache data
        data = await fetch_market_data()
        await resource_pool.cache_set(cache_key, data, ttl=300)
    else:
        data = cached_data
        
    return {"data": data}
```

## Configuration Options

### ExecutionEngine

| Option | Description | Default |
|--------|-------------|---------|
| `max_concurrent_tasks` | Maximum number of concurrent tasks | 10 |
| `task_timeout_multiplier` | Multiplier for task timeout values | 1.2 |
| `health_check_interval` | Interval for health checks (seconds) | 60 |

### ResourcePool

| Option | Description | Default |
|--------|-------------|---------|
| `http_pool_size` | Size of the HTTP client pool | 20 |
| `http_timeout` | HTTP request timeout (seconds) | 30 |
| `http_retry_count` | Number of retries for HTTP requests | 3 |
| `http_retry_delay` | Delay between retries (seconds) | 1.0 |
| `rate_limit_window` | Rate limit window (seconds) | 60 |
| `cache_ttl` | Default cache TTL (seconds) | 60 |
| `cache_max_size` | Maximum cache size | 10000 |

### AdaptiveScheduler

| Option | Description | Default |
|--------|-------------|---------|
| `min_interval` | Minimum execution interval (seconds) | 1.0 |
| `max_interval` | Maximum execution interval (seconds) | 3600.0 |
| `default_interval` | Default execution interval (seconds) | 60.0 |
| `market_weight` | Weight for market conditions | 0.4 |
| `performance_weight` | Weight for performance metrics | 0.4 |
| `system_weight` | Weight for system load | 0.2 |

## Best Practices

1. **Use Priority Levels Appropriately**:
   - `CRITICAL`: Use for time-sensitive operations like stop loss checks
   - `HIGH`: Use for important operations that should run soon
   - `NORMAL`: Use for regular agent cycles
   - `LOW`: Use for background tasks
   - `IDLE`: Use for maintenance tasks

2. **Optimize Resource Usage**:
   - Use the resource pool for all external API calls
   - Use caching for frequently accessed data
   - Respect rate limits for external APIs

3. **Handle Errors Properly**:
   - Catch and log exceptions in your agent code
   - Use appropriate error handling in task functions
   - Monitor error rates and adjust behavior accordingly

4. **Monitor Performance**:
   - Track execution times for agent cycles
   - Monitor resource usage
   - Adjust configuration based on performance metrics

## Troubleshooting

### Common Issues

1. **Task Timeouts**:
   - Check if the task is taking too long to execute
   - Increase the task timeout value
   - Optimize the task implementation

2. **Resource Exhaustion**:
   - Check if you're creating too many resources
   - Use the resource pool for shared resources
   - Increase resource pool sizes if needed

3. **Rate Limiting**:
   - Check if you're hitting API rate limits
   - Use rate limiting in resource pool
   - Adjust rate limits based on API documentation

4. **Memory Leaks**:
   - Check if resources are being properly closed
   - Use the resource pool's close method
   - Monitor memory usage over time

## Monitoring

The execution engine provides statistics that can be used for monitoring:

```python
# Get execution engine stats
stats = execution_engine.get_stats()

# Get resource pool stats
resource_stats = execution_engine.resource_pool.get_stats()

# Get scheduler stats
scheduler_stats = execution_engine.scheduler.get_stats()
```

These statistics can be exposed through an API endpoint or logged periodically for monitoring purposes.
