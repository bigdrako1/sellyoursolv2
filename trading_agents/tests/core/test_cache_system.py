"""
Tests for the caching system.
"""
import pytest
import asyncio
import os
import shutil
import time
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch, AsyncMock

from core.cache_manager import CacheManager, CacheLevel, InvalidationStrategy
from core.resource_pool import ResourcePool
from core.cache_preloader import CachePreloader

@pytest.fixture
def cache_dir():
    """Create a temporary cache directory."""
    cache_dir = "test_cache"
    os.makedirs(cache_dir, exist_ok=True)
    yield cache_dir
    shutil.rmtree(cache_dir)

@pytest.fixture
async def cache_manager(cache_dir):
    """Create a cache manager for testing."""
    config = {
        "memory_max_size": 100,
        "disk_max_size": 1024 * 1024,  # 1 MB
        "default_ttl": 60,
        "disk_cache_enabled": True,
        "disk_cache_dir": cache_dir,
        "invalidation_strategy": InvalidationStrategy.LRU.value
    }
    
    cache_manager = CacheManager(config)
    yield cache_manager
    await cache_manager.clear()

@pytest.fixture
async def resource_pool(cache_manager):
    """Create a resource pool for testing."""
    resource_pool = ResourcePool()
    resource_pool.cache_manager = cache_manager
    
    # Mock the HTTP client
    client_mock = AsyncMock()
    response_mock = AsyncMock()
    response_mock.status = 200
    response_mock.content_type = "application/json"
    response_mock.json.return_value = {"test": "data"}
    client_mock.request.return_value.__aenter__.return_value = response_mock
    
    with patch.object(resource_pool, "get_http_client", return_value=client_mock):
        yield resource_pool
    
    await resource_pool.close()

@pytest.fixture
async def cache_preloader(resource_pool):
    """Create a cache preloader for testing."""
    preloader = CachePreloader(resource_pool)
    yield preloader
    await preloader.stop()

@pytest.mark.asyncio
async def test_cache_manager_memory_cache(cache_manager):
    """Test the memory cache."""
    # Set a value
    await cache_manager.set("test_key", "test_value", 60, CacheLevel.MEMORY)
    
    # Get the value
    value = await cache_manager.get("test_key", None, CacheLevel.MEMORY)
    
    # Check the value
    assert value == "test_value"
    
    # Delete the value
    deleted = await cache_manager.delete("test_key", CacheLevel.MEMORY)
    
    # Check that it was deleted
    assert deleted is True
    
    # Try to get the deleted value
    value = await cache_manager.get("test_key", None, CacheLevel.MEMORY)
    
    # Check that it's None
    assert value is None

@pytest.mark.asyncio
async def test_cache_manager_disk_cache(cache_manager):
    """Test the disk cache."""
    # Set a value
    await cache_manager.set("test_key", "test_value", 60, CacheLevel.DISK)
    
    # Get the value
    value = await cache_manager.get("test_key", None, CacheLevel.DISK)
    
    # Check the value
    assert value == "test_value"
    
    # Delete the value
    deleted = await cache_manager.delete("test_key", CacheLevel.DISK)
    
    # Check that it was deleted
    assert deleted is True
    
    # Try to get the deleted value
    value = await cache_manager.get("test_key", None, CacheLevel.DISK)
    
    # Check that it's None
    assert value is None

@pytest.mark.asyncio
async def test_cache_manager_expiration(cache_manager):
    """Test cache expiration."""
    # Set a value with a short TTL
    await cache_manager.set("test_key", "test_value", 1)
    
    # Get the value immediately
    value = await cache_manager.get("test_key")
    
    # Check the value
    assert value == "test_value"
    
    # Wait for expiration
    await asyncio.sleep(1.1)
    
    # Try to get the expired value
    value = await cache_manager.get("test_key")
    
    # Check that it's None
    assert value is None

@pytest.mark.asyncio
async def test_cache_manager_invalidation_by_pattern(cache_manager):
    """Test invalidation by pattern."""
    # Set some values
    await cache_manager.set("test:1", "value1")
    await cache_manager.set("test:2", "value2")
    await cache_manager.set("other:1", "value3")
    
    # Invalidate by pattern
    count = await cache_manager.invalidate_by_pattern("test:.*")
    
    # Check that the correct number of entries were invalidated
    assert count == 2
    
    # Check that the invalidated entries are gone
    assert await cache_manager.get("test:1") is None
    assert await cache_manager.get("test:2") is None
    
    # Check that the other entry is still there
    assert await cache_manager.get("other:1") == "value3"

@pytest.mark.asyncio
async def test_cache_manager_invalidation_by_tag(cache_manager):
    """Test invalidation by tag."""
    # Set some values with tags
    await cache_manager.set("key1", "value1", tags=["tag1", "tag2"])
    await cache_manager.set("key2", "value2", tags=["tag2"])
    await cache_manager.set("key3", "value3", tags=["tag3"])
    
    # Invalidate by tag
    count = await cache_manager.invalidate_by_tag("tag2")
    
    # Check that the correct number of entries were invalidated
    assert count == 2
    
    # Check that the invalidated entries are gone
    assert await cache_manager.get("key1") is None
    assert await cache_manager.get("key2") is None
    
    # Check that the other entry is still there
    assert await cache_manager.get("key3") == "value3"

@pytest.mark.asyncio
async def test_resource_pool_cache_integration(resource_pool):
    """Test integration with resource pool."""
    # Set a value
    await resource_pool.cache_set("test_key", "test_value", 60)
    
    # Get the value
    value = await resource_pool.cache_get("test_key")
    
    # Check the value
    assert value == "test_value"
    
    # Delete the value
    await resource_pool.cache_delete("test_key")
    
    # Try to get the deleted value
    value = await resource_pool.cache_get("test_key")
    
    # Check that it's None
    assert value is None

@pytest.mark.asyncio
async def test_cache_preloader(cache_preloader, resource_pool):
    """Test the cache preloader."""
    # Create a mock loader function
    async def mock_loader(arg1, arg2, kwarg1=None):
        return f"{arg1}:{arg2}:{kwarg1}"
    
    # Register a task
    cache_preloader.register_task(
        name="test_task",
        loader_func=mock_loader,
        interval=60,
        args=["arg1", "arg2"],
        kwargs={"kwarg1": "kwarg1"},
        cache_key="test_key",
        cache_ttl=60,
        tags=["test"],
        enabled=True
    )
    
    # Run the task immediately
    await cache_preloader.run_task_now("test_task")
    
    # Check that the value was cached
    value = await resource_pool.cache_get("test_key")
    
    # Check the value
    assert value == "arg1:arg2:kwarg1"
    
    # Get task stats
    stats = await cache_preloader.get_stats()
    
    # Check that the task was run
    assert stats["preload_count"] == 1
    assert stats["task_stats"]["test_task"]["error_count"] == 0
