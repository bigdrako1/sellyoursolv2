"""
Tests for the AgentRegistry with database integration.
"""
import pytest
import asyncio
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime

from core.agent_registry import AgentRegistry
from core.base_agent import BaseAgent
from core.agent_status import AgentStatus
from database import get_agent_repository

class MockAgent(BaseAgent):
    """Mock agent for testing."""
    
    def __init__(self, agent_id, config):
        super().__init__(agent_id, config)
        self.start_called = False
        self.stop_called = False
        self.run_cycle_called = False
        
    async def _initialize(self):
        pass
        
    async def _cleanup(self):
        pass
        
    async def _on_config_update(self, old_config, new_config):
        pass
        
    async def _run_cycle(self, resource_pool):
        self.run_cycle_called = True
        return {"test": "result"}
        
    async def start(self):
        await super().start()
        self.start_called = True
        
    async def stop(self):
        await super().stop()
        self.stop_called = True
        
    async def get_status(self):
        return {
            "status": self.status.value,
            "config": self.config,
            "metrics": {}
        }

@pytest.fixture
async def mock_agent_repo():
    """Create a mock agent repository."""
    mock_repo = AsyncMock()
    
    # Mock create_agent
    mock_repo.create_agent.return_value = {
        "agent_id": "test_agent",
        "agent_type": "test",
        "name": "Test Agent",
        "status": "stopped",
        "config": {"name": "Test Agent"},
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    # Mock delete_agent
    mock_repo.delete_agent.return_value = True
    
    # Mock update_agent_status
    mock_repo.update_agent_status.return_value = True
    
    # Mock add_agent_log
    mock_repo.add_agent_log.return_value = True
    
    # Mock get_agents
    mock_repo.get_agents.return_value = (
        [
            {
                "agent_id": "test_agent",
                "agent_type": "test",
                "name": "Test Agent",
                "status": "stopped",
                "config": {"name": "Test Agent"},
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
        ],
        1
    )
    
    # Mock get_agent_logs
    mock_repo.get_agent_logs.return_value = [
        {
            "timestamp": datetime.now().isoformat(),
            "agent_id": "test_agent",
            "level": "info",
            "message": "Test log message"
        }
    ]
    
    return mock_repo

@pytest.fixture
async def registry(mock_agent_repo):
    """Create an agent registry for testing."""
    # Create registry
    registry = AgentRegistry.get_instance()
    
    # Mock the execution engine
    registry._execution_engine = AsyncMock()
    registry._execution_engine.schedule_agent_cycle = AsyncMock()
    registry._execution_engine.start = AsyncMock()
    registry._execution_engine.stop = AsyncMock()
    
    # Patch the get_agent_repository function
    with patch("core.agent_registry.get_agent_repository", return_value=mock_agent_repo):
        yield registry
    
    # Reset the singleton for other tests
    AgentRegistry._instance = None

@pytest.mark.asyncio
async def test_register_agent_with_database(registry, mock_agent_repo):
    """Test registering an agent with database integration."""
    # Register an agent
    agent = await registry.register_agent("test", "test_agent", {"name": "Test Agent"})
    
    # Check that the agent was created in the database
    mock_agent_repo.create_agent.assert_called_once_with(
        agent_id="test_agent",
        agent_type="test",
        name="Test Agent",
        config={"name": "Test Agent"}
    )
    
    # Check that the agent was added to the registry
    assert "test_agent" in registry.agents
    assert registry.agents["test_agent"] == agent

@pytest.mark.asyncio
async def test_unregister_agent_with_database(registry, mock_agent_repo):
    """Test unregistering an agent with database integration."""
    # Add an agent to the registry
    agent = MockAgent("test_agent", {"name": "Test Agent"})
    registry.agents["test_agent"] = agent
    
    # Unregister the agent
    await registry.unregister_agent("test_agent")
    
    # Check that the agent was deleted from the database
    mock_agent_repo.delete_agent.assert_called_once_with("test_agent")
    
    # Check that the agent was removed from the registry
    assert "test_agent" not in registry.agents

@pytest.mark.asyncio
async def test_start_agent_with_database(registry, mock_agent_repo):
    """Test starting an agent with database integration."""
    # Add an agent to the registry
    agent = MockAgent("test_agent", {"name": "Test Agent"})
    registry.agents["test_agent"] = agent
    
    # Start the agent
    result = await registry.start_agent("test_agent")
    
    # Check that the agent was started
    assert agent.start_called is True
    
    # Check that the agent status was updated in the database
    mock_agent_repo.update_agent_status.assert_called_once_with("test_agent", "running")
    
    # Check that a log entry was added
    mock_agent_repo.add_agent_log.assert_called_once()
    
    # Check the result
    assert result["success"] is True
    assert result["status"] == "running"

@pytest.mark.asyncio
async def test_stop_agent_with_database(registry, mock_agent_repo):
    """Test stopping an agent with database integration."""
    # Add an agent to the registry
    agent = MockAgent("test_agent", {"name": "Test Agent"})
    agent.status = AgentStatus.RUNNING
    registry.agents["test_agent"] = agent
    
    # Stop the agent
    result = await registry.stop_agent("test_agent")
    
    # Check that the agent was stopped
    assert agent.stop_called is True
    
    # Check that the agent status was updated in the database
    mock_agent_repo.update_agent_status.assert_called_once_with("test_agent", "stopped")
    
    # Check that a log entry was added
    mock_agent_repo.add_agent_log.assert_called_once()
    
    # Check the result
    assert result["success"] is True
    assert result["status"] == "stopped"

@pytest.mark.asyncio
async def test_get_agents_with_database(registry, mock_agent_repo):
    """Test getting agents with database integration."""
    # Get agents
    result = await registry.get_agents(
        agent_type="test",
        status="running",
        limit=10,
        offset=0
    )
    
    # Check that the database was queried
    mock_agent_repo.get_agents.assert_called_once_with(
        agent_type="test",
        status="running",
        limit=10,
        offset=0
    )
    
    # Check the result
    assert "agents" in result
    assert "total" in result
    assert result["total"] == 1
