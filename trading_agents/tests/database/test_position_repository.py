"""
Tests for the PositionRepository class.
"""
import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

from database.db import Database
from database.position_repository import PositionRepository

@pytest.fixture
async def db():
    """Create a mock database."""
    mock_db = MagicMock(spec=Database)
    mock_db._record_to_dict = lambda record: record
    mock_db._records_to_dicts = lambda records: records
    return mock_db

@pytest.fixture
async def repository(db):
    """Create a position repository."""
    return PositionRepository(db)

@pytest.mark.asyncio
async def test_create_position(repository, db):
    """Test creating a position."""
    # Mock database response
    mock_record = {
        "id": "123",
        "agent_id": "test_agent",
        "token_address": "test_token",
        "token_symbol": "TEST",
        "token_name": "Test Token",
        "entry_price": 1.0,
        "amount": 10.0,
        "current_price": 1.0,
        "price_change": 0.0,
        "status": "open",
        "opened_at": datetime.now(),
        "closed_at": None,
        "close_reason": None,
        "profit_loss": None,
        "metadata": {"key": "value"}
    }
    db.fetchrow.return_value = mock_record
    
    # Create position
    position = await repository.create_position(
        agent_id="test_agent",
        token_address="test_token",
        token_symbol="TEST",
        token_name="Test Token",
        entry_price=1.0,
        amount=10.0,
        metadata={"key": "value"}
    )
    
    # Check result
    assert position == mock_record
    
    # Check that database was called correctly
    db.fetchrow.assert_called_once()
    args = db.fetchrow.call_args[0]
    assert "INSERT INTO positions" in args[0]
    assert args[1] == "test_agent"
    assert args[2] == "test_token"
    assert args[3] == "TEST"
    assert args[4] == "Test Token"
    assert args[5] == 1.0
    assert args[6] == 10.0
    
@pytest.mark.asyncio
async def test_get_position(repository, db):
    """Test getting a position."""
    # Mock database response
    mock_record = {
        "id": "123",
        "agent_id": "test_agent",
        "token_address": "test_token",
        "token_symbol": "TEST",
        "token_name": "Test Token",
        "entry_price": 1.0,
        "amount": 10.0,
        "current_price": 1.0,
        "price_change": 0.0,
        "status": "open",
        "opened_at": datetime.now(),
        "closed_at": None,
        "close_reason": None,
        "profit_loss": None,
        "metadata": {"key": "value"}
    }
    db.fetchrow.return_value = mock_record
    
    # Get position
    position = await repository.get_position("123")
    
    # Check result
    assert position == mock_record
    
    # Check that database was called correctly
    db.fetchrow.assert_called_once()
    args = db.fetchrow.call_args[0]
    assert "SELECT * FROM positions" in args[0]
    assert args[1] == "123"
    
@pytest.mark.asyncio
async def test_get_position_by_token(repository, db):
    """Test getting a position by token."""
    # Mock database response
    mock_record = {
        "id": "123",
        "agent_id": "test_agent",
        "token_address": "test_token",
        "token_symbol": "TEST",
        "token_name": "Test Token",
        "entry_price": 1.0,
        "amount": 10.0,
        "current_price": 1.0,
        "price_change": 0.0,
        "status": "open",
        "opened_at": datetime.now(),
        "closed_at": None,
        "close_reason": None,
        "profit_loss": None,
        "metadata": {"key": "value"}
    }
    db.fetchrow.return_value = mock_record
    
    # Get position
    position = await repository.get_position_by_token("test_agent", "test_token")
    
    # Check result
    assert position == mock_record
    
    # Check that database was called correctly
    db.fetchrow.assert_called_once()
    args = db.fetchrow.call_args[0]
    assert "SELECT * FROM positions" in args[0]
    assert args[1] == "test_agent"
    assert args[2] == "test_token"
    assert args[3] == "open"
    
@pytest.mark.asyncio
async def test_get_agent_positions(repository, db):
    """Test getting agent positions."""
    # Mock database responses
    mock_records = [
        {
            "id": "123",
            "agent_id": "test_agent",
            "token_address": "test_token_1",
            "token_symbol": "TEST1",
            "token_name": "Test Token 1",
            "entry_price": 1.0,
            "amount": 10.0,
            "current_price": 1.0,
            "price_change": 0.0,
            "status": "open",
            "opened_at": datetime.now(),
            "closed_at": None,
            "close_reason": None,
            "profit_loss": None,
            "metadata": {"key": "value"}
        },
        {
            "id": "456",
            "agent_id": "test_agent",
            "token_address": "test_token_2",
            "token_symbol": "TEST2",
            "token_name": "Test Token 2",
            "entry_price": 2.0,
            "amount": 5.0,
            "current_price": 2.0,
            "price_change": 0.0,
            "status": "open",
            "opened_at": datetime.now(),
            "closed_at": None,
            "close_reason": None,
            "profit_loss": None,
            "metadata": {"key": "value"}
        }
    ]
    db.fetchval.return_value = 2
    db.fetch.return_value = mock_records
    
    # Get positions
    positions, total = await repository.get_agent_positions(
        agent_id="test_agent",
        status="open",
        limit=10,
        offset=0
    )
    
    # Check result
    assert positions == mock_records
    assert total == 2
    
    # Check that database was called correctly
    db.fetchval.assert_called_once()
    db.fetch.assert_called_once()
    
