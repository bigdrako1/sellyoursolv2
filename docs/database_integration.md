# Database Integration Guide

## Overview

This guide explains how to integrate the optimized database layer with the existing trading agents system. The database integration provides persistent storage for agents, positions, and market data, improving reliability and enabling advanced queries.

## Integration Steps

### 1. Update Agent Registry

The `AgentRegistry` class has been updated to use the database repositories:

```python
from database import get_agent_repository, get_position_repository, get_market_repository

class AgentRegistry:
    # ... existing code ...
    
    async def register_agent(self, agent_type: str, agent_id: str, config: Dict[str, Any]) -> BaseAgent:
        """Register a new agent."""
        # Check if agent_id already exists
        if agent_id in self.agents:
            raise ValueError(f"Agent with ID {agent_id} already exists")

        try:
            # Get agent repository
            agent_repo = get_agent_repository()
            
            # Create agent in database
            agent_data = await agent_repo.create_agent(
                agent_id=agent_id,
                agent_type=agent_type,
                name=config.get("name", f"{agent_type.capitalize()} Agent"),
                config=config
            )
            
            # Get agent class
            agent_class = self._get_agent_class(agent_type)
            
            # Create agent instance
            agent = agent_class(agent_id, config)
            
            # Store agent
            self.agents[agent_id] = agent
            
            logger.info(f"Registered agent {agent_id} of type {agent_type}")
            
            return agent
            
        except Exception as e:
            logger.error(f"Error registering agent {agent_id}: {str(e)}")
            raise
```

### 2. Agent Lifecycle Methods

The agent lifecycle methods (start, stop, unregister) have been updated to use the database:

```python
async def start_agent(self, agent_id: str) -> Dict[str, Any]:
    """Start an agent."""
    # ... existing code ...
    
    try:
        # Start the agent
        await agent.start()
        
        # Update agent status in database
        agent_repo = get_agent_repository()
        await agent_repo.update_agent_status(agent_id, agent.status.value)
        
        # Add log entry
        await agent_repo.add_agent_log(
            agent_id=agent_id,
            level="info",
            message=f"Agent started with status {agent.status.value}"
        )
        
        # ... existing code ...
    except Exception as e:
        # ... existing code ...
```

### 3. Query Methods

New query methods have been added to retrieve data from the database:

```python
async def get_agents(
    self, 
    agent_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> Dict[str, Any]:
    """Get all registered agents, optionally filtered by type and status."""
    try:
        # Get agent repository
        agent_repo = get_agent_repository()
        
        # Get agents from database
        agents_data, total = await agent_repo.get_agents(
            agent_type=agent_type,
            status=status,
            limit=limit,
            offset=offset
        )
        
        # Return database results directly
        return {
            "agents": agents_data,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        # Fall back to in-memory registry if database fails
        # ... fallback code ...
```

### 4. API Routes

The API routes have been updated to use the new database-backed methods:

```python
@router.get("/", response_model=AgentListResponse)
async def get_agents(
    agent_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    registry: AgentRegistry = Depends(get_agent_registry)
):
    """Get all agents with optional filtering and pagination."""
    try:
        # Use the new get_agents method that uses the database
        result = await registry.get_agents(
            agent_type=agent_type,
            status=status,
            limit=limit,
            offset=offset
        )
        
        # Return the result directly
        return {
            "agents": result["agents"],
            "total": result["total"]
        }
    except Exception as e:
        # ... error handling ...
```

## Database Repositories

### Agent Repository

The `AgentRepository` provides methods for managing agents in the database:

```python
class AgentRepository:
    """Repository for agent data."""
    
    def __init__(self, db):
        """Initialize the repository."""
        self.db = db
        
    async def create_agent(self, agent_id, agent_type, name, config):
        """Create a new agent."""
        # ... implementation ...
        
    async def get_agent(self, agent_id):
        """Get an agent by ID."""
        # ... implementation ...
        
    async def update_agent(self, agent_id, updates):
        """Update an agent."""
        # ... implementation ...
        
    async def delete_agent(self, agent_id):
        """Delete an agent."""
        # ... implementation ...
        
    async def get_agents(self, agent_type=None, status=None, limit=100, offset=0):
        """Get all agents, optionally filtered."""
        # ... implementation ...
        
    async def update_agent_status(self, agent_id, status):
        """Update an agent's status."""
        # ... implementation ...
        
    async def add_agent_log(self, agent_id, level, message):
        """Add a log entry for an agent."""
        # ... implementation ...
        
    async def get_agent_logs(self, agent_id, level=None, limit=100, offset=0):
        """Get logs for an agent."""
        # ... implementation ...
```

