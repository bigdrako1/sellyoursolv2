"""
Repository for market data.

This module provides functions for storing and retrieving market data from the database.
"""
import logging
import json
from typing import Dict, Any, List, Optional, Tuple, Union
from datetime import datetime, timedelta

from database.db import Database

logger = logging.getLogger(__name__)

class MarketRepository:
    """
    Repository for market data.
    
    This class provides methods for storing and retrieving market data from the database.
    """
    
    def __init__(self, db: Database):
        """
        Initialize the repository.
        
        Args:
            db: Database instance
        """
        self.db = db
        
    async def add_market_data(
        self,
        token_address: str,
        price: float,
        volume_24h: Optional[float] = None,
        market_cap: Optional[float] = None,
        liquidity: Optional[float] = None,
        holders_count: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Add market data for a token.
        
        Args:
            token_address: Token address
            price: Token price
            volume_24h: 24-hour trading volume
            market_cap: Market capitalization
            liquidity: Liquidity
            holders_count: Number of token holders
            metadata: Additional metadata
            timestamp: Data timestamp (default: now)
            
        Returns:
            Created market data entry
        """
        query = """
        INSERT INTO market_data (
            token_address, timestamp, price, volume_24h,
            market_cap, liquidity, holders_count, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        """
        
        if timestamp is None:
            timestamp = datetime.now()
            
        record = await self.db.fetchrow(
            query,
            token_address,
            timestamp,
            price,
            volume_24h,
            market_cap,
            liquidity,
            holders_count,
            json.dumps(metadata or {})
        )
        
        return self.db._record_to_dict(record)
        
    async def get_latest_market_data(self, token_address: str) -> Optional[Dict[str, Any]]:
        """
        Get the latest market data for a token.
        
        Args:
            token_address: Token address
            
        Returns:
            Latest market data or None if not found
        """
        query = """
        SELECT * FROM market_data
        WHERE token_address = $1
        ORDER BY timestamp DESC
        LIMIT 1
        """
        
        record = await self.db.fetchrow(query, token_address)
        return self.db._record_to_dict(record)
        
    async def get_market_data_history(
        self,
        token_address: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        interval: str = "1h",
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get historical market data for a token.
        
        Args:
            token_address: Token address
            start_time: Start time
            end_time: End time
            interval: Time interval for aggregation
            limit: Maximum number of data points to return
            
        Returns:
            List of market data points
        """
        # Set default time range if not provided
        if end_time is None:
            end_time = datetime.now()
            
        if start_time is None:
            # Default to 7 days of data
            start_time = end_time - timedelta(days=7)
            
        # Build time bucket expression based on interval
        if interval == "1m":
            time_bucket = "time_bucket('1 minute', timestamp)"
        elif interval == "5m":
            time_bucket = "time_bucket('5 minutes', timestamp)"
        elif interval == "15m":
            time_bucket = "time_bucket('15 minutes', timestamp)"
        elif interval == "1h":
            time_bucket = "time_bucket('1 hour', timestamp)"
        elif interval == "4h":
            time_bucket = "time_bucket('4 hours', timestamp)"
        elif interval == "1d":
            time_bucket = "time_bucket('1 day', timestamp)"
        else:
            # Default to 1 hour
            time_bucket = "time_bucket('1 hour', timestamp)"
            
        query = f"""
        SELECT
            {time_bucket} AS time,
            FIRST(price, timestamp) AS open,
            MAX(price) AS high,
            MIN(price) AS low,
            LAST(price, timestamp) AS close,
            AVG(volume_24h) AS volume,
            AVG(market_cap) AS market_cap,
            AVG(liquidity) AS liquidity
        FROM market_data
        WHERE token_address = $1
        AND timestamp >= $2
        AND timestamp <= $3
        GROUP BY time
        ORDER BY time DESC
        LIMIT $4
        """
        
        records = await self.db.fetch(query, token_address, start_time, end_time, limit)
        return self.db._records_to_dicts(records)
        
    async def add_trending_token(
        self,
        token_address: str,
        score: float,
        token_symbol: Optional[str] = None,
        token_name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Add or update a trending token.
        
        Args:
            token_address: Token address
            score: Trending score
            token_symbol: Token symbol
            token_name: Token name
            metadata: Additional metadata
            
        Returns:
            Created or updated trending token
        """
        query = """
        INSERT INTO trending_tokens (
            token_address, token_symbol, token_name, score, metadata
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (token_address)
        DO UPDATE SET
            token_symbol = EXCLUDED.token_symbol,
            token_name = EXCLUDED.token_name,
            score = EXCLUDED.score,
            metadata = EXCLUDED.metadata,
            timestamp = NOW()
        RETURNING *
        """
        
        record = await self.db.fetchrow(
            query,
            token_address,
            token_symbol,
            token_name,
            score,
            json.dumps(metadata or {})
        )
        
        return self.db._record_to_dict(record)
        
    async def get_trending_tokens(
        self,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get trending tokens.
        
        Args:
            limit: Maximum number of tokens to return
            offset: Offset for pagination
            
        Returns:
            List of trending tokens
        """
        query = """
        SELECT * FROM trending_tokens
        ORDER BY score DESC
        LIMIT $1 OFFSET $2
        """
        
        records = await self.db.fetch(query, limit, offset)
        return self.db._records_to_dicts(records)
        
    async def add_wallet_transaction(
        self,
        wallet_address: str,
        transaction_hash: str,
        timestamp: datetime,
        token_address: Optional[str] = None,
        token_symbol: Optional[str] = None,
        token_name: Optional[str] = None,
        amount: Optional[float] = None,
        price: Optional[float] = None,
        transaction_type: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Add a wallet transaction.
        
        Args:
            wallet_address: Wallet address
            transaction_hash: Transaction hash
            timestamp: Transaction timestamp
            token_address: Token address
            token_symbol: Token symbol
            token_name: Token name
            amount: Transaction amount
            price: Token price at transaction time
            transaction_type: Transaction type
            metadata: Additional metadata
            
        Returns:
            Created wallet transaction
        """
        query = """
        INSERT INTO wallet_transactions (
            wallet_address, transaction_hash, timestamp,
            token_address, token_symbol, token_name,
            amount, price, transaction_type, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (transaction_hash)
        DO NOTHING
        RETURNING *
        """
        
        record = await self.db.fetchrow(
            query,
            wallet_address,
            transaction_hash,
            timestamp,
            token_address,
            token_symbol,
            token_name,
            amount,
            price,
            transaction_type,
            json.dumps(metadata or {})
        )
        
        return self.db._record_to_dict(record)
        
    async def get_wallet_transactions(
        self,
        wallet_address: str,
        token_address: Optional[str] = None,
        transaction_type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Get transactions for a wallet.
        
        Args:
            wallet_address: Wallet address
            token_address: Filter by token address
            transaction_type: Filter by transaction type
            start_time: Filter by start time
            end_time: Filter by end time
            limit: Maximum number of transactions to return
            offset: Offset for pagination
            
        Returns:
            Tuple of (transactions, total count)
        """
        # Build query conditions
        conditions = ["wallet_address = $1"]
        params = [wallet_address]
        
        if token_address:
            conditions.append("token_address = $" + str(len(params) + 1))
            params.append(token_address)
            
        if transaction_type:
            conditions.append("transaction_type = $" + str(len(params) + 1))
            params.append(transaction_type)
            
        if start_time:
            conditions.append("timestamp >= $" + str(len(params) + 1))
            params.append(start_time)
            
        if end_time:
            conditions.append("timestamp <= $" + str(len(params) + 1))
            params.append(end_time)
            
        # Build WHERE clause
        where_clause = "WHERE " + " AND ".join(conditions)
            
        # Count query
        count_query = f"""
        SELECT COUNT(*) FROM wallet_transactions
        {where_clause}
        """
        
        # Data query
        query = f"""
        SELECT * FROM wallet_transactions
        {where_clause}
        ORDER BY timestamp DESC
        LIMIT $" + str(len(params) + 1) + "
        OFFSET $" + str(len(params) + 2) + "
        """
        
        # Execute queries
        total = await self.db.fetchval(count_query, *params)
        records = await self.db.fetch(query, *(params + [limit, offset]))
        
        return self.db._records_to_dicts(records), total
        
    async def get_token_transactions(
        self,
        token_address: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get transactions for a token.
        
        Args:
            token_address: Token address
            start_time: Filter by start time
            end_time: Filter by end time
            limit: Maximum number of transactions to return
            
        Returns:
            List of transactions
        """
        # Build query conditions
        conditions = ["token_address = $1"]
        params = [token_address]
        
        if start_time:
            conditions.append("timestamp >= $" + str(len(params) + 1))
            params.append(start_time)
            
        if end_time:
            conditions.append("timestamp <= $" + str(len(params) + 1))
            params.append(end_time)
            
        # Build WHERE clause
        where_clause = "WHERE " + " AND ".join(conditions)
            
        # Build query
        query = f"""
        SELECT * FROM wallet_transactions
        {where_clause}
        ORDER BY timestamp DESC
        LIMIT $" + str(len(params) + 1) + "
        """
        
        # Execute query
        records = await self.db.fetch(query, *(params + [limit]))
        return self.db._records_to_dicts(records)
