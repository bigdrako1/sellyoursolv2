"""
Tests for the cache preloader with startup warming.
"""
import asyncio
import pytest
import time
from unittest.mock import MagicMock, patch

from trading_agents.core.cache_preloader import CachePreloader, TaskPriority, StartupPhase
from trading_agents.core.resource_pool import ResourcePool

@pytest.fixture
def resource_pool_mock():
    """Mock resource pool."""
    resource_pool = MagicMock(spec=ResourcePool)
    
    # Mock cache_set method
    resource_pool.cache_set = MagicMock(return_value=None)
    
    # Mock http_request method
    resource_pool.http_request = MagicMock(return_value=(200, {"data": "test"}))
    
    return resource_pool

@pytest.fixture
def cache_preloader(resource_pool_mock):
    """Cache preloader with mock resource pool."""
    preloader = CachePreloader(resource_pool_mock)
    
    yield preloader
    
    # Clean up
    asyncio.run(preloader.stop())

@pytest.mark.asyncio
async def test_startup_task_registration(cache_preloader):
    """Test startup task registration."""
    # Define a mock loader function
    async def mock_loader(arg1, arg2, kwarg1=None):
        return f"{arg1}:{arg2}:{kwarg1}"
    
    # Register a startup task
    cache_preloader.register_startup_task(
        name="test_task",
        loader_func=mock_loader,
        args=["arg1", "arg2"],
        kwargs={"kwarg1": "kwarg1"},
        cache_key="test_key",
        cache_ttl=60,
        tags=["test"],
        priority=TaskPriority.HIGH,
        depends_on=["dependency_task"]
    )
    
    # Verify task was registered
    assert "test_task" in cache_preloader.startup_tasks
    assert cache_preloader.startup_tasks["test_task"]["priority"] == TaskPriority.HIGH
    assert cache_preloader._startup_dependencies["test_task"] == ["dependency_task"]
    assert cache_preloader._startup_dependents["dependency_task"] == ["test_task"]
    assert cache_preloader._startup_stats["total_tasks"] == 1

@pytest.mark.asyncio
async def test_startup_task_execution(cache_preloader, resource_pool_mock):
    """Test startup task execution."""
    # Define a mock loader function
    async def mock_loader(arg1, arg2, kwarg1=None):
        return f"{arg1}:{arg2}:{kwarg1}"
    
    # Register a startup task
    cache_preloader.register_startup_task(
        name="test_task",
        loader_func=mock_loader,
        args=["arg1", "arg2"],
        kwargs={"kwarg1": "kwarg1"},
        cache_key="test_key",
        cache_ttl=60,
        tags=["test"],
        priority=TaskPriority.HIGH
    )
    
    # Run the startup task
    await cache_preloader._run_startup_task("test_task")
    
    # Verify task was executed
    assert cache_preloader.startup_tasks["test_task"]["completed"] is True
    assert cache_preloader._startup_stats["completed_tasks"] == 1
    
    # Verify cache_set was called
    resource_pool_mock.cache_set.assert_called_once_with(
        key="test_key",
        value="arg1:arg2:kwarg1",
        ttl=60,
        tags=["test"]
    )

@pytest.mark.asyncio
async def test_startup_warming_with_dependencies(cache_preloader, resource_pool_mock):
    """Test startup warming with dependencies."""
    # Define mock loader functions
    async def mock_loader1():
        return "value1"
    
    async def mock_loader2():
        return "value2"
    
    async def mock_loader3():
        return "value3"
    
    # Register startup tasks with dependencies
    cache_preloader.register_startup_task(
        name="task1",
        loader_func=mock_loader1,
        cache_key="key1",
        priority=TaskPriority.HIGH
    )
    
    cache_preloader.register_startup_task(
        name="task2",
        loader_func=mock_loader2,
        cache_key="key2",
        priority=TaskPriority.NORMAL,
        depends_on=["task1"]
    )
    
    cache_preloader.register_startup_task(
        name="task3",
        loader_func=mock_loader3,
        cache_key="key3",
        priority=TaskPriority.LOW,
        depends_on=["task2"]
    )
    
    # Run startup warming
    await cache_preloader._run_startup_warming()
    
    # Verify all tasks were completed
    assert cache_preloader.startup_tasks["task1"]["completed"] is True
    assert cache_preloader.startup_tasks["task2"]["completed"] is True
    assert cache_preloader.startup_tasks["task3"]["completed"] is True
    assert cache_preloader._startup_stats["completed_tasks"] == 3
    assert cache_preloader.startup_progress == 100

