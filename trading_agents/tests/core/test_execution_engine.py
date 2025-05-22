"""
Tests for the ExecutionEngine class.
"""
import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

from core.execution_engine import ExecutionEngine, TaskPriority, AgentTask
from core.resource_pool import ResourcePool
from core.adaptive_scheduler import AdaptiveScheduler
from core.base_agent import BaseAgent
from core.agent_status import AgentStatus

class MockAgent(BaseAgent):
    """Mock agent for testing."""
    
    async def _initialize(self):
        pass
        
    async def _cleanup(self):
        pass
        
    async def _on_config_update(self, old_config, new_config):
        pass
        
    async def _run_cycle(self, resource_pool):
        return {"test": "result"}

@pytest.mark.asyncio
async def test_execution_engine_initialization():
    """Test ExecutionEngine initialization."""
    # Create engine
    engine = ExecutionEngine()
    
    # Check initial state
    assert engine.resource_pool is not None
    assert engine.scheduler is not None
    assert engine._running is False
    assert engine._task_queue == []
    assert engine._running_tasks == set()
    
@pytest.mark.asyncio
async def test_execution_engine_start_stop():
    """Test ExecutionEngine start and stop."""
    # Create engine
    engine = ExecutionEngine()
    
    # Start engine
    await engine.start()
    assert engine._running is True
    assert engine._main_task is not None
    assert engine._health_check_task is not None
    
    # Stop engine
    await engine.stop()
    assert engine._running is False
    
@pytest.mark.asyncio
async def test_schedule_agent_cycle():
    """Test scheduling an agent cycle."""
    # Create engine
    engine = ExecutionEngine()
    
    # Create mock agent
    agent = MockAgent("test_agent", {"name": "Test Agent"})
    agent.status = AgentStatus.RUNNING
    
    # Start engine
    await engine.start()
    
    try:
        # Schedule agent cycle
        await engine.schedule_agent_cycle(agent, TaskPriority.NORMAL)
        
        # Check that task was added to queue
        assert len(engine._task_queue) == 1
        assert engine._task_queue[0].agent_id == "test_agent"
        assert engine._task_queue[0].task_type == "cycle"
        assert engine._task_queue[0].priority == TaskPriority.NORMAL
        
    finally:
        # Stop engine
        await engine.stop()
        
@pytest.mark.asyncio
async def test_schedule_task():
    """Test scheduling a custom task."""
    # Create engine
    engine = ExecutionEngine()
    
    # Create mock coroutine
    async def mock_coroutine(resource_pool):
        return {"test": "result"}
        
    # Start engine
    await engine.start()
    
    try:
        # Schedule task
        await engine.schedule_task(
            agent_id="test_agent",
            task_type="test_task",
            coroutine=mock_coroutine,
            priority=TaskPriority.HIGH
        )
        
        # Check that task was added to queue
        assert len(engine._task_queue) == 1
        assert engine._task_queue[0].agent_id == "test_agent"
        assert engine._task_queue[0].task_type == "test_task"
        assert engine._task_queue[0].priority == TaskPriority.HIGH
        
    finally:
        # Stop engine
        await engine.stop()
        
@pytest.mark.asyncio
async def test_task_priority_ordering():
    """Test that tasks are ordered by priority."""
    # Create engine
    engine = ExecutionEngine()
    
    # Create mock coroutine
    async def mock_coroutine(resource_pool):
        return {"test": "result"}
        
    # Start engine
    await engine.start()
    
    try:
        # Schedule tasks with different priorities
        await engine.schedule_task(
            agent_id="test_agent",
            task_type="normal_task",
            coroutine=mock_coroutine,
            priority=TaskPriority.NORMAL
        )
        
        await engine.schedule_task(
            agent_id="test_agent",
            task_type="high_task",
            coroutine=mock_coroutine,
            priority=TaskPriority.HIGH
        )
        
        await engine.schedule_task(
            agent_id="test_agent",
            task_type="critical_task",
            coroutine=mock_coroutine,
            priority=TaskPriority.CRITICAL
        )
        
        # Check that tasks are ordered by priority
        assert len(engine._task_queue) == 3
        assert engine._task_queue[0].task_type == "critical_task"
        assert engine._task_queue[0].priority == TaskPriority.CRITICAL
        
    finally:
        # Stop engine
        await engine.stop()
        
@pytest.mark.asyncio
async def test_run_task():
    """Test running a task."""
    # Create engine
    engine = ExecutionEngine()
    
    # Create mock coroutine
    mock_result = {"test": "result"}
    mock_coroutine = MagicMock()
    mock_coroutine.return_value = asyncio.Future()
    mock_coroutine.return_value.set_result(mock_result)
    
    # Create task
    task = AgentTask(
        agent_id="test_agent",
        task_type="test_task",
        coroutine=mock_coroutine,
        priority=TaskPriority.NORMAL
    )
    
    # Run task
    await engine._run_task(task)
    
    # Check that coroutine was called
    mock_coroutine.assert_called_once()
    
    # Check that task was removed from running tasks
    assert len(engine._running_tasks) == 0
    
@pytest.mark.asyncio
async def test_run_task_with_error():
    """Test running a task that raises an error."""
    # Create engine
    engine = ExecutionEngine()
    
    # Create mock coroutine that raises an error
    mock_coroutine = MagicMock()
    mock_coroutine.return_value = asyncio.Future()
    mock_coroutine.return_value.set_exception(Exception("Test error"))
    
    # Create task
    task = AgentTask(
        agent_id="test_agent",
        task_type="test_task",
        coroutine=mock_coroutine,
        priority=TaskPriority.NORMAL
    )
    
    # Run task
    await engine._run_task(task)
    
    # Check that coroutine was called
    mock_coroutine.assert_called_once()
    
    # Check that task was removed from running tasks
    assert len(engine._running_tasks) == 0
    
@pytest.mark.asyncio
async def test_run_task_with_timeout():
    """Test running a task that times out."""
    # Create engine
    engine = ExecutionEngine()
    
    # Create mock coroutine that never completes
    async def mock_coroutine(resource_pool):
        await asyncio.sleep(10)
        return {"test": "result"}
        
    # Create task with short timeout
    task = AgentTask(
        agent_id="test_agent",
        task_type="test_task",
        coroutine=mock_coroutine,
        priority=TaskPriority.NORMAL,
        timeout=0.1
    )
    
    # Run task
    await engine._run_task(task)
    
    # Check that task was removed from running tasks
    assert len(engine._running_tasks) == 0
    
@pytest.mark.asyncio
async def test_get_stats():
    """Test getting engine statistics."""
    # Create engine
    engine = ExecutionEngine()
    
    # Get stats
    stats = engine.get_stats()
    
    # Check stats
    assert "running" in stats
    assert "queued_tasks" in stats
    assert "running_tasks" in stats
    assert "agents_tracked" in stats
    assert "resource_pool_stats" in stats
    assert "scheduler_stats" in stats
