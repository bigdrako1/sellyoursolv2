"""
Integration tests for the monitoring system and dashboard.

This module tests the monitoring API endpoints and dashboard functionality.
"""
import asyncio
import pytest
import time
import uuid
import json
from typing import Dict, Any, List
import aiohttp
from fastapi.testclient import TestClient

from trading_agents.api.app import app
from trading_agents.api.routes import monitoring
from trading_agents.core.agent_registry import AgentRegistry
from trading_agents.core.resource_pool import ResourcePool

# Create test client
client = TestClient(app)

@pytest.mark.asyncio
async def test_metrics_endpoint():
    """Test the metrics API endpoint."""
    # Initialize monitoring if not already initialized
    if monitoring._performance_monitor is None:
        registry = AgentRegistry.get_instance()
        execution_engine = registry.get_execution_engine()
        resource_pool = execution_engine.resource_pool
        
        monitoring.initialize_monitoring(
            resource_pool=resource_pool,
            execution_engine=execution_engine,
            config={
                "metrics_interval": 60,
                "metrics_history_size": 10
            }
        )
        await monitoring.start_monitoring()
    
    # Wait for metrics to be collected
    await asyncio.sleep(1)
    
    # Test metrics endpoint
    response = client.get("/monitoring/metrics")
    assert response.status_code == 200
    
    data = response.json()
    assert "timestamp" in data
    assert "metrics" in data
    
    # Verify metrics structure
    metrics = data["metrics"]
    assert isinstance(metrics, dict)
    
    # Check for expected metric categories
    expected_categories = ["system", "cache", "http", "execution"]
    for category in expected_categories:
        assert category in metrics, f"Missing metric category: {category}"
        assert isinstance(metrics[category], list)
    
    # Test metrics with history parameter
    response = client.get("/monitoring/metrics?history=5")
    assert response.status_code == 200
    
    data = response.json()
    metrics = data["metrics"]
    
    # Verify history limit is applied
    for category in metrics:
        assert len(metrics[category]) <= 5

@pytest.mark.asyncio
async def test_alerts_endpoint():
    """Test the alerts API endpoint."""
    # Create a test alert
    test_alert = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "level": "warning",
        "source": "test",
        "message": f"Test alert {uuid.uuid4().hex[:8]}"
    }
    
    # Post the alert
    response = client.post("/monitoring/alerts", json=test_alert)
    assert response.status_code == 201
    
    # Get alerts
    response = client.get("/monitoring/alerts")
    assert response.status_code == 200
    
    data = response.json()
    assert "timestamp" in data
    assert "alerts" in data
    assert "count" in data
    
    # Verify our test alert is in the results
    alerts = data["alerts"]
    assert isinstance(alerts, list)
    
    found = False
    for alert in alerts:
        if (alert["level"] == test_alert["level"] and 
            alert["source"] == test_alert["source"] and 
            alert["message"] == test_alert["message"]):
            found = True
            break
    
    assert found, "Test alert not found in alerts response"
    
    # Test filtering by level
    response = client.get(f"/monitoring/alerts?level={test_alert['level']}")
    assert response.status_code == 200
    
    data = response.json()
    alerts = data["alerts"]
    
    # All alerts should have the specified level
    for alert in alerts:
        assert alert["level"] == test_alert["level"]
    
    # Test filtering by source
    response = client.get(f"/monitoring/alerts?source={test_alert['source']}")
    assert response.status_code == 200
    
    data = response.json()
    alerts = data["alerts"]
    
    # All alerts should have the specified source
    for alert in alerts:
        assert alert["source"] == test_alert["source"]
    
    # Test limit parameter
    response = client.get("/monitoring/alerts?limit=3")
    assert response.status_code == 200
    
    data = response.json()
    alerts = data["alerts"]
    
    assert len(alerts) <= 3
    
    # Test clear alerts
    response = client.post("/monitoring/clear-alerts")
    assert response.status_code == 200
    
    # Verify alerts were cleared
    response = client.get("/monitoring/alerts")
    assert response.status_code == 200
    
    data = response.json()
    assert data["count"] == 0

