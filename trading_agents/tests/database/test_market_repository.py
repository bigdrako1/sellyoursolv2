"""
Tests for the MarketRepository class.
"""
import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

from database.db import Database
from database.market_repository import MarketRepository

@pytest.fixture
async def db():
    """Create a mock database."""
    mock_db = MagicMock(spec=Database)
    mock_db._record_to_dict = lambda record: record
    mock_db._records_to_dicts = lambda records: records
    return mock_db

@pytest.fixture
async def repository(db):
    """Create a market repository."""
    return MarketRepository(db)

@pytest.mark.asyncio
async def test_add_market_data(repository, db):
    """Test adding market data."""
    # Mock database response
    mock_record = {
        "id": "123",
        "token_address": "test_token",
        "timestamp": datetime.now(),
        "price": 1.0,
        "volume_24h": 1000.0,
        "market_cap": 1000000.0,
        "liquidity": 10000.0,
        "holders_count": 100,
        "metadata": {"key": "value"}
    }
    db.fetchrow.return_value = mock_record
    
    # Add market data
    data = await repository.add_market_data(
        token_address="test_token",
        price=1.0,
        volume_24h=1000.0,
        market_cap=1000000.0,
        liquidity=10000.0,
        holders_count=100,
        metadata={"key": "value"}
    )
    
    # Check result
    assert data == mock_record
    
    # Check that database was called correctly
    db.fetchrow.assert_called_once()
    args = db.fetchrow.call_args[0]
    assert "INSERT INTO market_data" in args[0]
    assert args[1] == "test_token"
    assert args[3] == 1.0
    assert args[4] == 1000.0
    assert args[5] == 1000000.0
    assert args[6] == 10000.0
    assert args[7] == 100
    
@pytest.mark.asyncio
async def test_get_latest_market_data(repository, db):
    """Test getting latest market data."""
    # Mock database response
    mock_record = {
        "id": "123",
        "token_address": "test_token",
        "timestamp": datetime.now(),
        "price": 1.0,
        "volume_24h": 1000.0,
        "market_cap": 1000000.0,
        "liquidity": 10000.0,
        "holders_count": 100,
        "metadata": {"key": "value"}
    }
    db.fetchrow.return_value = mock_record
    
    # Get latest market data
    data = await repository.get_latest_market_data("test_token")
    
    # Check result
    assert data == mock_record
    
    # Check that database was called correctly
    db.fetchrow.assert_called_once()
    args = db.fetchrow.call_args[0]
    assert "SELECT * FROM market_data" in args[0]
    assert args[1] == "test_token"
    
@pytest.mark.asyncio
async def test_get_market_data_history(repository, db):
    """Test getting market data history."""
    # Mock database response
    mock_records = [
        {
            "time": datetime.now() - timedelta(hours=2),
            "open": 1.0,
            "high": 1.1,
            "low": 0.9,
            "close": 1.05,
            "volume": 1000.0,
            "market_cap": 1000000.0,
            "liquidity": 10000.0
        },
        {
            "time": datetime.now() - timedelta(hours=1),
            "open": 1.05,
            "high": 1.15,
            "low": 1.0,
            "close": 1.1,
            "volume": 1100.0,
            "market_cap": 1100000.0,
            "liquidity": 11000.0
        }
    ]
    db.fetch.return_value = mock_records
    
    # Get market data history
    history = await repository.get_market_data_history(
        token_address="test_token",
        start_time=datetime.now() - timedelta(days=1),
        end_time=datetime.now(),
        interval="1h",
        limit=10
    )
    
    # Check result
    assert history == mock_records
    
    # Check that database was called correctly
    db.fetch.assert_called_once()
    args = db.fetch.call_args[0]
    assert "SELECT" in args[0]
    assert "FROM market_data" in args[0]
    assert args[1] == "test_token"
    
@pytest.mark.asyncio
async def test_add_trending_token(repository, db):
    """Test adding a trending token."""
    # Mock database response
    mock_record = {
        "id": "123",
        "token_address": "test_token",
        "token_symbol": "TEST",
        "token_name": "Test Token",
        "score": 0.8,
        "timestamp": datetime.now(),
        "metadata": {"key": "value"}
    }
    db.fetchrow.return_value = mock_record
    
    # Add trending token
    token = await repository.add_trending_token(
        token_address="test_token",
        score=0.8,
        token_symbol="TEST",
        token_name="Test Token",
        metadata={"key": "value"}
    )
    
    # Check result
    assert token == mock_record
    
    # Check that database was called correctly
    db.fetchrow.assert_called_once()
    args = db.fetchrow.call_args[0]
    assert "INSERT INTO trending_tokens" in args[0]
    assert args[1] == "test_token"
    assert args[2] == "TEST"
    assert args[3] == "Test Token"
    assert args[4] == 0.8
    
