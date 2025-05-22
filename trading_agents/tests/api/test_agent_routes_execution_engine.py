"""
Tests for the agent routes with execution engine integration.
"""
import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi.testclient import TestClient
from fastapi import FastAPI
import json

from api.app import app
from core.agent_registry import AgentRegistry
from core.execution_engine import ExecutionEngine
from core.base_agent import BaseAgent
from core.agent_status import AgentStatus

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
def client():
    """Create a test client."""
    # Create a test client
    client = TestClient(app)
    
    # Mock the agent registry
    registry = MagicMock(spec=AgentRegistry)
    registry.start_agent = AsyncMock()
    registry.stop_agent = AsyncMock()
    registry.get_agent = AsyncMock()
    
    # Mock the execution engine
    execution_engine = MagicMock(spec=ExecutionEngine)
    execution_engine.schedule_agent_cycle = AsyncMock()
    
    # Set up the registry to return the execution engine
    registry.get_execution_engine.return_value = execution_engine
    
    # Patch the get_agent_registry function
    with patch("api.routes.agent_routes.get_agent_registry", return_value=registry):
        yield client, registry, execution_engine

def test_start_agent(client):
    """Test starting an agent."""
    # Unpack the fixture
    client, registry, execution_engine = client
    
    # Create a mock agent
    agent = MockAgent("test_agent", {"name": "Test Agent"})
    agent.status = AgentStatus.RUNNING
    
    # Set up the registry to return the agent
    registry.get_agent.return_value = agent
    registry.start_agent.return_value = {"success": True, "status": "running"}
    
    # Make the request
    response = client.post("/agents/test_agent/start")
    
    # Check the response
    assert response.status_code == 200
    assert response.json()["status"] == "running"
    
    # Check that the registry was called
    registry.start_agent.assert_called_once_with("test_agent")

def test_stop_agent(client):
    """Test stopping an agent."""
    # Unpack the fixture
    client, registry, execution_engine = client
    
    # Create a mock agent
    agent = MockAgent("test_agent", {"name": "Test Agent"})
    agent.status = AgentStatus.STOPPED
    
    # Set up the registry to return the agent
    registry.get_agent.return_value = agent
    registry.stop_agent.return_value = {"success": True, "status": "stopped"}
    
    # Make the request
    response = client.post("/agents/test_agent/stop")
    
    # Check the response
    assert response.status_code == 200
    assert response.json()["status"] == "stopped"
    
    # Check that the registry was called
    registry.stop_agent.assert_called_once_with("test_agent")

def test_start_agent_error(client):
    """Test starting an agent with an error."""
    # Unpack the fixture
    client, registry, execution_engine = client
    
    # Set up the registry to return an error
    registry.start_agent.return_value = {"success": False, "error": "Test error", "status": "error"}
    
    # Make the request
    response = client.post("/agents/test_agent/start")
    
    # Check the response
    assert response.status_code == 500
    assert "Test error" in response.json()["detail"]
    
    # Check that the registry was called
    registry.start_agent.assert_called_once_with("test_agent")

def test_stop_agent_error(client):
    """Test stopping an agent with an error."""
    # Unpack the fixture
    client, registry, execution_engine = client
    
    # Set up the registry to return an error
    registry.stop_agent.return_value = {"success": False, "error": "Test error", "status": "error"}
    
    # Make the request
    response = client.post("/agents/test_agent/stop")
    
    # Check the response
    assert response.status_code == 500
    assert "Test error" in response.json()["detail"]
    
    # Check that the registry was called
    registry.stop_agent.assert_called_once_with("test_agent")
