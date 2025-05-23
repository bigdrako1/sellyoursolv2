"""
Performance tests for the trading agent system.

This module tests the performance of the system under load,
focusing on caching, database operations, and execution engine.
"""
import asyncio
import pytest
import time
import uuid
import statistics
from typing import Dict, Any, List

from trading_agents.core.agent_registry import AgentRegistry
from trading_agents.core.cache_manager import CacheLevel
from trading_agents.core.execution_engine import ExecutionEngine
from trading_agents.core.resource_pool import ResourcePool

# Test configuration
PERFORMANCE_CONFIG = {
    "cache_test": {
        "iterations": 1000,
        "concurrent_operations": 50,
        "value_size_bytes": 1024,
        "ttl": 60
    },
    "database_test": {
        "iterations": 100,
        "concurrent_operations": 20
    },
    "execution_test": {
        "agent_count": 10,
        "concurrent_executions": 5,
        "iterations": 3
    }
}

@pytest.mark.asyncio
async def test_cache_performance(resource_pool):
    """Test cache performance under load."""
    iterations = PERFORMANCE_CONFIG["cache_test"]["iterations"]
    concurrency = PERFORMANCE_CONFIG["cache_test"]["concurrent_operations"]
    value_size = PERFORMANCE_CONFIG["cache_test"]["value_size_bytes"]
    ttl = PERFORMANCE_CONFIG["cache_test"]["ttl"]
    
    # Create test data
    test_value = "x" * value_size
    
    # Test set performance
    async def set_operation(i):
        key = f"perf_test_key_{i}"
        start_time = time.time()
        await resource_pool.cache_set(key, test_value, ttl)
        end_time = time.time()
        return end_time - start_time
    
    # Run set operations concurrently
    set_tasks = []
    for i in range(iterations):
        if len(set_tasks) >= concurrency:
            # Wait for some tasks to complete
            completed, set_tasks = await asyncio.wait(
                set_tasks, 
                return_when=asyncio.FIRST_COMPLETED
            )
        
        # Add new task
        set_tasks.append(asyncio.create_task(set_operation(i)))
    
    # Wait for remaining tasks
    if set_tasks:
        completed, _ = await asyncio.wait(set_tasks)
    
    # Collect set operation times
    set_times = [task.result() for task in completed]
    
    # Test get performance
    async def get_operation(i):
        key = f"perf_test_key_{i}"
        start_time = time.time()
        await resource_pool.cache_get(key)
        end_time = time.time()
        return end_time - start_time
    
    # Run get operations concurrently
    get_tasks = []
    for i in range(iterations):
        if len(get_tasks) >= concurrency:
            # Wait for some tasks to complete
            completed, get_tasks = await asyncio.wait(
                get_tasks, 
                return_when=asyncio.FIRST_COMPLETED
            )
        
        # Add new task
        get_tasks.append(asyncio.create_task(get_operation(i)))
    
    # Wait for remaining tasks
    if get_tasks:
        completed, _ = await asyncio.wait(get_tasks)
    
    # Collect get operation times
    get_times = [task.result() for task in completed]
    
    # Calculate statistics
    set_avg = statistics.mean(set_times)
    set_p95 = sorted(set_times)[int(len(set_times) * 0.95)]
    get_avg = statistics.mean(get_times)
    get_p95 = sorted(get_times)[int(len(get_times) * 0.95)]
    
    # Print results
    print(f"\nCache Performance Results:")
    print(f"Set operations: {iterations}")
    print(f"Set average time: {set_avg:.6f} seconds")
    print(f"Set P95 time: {set_p95:.6f} seconds")
    print(f"Set operations per second: {iterations / sum(set_times):.2f}")
    print(f"Get operations: {iterations}")
    print(f"Get average time: {get_avg:.6f} seconds")
    print(f"Get P95 time: {get_p95:.6f} seconds")
    print(f"Get operations per second: {iterations / sum(get_times):.2f}")
    
    # Verify performance meets requirements
    assert set_avg < 0.01, f"Set operation too slow: {set_avg:.6f} seconds"
    assert get_avg < 0.005, f"Get operation too slow: {get_avg:.6f} seconds"

