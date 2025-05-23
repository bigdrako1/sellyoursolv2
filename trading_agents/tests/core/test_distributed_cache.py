"""
Tests for the distributed cache adapter.
"""
import asyncio
import pytest
import time
from unittest.mock import MagicMock, patch

from trading_agents.core.cache_adapters import RedisAdapter
from trading_agents.core.cache_manager import CacheManager, CacheLevel

@pytest.fixture
async def redis_mock():
    """Mock Redis client."""
    with patch('redis.asyncio.Redis') as redis_mock:
        # Mock Redis client methods
        redis_instance = MagicMock()
        redis_mock.return_value = redis_instance
        
        # Mock get method
        redis_instance.get.return_value = None
        
        # Mock set method
        redis_instance.set.return_value = True
        
        # Mock delete method
        redis_instance.delete.return_value = 1
        
        # Mock exists method
        redis_instance.exists.return_value = 0
        
        # Mock keys method
        redis_instance.keys.return_value = []
        
        # Mock info method
        redis_instance.info.return_value = {
            "used_memory": 1024,
            "used_memory_peak": 2048,
            "connected_clients": 1
        }
        
        yield redis_instance

@pytest.fixture
async def redis_adapter(redis_mock):
    """Redis cache adapter."""
    adapter = RedisAdapter(
        host="localhost",
        port=6379,
        db=0,
        password=None,
        prefix="test:"
    )
    
    # Replace the Redis client with the mock
    adapter.redis = redis_mock
    
    yield adapter
    
    # Clean up
    await adapter.close()

@pytest.fixture
async def cache_manager(redis_adapter):
    """Cache manager with Redis adapter."""
    config = {
        "memory_max_size": 100,
        "disk_max_size": 1024 * 1024,  # 1 MB
        "disk_cache_enabled": True,
        "disk_cache_dir": "test_cache",
        "distributed_cache_enabled": True,
        "distributed_adapter": redis_adapter,
        "dependency_tracking_enabled": True
    }
    
    cache_manager = CacheManager(config)
    
    yield cache_manager
    
    # Clean up
    await cache_manager.clear()

@pytest.mark.asyncio
async def test_redis_adapter_get_set(redis_adapter, redis_mock):
    """Test Redis adapter get and set methods."""
    # Set up mock return value for get
    redis_mock.get.return_value = b'"test_value"'
    
    # Test set
    await redis_adapter.set("test_key", "test_value", 60)
    redis_mock.set.assert_called_once_with(
        "test:test_key", 
        '"test_value"', 
        ex=60
    )
    
    # Test get
    value = await redis_adapter.get("test_key")
    redis_mock.get.assert_called_once_with("test:test_key")
    assert value == "test_value"

@pytest.mark.asyncio
async def test_redis_adapter_delete(redis_adapter, redis_mock):
    """Test Redis adapter delete method."""
    # Set up mock return value for delete
    redis_mock.delete.return_value = 1
    
    # Test delete
    result = await redis_adapter.delete("test_key")
    redis_mock.delete.assert_called_once_with("test:test_key")
    assert result is True
    
    # Test delete non-existent key
    redis_mock.delete.return_value = 0
    result = await redis_adapter.delete("non_existent_key")
    assert result is False

@pytest.mark.asyncio
async def test_redis_adapter_clear(redis_adapter, redis_mock):
    """Test Redis adapter clear method."""
    # Set up mock return values
    redis_mock.keys.return_value = [b"test:key1", b"test:key2"]
    redis_mock.delete.return_value = 2
    
    # Test clear
    await redis_adapter.clear()
    redis_mock.keys.assert_called_once_with("test:*")
    redis_mock.delete.assert_called_once_with(b"test:key1", b"test:key2")

@pytest.mark.asyncio
async def test_redis_adapter_invalidate_by_pattern(redis_adapter, redis_mock):
    """Test Redis adapter invalidate_by_pattern method."""
    # Set up mock return values
    redis_mock.keys.return_value = [b"test:key1", b"test:key2"]
    redis_mock.delete.return_value = 2
    
    # Test invalidate_by_pattern
    count = await redis_adapter.invalidate_by_pattern("key*")
    redis_mock.keys.assert_called_once_with("test:key*")
    redis_mock.delete.assert_called_once_with(b"test:key1", b"test:key2")
    assert count == 2

@pytest.mark.asyncio
async def test_redis_adapter_get_stats(redis_adapter, redis_mock):
    """Test Redis adapter get_stats method."""
    # Set up mock return values
    redis_mock.info.return_value = {
        "used_memory": 1024,
        "used_memory_peak": 2048,
        "connected_clients": 1
    }
    redis_mock.keys.return_value = [b"test:key1", b"test:key2"]
    
    # Test get_stats
    stats = await redis_adapter.get_stats()
    redis_mock.info.assert_called_once()
    redis_mock.keys.assert_called_once_with("test:*")
    
    assert stats["used_memory"] == 1024
    assert stats["used_memory_peak"] == 2048
    assert stats["connected_clients"] == 1
    assert stats["key_count"] == 2

@pytest.mark.asyncio
async def test_cache_manager_distributed_get_set(cache_manager, redis_adapter, redis_mock):
    """Test cache manager with distributed cache."""
    # Set up mock return value for get
    redis_mock.get.return_value = b'"test_value"'
    
    # Test set with distributed cache
    await cache_manager.set(
        "test_key", 
        "test_value", 
        60, 
        CacheLevel.DISTRIBUTED
    )
    
    # Test get with distributed cache
    value = await cache_manager.get(
        "test_key", 
        default=None, 
        level=CacheLevel.DISTRIBUTED
    )
    
    assert value == "test_value"
    redis_mock.get.assert_called_once_with("test:test_key")

@pytest.mark.asyncio
async def test_cache_manager_distributed_delete(cache_manager, redis_adapter, redis_mock):
    """Test cache manager delete with distributed cache."""
    # Set up mock return value for delete
    redis_mock.delete.return_value = 1
    
    # Test delete with distributed cache
    result = await cache_manager.delete(
        "test_key", 
        level=CacheLevel.DISTRIBUTED
    )
    
    assert result is True
    redis_mock.delete.assert_called_once_with("test:test_key")

@pytest.mark.asyncio
async def test_cache_manager_dependency_tracking(cache_manager, redis_adapter, redis_mock):
    """Test cache manager dependency tracking."""
    # Set up mock return values
    redis_mock.get.return_value = b'"test_value"'
    redis_mock.delete.return_value = 1
    
    # Set values with dependencies
    await cache_manager.set(
        "parent_key", 
        "parent_value", 
        60, 
        CacheLevel.ALL
    )
    
    await cache_manager.set(
        "child_key", 
        "child_value", 
        60, 
        CacheLevel.ALL,
        depends_on=["parent_key"]
    )
    
    # Get dependencies
    dependencies = await cache_manager.get_dependencies("child_key")
    assert "parent_key" in dependencies
    
    # Get dependents
    dependents = await cache_manager.get_dependents("parent_key")
    assert "child_key" in dependents
    
    # Delete parent key (should also delete child key)
    await cache_manager.delete("parent_key", level=CacheLevel.ALL)
    
    # Verify child key was deleted
    child_value = await cache_manager.get("child_key", default=None, level=CacheLevel.ALL)
    assert child_value is None
