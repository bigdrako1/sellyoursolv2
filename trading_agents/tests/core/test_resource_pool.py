"""
Tests for the ResourcePool class.
"""
import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

from core.resource_pool import ResourcePool

@pytest.mark.asyncio
async def test_resource_pool_initialization():
    """Test ResourcePool initialization."""
    # Create pool
    pool = ResourcePool()
    
    # Check initial state
    assert pool.http_clients == {}
    assert pool.api_rate_limits == {}
    assert pool.cache == {}
    assert pool.db_connections == {}
    
@pytest.mark.asyncio
async def test_resource_pool_close():
    """Test ResourcePool close."""
    # Create pool
    pool = ResourcePool()
    
    # Create mock HTTP client
    mock_client = MagicMock()
    mock_client.closed = False
    mock_client.close = MagicMock()
    mock_client.close.return_value = asyncio.Future()
    mock_client.close.return_value.set_result(None)
    
    # Add client to pool
    pool.http_clients["test"] = mock_client
    
    # Close pool
    await pool.close()
    
    # Check that client was closed
    mock_client.close.assert_called_once()
    
    # Check that cache was cleared
    assert pool.cache == {}
    
@pytest.mark.asyncio
async def test_get_http_client():
    """Test getting an HTTP client."""
    # Create pool
    pool = ResourcePool()
    
    # Get client
    client = await pool.get_http_client("test")
    
    # Check that client was created
    assert "test" in pool.http_clients
    assert client is pool.http_clients["test"]
    
    # Get same client again
    client2 = await pool.get_http_client("test")
    
    # Check that same client was returned
    assert client2 is client
    
@pytest.mark.asyncio
async def test_http_request():
    """Test making an HTTP request."""
    # Create pool
    pool = ResourcePool()
    
    # Mock aiohttp.ClientSession.request
    with patch("aiohttp.ClientSession.request") as mock_request:
        # Mock response
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.content_type = "application/json"
        mock_response.json = MagicMock()
        mock_response.json.return_value = asyncio.Future()
        mock_response.json.return_value.set_result({"test": "result"})
        
        # Set up mock request to return mock response
        mock_request.return_value.__aenter__.return_value = mock_response
        
        # Make request
        status, data = await pool.http_request("GET", "https://example.com")
        
        # Check result
        assert status == 200
        assert data == {"test": "result"}
        
        # Check that request was made
        mock_request.assert_called_once_with("GET", "https://example.com")
        
@pytest.mark.asyncio
async def test_http_request_with_retry():
    """Test making an HTTP request with retry."""
    # Create pool with short retry delay
    pool = ResourcePool({"http_retry_delay": 0.01})
    
    # Mock aiohttp.ClientSession.request to fail once then succeed
    with patch("aiohttp.ClientSession.request") as mock_request:
        # First call raises error
        first_call = MagicMock()
        first_call.__aenter__.side_effect = Exception("Test error")
        
        # Second call succeeds
        second_call = MagicMock()
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.content_type = "application/json"
        mock_response.json = MagicMock()
        mock_response.json.return_value = asyncio.Future()
        mock_response.json.return_value.set_result({"test": "result"})
        second_call.__aenter__.return_value = mock_response
        
        # Set up mock request to return different responses
        mock_request.side_effect = [first_call, second_call]
        
        # Make request
        status, data = await pool.http_request("GET", "https://example.com")
        
        # Check result
        assert status == 200
        assert data == {"test": "result"}
        
        # Check that request was made twice
        assert mock_request.call_count == 2
        