@pytest.mark.asyncio
async def test_execution_engine_performance(agent_registry, execution_engine):
    """Test execution engine performance under load."""
    agent_count = PERFORMANCE_CONFIG["execution_test"]["agent_count"]
    concurrency = PERFORMANCE_CONFIG["execution_test"]["concurrent_executions"]
    iterations = PERFORMANCE_CONFIG["execution_test"]["iterations"]
    
    # Create test agents
    agents = []
    for i in range(agent_count):
        agent_config = {
            "name": f"perf_test_agent_{i}",
            "type": "simple_trader",
            "description": f"Performance test agent {i}",
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
        agent = await agent_registry.create_agent(agent_config)
        agents.append(agent)
    
    # Test execution performance
    execution_times = []
    
    for iteration in range(iterations):
        start_time = time.time()
        
        # Execute agents concurrently
        execution_tasks = []
        for agent in agents:
            if len(execution_tasks) >= concurrency:
                # Wait for some tasks to complete
                completed, execution_tasks = await asyncio.wait(
                    execution_tasks, 
                    return_when=asyncio.FIRST_COMPLETED
                )
            
            # Add new execution task
            async def execute_agent(agent_id):
                task_id = await execution_engine.execute_agent(agent_id, {})
                
                # Wait for execution to complete
                while True:
                    status = await execution_engine.get_task_status(task_id)
                    if status["status"] in ("completed", "failed"):
                        break
                    await asyncio.sleep(0.1)
                
                return status
            
            execution_tasks.append(asyncio.create_task(execute_agent(agent.id)))
        
        # Wait for remaining tasks
        if execution_tasks:
            await asyncio.wait(execution_tasks)
        
        end_time = time.time()
        execution_times.append(end_time - start_time)
    
    # Calculate statistics
    avg_time = statistics.mean(execution_times)
    max_time = max(execution_times)
    
    # Print results
    print(f"\nExecution Engine Performance Results:")
    print(f"Agents: {agent_count}")
    print(f"Concurrent executions: {concurrency}")
    print(f"Iterations: {iterations}")
    print(f"Average execution time: {avg_time:.2f} seconds")
    print(f"Maximum execution time: {max_time:.2f} seconds")
    print(f"Agents executed per second: {agent_count / avg_time:.2f}")
    
    # Clean up
    for agent in agents:
        await agent_registry.delete_agent(agent.id)
    
    # Verify performance meets requirements
    assert avg_time / agent_count < 1.0, f"Execution too slow: {avg_time / agent_count:.2f} seconds per agent"

@pytest.mark.asyncio
async def test_distributed_cache_performance(resource_pool):
    """Test distributed cache performance if enabled."""
    if not resource_pool.cache_manager.distributed_cache_enabled:
        pytest.skip("Distributed cache not enabled")
    
    iterations = 100
    value_size = 1024
    ttl = 60
    
    # Create test data
    test_value = "x" * value_size
    
    # Measure distributed cache set performance
    dist_set_times = []
    for i in range(iterations):
        key = f"dist_perf_test_key_{i}"
        start_time = time.time()
        await resource_pool.cache_set(
            key=key,
            value=test_value,
            ttl=ttl,
            level=CacheLevel.DISTRIBUTED
        )
        end_time = time.time()
        dist_set_times.append(end_time - start_time)
    
    # Measure distributed cache get performance
    dist_get_times = []
    for i in range(iterations):
        key = f"dist_perf_test_key_{i}"
        start_time = time.time()
        await resource_pool.cache_get(
            key=key,
            level=CacheLevel.DISTRIBUTED
        )
        end_time = time.time()
        dist_get_times.append(end_time - start_time)
    
    # Calculate statistics
    dist_set_avg = statistics.mean(dist_set_times)
    dist_get_avg = statistics.mean(dist_get_times)
    
    # Print results
    print(f"\nDistributed Cache Performance Results:")
    print(f"Set operations: {iterations}")
    print(f"Set average time: {dist_set_avg:.6f} seconds")
    print(f"Set operations per second: {iterations / sum(dist_set_times):.2f}")
    print(f"Get operations: {iterations}")
    print(f"Get average time: {dist_get_avg:.6f} seconds")
    print(f"Get operations per second: {iterations / sum(dist_get_times):.2f}")
    
    # Compare with local cache
    local_set_times = []
    local_get_times = []
    for i in range(iterations):
        key = f"local_perf_test_key_{i}"
        
        # Set
        start_time = time.time()
        await resource_pool.cache_set(
            key=key,
            value=test_value,
            ttl=ttl,
            level=CacheLevel.MEMORY
        )
        end_time = time.time()
        local_set_times.append(end_time - start_time)
        
        # Get
        start_time = time.time()
        await resource_pool.cache_get(
            key=key,
            level=CacheLevel.MEMORY
        )
        end_time = time.time()
        local_get_times.append(end_time - start_time)
    
    local_set_avg = statistics.mean(local_set_times)
    local_get_avg = statistics.mean(local_get_times)
    
    print(f"\nLocal vs Distributed Cache Comparison:")
    print(f"Local set average: {local_set_avg:.6f} seconds")
    print(f"Distributed set average: {dist_set_avg:.6f} seconds")
    print(f"Local get average: {local_get_avg:.6f} seconds")
    print(f"Distributed get average: {dist_get_avg:.6f} seconds")
    print(f"Set time ratio (distributed/local): {dist_set_avg/local_set_avg:.2f}x")
    print(f"Get time ratio (distributed/local): {dist_get_avg/local_get_avg:.2f}x")