@pytest.mark.asyncio
async def test_get_trending_tokens(repository, db):
    """Test getting trending tokens."""
    # Mock database response
    mock_records = [
        {
            "id": "123",
            "token_address": "test_token_1",
            "token_symbol": "TEST1",
            "token_name": "Test Token 1",
            "score": 0.9,
            "timestamp": datetime.now(),
            "metadata": {"key": "value"}
        },
        {
            "id": "456",
            "token_address": "test_token_2",
            "token_symbol": "TEST2",
            "token_name": "Test Token 2",
            "score": 0.8,
            "timestamp": datetime.now(),
            "metadata": {"key": "value"}
        }
    ]
    db.fetch.return_value = mock_records
    
    # Get trending tokens
    tokens = await repository.get_trending_tokens(limit=10, offset=0)
    
    # Check result
    assert tokens == mock_records
    
    # Check that database was called correctly
    db.fetch.assert_called_once()
    args = db.fetch.call_args[0]
    assert "SELECT * FROM trending_tokens" in args[0]
    assert args[1] == 10
    assert args[2] == 0
    
@pytest.mark.asyncio
async def test_add_wallet_transaction(repository, db):
    """Test adding a wallet transaction."""
    # Mock database response
    mock_record = {
        "id": "123",
        "wallet_address": "test_wallet",
        "transaction_hash": "test_hash",
        "timestamp": datetime.now(),
        "token_address": "test_token",
        "token_symbol": "TEST",
        "token_name": "Test Token",
        "amount": 10.0,
        "price": 1.0,
        "transaction_type": "buy",
        "metadata": {"key": "value"}
    }
    db.fetchrow.return_value = mock_record
    
    # Add wallet transaction
    transaction = await repository.add_wallet_transaction(
        wallet_address="test_wallet",
        transaction_hash="test_hash",
        timestamp=datetime.now(),
        token_address="test_token",
        token_symbol="TEST",
        token_name="Test Token",
        amount=10.0,
        price=1.0,
        transaction_type="buy",
        metadata={"key": "value"}
    )
    
    # Check result
    assert transaction == mock_record
    
    # Check that database was called correctly
    db.fetchrow.assert_called_once()
    args = db.fetchrow.call_args[0]
    assert "INSERT INTO wallet_transactions" in args[0]
    assert args[1] == "test_wallet"
    assert args[2] == "test_hash"
    assert args[4] == "test_token"
    assert args[5] == "TEST"
    assert args[6] == "Test Token"
    assert args[7] == 10.0
    assert args[8] == 1.0
    assert args[9] == "buy"
    
@pytest.mark.asyncio
async def test_get_wallet_transactions(repository, db):
    """Test getting wallet transactions."""
    # Mock database responses
    mock_records = [
        {
            "id": "123",
            "wallet_address": "test_wallet",
            "transaction_hash": "test_hash_1",
            "timestamp": datetime.now(),
            "token_address": "test_token_1",
            "token_symbol": "TEST1",
            "token_name": "Test Token 1",
            "amount": 10.0,
            "price": 1.0,
            "transaction_type": "buy",
            "metadata": {"key": "value"}
        },
        {
            "id": "456",
            "wallet_address": "test_wallet",
            "transaction_hash": "test_hash_2",
            "timestamp": datetime.now(),
            "token_address": "test_token_2",
            "token_symbol": "TEST2",
            "token_name": "Test Token 2",
            "amount": 5.0,
            "price": 2.0,
            "transaction_type": "sell",
            "metadata": {"key": "value"}
        }
    ]
    db.fetchval.return_value = 2
    db.fetch.return_value = mock_records
    
    # Get wallet transactions
    transactions, total = await repository.get_wallet_transactions(
        wallet_address="test_wallet",
        token_address="test_token",
        transaction_type="buy",
        start_time=datetime.now() - timedelta(days=1),
        end_time=datetime.now(),
        limit=10,
        offset=0
    )
    
    # Check result
    assert transactions == mock_records
    assert total == 2
    
    # Check that database was called correctly
    db.fetchval.assert_called_once()
    db.fetch.assert_called_once()
    
@pytest.mark.asyncio
async def test_get_token_transactions(repository, db):
    """Test getting token transactions."""
    # Mock database response
    mock_records = [
        {
            "id": "123",
            "wallet_address": "test_wallet_1",
            "transaction_hash": "test_hash_1",
            "timestamp": datetime.now(),
            "token_address": "test_token",
            "token_symbol": "TEST",
            "token_name": "Test Token",
            "amount": 10.0,
            "price": 1.0,
            "transaction_type": "buy",
            "metadata": {"key": "value"}
        },
        {
            "id": "456",
            "wallet_address": "test_wallet_2",
            "transaction_hash": "test_hash_2",
            "timestamp": datetime.now(),
            "token_address": "test_token",
            "token_symbol": "TEST",
            "token_name": "Test Token",
            "amount": 5.0,
            "price": 1.1,
            "transaction_type": "buy",
            "metadata": {"key": "value"}
        }
    ]
    db.fetch.return_value = mock_records
    
    # Get token transactions
    transactions = await repository.get_token_transactions(
        token_address="test_token",
        start_time=datetime.now() - timedelta(days=1),
        end_time=datetime.now(),
        limit=10
    )
    
    # Check result
    assert transactions == mock_records
    
    # Check that database was called correctly
    db.fetch.assert_called_once()
    args = db.fetch.call_args[0]
    assert "SELECT * FROM wallet_transactions" in args[0]
    assert args[1] == "test_token"
