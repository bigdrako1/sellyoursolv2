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

from config.settings import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

logger = logging.getLogger(__name__)

class Database:
    """
    Database connection manager.
    
    This class manages a connection pool to the PostgreSQL database and provides
    methods for executing queries and transactions.
    """
    
    _instance = None
    _pool: Optional[Pool] = None
    _initialized = False
    
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
        """Initialize the database connection pool."""
        if self._initialized:
            return
            
        logger.info("Initializing database connection pool")
        
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
            raise
            
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
        if not self._pool:
            raise RuntimeError("Database connection pool not initialized")
            
        async with self._pool.acquire() as conn:
            return await conn.execute(query, *args, timeout=timeout)
            
    async def fetch(self, query: str, *args, timeout: Optional[float] = None) -> List[asyncpg.Record]:
        """
        Execute a query and return all rows.
        
        Args:
            query: SQL query
            *args: Query parameters
            timeout: Query timeout in seconds
            
        Returns:
            List of records
        """
        if not self._pool:
            raise RuntimeError("Database connection pool not initialized")
            
        async with self._pool.acquire() as conn:
            return await conn.fetch(query, *args, timeout=timeout)
            
    async def fetchrow(self, query: str, *args, timeout: Optional[float] = None) -> Optional[asyncpg.Record]:
        """
        Execute a query and return the first row.
        
        Args:
            query: SQL query
            *args: Query parameters
            timeout: Query timeout in seconds
            
        Returns:
            First record or None
        """
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
        if not self._pool:
            raise RuntimeError("Database connection pool not initialized")
            
        async with self._pool.acquire() as conn:
            return await conn.fetchval(query, *args, column=column, timeout=timeout)
            
    async def transaction(self) -> asyncpg.Connection:
        """
        Start a transaction.
        
        Returns:
            Connection with transaction
        """
        if not self._pool:
            raise RuntimeError("Database connection pool not initialized")
            
        return await self._pool.acquire()
        
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
