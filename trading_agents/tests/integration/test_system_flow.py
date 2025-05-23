"""
Integration tests for the entire trading agent system flow.

This module tests the complete flow from agent creation to execution,
including caching, database operations, and execution engine functionality.
"""
import asyncio
import pytest
import time
import uuid
from typing import Dict, Any, List

from trading_agents.core.agent_registry import AgentRegistry
from trading_agents.core.cache_manager import CacheLevel
from trading_agents.core.execution_engine import ExecutionEngine
from trading_agents.core.resource_pool import ResourcePool

# Test agent configuration
TEST_AGENT_CONFIG = {
    "name": "test_integration_agent",
    "type": "simple_trader",
    "description": "Test agent for integration testing",
    "config": {
        "symbol": "BTCUSDT",
        "timeframe": "1m",
        "strategy": "simple_moving_average",
        "parameters": {
            "short_period": 10,
            "long_period": 20,
            "volume_threshold": 100
        }
    }
}

@pytest.mark.asyncio
async def test_agent_creation_and_execution(agent_registry, execution_engine, resource_pool):
    """Test the complete flow of agent creation and execution."""
    # Generate a unique agent ID
    agent_id = f"test_agent_{uuid.uuid4().hex[:8]}"
    TEST_AGENT_CONFIG["name"] = agent_id
    
    # Step 1: Create an agent
    agent = await agent_registry.create_agent(TEST_AGENT_CONFIG)
    assert agent is not None
    assert agent.id is not None
    assert agent.name == agent_id
    
    # Step 2: Verify agent was stored in the database
    db_agent = await agent_registry.get_agent(agent.id)
    assert db_agent is not None
    assert db_agent.id == agent.id
    assert db_agent.name == agent_id
    
    # Step 3: Execute the agent
    task_id = await execution_engine.execute_agent(agent.id, {})
    assert task_id is not None
    
    # Step 4: Wait for execution to complete
    max_wait = 30  # seconds
    start_time = time.time()
    task_status = None
    
    while time.time() - start_time < max_wait:
        task_status = await execution_engine.get_task_status(task_id)
        if task_status["status"] in ("completed", "failed"):
            break
        await asyncio.sleep(0.5)
    
    assert task_status is not None
    assert task_status["status"] == "completed"
    
    # Step 5: Verify execution results were cached
    cache_key = f"execution_result:{task_id}"
    cached_result = await resource_pool.cache_get(cache_key)
    assert cached_result is not None
    
    # Step 6: Clean up
    await agent_registry.delete_agent(agent.id)
    deleted_agent = await agent_registry.get_agent(agent.id)
    assert deleted_agent is None

@pytest.mark.asyncio
async def test_cache_system_integration(resource_pool):
    """Test the cache system integration with the resource pool."""
    # Step 1: Set a value in the cache
    test_key = f"test_key_{uuid.uuid4().hex[:8]}"
    test_value = {"data": "test_value", "timestamp": time.time()}
    
    await resource_pool.cache_set(
        key=test_key,
        value=test_value,
        ttl=60,
        tags=["test", "integration"]
    )
    
    # Step 2: Get the value from the cache
    cached_value = await resource_pool.cache_get(test_key)
    assert cached_value is not None
    assert cached_value["data"] == "test_value"
    
    # Step 3: Test cache invalidation by tag
    await resource_pool.cache_invalidate_by_tag("test")
    invalidated_value = await resource_pool.cache_get(test_key)
    assert invalidated_value is None
    
    # Step 4: Test distributed caching if enabled
    if resource_pool.cache_manager.distributed_cache_enabled:
        dist_key = f"dist_test_key_{uuid.uuid4().hex[:8]}"
        dist_value = {"data": "distributed_test", "timestamp": time.time()}
        
        # Set in distributed cache only
        await resource_pool.cache_set(
            key=dist_key,
            value=dist_value,
            ttl=60,
            level=CacheLevel.DISTRIBUTED,
            tags=["test", "distributed"]
        )
        
        # Get from distributed cache
        dist_cached_value = await resource_pool.cache_get(
            dist_key, 
            level=CacheLevel.DISTRIBUTED
        )
        assert dist_cached_value is not None
        assert dist_cached_value["data"] == "distributed_test"
        
        # Verify it's not in memory cache
        memory_value = await resource_pool.cache_get(
            dist_key, 
            level=CacheLevel.MEMORY
        )
        assert memory_value is None

@pytest.mark.asyncio
async def test_cache_dependency_tracking(resource_pool):
    """Test cache dependency tracking."""
    # Step 1: Set parent value
    parent_key = f"parent_key_{uuid.uuid4().hex[:8]}"
    parent_value = {"data": "parent_value", "timestamp": time.time()}
    
    await resource_pool.cache_set(
        key=parent_key,
        value=parent_value,
        ttl=60,
        tags=["test", "parent"]
    )
    
    # Step 2: Set child value with dependency
    child_key = f"child_key_{uuid.uuid4().hex[:8]}"
    child_value = {"data": "child_value", "timestamp": time.time()}
    
    await resource_pool.cache_manager.set(
        key=child_key,
        value=child_value,
        ttl=60,
        tags=["test", "child"],
        depends_on=[parent_key]
    )
    
    # Step 3: Verify dependency tracking
    dependencies = await resource_pool.cache_manager.get_dependencies(child_key)
    assert parent_key in dependencies
    
    dependents = await resource_pool.cache_manager.get_dependents(parent_key)
    assert child_key in dependents
    
    # Step 4: Delete parent and verify child is also deleted
    await resource_pool.cache_delete(parent_key)
    
    # Child should be automatically deleted due to dependency
    child_cached = await resource_pool.cache_get(child_key)
    assert child_cached is None

@pytest.mark.asyncio
async def test_cache_preloader_integration(resource_pool):
    """Test cache preloader integration."""
    # Step 1: Register a preload task
    async def test_loader(param1, param2):
        return {"param1": param1, "param2": param2, "timestamp": time.time()}
    
    task_name = f"test_task_{uuid.uuid4().hex[:8]}"
    cache_key = f"preload_test_{uuid.uuid4().hex[:8]}"
    
    resource_pool.register_preload_task(
        name=task_name,
        loader_func=test_loader,
        interval=60,
        args=["value1", "value2"],
        cache_key=cache_key,
        cache_ttl=120,
        tags=["test", "preloader"],
        enabled=True
    )
    
    # Step 2: Run the task immediately
    success = await resource_pool.run_preload_task_now(task_name)
    assert success is True
    
    # Step 3: Verify the data was cached
    await asyncio.sleep(0.5)  # Give it a moment to complete
    cached_data = await resource_pool.cache_get(cache_key)
    assert cached_data is not None
    assert cached_data["param1"] == "value1"
    assert cached_data["param2"] == "value2"
    
    # Step 4: Unregister the task
    resource_pool.unregister_preload_task(task_name)
    
    # Step 5: Verify task was unregistered
    stats = await resource_pool.get_preloader_stats()
    assert task_name not in stats.get("task_stats", {})
