"""
Tests for the AgentRepository class.
"""
import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

from database.db import Database
from database.agent_repository import AgentRepository

@pytest.fixture
async def db():
    """Create a mock database."""
    mock_db = MagicMock(spec=Database)
    mock_db._record_to_dict = lambda record: record
    mock_db._records_to_dicts = lambda records: records
    return mock_db

@pytest.fixture
async def repository(db):
    """Create an agent repository."""
    return AgentRepository(db)

@pytest.mark.asyncio
async def test_create_agent(repository, db):
    """Test creating an agent."""
    # Mock database response
    mock_record = {
        "id": "123",
        "agent_id": "test_agent",
        "agent_type": "copy_trading",
        "name": "Test Agent",
        "status": "initialized",
        "config": {"key": "value"},
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    db.fetchrow.return_value = mock_record
    
    # Create agent
    agent = await repository.create_agent(
        agent_id="test_agent",
        agent_type="copy_trading",
        name="Test Agent",
        config={"key": "value"}
    )
    
    # Check result
    assert agent == mock_record
    
    # Check that database was called correctly
    db.fetchrow.assert_called_once()
    args = db.fetchrow.call_args[0]
    assert "INSERT INTO agents" in args[0]
    assert args[1] == "test_agent"
    assert args[2] == "copy_trading"
    assert args[3] == "Test Agent"
    
@pytest.mark.asyncio
async def test_get_agent(repository, db):
    """Test getting an agent."""
    # Mock database response
    mock_record = {
        "id": "123",
        "agent_id": "test_agent",
        "agent_type": "copy_trading",
        "name": "Test Agent",
        "status": "initialized",
        "config": {"key": "value"},
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "metrics": {"metric1": 1, "metric2": 2}
    }
    db.fetchrow.return_value = mock_record
    
    # Get agent
    agent = await repository.get_agent("test_agent")
    
    # Check result
    assert agent == mock_record
    
    # Check that database was called correctly
    db.fetchrow.assert_called_once()
    args = db.fetchrow.call_args[0]
    assert "FROM agent_status_view" in args[0]
    assert args[1] == "test_agent"
    
@pytest.mark.asyncio
async def test_get_agents(repository, db):
    """Test getting agents."""
    # Mock database responses
    mock_records = [
        {
            "id": "123",
            "agent_id": "test_agent_1",
            "agent_type": "copy_trading",
            "name": "Test Agent 1",
            "status": "initialized",
            "config": {"key": "value"},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "metrics": {"metric1": 1, "metric2": 2}
        },
        {
            "id": "456",
            "agent_id": "test_agent_2",
            "agent_type": "liquidation",
            "name": "Test Agent 2",
            "status": "running",
            "config": {"key": "value"},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "metrics": {"metric1": 3, "metric2": 4}
        }
    ]
    db.fetchval.return_value = 2
    db.fetch.return_value = mock_records
    
    # Get agents
    agents, total = await repository.get_agents(
        agent_type="copy_trading",
        status="initialized",
        limit=10,
        offset=0
    )
    
    # Check result
    assert agents == mock_records
    assert total == 2
    
    # Check that database was called correctly
    db.fetchval.assert_called_once()
    db.fetch.assert_called_once()
    
@pytest.mark.asyncio
async def test_update_agent(repository, db):
    """Test updating an agent."""
    # Mock database responses
    mock_current = {
        "id": "123",
        "agent_id": "test_agent",
        "agent_type": "copy_trading",
        "name": "Test Agent",
        "status": "initialized",
        "config": {"key": "value"},
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "metrics": {"metric1": 1, "metric2": 2}
    }
    mock_updated = {
        "id": "123",
        "agent_id": "test_agent",
        "agent_type": "copy_trading",
        "name": "Updated Agent",
        "status": "initialized",
        "config": {"key": "new_value"},
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    # Set up mock responses
    db.fetchrow.side_effect = [mock_current, mock_updated]
    
    # Update agent
    updated = await repository.update_agent(
        agent_id="test_agent",
        name="Updated Agent",
        config={"key": "new_value"}
    )
    
    # Check result
    assert updated == mock_updated
    
    # Check that database was called correctly
    assert db.fetchrow.call_count == 2
    
@pytest.mark.asyncio
async def test_delete_agent(repository, db):
    """Test deleting an agent."""
    # Mock database response
    db.fetchval.return_value = "test_agent"
    
    # Delete agent
    result = await repository.delete_agent("test_agent")
    
    # Check result
    assert result is True
    
    # Check that database was called correctly
    db.fetchval.assert_called_once()
    args = db.fetchval.call_args[0]
    assert "DELETE FROM agents" in args[0]
    assert args[1] == "test_agent"
    
@pytest.mark.asyncio
async def test_update_agent_status(repository, db):
    """Test updating an agent's status."""
    # Mock database response
    mock_record = {
        "id": "123",
        "agent_id": "test_agent",
        "agent_type": "copy_trading",
        "name": "Test Agent",
        "status": "running",
        "config": {"key": "value"},
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    db.fetchrow.return_value = mock_record
    
    # Update status
    updated = await repository.update_agent_status("test_agent", "running")
    
    # Check result
    assert updated == mock_record
    
    # Check that database was called correctly
    db.fetchrow.assert_called_once()
    args = db.fetchrow.call_args[0]
    assert "UPDATE agents" in args[0]
    assert args[1] == "test_agent"
    assert args[2] == "running"
    
@pytest.mark.asyncio
async def test_add_agent_log(repository, db):
    """Test adding an agent log."""
    # Mock database response
    mock_record = {
        "id": "123",
        "agent_id": "test_agent",
        "timestamp": datetime.now(),
        "level": "info",
        "message": "Test message"
    }
    db.fetchrow.return_value = mock_record
    
    # Add log
    log = await repository.add_agent_log(
        agent_id="test_agent",
        level="info",
        message="Test message"
    )
    
    # Check result
    assert log == mock_record
    
    # Check that database was called correctly
    db.fetchrow.assert_called_once()
    args = db.fetchrow.call_args[0]
    assert "INSERT INTO agent_logs" in args[0]
    assert args[1] == "test_agent"
    assert args[2] == "info"
    assert args[3] == "Test message"
    
@pytest.mark.asyncio
async def test_get_agent_logs(repository, db):
    """Test getting agent logs."""
    # Mock database response
    mock_records = [
        {
            "id": "123",
            "agent_id": "test_agent",
            "timestamp": datetime.now(),
            "level": "info",
            "message": "Test message 1"
        },
        {
            "id": "456",
            "agent_id": "test_agent",
            "timestamp": datetime.now(),
            "level": "error",
            "message": "Test message 2"
        }
    ]
    db.fetch.return_value = mock_records
    
    # Get logs
    logs = await repository.get_agent_logs(
        agent_id="test_agent",
        level="info",
        limit=10,
        offset=0
    )
    
    # Check result
    assert logs == mock_records
    
    # Check that database was called correctly
    db.fetch.assert_called_once()
    
@pytest.mark.asyncio
async def test_add_agent_metric(repository, db):
    """Test adding an agent metric."""
    # Mock database response
    mock_record = {
        "id": "123",
        "agent_id": "test_agent",
        "timestamp": datetime.now(),
        "metric_name": "test_metric",
        "metric_value": 42.0,
        "metric_value_str": None,
        "metric_type": "gauge"
    }
    db.fetchrow.return_value = mock_record
    
    # Add metric
    metric = await repository.add_agent_metric(
        agent_id="test_agent",
        metric_name="test_metric",
        metric_value=42.0,
        metric_type="gauge"
    )
    
    # Check result
    assert metric == mock_record
    
    # Check that database was called correctly
    db.fetchrow.assert_called_once()
    args = db.fetchrow.call_args[0]
    assert "INSERT INTO agent_metrics" in args[0]
    assert args[1] == "test_agent"
    assert args[2] == "test_metric"
    assert args[3] == 42.0
    assert args[5] == "gauge"
    
@pytest.mark.asyncio
async def test_get_agent_metrics(repository, db):
    """Test getting agent metrics."""
    # Mock database response
    mock_records = [
        {
            "id": "123",
            "agent_id": "test_agent",
            "timestamp": datetime.now(),
            "metric_name": "test_metric",
            "metric_value": 42.0,
            "metric_value_str": None,
            "metric_type": "gauge"
        },
        {
            "id": "456",
            "agent_id": "test_agent",
            "timestamp": datetime.now(),
            "metric_name": "test_metric",
            "metric_value": 43.0,
            "metric_value_str": None,
            "metric_type": "gauge"
        }
    ]
    db.fetch.return_value = mock_records
    
    # Get metrics
    metrics = await repository.get_agent_metrics(
        agent_id="test_agent",
        metric_name="test_metric",
        start_time=datetime.now() - timedelta(days=1),
        end_time=datetime.now(),
        limit=10
    )
    
    # Check result
    assert metrics == mock_records
    
    # Check that database was called correctly
    db.fetch.assert_called_once()
