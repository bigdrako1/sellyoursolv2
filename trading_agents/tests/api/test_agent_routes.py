"""
Tests for the agent API routes.
"""
import pytest
from fastapi.testclient import TestClient
from api.app import app

client = TestClient(app)

def test_create_agent():
    """
    Test creating an agent.
    """
    # Create a copy trading agent
    response = client.post(
        "/agents/",
        json={
            "agent_type": "copy_trading",
            "name": "Test Copy Trading Agent",
            "config": {
                "tracked_wallets": ["wallet1", "wallet2"],
                "check_interval_minutes": 10
            }
        }
    )
    
    # Check response
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Copy Trading Agent"
    assert data["agent_type"] == "copy_trading"
    assert data["status"] == "initialized"
    assert "agent_id" in data
    
    # Store agent ID for later tests
    agent_id = data["agent_id"]
    
    # Clean up
    client.delete(f"/agents/{agent_id}")

def test_get_agents():
    """
    Test getting all agents.
    """
    # Create two agents
    response1 = client.post(
        "/agents/",
        json={
            "agent_type": "copy_trading",
            "name": "Test Agent 1",
            "config": {}
        }
    )
    
    response2 = client.post(
        "/agents/",
        json={
            "agent_type": "liquidation",
            "name": "Test Agent 2",
            "config": {}
        }
    )
    
    agent_id1 = response1.json()["agent_id"]
    agent_id2 = response2.json()["agent_id"]
    
    # Get all agents
    response = client.get("/agents/")
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert "agents" in data
    assert "total" in data
    assert data["total"] >= 2
    
    # Check that our agents are in the list
    agent_ids = [agent["agent_id"] for agent in data["agents"]]
    assert agent_id1 in agent_ids
    assert agent_id2 in agent_ids
    
    # Clean up
    client.delete(f"/agents/{agent_id1}")
    client.delete(f"/agents/{agent_id2}")

def test_get_agent():
    """
    Test getting a specific agent.
    """
    # Create an agent
    response = client.post(
        "/agents/",
        json={
            "agent_type": "copy_trading",
            "name": "Test Agent",
            "config": {}
        }
    )
    
    agent_id = response.json()["agent_id"]
    
    # Get the agent
    response = client.get(f"/agents/{agent_id}")
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert data["agent_id"] == agent_id
    assert data["name"] == "Test Agent"
    assert data["agent_type"] == "copy_trading"
    
    # Clean up
    client.delete(f"/agents/{agent_id}")

def test_get_nonexistent_agent():
    """
    Test getting a nonexistent agent.
    """
    response = client.get("/agents/nonexistent_agent")
    assert response.status_code == 404

def test_update_agent():
    """
    Test updating an agent.
    """
    # Create an agent
    response = client.post(
        "/agents/",
        json={
            "agent_type": "copy_trading",
            "name": "Test Agent",
            "config": {
                "check_interval_minutes": 10
            }
        }
    )
    
    agent_id = response.json()["agent_id"]
    
    # Update the agent
    response = client.put(
        f"/agents/{agent_id}",
        json={
            "name": "Updated Agent Name",
            "config": {
                "check_interval_minutes": 5
            }
        }
    )
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Agent Name"
    assert data["config"]["check_interval_minutes"] == 5
    
    # Clean up
    client.delete(f"/agents/{agent_id}")

def test_delete_agent():
    """
    Test deleting an agent.
    """
    # Create an agent
    response = client.post(
        "/agents/",
        json={
            "agent_type": "copy_trading",
            "name": "Test Agent",
            "config": {}
        }
    )
    
    agent_id = response.json()["agent_id"]
    
    # Delete the agent
    response = client.delete(f"/agents/{agent_id}")
    
    # Check response
    assert response.status_code == 204
    
    # Verify that the agent is gone
    response = client.get(f"/agents/{agent_id}")
    assert response.status_code == 404

def test_start_stop_agent():
    """
    Test starting and stopping an agent.
    """
    # Create an agent
    response = client.post(
        "/agents/",
        json={
            "agent_type": "copy_trading",
            "name": "Test Agent",
            "config": {}
        }
    )
    
    agent_id = response.json()["agent_id"]
    
    # Start the agent
    response = client.post(f"/agents/{agent_id}/start")
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"
    
    # Stop the agent
    response = client.post(f"/agents/{agent_id}/stop")
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "stopped"
    
    # Clean up
    client.delete(f"/agents/{agent_id}")

def test_get_agent_status():
    """
    Test getting agent status.
    """
    # Create an agent
    response = client.post(
        "/agents/",
        json={
            "agent_type": "copy_trading",
            "name": "Test Agent",
            "config": {}
        }
    )
    
    agent_id = response.json()["agent_id"]
    
    # Get agent status
    response = client.get(f"/agents/{agent_id}/status")
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert data["agent_id"] == agent_id
    assert "status" in data
    assert "metrics" in data
    assert "config" in data
    
    # Clean up
    client.delete(f"/agents/{agent_id}")

def test_execute_agent_action():
    """
    Test executing an action on an agent.
    """
    # Create a copy trading agent
    response = client.post(
        "/agents/",
        json={
            "agent_type": "copy_trading",
            "name": "Test Agent",
            "config": {
                "tracked_wallets": []
            }
        }
    )
    
    agent_id = response.json()["agent_id"]
    
    # Start the agent
    client.post(f"/agents/{agent_id}/start")
    
    # Execute an action
    response = client.post(
        f"/agents/{agent_id}/execute",
        json={
            "type": "add_wallet",
            "parameters": {
                "wallet": "test_wallet"
            }
        }
    )
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert data["success"]
    assert "Added wallet test_wallet" in data["message"]
    
    # Clean up
    client.post(f"/agents/{agent_id}/stop")
    client.delete(f"/agents/{agent_id}")

def test_get_agent_logs():
    """
    Test getting agent logs.
    """
    # Create an agent
    response = client.post(
        "/agents/",
        json={
            "agent_type": "copy_trading",
            "name": "Test Agent",
            "config": {}
        }
    )
    
    agent_id = response.json()["agent_id"]
    
    # Start the agent to generate some logs
    client.post(f"/agents/{agent_id}/start")
    
    # Get agent logs
    response = client.get(f"/agents/{agent_id}/logs")
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
    # Clean up
    client.post(f"/agents/{agent_id}/stop")
    client.delete(f"/agents/{agent_id}")

def test_get_agent_types():
    """
    Test getting available agent types.
    """
    response = client.get("/agent-types")
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert "agent_types" in data
    assert len(data["agent_types"]) >= 4  # We should have at least 4 agent types
    
    # Check that our agent types are in the list
    agent_types = [t["type"] for t in data["agent_types"]]
    assert "copy_trading" in agent_types
    assert "liquidation" in agent_types
    assert "scanner" in agent_types
    assert "sniper" in agent_types

def test_get_agent_type():
    """
    Test getting a specific agent type.
    """
    response = client.get("/agent-types/copy_trading")
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "copy_trading"
    assert "description" in data
    assert "config_schema" in data