@pytest.mark.asyncio
async def test_http_request_with_rate_limit():
    """Test making an HTTP request with rate limiting."""
    # Create pool with short rate limit window
    pool = ResourcePool({"rate_limit_window": 1})
    
    # Mock aiohttp.ClientSession.request
    with patch("aiohttp.ClientSession.request") as mock_request:
        # Mock response
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.content_type = "application/json"
        mock_response.json = MagicMock()
        mock_response.json.return_value = asyncio.Future()
        mock_response.json.return_value.set_result({"test": "result"})
        
        # Set up mock request to return mock response
        mock_request.return_value.__aenter__.return_value = mock_response
        
        # Make requests with rate limit
        start_time = asyncio.get_event_loop().time()
        
        # First request should go through immediately
        await pool.http_request("GET", "https://example.com", "test_api", rate_limit=2)
        
        # Second request should go through immediately
        await pool.http_request("GET", "https://example.com", "test_api", rate_limit=2)
        
        # Third request should be rate limited
        await pool.http_request("GET", "https://example.com", "test_api", rate_limit=2)
        
        end_time = asyncio.get_event_loop().time()
        
        # Check that it took at least 1 second (rate limit window)
        assert end_time - start_time >= 1.0
        
@pytest.mark.asyncio
async def test_cache_operations():
    """Test cache operations."""
    # Create pool
    pool = ResourcePool()
    
    # Set cache value
    await pool.cache_set("test_key", "test_value")
    
    # Get cache value
    value = await pool.cache_get("test_key")
    assert value == "test_value"
    
    # Delete cache value
    await pool.cache_delete("test_key")
    
    # Check that value is gone
    value = await pool.cache_get("test_key")
    assert value is None
    
@pytest.mark.asyncio
async def test_cache_expiration():
    """Test cache expiration."""
    # Create pool with short TTL
    pool = ResourcePool({"cache_ttl": 0.1})
    
    # Set cache value
    await pool.cache_set("test_key", "test_value")
    
    # Get cache value immediately
    value = await pool.cache_get("test_key")
    assert value == "test_value"
    
    # Wait for expiration
    await asyncio.sleep(0.2)
    
    # Check that value is expired
    value = await pool.cache_get("test_key")
    assert value is None
    
@pytest.mark.asyncio
async def test_cache_max_size():
    """Test cache max size."""
    # Create pool with small max size
    pool = ResourcePool({"cache_max_size": 2})
    
    # Set cache values
    await pool.cache_set("key1", "value1")
    await pool.cache_set("key2", "value2")
    
    # Check values
    assert await pool.cache_get("key1") == "value1"
    assert await pool.cache_get("key2") == "value2"
    
    # Add third value (should evict oldest)
    await pool.cache_set("key3", "value3")
    
    # Check values
    assert await pool.cache_get("key1") is None  # Evicted
    assert await pool.cache_get("key2") == "value2"
    assert await pool.cache_get("key3") == "value3"
    
@pytest.mark.asyncio
async def test_health_check():
    """Test health check."""
    # Create pool
    pool = ResourcePool()
    
    # Add mock HTTP client
    mock_client = MagicMock()
    mock_client.closed = False
    pool.http_clients["test"] = mock_client
    
    # Add rate limit data
    pool.api_rate_limits["test_api"] = [datetime.now()]
    
    # Run health check
    results = await pool.health_check()
    
    # Check results
    assert "http_clients" in results
    assert "test" in results["http_clients"]
    assert results["http_clients"]["test"]["closed"] is False
    
    assert "cache_size" in results
    assert results["cache_size"] == 0
    
    assert "rate_limits" in results
    assert "test_api" in results["rate_limits"]
    assert results["rate_limits"]["test_api"] == 1
    
@pytest.mark.asyncio
async def test_get_stats():
    """Test getting statistics."""
    # Create pool
    pool = ResourcePool()
    
    # Get stats
    stats = pool.get_stats()
    
    # Check stats
    assert "http_clients" in stats
    assert "http_requests" in stats
    assert "http_errors" in stats
    assert "http_error_rate" in stats
    assert "cache_size" in stats
    assert "cache_hits" in stats
    assert "cache_misses" in stats
    assert "cache_hit_rate" in stats
    assert "rate_limited_apis" in stats