@pytest.mark.asyncio
async def test_dashboard_endpoint():
    """Test the dashboard endpoint."""
    # Test dashboard redirect
    response = client.get("/monitoring/dashboard", allow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/dashboard/index.html"

@pytest.mark.asyncio
async def test_dashboard_static_files():
    """Test the dashboard static files."""
    # Test index.html
    response = client.get("/dashboard/index.html")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    
    # Test dashboard.js
    response = client.get("/dashboard/js/dashboard.js")
    assert response.status_code == 200
    assert "application/javascript" in response.headers["content-type"]

@pytest.mark.asyncio
async def test_performance_monitor_stats():
    """Test performance monitor statistics."""
    # Get the performance monitor
    monitor = await monitoring.get_performance_monitor()
    
    # Get metrics
    metrics = monitor.get_metrics()
    assert isinstance(metrics, dict)
    
    # Check for expected metric categories
    expected_categories = ["system", "cache", "http", "execution"]
    for category in expected_categories:
        assert category in metrics, f"Missing metric category: {category}"
    
    # Check system metrics
    system_metrics = metrics["system"]
    assert isinstance(system_metrics, list)
    if system_metrics:
        latest = system_metrics[-1]
        assert "cpu_percent" in latest
        assert "memory_percent" in latest
        assert "disk_percent" in latest
    
    # Check cache metrics
    cache_metrics = metrics["cache"]
    assert isinstance(cache_metrics, list)
    if cache_metrics:
        latest = cache_metrics[-1]
        assert "memory_hit_rate" in latest
        assert "disk_hit_rate" in latest
        assert "memory_size" in latest
        assert "disk_size" in latest
    
    # Check execution metrics
    execution_metrics = metrics["execution"]
    assert isinstance(execution_metrics, list)
    if execution_metrics:
        latest = execution_metrics[-1]
        assert "tasks_completed" in latest
        assert "tasks_failed" in latest
        assert "average_execution_time" in latest

@pytest.mark.asyncio
async def test_dashboard_api_integration():
    """Test dashboard API integration with a real HTTP client."""
    # This test requires a running server
    # We'll use aiohttp to make real HTTP requests
    
    # Skip this test in CI environments
    import os
    if os.environ.get("CI") == "true":
        pytest.skip("Skipping in CI environment")
    
    # Start the server in a separate process
    import subprocess
    import time
    import signal
    
    server_process = subprocess.Popen(
        ["python", "-m", "uvicorn", "trading_agents.api.app:app", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        preexec_fn=os.setsid
    )
    
    try:
        # Wait for server to start
        await asyncio.sleep(3)
        
        # Create HTTP client session
        async with aiohttp.ClientSession() as session:
            # Test metrics endpoint
            async with session.get("http://localhost:8000/monitoring/metrics") as response:
                assert response.status == 200
                data = await response.json()
                assert "metrics" in data
            
            # Test alerts endpoint
            test_alert = {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
                "level": "info",
                "source": "test",
                "message": f"Test alert {uuid.uuid4().hex[:8]}"
            }
            
            async with session.post(
                "http://localhost:8000/monitoring/alerts", 
                json=test_alert
            ) as response:
                assert response.status == 201
            
            # Test dashboard endpoint
            async with session.get(
                "http://localhost:8000/monitoring/dashboard", 
                allow_redirects=False
            ) as response:
                assert response.status == 307
                assert response.headers["location"] == "/dashboard/index.html"
            
            # Test dashboard static files
            async with session.get("http://localhost:8000/dashboard/index.html") as response:
                assert response.status == 200
                content = await response.text()
                assert "Trading Agents Dashboard" in content
            
            async with session.get("http://localhost:8000/dashboard/js/dashboard.js") as response:
                assert response.status == 200
                content = await response.text()
                assert "Trading Agents Dashboard" in content
    
    finally:
        # Kill the server process
        os.killpg(os.getpgid(server_process.pid), signal.SIGTERM)
        server_process.wait()
