# Database Optimization Documentation

## Overview

This document describes the database optimization implemented for the trading agents system. The optimization focuses on improving performance for high-frequency trading operations, efficient storage of time-series data, and proper indexing for common query patterns.

## Key Features

- **TimescaleDB Integration**: Optimized storage and querying of time-series data
- **Efficient Indexing**: Strategic indexes for common query patterns
- **Data Partitioning**: Automatic partitioning of historical data
- **Retention Policies**: Automatic cleanup of old data
- **Connection Pooling**: Efficient management of database connections
- **Query Optimization**: Optimized queries for common operations

## Database Schema

The database schema is designed to efficiently store and retrieve trading agent data:

### Core Tables

1. **agents**: Stores agent metadata and configuration
2. **agent_metrics**: Stores agent performance metrics (time-series)
3. **agent_logs**: Stores agent log messages (time-series)
4. **positions**: Stores agent trading positions
5. **market_data**: Stores token market data (time-series)
6. **wallet_transactions**: Stores wallet transactions (time-series)
7. **trending_tokens**: Stores trending token data

### Views

1. **agent_status_view**: Combines agent data with latest metrics
2. **agent_positions_view**: Combines position data with agent information

## TimescaleDB Integration

TimescaleDB is used to optimize time-series data storage and querying:

```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert agent_metrics to a hypertable
SELECT create_hypertable('agent_metrics', 'timestamp');

-- Convert agent_logs to a hypertable
SELECT create_hypertable('agent_logs', 'timestamp');

-- Convert market_data to a hypertable
SELECT create_hypertable('market_data', 'timestamp');

-- Convert wallet_transactions to a hypertable
SELECT create_hypertable('wallet_transactions', 'timestamp');
```

Benefits of TimescaleDB:
- Automatic partitioning of time-series data
- Efficient time-range queries
- Optimized data compression
- Time-bucket aggregation for analytics

## Indexing Strategy

Strategic indexes are created for common query patterns:

```sql
-- Index for filtering agents by type
CREATE INDEX idx_agents_agent_type ON agents(agent_type);

-- Index for filtering agents by status
CREATE INDEX idx_agents_status ON agents(status);

-- Index for efficient time-series queries on agent metrics
CREATE INDEX idx_agent_metrics_agent_id_timestamp ON agent_metrics(agent_id, timestamp DESC);

-- Index for filtering agent logs by level
CREATE INDEX idx_agent_logs_level ON agent_logs(level);

-- Index for filtering positions by token
CREATE INDEX idx_positions_token_address ON positions(token_address);

-- Index for efficient time-series queries on market data
CREATE INDEX idx_market_data_token_address_timestamp ON market_data(token_address, timestamp DESC);
```

## Retention Policies

Automatic retention policies are implemented to manage data growth:

```sql
-- Apply retention policies
SELECT create_retention_policy('agent_metrics', '30 days');
SELECT create_retention_policy('agent_logs', '30 days');
SELECT create_retention_policy('market_data', '90 days');
SELECT create_retention_policy('wallet_transactions', '90 days');
```

## Connection Pooling

The database module implements connection pooling to efficiently manage database connections:

```python
self._pool = await asyncpg.create_pool(
    host=DB_HOST,
    port=DB_PORT,
    database=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD,
    min_size=5,
    max_size=20,
    command_timeout=60,
    statement_cache_size=100,
    max_cached_statement_lifetime=300,
    max_inactive_connection_lifetime=300
)
```

Benefits of connection pooling:
- Reduced connection overhead
- Efficient resource utilization
- Automatic connection management
- Statement caching for improved performance

## Repository Pattern

The database module implements the repository pattern to provide a clean API for data access:

- **AgentRepository**: Manages agent data
- **PositionRepository**: Manages position data
- **MarketRepository**: Manages market data

This pattern provides:
- Separation of concerns
- Testable data access code
- Consistent error handling
- Centralized query logic

## Query Optimization

Queries are optimized for common operations:

### Time-Bucket Aggregation

```sql
SELECT
    time_bucket('1 hour', timestamp) AS time,
    FIRST(price, timestamp) AS open,
    MAX(price) AS high,
    MIN(price) AS low,
    LAST(price, timestamp) AS close,
    AVG(volume_24h) AS volume
FROM market_data
WHERE token_address = $1
AND timestamp >= $2
AND timestamp <= $3
GROUP BY time
ORDER BY time DESC
```

### Efficient Joins

```sql
SELECT 
    p.*,
    a.name AS agent_name,
    a.agent_type
FROM positions p
JOIN agents a ON p.agent_id = a.agent_id
WHERE p.status = 'open'
```

### Aggregation Functions

```sql
SELECT
    COALESCE(SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END), 0) AS total_profit,
    COALESCE(SUM(CASE WHEN profit_loss < 0 THEN -profit_loss ELSE 0 END), 0) AS total_loss,
    COALESCE(SUM(profit_loss), 0) AS net_pnl
FROM positions
WHERE agent_id = $1 AND status = 'closed'
```

