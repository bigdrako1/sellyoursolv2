"""
Tests for the Database class.
"""
import pytest
import asyncio
from unittest.mock import MagicMock, patch, AsyncMock
import asyncpg

from database.db import Database

@pytest.mark.asyncio
async def test_get_instance():
    """Test getting a database instance."""
    # Mock asyncpg.create_pool
    with patch("asyncpg.create_pool") as mock_create_pool:
        # Mock connection
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock()
        
        # Mock pool
        mock_pool = AsyncMock()
        mock_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Set up mock_create_pool to return mock_pool
        mock_create_pool.return_value = mock_pool
        
        # Get database instance
        db = await Database.get_instance()
        
        # Check that create_pool was called
        mock_create_pool.assert_called_once()
        
        # Check that search path was set
        mock_conn.execute.assert_called_with("SET search_path TO trading_agents, public")
        
        # Check that instance was initialized
        assert db._initialized is True
        assert db._pool is mock_pool
        
        # Get instance again
        db2 = await Database.get_instance()
        
        # Check that it's the same instance
        assert db2 is db
        
        # Check that create_pool was called only once
        assert mock_create_pool.call_count == 1

@pytest.mark.asyncio
async def test_close():
    """Test closing the database connection."""
    # Mock asyncpg.create_pool
    with patch("asyncpg.create_pool") as mock_create_pool:
        # Mock pool
        mock_pool = AsyncMock()
        
        # Set up mock_create_pool to return mock_pool
        mock_create_pool.return_value = mock_pool
        
        # Get database instance
        db = await Database.get_instance()
        
        # Close database
        await db.close()
        
        # Check that pool.close was called
        mock_pool.close.assert_called_once()
        
        # Check that instance was reset
        assert db._pool is None
        assert db._initialized is False

@pytest.mark.asyncio
async def test_execute():
    """Test executing a query."""
    # Mock asyncpg.create_pool
    with patch("asyncpg.create_pool") as mock_create_pool:
        # Mock connection
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock(return_value="INSERT 0 1")
        
        # Mock pool
        mock_pool = AsyncMock()
        mock_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Set up mock_create_pool to return mock_pool
        mock_create_pool.return_value = mock_pool
        
        # Get database instance
        db = await Database.get_instance()
        
        # Execute query
        result = await db.execute("INSERT INTO test VALUES ($1)", "value")
        
        # Check result
        assert result == "INSERT 0 1"
        
        # Check that connection.execute was called
        mock_conn.execute.assert_called_with("INSERT INTO test VALUES ($1)", "value", timeout=None)

@pytest.mark.asyncio
async def test_fetch():
    """Test fetching rows."""
    # Mock asyncpg.create_pool
    with patch("asyncpg.create_pool") as mock_create_pool:
        # Mock connection
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(return_value=[{"id": 1, "name": "test"}])
        
        # Mock pool
        mock_pool = AsyncMock()
        mock_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Set up mock_create_pool to return mock_pool
        mock_create_pool.return_value = mock_pool
        
        # Get database instance
        db = await Database.get_instance()
        
        # Fetch rows
        result = await db.fetch("SELECT * FROM test WHERE id = $1", 1)
        
        # Check result
        assert result == [{"id": 1, "name": "test"}]
        
        # Check that connection.fetch was called
        mock_conn.fetch.assert_called_with("SELECT * FROM test WHERE id = $1", 1, timeout=None)

@pytest.mark.asyncio
async def test_fetchrow():
    """Test fetching a single row."""
    # Mock asyncpg.create_pool
    with patch("asyncpg.create_pool") as mock_create_pool:
        # Mock connection
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value={"id": 1, "name": "test"})
        
        # Mock pool
        mock_pool = AsyncMock()
        mock_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Set up mock_create_pool to return mock_pool
        mock_create_pool.return_value = mock_pool
        
        # Get database instance
        db = await Database.get_instance()
        
        # Fetch row
        result = await db.fetchrow("SELECT * FROM test WHERE id = $1", 1)
        
        # Check result
        assert result == {"id": 1, "name": "test"}
        
        # Check that connection.fetchrow was called
        mock_conn.fetchrow.assert_called_with("SELECT * FROM test WHERE id = $1", 1, timeout=None)

@pytest.mark.asyncio
async def test_fetchval():
    """Test fetching a single value."""
    # Mock asyncpg.create_pool
    with patch("asyncpg.create_pool") as mock_create_pool:
        # Mock connection
        mock_conn = AsyncMock()
        mock_conn.fetchval = AsyncMock(return_value="test")
        
        # Mock pool
        mock_pool = AsyncMock()
        mock_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        # Set up mock_create_pool to return mock_pool
        mock_create_pool.return_value = mock_pool
        
        # Get database instance
        db = await Database.get_instance()
        
        # Fetch value
        result = await db.fetchval("SELECT name FROM test WHERE id = $1", 1)
        
        # Check result
        assert result == "test"
        
        # Check that connection.fetchval was called
        mock_conn.fetchval.assert_called_with("SELECT name FROM test WHERE id = $1", 1, column=0, timeout=None)

@pytest.mark.asyncio
async def test_transaction():
    """Test starting a transaction."""
    # Mock asyncpg.create_pool
    with patch("asyncpg.create_pool") as mock_create_pool:
        # Mock connection
        mock_conn = AsyncMock()
        
        # Mock pool
        mock_pool = AsyncMock()
        mock_pool.acquire = AsyncMock(return_value=mock_conn)
        
        # Set up mock_create_pool to return mock_pool
        mock_create_pool.return_value = mock_pool
        
        # Get database instance
        db = await Database.get_instance()
        
        # Start transaction
        conn = await db.transaction()
        
        # Check result
        assert conn is mock_conn
        
        # Check that pool.acquire was called
        mock_pool.acquire.assert_called_once()

@pytest.mark.asyncio
async def test_record_to_dict():
    """Test converting a record to a dictionary."""
    # Create database instance
    db = Database()
    
    # Create mock record
    mock_record = MagicMock()
    mock_record.__iter__ = lambda self: iter([("id", 1), ("name", "test")])
    
    # Convert record to dict
    result = db._record_to_dict(mock_record)
    
    # Check result
    assert result == {"id": 1, "name": "test"}
    
    # Test with None
    assert db._record_to_dict(None) is None

@pytest.mark.asyncio
async def test_records_to_dicts():
    """Test converting records to dictionaries."""
    # Create database instance
    db = Database()
    
    # Create mock records
    mock_record1 = MagicMock()
    mock_record1.__iter__ = lambda self: iter([("id", 1), ("name", "test1")])
    
    mock_record2 = MagicMock()
    mock_record2.__iter__ = lambda self: iter([("id", 2), ("name", "test2")])
    
    # Convert records to dicts
    result = db._records_to_dicts([mock_record1, mock_record2])
    
    # Check result
    assert result == [{"id": 1, "name": "test1"}, {"id": 2, "name": "test2"}]
