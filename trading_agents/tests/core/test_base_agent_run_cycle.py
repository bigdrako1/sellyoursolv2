"""
Tests for the BaseAgent run_cycle method.
"""
import pytest
import asyncio
from unittest.mock import MagicMock, patch
from datetime import datetime

from core.base_agent import BaseAgent
from core.agent_status import AgentStatus
from core.resource_pool import ResourcePool

class TestAgent(BaseAgent):
    """Test agent implementation."""
    
    def __init__(self, agent_id, config, should_raise=False):
        super().__init__(agent_id, config)
        self.should_raise = should_raise
        self.run_cycle_called = False
        
    async def _initialize(self):
        pass
        
    async def _cleanup(self):
        pass
        
    async def _on_config_update(self, old_config, new_config):
        pass
        
    async def _run_cycle(self, resource_pool):
        self.run_cycle_called = True
        
        if self.should_raise:
            raise Exception("Test error")
            
        return {"test": "result"}

@pytest.mark.asyncio
async def test_run_cycle_not_running():
    """Test run_cycle when agent is not running."""
    # Create agent
    agent = TestAgent("test_agent", {"name": "Test Agent"})
    
    # Create resource pool
    resource_pool = ResourcePool()
    
    # Run cycle
    result = await agent.run_cycle(resource_pool)
    
    # Check result
    assert result["success"] is False
    assert "not running" in result["message"]
    assert agent.run_cycle_called is False
    
@pytest.mark.asyncio
async def test_run_cycle_success():
    """Test run_cycle with successful execution."""
    # Create agent
    agent = TestAgent("test_agent", {"name": "Test Agent"})
    agent.status = AgentStatus.RUNNING
    
    # Create resource pool
    resource_pool = ResourcePool()
    
    # Run cycle
    result = await agent.run_cycle(resource_pool)
    
    # Check result
    assert result["success"] is True
    assert "duration" in result
    assert result["results"] == {"test": "result"}
    assert agent.run_cycle_called is True
    
    # Check metrics
    assert agent.metrics.get_metric("last_cycle_completed", "gauges") is not None
    assert agent.metrics.get_metric("last_cycle_time", "gauges") is not None
    assert agent.metrics.get_metric("cycles_completed", "counters") == 1
    
@pytest.mark.asyncio
async def test_run_cycle_error():
    """Test run_cycle with error."""
    # Create agent that raises an error
    agent = TestAgent("test_agent", {"name": "Test Agent"}, should_raise=True)
    agent.status = AgentStatus.RUNNING
    
    # Create resource pool
    resource_pool = ResourcePool()
    
    # Run cycle
    result = await agent.run_cycle(resource_pool)
    
    # Check result
    assert result["success"] is False
    assert "duration" in result
    assert "error" in result
    assert result["error"] == "Test error"
    assert agent.run_cycle_called is True
    
    # Check metrics
    assert agent.metrics.get_metric("last_cycle_time", "gauges") is not None
    assert agent.metrics.get_metric("last_cycle_error", "gauges") == "Test error"
    assert agent.metrics.get_metric("cycles_failed", "counters") == 1
    assert agent.metrics.get_metric("errors", "counters") == 1
    
@pytest.mark.asyncio
async def test_run_cycle_timing():
    """Test run_cycle timing measurement."""
    # Create agent with delayed execution
    class DelayedAgent(TestAgent):
        async def _run_cycle(self, resource_pool):
            self.run_cycle_called = True
            await asyncio.sleep(0.1)  # Small delay
            return {"test": "result"}
            
    agent = DelayedAgent("test_agent", {"name": "Test Agent"})
    agent.status = AgentStatus.RUNNING
    
    # Create resource pool
    resource_pool = ResourcePool()
    
    # Run cycle
    result = await agent.run_cycle(resource_pool)
    
    # Check result
    assert result["success"] is True
    assert result["duration"] >= 0.1  # Should be at least the sleep time
    assert agent.run_cycle_called is True
    
    # Check metrics
    cycle_time = agent.metrics.get_metric("last_cycle_time", "gauges")
    assert cycle_time is not None
    assert cycle_time >= 0.1  # Should be at least the sleep time
