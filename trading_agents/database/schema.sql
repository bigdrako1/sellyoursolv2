-- Database schema for trading agents

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable TimescaleDB extension for time-series data
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create schema for trading agents
CREATE SCHEMA IF NOT EXISTS trading_agents;

-- Set search path
SET search_path TO trading_agents, public;

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id VARCHAR(255) NOT NULL UNIQUE,
    agent_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on agent_type for filtering
CREATE INDEX IF NOT EXISTS idx_agents_agent_type ON agents(agent_type);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

-- Agent metrics table (time-series data)
CREATE TABLE IF NOT EXISTS agent_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metric_name VARCHAR(255) NOT NULL,
    metric_value DOUBLE PRECISION,
    metric_value_str TEXT,
    metric_type VARCHAR(50) NOT NULL,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE
);

-- Convert agent_metrics to a hypertable
SELECT create_hypertable('agent_metrics', 'timestamp', if_not_exists => TRUE);

-- Create index on agent_id and timestamp for efficient queries
CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_id_timestamp ON agent_metrics(agent_id, timestamp DESC);

-- Create index on metric_name for filtering
CREATE INDEX IF NOT EXISTS idx_agent_metrics_metric_name ON agent_metrics(metric_name);

-- Agent logs table (time-series data)
CREATE TABLE IF NOT EXISTS agent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE
);

-- Convert agent_logs to a hypertable
SELECT create_hypertable('agent_logs', 'timestamp', if_not_exists => TRUE);

-- Create index on agent_id and timestamp for efficient queries
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_id_timestamp ON agent_logs(agent_id, timestamp DESC);

-- Create index on level for filtering
CREATE INDEX IF NOT EXISTS idx_agent_logs_level ON agent_logs(level);

-- Positions table (for tracking agent positions)
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id VARCHAR(255) NOT NULL,
    token_address VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(50),
    token_name VARCHAR(255),
    entry_price DOUBLE PRECISION NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    current_price DOUBLE PRECISION,
    price_change DOUBLE PRECISION,
    status VARCHAR(50) NOT NULL,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    close_reason VARCHAR(50),
    profit_loss DOUBLE PRECISION,
    metadata JSONB,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE
);

-- Create index on agent_id for filtering
CREATE INDEX IF NOT EXISTS idx_positions_agent_id ON positions(agent_id);

-- Create index on token_address for filtering
CREATE INDEX IF NOT EXISTS idx_positions_token_address ON positions(token_address);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);

-- Create index on opened_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_positions_opened_at ON positions(opened_at DESC);

-- Market data table (time-series data)
CREATE TABLE IF NOT EXISTS market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_address VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    price DOUBLE PRECISION,
    volume_24h DOUBLE PRECISION,
    market_cap DOUBLE PRECISION,
    liquidity DOUBLE PRECISION,
    holders_count INTEGER,
    metadata JSONB
);

-- Convert market_data to a hypertable
SELECT create_hypertable('market_data', 'timestamp', if_not_exists => TRUE);

-- Create index on token_address and timestamp for efficient queries
CREATE INDEX IF NOT EXISTS idx_market_data_token_address_timestamp ON market_data(token_address, timestamp DESC);

-- Wallet transactions table (time-series data)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(255) NOT NULL,
    transaction_hash VARCHAR(255) NOT NULL UNIQUE,
    timestamp TIMESTAMPTZ NOT NULL,
    token_address VARCHAR(255),
    token_symbol VARCHAR(50),
    token_name VARCHAR(255),
    amount DOUBLE PRECISION,
    price DOUBLE PRECISION,
    transaction_type VARCHAR(50),
    metadata JSONB
);

-- Convert wallet_transactions to a hypertable
SELECT create_hypertable('wallet_transactions', 'timestamp', if_not_exists => TRUE);

-- Create index on wallet_address and timestamp for efficient queries
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_address_timestamp ON wallet_transactions(wallet_address, timestamp DESC);

-- Create index on token_address for filtering
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_token_address ON wallet_transactions(token_address);

-- Create index on transaction_type for filtering
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_transaction_type ON wallet_transactions(transaction_type);

-- Trending tokens table
CREATE TABLE IF NOT EXISTS trending_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_address VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(50),
    token_name VARCHAR(255),
    score DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);

-- Create index on score for sorting
CREATE INDEX IF NOT EXISTS idx_trending_tokens_score ON trending_tokens(score DESC);

-- Create index on timestamp for time-based queries
CREATE INDEX IF NOT EXISTS idx_trending_tokens_timestamp ON trending_tokens(timestamp DESC);

-- Create a unique constraint on token_address to avoid duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_tokens_token_address ON trending_tokens(token_address);

-- Retention policy function for time-series data
CREATE OR REPLACE FUNCTION create_retention_policy(
    p_table_name TEXT,
    p_interval INTERVAL
)
RETURNS VOID AS $$
BEGIN
    EXECUTE format(
        'SELECT add_retention_policy(''%I'', INTERVAL ''%s'')',
        p_table_name,
        p_interval
    );
END;
$$ LANGUAGE plpgsql;

-- Apply retention policies
SELECT create_retention_policy('agent_metrics', '30 days');
SELECT create_retention_policy('agent_logs', '30 days');
SELECT create_retention_policy('market_data', '90 days');
SELECT create_retention_policy('wallet_transactions', '90 days');

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_agents_updated_at
BEFORE UPDATE ON agents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a function to clean up old trending tokens
CREATE OR REPLACE FUNCTION cleanup_trending_tokens()
RETURNS VOID AS $$
BEGIN
    DELETE FROM trending_tokens
    WHERE timestamp < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old trending tokens
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('0 0 * * *', 'SELECT cleanup_trending_tokens()');

-- Create a view for agent status with latest metrics
CREATE OR REPLACE VIEW agent_status_view AS
SELECT 
    a.agent_id,
    a.name,
    a.agent_type,
    a.status,
    a.config,
    a.created_at,
    a.updated_at,
    (
        SELECT jsonb_object_agg(am.metric_name, am.metric_value)
        FROM (
            SELECT DISTINCT ON (metric_name) 
                metric_name, 
                metric_value
            FROM agent_metrics
            WHERE agent_id = a.agent_id
            ORDER BY metric_name, timestamp DESC
        ) am
    ) AS metrics
FROM agents a;

-- Create a view for agent positions with latest data
CREATE OR REPLACE VIEW agent_positions_view AS
SELECT 
    p.*,
    a.name AS agent_name,
    a.agent_type
FROM positions p
JOIN agents a ON p.agent_id = a.agent_id
WHERE p.status = 'open';

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA trading_agents TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA trading_agents TO postgres;
