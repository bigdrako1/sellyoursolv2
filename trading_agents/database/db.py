"""
Database module for trading agents.

This module provides a database connection pool and functions for interacting with the database.
"""
import os
import logging
import asyncio
from typing import Dict, Any, List, Optional, Tuple, Union
import json
from datetime import datetime, timedelta
import asyncpg
from asyncpg.pool import Pool
import uuid
import random

# Try to import from config, but use environment variables if not available
try:
    from config.settings import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
except ImportError:
    DB_HOST = os.environ.get("DB_HOST", "localhost")
    DB_PORT = int(os.environ.get("DB_PORT", "5432"))
    DB_NAME = os.environ.get("DB_NAME", "trading_agents")
    DB_USER = os.environ.get("DB_USER", "postgres")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "postgres")

# Check if we should use mock database
USE_MOCK_DB = os.environ.get("USE_MOCK_DB", "true").lower() == "true"

logger = logging.getLogger(__name__)

class MockRecord(dict):
    """Mock record for the mock database."""

    def __getattr__(self, name):
        if name in self:
            return self[name]
        raise AttributeError(f"'Record' object has no attribute '{name}'")

class Database:
    """
    Database connection manager.

    This class manages a connection pool to the PostgreSQL database and provides
    methods for executing queries and transactions. It can also use a mock database
    for development and testing.
    """

    _instance = None
    _pool: Optional[Pool] = None
    _initialized = False
    _mock_data = {}

    @classmethod
    async def get_instance(cls) -> 'Database':
        """
        Get or create the singleton instance.

        Returns:
            Database instance
        """
        if cls._instance is None:
            cls._instance = Database()

        if not cls._initialized:
            await cls._instance._initialize()

        return cls._instance

    async def _initialize(self):
        """Initialize the database connection pool or mock database."""
        if self._initialized:
            return

        logger.info("Initializing database connection pool")

        if USE_MOCK_DB:
            # Initialize mock database
            self._initialize_mock_data()
            self._initialized = True
            logger.info("Mock database initialized")
            return

        try:
            # Create connection pool
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

            # Set schema search path
            async with self._pool.acquire() as conn:
                await conn.execute("SET search_path TO trading_agents, public")

            self._initialized = True
            logger.info("Database connection pool initialized")

        except Exception as e:
            logger.error(f"Error initializing database connection pool: {str(e)}")
            if USE_MOCK_DB:
                # Fall back to mock database
                self._initialize_mock_data()
                self._initialized = True
                logger.info("Falling back to mock database")
            else:
                raise

    def _initialize_mock_data(self):
        """Initialize mock data for development and testing."""
        # Create mock tables
        self._mock_data = {
            "agents": [],
            "agent_types": [],
            "markets": [],
            "orders": [],
            "positions": [],
            "users": [],
            "notifications": []
        }

        # Add some mock data
        self._add_mock_agent_types()
        self._add_mock_agents()
        self._add_mock_markets()
        self._add_mock_orders()
        self._add_mock_positions()
        self._add_mock_users()
        self._add_mock_notifications()

    def _add_mock_agent_types(self):
        """Add mock agent types."""
        self._mock_data["agent_types"] = [
            {
                "id": "type1",
                "name": "Trend Following",
                "description": "Follows market trends using technical indicators",
                "parameters": {
                    "timeframe": "1h",
                    "indicators": ["sma", "ema", "macd"],
                    "risk_level": "medium"
                },
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            },
            {
                "id": "type2",
                "name": "Mean Reversion",
                "description": "Trades based on price reversion to the mean",
                "parameters": {
                    "timeframe": "15m",
                    "indicators": ["bollinger", "rsi", "stoch"],
                    "risk_level": "medium"
                },
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            },
            {
                "id": "type3",
                "name": "Reinforcement Learning",
                "description": "Uses reinforcement learning to make trading decisions",
                "parameters": {
                    "model": "dqn",
                    "state_size": 10,
                    "action_size": 3,
                    "risk_level": "high"
                },
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
        ]

    def _add_mock_agents(self):
        """Add mock agents."""
        self._mock_data["agents"] = [
            {
                "id": "agent1",
                "name": "BTC Trend Follower",
                "type": "type1",
                "status": "running",
                "config": {
                    "exchange_id": "binance",
                    "symbols": ["BTC/USDT"],
                    "model_id": "trend_follower_v1",
                    "trade_enabled": True
                },
                "metrics": {
                    "return_pct": 12.5,
                    "win_rate": 65.2,
                    "trades_count": 42,
                    "profit_factor": 1.8,
                    "max_drawdown": 5.2,
                    "sharpe_ratio": 1.2,
                    "last_updated": datetime.now().isoformat()
                },
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            },
            {
                "id": "agent2",
                "name": "ETH Mean Reversion",
                "type": "type2",
                "status": "stopped",
                "config": {
                    "exchange_id": "binance",
                    "symbols": ["ETH/USDT"],
                    "model_id": "mean_reversion_v1",
                    "trade_enabled": False
                },
                "metrics": {
                    "return_pct": 8.3,
                    "win_rate": 58.7,
                    "trades_count": 27,
                    "profit_factor": 1.5,
                    "max_drawdown": 7.1,
                    "sharpe_ratio": 0.9,
                    "last_updated": datetime.now().isoformat()
                },
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            },
            {
                "id": "agent3",
                "name": "Multi-Asset RL",
                "type": "type3",
                "status": "running",
                "config": {
                    "exchange_id": "binance",
                    "symbols": ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
                    "model_id": "rl_portfolio_v1",
                    "trade_enabled": True
                },
                "metrics": {
                    "return_pct": 15.7,
                    "win_rate": 62.1,
                    "trades_count": 63,
                    "profit_factor": 2.1,
                    "max_drawdown": 8.5,
                    "sharpe_ratio": 1.4,
                    "last_updated": datetime.now().isoformat()
                },
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
        ]

    def _add_mock_markets(self):
        """Add mock markets."""
        self._mock_data["markets"] = [
            {
                "symbol": "BTC/USDT",
                "base": "BTC",
                "quote": "USDT",
                "price": 30245.50,
                "change_24h": 2.5,
                "volume_24h": 1250000000.0,
                "high_24h": 30500.0,
                "low_24h": 29800.0,
                "last_updated": datetime.now().isoformat()
            },
            {
                "symbol": "ETH/USDT",
                "base": "ETH",
                "quote": "USDT",
                "price": 1875.25,
                "change_24h": 1.2,
                "volume_24h": 750000000.0,
                "high_24h": 1900.0,
                "low_24h": 1850.0,
                "last_updated": datetime.now().isoformat()
            },
            {
                "symbol": "SOL/USDT",
                "base": "SOL",
                "quote": "USDT",
                "price": 24.75,
                "change_24h": 3.8,
                "volume_24h": 350000000.0,
                "high_24h": 25.5,
                "low_24h": 24.0,
                "last_updated": datetime.now().isoformat()
            },
            {
                "symbol": "ADA/USDT",
                "base": "ADA",
                "quote": "USDT",
                "price": 0.38,
                "change_24h": -0.5,
                "volume_24h": 120000000.0,
                "high_24h": 0.39,
                "low_24h": 0.37,
                "last_updated": datetime.now().isoformat()
            },
            {
                "symbol": "XRP/USDT",
                "base": "XRP",
                "quote": "USDT",
                "price": 0.48,
                "change_24h": 1.0,
                "volume_24h": 180000000.0,
                "high_24h": 0.49,
                "low_24h": 0.47,
                "last_updated": datetime.now().isoformat()
            }
        ]

    def _add_mock_orders(self):
        """Add mock orders."""
        self._mock_data["orders"] = [
            {
                "id": "order1",
                "symbol": "BTC/USDT",
                "type": "LIMIT",
                "side": "BUY",
                "amount": 0.1,
                "price": 29500.0,
                "status": "FILLED",
                "filled": 0.1,
                "remaining": 0.0,
                "cost": 2950.0,
                "fee": {"cost": 2.95, "currency": "USDT"},
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "agent_id": "agent1"
            },
            {
                "id": "order2",
                "symbol": "ETH/USDT",
                "type": "MARKET",
                "side": "BUY",
                "amount": 1.5,
                "price": None,
                "status": "FILLED",
                "filled": 1.5,
                "remaining": 0.0,
                "cost": 2812.5,
                "fee": {"cost": 2.81, "currency": "USDT"},
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "agent_id": "agent2"
            },
            {
                "id": "order3",
                "symbol": "SOL/USDT",
                "type": "LIMIT",
                "side": "SELL",
                "amount": 50.0,
                "price": 25.0,
                "status": "OPEN",
                "filled": 0.0,
                "remaining": 50.0,
                "cost": 0.0,
                "fee": {"cost": 0.0, "currency": "USDT"},
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "agent_id": "agent3"
            }
        ]

    def _add_mock_positions(self):
        """Add mock positions."""
        self._mock_data["positions"] = [
            {
                "id": "position1",
                "symbol": "BTC/USDT",
                "side": "LONG",
                "amount": 0.1,
                "entry_price": 29500.0,
                "current_price": 30245.5,
                "pnl": 74.55,
                "pnl_percentage": 2.53,
                "liquidation_price": 15000.0,
                "leverage": 2.0,
                "margin": 1475.0,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "agent_id": "agent1"
            },
            {
                "id": "position2",
                "symbol": "ETH/USDT",
                "side": "LONG",
                "amount": 1.5,
                "entry_price": 1850.0,
                "current_price": 1875.25,
                "pnl": 37.88,
                "pnl_percentage": 1.36,
                "liquidation_price": 925.0,
                "leverage": 2.0,
                "margin": 1387.5,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "agent_id": "agent2"
            }
        ]

    def _add_mock_users(self):
        """Add mock users."""
        self._mock_data["users"] = [
            {
                "id": "user1",
                "username": "admin",
                "email": "admin@example.com",
                "full_name": "Admin User",
                "password_hash": "$2b$12$1234567890123456789012",
                "disabled": False,
                "roles": ["admin", "user"],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            },
            {
                "id": "user2",
                "username": "user",
                "email": "user@example.com",
                "full_name": "Regular User",
                "password_hash": "$2b$12$1234567890123456789012",
                "disabled": False,
                "roles": ["user"],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            },
            {
                "id": "user3",
                "username": "testuser",
                "email": "test@example.com",
                "full_name": "Test User",
                "password_hash": "$2b$12$1234567890123456789012",
                "disabled": False,
                "roles": ["user"],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
        ]

    def _add_mock_notifications(self):
        """Add mock notifications."""
        self._mock_data["notifications"] = [
            {
                "id": "notification1",
                "type": "agent_status",
                "title": "Agent Started",
                "message": "Agent 'BTC Trend Follower' has been started",
                "read": True,
                "metadata": {
                    "agent_id": "agent1"
                },
                "created_at": datetime.now().isoformat(),
                "user_id": "user1"
            },
            {
                "id": "notification2",
                "type": "order_update",
                "title": "Order Filled",
                "message": "Your BTC/USDT buy order has been filled at $29,500",
                "read": True,
                "metadata": {
                    "order_id": "order1"
                },
                "created_at": datetime.now().isoformat(),
                "user_id": "user1"
            },
            {
                "id": "notification3",
                "type": "price_alert",
                "title": "Price Alert",
                "message": "BTC/USDT has increased by 2.5% in the last 24 hours",
                "read": False,
                "metadata": {
                    "symbol": "BTC/USDT",
                    "price": 30245.50,
                    "change": 2.5
                },
                "created_at": datetime.now().isoformat(),
                "user_id": "user1"
            }
        ]

    async def close(self):
        """Close the database connection pool."""
        if self._pool:
            logger.info("Closing database connection pool")
            await self._pool.close()
            self._pool = None
            self._initialized = False

    async def execute(self, query: str, *args, timeout: Optional[float] = None) -> str:
        """
        Execute a query that doesn't return rows.

        Args:
            query: SQL query
            *args: Query parameters
            timeout: Query timeout in seconds

        Returns:
            Command tag
        """
        if USE_MOCK_DB:
            # Mock execution for common operations
            if "INSERT INTO" in query.upper():
                table_name = self._extract_table_name(query, "INSERT INTO")
                if table_name and table_name in self._mock_data:
                    # Create a new record with a random ID
                    new_id = f"{table_name[:-1]}{len(self._mock_data[table_name]) + 1}"
                    self._mock_data[table_name].append({"id": new_id})
                    return f"INSERT 0 1"
            elif "UPDATE" in query.upper():
                table_name = self._extract_table_name(query, "UPDATE")
                if table_name and table_name in self._mock_data:
                    return f"UPDATE 1"
            elif "DELETE FROM" in query.upper():
                table_name = self._extract_table_name(query, "DELETE FROM")
                if table_name and table_name in self._mock_data:
                    return f"DELETE 1"
            return "OK"

        if not self._pool:
            raise RuntimeError("Database connection pool not initialized")

        async with self._pool.acquire() as conn:
            return await conn.execute(query, *args, timeout=timeout)

    async def fetch(self, query: str, *args, timeout: Optional[float] = None) -> List[Any]:
        """
        Execute a query and return all rows.

        Args:
            query: SQL query
            *args: Query parameters
            timeout: Query timeout in seconds

        Returns:
            List of records
        """
        if USE_MOCK_DB:
            # Mock fetch for common operations
            if "SELECT" in query.upper():
                table_name = self._extract_table_name(query, "FROM")
                if table_name and table_name in self._mock_data:
                    # Return all records from the table
                    return [MockRecord(record) for record in self._mock_data[table_name]]
            return []

        if not self._pool:
            raise RuntimeError("Database connection pool not initialized")

        async with self._pool.acquire() as conn:
            return await conn.fetch(query, *args, timeout=timeout)

    async def fetchrow(self, query: str, *args, timeout: Optional[float] = None) -> Optional[Any]:
        """
        Execute a query and return the first row.

        Args:
            query: SQL query
            *args: Query parameters
            timeout: Query timeout in seconds

        Returns:
            First record or None
        """
        if USE_MOCK_DB:
            # Mock fetchrow for common operations
            if "SELECT" in query.upper():
                table_name = self._extract_table_name(query, "FROM")
                if table_name and table_name in self._mock_data:
                    # Check for WHERE clause to filter records
                    if "WHERE" in query.upper():
                        where_clause = query.upper().split("WHERE")[1].strip()
                        # Very basic WHERE clause parsing for id = 'value'
                        if "=" in where_clause:
                            field, value = where_clause.split("=", 1)
                            field = field.strip()
                            value = value.strip().strip("'").strip('"')

                            # Find matching record
                            for record in self._mock_data[table_name]:
                                if str(record.get(field.lower(), "")) == value:
                                    return MockRecord(record)

                    # If no WHERE clause or no match, return first record
                    if self._mock_data[table_name]:
                        return MockRecord(self._mock_data[table_name][0])
            return None

        if not self._pool:
            raise RuntimeError("Database connection pool not initialized")

        async with self._pool.acquire() as conn:
            return await conn.fetchrow(query, *args, timeout=timeout)

    async def fetchval(self, query: str, *args, column: int = 0, timeout: Optional[float] = None) -> Any:
        """
        Execute a query and return a single value.

        Args:
            query: SQL query
            *args: Query parameters
            column: Column index
            timeout: Query timeout in seconds

        Returns:
            Single value or None
        """
        if USE_MOCK_DB:
            # Mock fetchval for common operations
            row = await self.fetchrow(query, *args, timeout=timeout)
            if row:
                # Get the first column value
                return list(row.values())[column] if len(row) > column else None
            return None

        if not self._pool:
            raise RuntimeError("Database connection pool not initialized")

        async with self._pool.acquire() as conn:
            return await conn.fetchval(query, *args, column=column, timeout=timeout)

    async def transaction(self) -> Any:
        """
        Start a transaction.

        Returns:
            Connection with transaction
        """
        if USE_MOCK_DB:
            # Return a mock connection that does nothing
            class MockConnection:
                async def __aenter__(self):
                    return self

                async def __aexit__(self, exc_type, exc_val, exc_tb):
                    pass

                async def execute(self, query, *args, **kwargs):
                    return "OK"

                async def fetch(self, query, *args, **kwargs):
                    return []

                async def fetchrow(self, query, *args, **kwargs):
                    return None

                async def fetchval(self, query, *args, **kwargs):
                    return None

            return MockConnection()

        if not self._pool:
            raise RuntimeError("Database connection pool not initialized")

        return await self._pool.acquire()

    def _extract_table_name(self, query: str, keyword: str) -> Optional[str]:
        """
        Extract table name from a query.

        Args:
            query: SQL query
            keyword: Keyword to look for (e.g., FROM, INSERT INTO)

        Returns:
            Table name or None
        """
        try:
            # Very basic SQL parsing
            parts = query.upper().split(keyword)
            if len(parts) > 1:
                table_part = parts[1].strip().split(" ")[0].strip()
                return table_part.lower()
        except Exception:
            pass
        return None

    def _jsonify(self, obj: Any) -> Any:
        """
        Convert an object to a JSON-compatible format.

        Args:
            obj: Object to convert

        Returns:
            JSON-compatible object
        """
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, dict):
            return {k: self._jsonify(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._jsonify(v) for v in obj]
        else:
            return obj

    def _record_to_dict(self, record: asyncpg.Record) -> Dict[str, Any]:
        """
        Convert a database record to a dictionary.

        Args:
            record: Database record

        Returns:
            Dictionary representation
        """
        if record is None:
            return None

        result = dict(record)

        # Convert JSONB fields to Python objects
        for key, value in result.items():
            if isinstance(value, asyncpg.pgproto.pgproto.JSON) or isinstance(value, asyncpg.pgproto.pgproto.JSONB):
                result[key] = json.loads(value)

        return result

    def _records_to_dicts(self, records: List[asyncpg.Record]) -> List[Dict[str, Any]]:
        """
        Convert a list of database records to dictionaries.

        Args:
            records: List of database records

        Returns:
            List of dictionary representations
        """
        return [self._record_to_dict(record) for record in records]