@pytest.mark.asyncio
async def test_startup_warming_with_error(cache_preloader, resource_pool_mock):
    """Test startup warming with error."""
    # Define mock loader functions
    async def mock_loader1():
        return "value1"
    
    async def mock_loader2():
        raise Exception("Test error")
    
    # Register startup tasks
    cache_preloader.register_startup_task(
        name="task1",
        loader_func=mock_loader1,
        cache_key="key1",
        priority=TaskPriority.HIGH
    )
    
    cache_preloader.register_startup_task(
        name="task2",
        loader_func=mock_loader2,
        cache_key="key2",
        priority=TaskPriority.NORMAL
    )
    
    # Run startup warming
    await cache_preloader._run_startup_warming()
    
    # Verify task1 was completed and task2 failed
    assert cache_preloader.startup_tasks["task1"]["completed"] is True
    assert cache_preloader.startup_tasks["task2"]["completed"] is False
    assert cache_preloader.startup_tasks["task2"]["error"] is not None
    assert str(cache_preloader.startup_tasks["task2"]["error"]) == "Test error"
    assert cache_preloader._startup_stats["completed_tasks"] == 1
    assert cache_preloader._startup_stats["failed_tasks"] == 1
    assert cache_preloader.startup_progress == 100

@pytest.mark.asyncio
async def test_startup_warming_with_periodic_registration(cache_preloader, resource_pool_mock):
    """Test startup warming with periodic registration."""
    # Define a mock loader function
    async def mock_loader():
        return "test_value"
    
    # Register a startup task with periodic registration
    cache_preloader.register_startup_task(
        name="test_task",
        loader_func=mock_loader,
        cache_key="test_key",
        priority=TaskPriority.NORMAL,
        register_as_periodic=True,
        periodic_interval=300
    )
    
    # Verify task was registered as both startup and periodic
    assert "test_task" in cache_preloader.startup_tasks
    assert "test_task" in cache_preloader.preload_tasks
    assert cache_preloader.preload_tasks["test_task"]["interval"] == 300

@pytest.mark.asyncio
async def test_start_with_startup_warming(cache_preloader, resource_pool_mock):
    """Test start with startup warming."""
    # Define a mock loader function
    async def mock_loader():
        return "test_value"
    
    # Register a startup task
    cache_preloader.register_startup_task(
        name="test_task",
        loader_func=mock_loader,
        cache_key="test_key",
        priority=TaskPriority.NORMAL
    )
    
    # Start the preloader with startup warming
    await cache_preloader.start(run_startup_warming=True)
    
    # Verify startup warming was executed
    assert cache_preloader.startup_phase == StartupPhase.READY
    assert cache_preloader.startup_tasks["test_task"]["completed"] is True
    assert cache_preloader._startup_stats["completed_tasks"] == 1
    
    # Verify startup complete event was set
    assert cache_preloader._startup_complete_event.is_set()

@pytest.mark.asyncio
async def test_wait_for_startup_complete(cache_preloader):
    """Test wait for startup complete."""
    # Set startup phase to warming
    cache_preloader.startup_phase = StartupPhase.WARMING
    cache_preloader._startup_complete_event.clear()
    
    # Start a task to set the event after a delay
    async def set_complete():
        await asyncio.sleep(0.1)
        cache_preloader.startup_phase = StartupPhase.READY
        cache_preloader._startup_complete_event.set()
    
    asyncio.create_task(set_complete())
    
    # Wait for startup to complete
    result = await cache_preloader.wait_for_startup_complete(timeout=1.0)
    
    # Verify wait was successful
    assert result is True
    assert cache_preloader.startup_phase == StartupPhase.READY