## Integration Guide

### 1. Database Setup

1. Install PostgreSQL and TimescaleDB:

```bash
# Install PostgreSQL
sudo apt-get install postgresql

# Install TimescaleDB
sudo apt-get install timescaledb-postgresql-13

# Enable TimescaleDB
sudo timescaledb-tune
```

2. Create the database:

```bash
createdb trading_agents
```

3. Apply the schema:

```bash
psql -d trading_agents -f trading_agents/database/schema.sql
```

### 2. Application Integration

1. Update the configuration:

```python
# config/settings.py
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "trading_agents")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
```

2. Initialize the database in the application startup:

```python
# app.py
from database import initialize_database, close_database

async def startup():
    await initialize_database()

async def shutdown():
    await close_database()
```

3. Use the repositories in your services:

```python
from database import get_agent_repository, get_position_repository, get_market_repository

async def get_agent(agent_id):
    agent_repo = get_agent_repository()
    return await agent_repo.get_agent(agent_id)
```

## Usage Examples

### Agent Repository

```python
# Get agent repository
agent_repo = get_agent_repository()

# Create an agent
agent = await agent_repo.create_agent(
    agent_id="copy_trading_1",
    agent_type="copy_trading",
    name="My Copy Trading Agent",
    config={"tracked_wallets": ["wallet1", "wallet2"]}
)

# Get an agent
agent = await agent_repo.get_agent("copy_trading_1")

# Update agent status
await agent_repo.update_agent_status("copy_trading_1", "running")

# Add agent log
await agent_repo.add_agent_log(
    agent_id="copy_trading_1",
    level="info",
    message="Agent started successfully"
)

# Add agent metric
await agent_repo.add_agent_metric(
    agent_id="copy_trading_1",
    metric_name="positions_count",
    metric_value=5,
    metric_type="gauge"
)
```

### Position Repository

```python
# Get position repository
position_repo = get_position_repository()

# Create a position
position = await position_repo.create_position(
    agent_id="copy_trading_1",
    token_address="token123",
    token_symbol="TKN",
    token_name="Test Token",
    entry_price=1.0,
    amount=10.0
)

# Update position price
await position_repo.update_position_price(
    position_id=position["id"],
    current_price=1.1
)

# Close position
await position_repo.close_position(
    position_id=position["id"],
    close_price=1.2,
    close_reason="take_profit"
)

# Get agent profit/loss
pnl = await position_repo.get_agent_profit_loss("copy_trading_1")
```

### Market Repository

```python
# Get market repository
market_repo = get_market_repository()

# Add market data
await market_repo.add_market_data(
    token_address="token123",
    price=1.0,
    volume_24h=1000.0,
    market_cap=1000000.0
)

# Get market data history
history = await market_repo.get_market_data_history(
    token_address="token123",
    interval="1h",
    limit=24
)

# Add trending token
await market_repo.add_trending_token(
    token_address="token123",
    score=0.8,
    token_symbol="TKN",
    token_name="Test Token"
)
```

## Performance Considerations

### Connection Pool Sizing

The connection pool size should be adjusted based on the expected load:

```python
min_size=5,  # Minimum connections to keep open
max_size=20  # Maximum connections to allow
```

For high-load environments, increase the `max_size` value.

### Query Timeout

Set appropriate timeouts for queries to prevent long-running queries from blocking resources:

```python
await db.fetch(query, *args, timeout=10.0)  # 10-second timeout
```

### Batch Operations

Use batch operations for inserting or updating multiple records:

```python
async def add_metrics_batch(agent_id, metrics):
    async with db.transaction() as conn:
        for metric in metrics:
            await conn.execute(
                "INSERT INTO agent_metrics (...) VALUES (...)",
                agent_id, metric["name"], metric["value"], ...
            )
```

### Index Maintenance

Regularly maintain indexes to ensure optimal performance:

```sql
VACUUM ANALYZE agent_metrics;
REINDEX TABLE agent_metrics;
```

## Monitoring and Maintenance

### Database Statistics

Monitor database statistics to identify performance issues:

```sql
-- Table statistics
SELECT relname, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Index usage
SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Query performance
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

### Maintenance Tasks

Schedule regular maintenance tasks:

1. **Vacuum**: Remove dead tuples and reclaim space
2. **Analyze**: Update statistics for the query planner
3. **Reindex**: Rebuild indexes to improve performance

```sql
-- Automated maintenance
CREATE EXTENSION pg_cron;
SELECT cron.schedule('0 0 * * *', 'VACUUM ANALYZE');
```

## Conclusion

The database optimization implemented for the trading agents system provides significant performance improvements for high-frequency trading operations. By using TimescaleDB for time-series data, implementing efficient indexing strategies, and optimizing queries, the system can handle large volumes of data with minimal latency.
