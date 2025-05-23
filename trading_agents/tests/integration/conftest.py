"""
Pytest configuration for integration tests.

This module provides fixtures for integration testing the entire trading agent system.
"""
import asyncio
import logging
import os
import pytest
import tempfile
from typing import Dict, Any, List, Optional

from trading_agents.core.agent_registry import AgentRegistry
from trading_agents.core.cache_manager import CacheManager, CacheLevel, InvalidationStrategy
from trading_agents.core.cache_adapters import RedisAdapter
from trading_agents.core.execution_engine import ExecutionEngine
from trading_agents.core.resource_pool import ResourcePool
from trading_agents.database.db import initialize_db_pool, close_db_pool

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Test configuration
TEST_CONFIG = {
    "cache": {
        "memory_max_size": 1000,
        "disk_max_size": 10 * 1024 * 1024,  # 10 MB
        "disk_cache_enabled": True,
        "distributed_cache_enabled": False,  # Set to True to test with Redis
        "dependency_tracking_enabled": True,
        "invalidation_strategy": "lru"
    },
    "database": {
        "host": "localhost",
        "port": 5432,
        "user": "postgres",
        "password": "postgres",
        "database": "trading_test",
        "min_size": 2,
        "max_size": 10
    },
    "http": {
        "pool_size": 20,
        "timeout": 30,
        "retry_count": 3,
        "retry_delay": 1.0
    },
    "execution": {
        "max_concurrent_tasks": 20,
        "task_timeout_multiplier": 1.5,
        "max_retries": 3
    }
}

@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def temp_dir():
    """Create a temporary directory for test files."""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield temp_dir

@pytest.fixture(scope="session")
async def cache_config(temp_dir):
    """Create cache configuration for tests."""
    config = TEST_CONFIG["cache"].copy()
    config["disk_cache_dir"] = os.path.join(temp_dir, "cache")
    
    # Create cache directory if it doesn't exist
    os.makedirs(config["disk_cache_dir"], exist_ok=True)
    
    return config

@pytest.fixture(scope="session")
async def distributed_adapter():
    """Create a distributed cache adapter if enabled."""
    if not TEST_CONFIG["cache"]["distributed_cache_enabled"]:
        yield None
        return
    
    # Create Redis adapter
    adapter = RedisAdapter(
        host="localhost",
        port=6379,
        db=0,
        password=None,
        prefix="test:"
    )
    
    yield adapter
    
    # Clean up
    await adapter.clear()
    await adapter.close()

@pytest.fixture(scope="session")
async def cache_manager(cache_config, distributed_adapter):
    """Create a cache manager for tests."""
    if distributed_adapter:
        cache_config["distributed_adapter"] = distributed_adapter
    
    cache_manager = CacheManager(cache_config)
    
    yield cache_manager
    
    # Clean up
    await cache_manager.clear()

@pytest.fixture(scope="session")
async def db_pool():
    """Create a database connection pool for tests."""
    db_config = TEST_CONFIG["database"]
    
    # Initialize database pool
    pool = await initialize_db_pool(
        host=db_config["host"],
        port=db_config["port"],
        user=db_config["user"],
        password=db_config["password"],
        database=db_config["database"],
        min_size=db_config["min_size"],
        max_size=db_config["max_size"]
    )
    
    yield pool
    
    # Clean up
    await close_db_pool()

@pytest.fixture(scope="session")
async def resource_pool(cache_manager, db_pool):
    """Create a resource pool for tests."""
    # Create resource pool
    resource_pool = ResourcePool()
    
    # Configure resource pool
    resource_pool.cache_manager = cache_manager
    resource_pool.db_pool = db_pool
    resource_pool.http_pool_size = TEST_CONFIG["http"]["pool_size"]
    resource_pool.http_timeout = TEST_CONFIG["http"]["timeout"]
    resource_pool.http_retry_count = TEST_CONFIG["http"]["retry_count"]
    resource_pool.http_retry_delay = TEST_CONFIG["http"]["retry_delay"]
    
    # Start cache preloader
    await resource_pool.start_cache_preloader()
    
    yield resource_pool
    
    # Clean up
    await resource_pool.stop_cache_preloader()

@pytest.fixture(scope="session")
async def execution_engine(resource_pool):
    """Create an execution engine for tests."""
    # Create execution engine
    execution_engine = ExecutionEngine(resource_pool)
    
    # Configure execution engine
    execution_engine.max_concurrent_tasks = TEST_CONFIG["execution"]["max_concurrent_tasks"]
    execution_engine.task_timeout_multiplier = TEST_CONFIG["execution"]["task_timeout_multiplier"]
    execution_engine.max_retries = TEST_CONFIG["execution"]["max_retries"]
    
    # Start execution engine
    await execution_engine.start()
    
    yield execution_engine
    
    # Clean up
    await execution_engine.stop()

@pytest.fixture(scope="session")
async def agent_registry(execution_engine):
    """Create an agent registry for tests."""
    # Get singleton instance
    registry = AgentRegistry.get_instance()
    
    # Set execution engine
    registry.set_execution_engine(execution_engine)
    
    # Start registry
    await registry.start()
    
    yield registry
    
    # Clean up
    await registry.stop()
