"""
Tests for the AgentRegistry with ExecutionEngine integration.
"""
import pytest
import asyncio
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime

from core.agent_registry import AgentRegistry
from core.base_agent import BaseAgent
from core.agent_status import AgentStatus
from core.execution_engine import ExecutionEngine, TaskPriority

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

@pytest.fixture
async def registry():
    """Create an agent registry for testing."""
    # Create registry
    registry = AgentRegistry.get_instance()
    
    # Mock the execution engine
    registry._execution_engine = MagicMock(spec=ExecutionEngine)
    registry._execution_engine.schedule_agent_cycle = AsyncMock()
    registry._execution_engine.start = AsyncMock()
    registry._execution_engine.stop = AsyncMock()
    
    # Start the registry
    await registry.start()
    
    yield registry
    
    # Clean up
    await registry.stop()
    
    # Reset the singleton for other tests
    AgentRegistry._instance = None

@pytest.mark.asyncio
async def test_registry_start_stop(registry):
    """Test starting and stopping the registry."""
    # Check that execution engine was started
    registry._execution_engine.start.assert_called_once()
    
    # Stop the registry
    await registry.stop()
    
    # Check that execution engine was stopped
    registry._execution_engine.stop.assert_called_once()

@pytest.mark.asyncio
async def test_start_agent_schedules_cycle(registry):
    """Test that starting an agent schedules a cycle."""
    # Register a mock agent
    agent = MockAgent("test_agent", {"name": "Test Agent"})
    registry.agents["test_agent"] = agent
    
    # Start the agent
    result = await registry.start_agent("test_agent")
    
    # Check result
    assert result["success"] is True
    assert result["status"] == "running"
    
    # Check that agent was started
    assert agent.start_called is True
    
    # Check that a cycle was scheduled
    registry._execution_engine.schedule_agent_cycle.assert_called_once_with(agent)

@pytest.mark.asyncio
async def test_stop_agent(registry):
    """Test stopping an agent."""
    # Register a mock agent
    agent = MockAgent("test_agent", {"name": "Test Agent"})
    agent.status = AgentStatus.RUNNING
    registry.agents["test_agent"] = agent
    
    # Stop the agent
    result = await registry.stop_agent("test_agent")
    
    # Check result
    assert result["success"] is True
    assert result["status"] == "stopped"
    
    # Check that agent was stopped
    assert agent.stop_called is True
    
    # No need to check for cancellation of scheduled tasks
    # as that's handled by the execution engine

@pytest.mark.asyncio
async def test_start_all_agents(registry):
    """Test starting all agents."""
    # Register mock agents
    agent1 = MockAgent("agent1", {"name": "Agent 1"})
    agent2 = MockAgent("agent2", {"name": "Agent 2"})
    registry.agents["agent1"] = agent1
    registry.agents["agent2"] = agent2
    
    # Start all agents
    results = await registry.start_all_agents()
    
    # Check results
    assert results["agent1"]["success"] is True
    assert results["agent2"]["success"] is True
    
    # Check that agents were started
    assert agent1.start_called is True
    assert agent2.start_called is True
    
    # Check that cycles were scheduled
    assert registry._execution_engine.schedule_agent_cycle.call_count == 2

@pytest.mark.asyncio
async def test_stop_all_agents(registry):
    """Test stopping all agents."""
    # Register mock agents
    agent1 = MockAgent("agent1", {"name": "Agent 1"})
    agent1.status = AgentStatus.RUNNING
    agent2 = MockAgent("agent2", {"name": "Agent 2"})
    agent2.status = AgentStatus.RUNNING
    registry.agents["agent1"] = agent1
    registry.agents["agent2"] = agent2
    
    # Stop all agents
    results = await registry.stop_all_agents()
    
    # Check results
    assert results["agent1"]["success"] is True
    assert results["agent2"]["success"] is True
    
    # Check that agents were stopped
    assert agent1.stop_called is True
    assert agent2.stop_called is True