### Position Repository

The `PositionRepository` provides methods for managing trading positions:

```python
class PositionRepository:
    """Repository for position data."""
    
    def __init__(self, db):
        """Initialize the repository."""
        self.db = db
        
    async def create_position(self, position_data):
        """Create a new position."""
        # ... implementation ...
        
    async def get_position(self, position_id):
        """Get a position by ID."""
        # ... implementation ...
        
    async def update_position(self, position_id, updates):
        """Update a position."""
        # ... implementation ...
        
    async def close_position(self, position_id, close_data):
        """Close a position."""
        # ... implementation ...
        
    async def get_positions(self, agent_id=None, status=None, limit=100, offset=0):
        """Get all positions, optionally filtered."""
        # ... implementation ...
```

### Market Repository

The `MarketRepository` provides methods for managing market data:

```python
class MarketRepository:
    """Repository for market data."""
    
    def __init__(self, db):
        """Initialize the repository."""
        self.db = db
        
    async def save_market_data(self, symbol, timeframe, data):
        """Save market data."""
        # ... implementation ...
        
    async def get_market_data(self, symbol, timeframe, start_time=None, end_time=None, limit=1000):
        """Get market data."""
        # ... implementation ...
        
    async def get_latest_market_data(self, symbol, timeframe, limit=1):
        """Get latest market data."""
        # ... implementation ...
```

## Database Schema

### Agents Table

```sql
CREATE TABLE agents (
    agent_id TEXT PRIMARY KEY,
    agent_type TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'stopped',
    config JSONB NOT NULL,
    metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Agent Logs Table

```sql
CREATE TABLE agent_logs (
    id SERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(agent_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    level TEXT NOT NULL,
    message TEXT NOT NULL
);
```

### Positions Table

```sql
CREATE TABLE positions (
    position_id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(agent_id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL,
    entry_price NUMERIC NOT NULL,
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    size NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    exit_price NUMERIC,
    exit_time TIMESTAMP WITH TIME ZONE,
    profit_loss NUMERIC,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Market Data Table

```sql
CREATE TABLE market_data (
    id SERIAL PRIMARY KEY,
    symbol TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open NUMERIC NOT NULL,
    high NUMERIC NOT NULL,
    low NUMERIC NOT NULL,
    close NUMERIC NOT NULL,
    volume NUMERIC NOT NULL,
    UNIQUE(symbol, timeframe, timestamp)
);
```

## Best Practices

1. **Error Handling**: Always include error handling when interacting with the database. The registry methods include fallbacks to in-memory data if the database fails.

2. **Transactions**: Use transactions for operations that modify multiple tables to ensure data consistency.

3. **Connection Pooling**: The database layer uses connection pooling to efficiently manage database connections.

4. **Pagination**: Always use pagination for queries that may return large result sets.

5. **Indexing**: The database schema includes indexes on frequently queried columns to improve performance.

6. **Logging**: Log database errors to help with debugging and monitoring.

7. **Validation**: Validate data before inserting or updating it in the database.

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Check that the database is running and accessible.
2. Verify that the connection string is correct.
3. Check for network issues between the application and the database.
4. Verify that the database user has the necessary permissions.

### Query Performance Issues

If queries are slow:

1. Check that indexes are being used (use EXPLAIN ANALYZE).
2. Optimize queries to use indexes effectively.
3. Consider adding additional indexes for frequently used queries.
4. Use pagination to limit the number of results returned.

### Data Consistency Issues

If you encounter data consistency issues:

1. Check that transactions are being used for operations that modify multiple tables.
2. Verify that foreign key constraints are being enforced.
3. Check for race conditions in concurrent operations.
4. Use optimistic locking for operations that may conflict.