@pytest.mark.asyncio
async def test_update_position_price(repository, db):
    """Test updating a position's price."""
    # Mock database response
    mock_record = {
        "id": "123",
        "agent_id": "test_agent",
        "token_address": "test_token",
        "token_symbol": "TEST",
        "token_name": "Test Token",
        "entry_price": 1.0,
        "amount": 10.0,
        "current_price": 1.1,
        "price_change": 0.1,
        "status": "open",
        "opened_at": datetime.now(),
        "closed_at": None,
        "close_reason": None,
        "profit_loss": None,
        "metadata": {"key": "value"}
    }
    db.fetchrow.return_value = mock_record
    
    # Update price
    position = await repository.update_position_price("123", 1.1)
    
    # Check result
    assert position == mock_record
    
    # Check that database was called correctly
    db.fetchrow.assert_called_once()
    args = db.fetchrow.call_args[0]
    assert "UPDATE positions" in args[0]
    assert args[1] == "123"
    assert args[2] == 1.1
    
@pytest.mark.asyncio
async def test_close_position(repository, db):
    """Test closing a position."""
    # Mock database response
    mock_record = {
        "id": "123",
        "agent_id": "test_agent",
        "token_address": "test_token",
        "token_symbol": "TEST",
        "token_name": "Test Token",
        "entry_price": 1.0,
        "amount": 10.0,
        "current_price": 1.1,
        "price_change": 0.1,
        "status": "closed",
        "opened_at": datetime.now(),
        "closed_at": datetime.now(),
        "close_reason": "take_profit",
        "profit_loss": 1.0,
        "metadata": {"key": "value"}
    }
    db.fetchrow.return_value = mock_record
    
    # Close position
    position = await repository.close_position("123", 1.1, "take_profit")
    
    # Check result
    assert position == mock_record
    
    # Check that database was called correctly
    db.fetchrow.assert_called_once()
    args = db.fetchrow.call_args[0]
    assert "UPDATE positions" in args[0]
    assert args[1] == "123"
    assert args[2] == 1.1
    assert args[3] == "take_profit"
    
@pytest.mark.asyncio
async def test_get_agent_profit_loss(repository, db):
    """Test getting agent profit/loss."""
    # Mock database response
    mock_record = {
        "total_profit": 10.0,
        "total_loss": 5.0,
        "net_pnl": 5.0
    }
    db.fetchrow.return_value = mock_record
    
    # Get profit/loss
    pnl = await repository.get_agent_profit_loss("test_agent")
    
    # Check result
    assert pnl == mock_record
    
    # Check that database was called correctly
    db.fetchrow.assert_called_once()
    args = db.fetchrow.call_args[0]
    assert "SELECT" in args[0]
    assert "FROM positions" in args[0]
    assert args[1] == "test_agent"
    
@pytest.mark.asyncio
async def test_get_position_history(repository, db):
    """Test getting position history."""
    # Mock database response
    mock_records = [
        {
            "id": "123",
            "agent_id": "test_agent",
            "token_address": "test_token_1",
            "token_symbol": "TEST1",
            "token_name": "Test Token 1",
            "entry_price": 1.0,
            "amount": 10.0,
            "current_price": 1.1,
            "price_change": 0.1,
            "status": "closed",
            "opened_at": datetime.now() - timedelta(days=1),
            "closed_at": datetime.now(),
            "close_reason": "take_profit",
            "profit_loss": 1.0,
            "metadata": {"key": "value"}
        },
        {
            "id": "456",
            "agent_id": "test_agent",
            "token_address": "test_token_2",
            "token_symbol": "TEST2",
            "token_name": "Test Token 2",
            "entry_price": 2.0,
            "amount": 5.0,
            "current_price": 1.9,
            "price_change": -0.05,
            "status": "closed",
            "opened_at": datetime.now() - timedelta(days=2),
            "closed_at": datetime.now() - timedelta(days=1),
            "close_reason": "stop_loss",
            "profit_loss": -0.5,
            "metadata": {"key": "value"}
        }
    ]
    db.fetch.return_value = mock_records
    
    # Get history
    history = await repository.get_position_history(
        agent_id="test_agent",
        start_time=datetime.now() - timedelta(days=7),
        end_time=datetime.now(),
        limit=10
    )
    
    # Check result
    assert history == mock_records
    
    # Check that database was called correctly
    db.fetch.assert_called_once()
    
@pytest.mark.asyncio
async def test_get_position_metrics(repository, db):
    """Test getting position metrics."""
    # Mock database response
    mock_record = {
        "open_positions": 2,
        "closed_positions": 5,
        "profitable_positions": 3,
        "unprofitable_positions": 2,
        "avg_profit_percentage": 0.1,
        "avg_loss_percentage": -0.05,
        "max_profit_percentage": 0.2,
        "max_loss_percentage": -0.1
    }
    db.fetchrow.return_value = mock_record
    
    # Get metrics
    metrics = await repository.get_position_metrics("test_agent")
    
    # Check result
    assert metrics == mock_record
    
    # Check that database was called correctly
    db.fetchrow.assert_called_once()
    args = db.fetchrow.call_args[0]
    assert "SELECT" in args[0]
    assert "FROM positions" in args[0]
    assert args[1] == "test_agent"
