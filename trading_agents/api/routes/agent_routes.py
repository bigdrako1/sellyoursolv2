"""
API routes for agent management.
"""
from fastapi import APIRouter, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any, Optional
import asyncio
import json
import logging
from datetime import datetime

from core.agent_registry import AgentRegistry
from database import get_agent_repository, get_position_repository, get_market_repository
from api.models.agent_models import (
    AgentConfig,
    AgentConfigUpdate,
    AgentAction,
    AgentStatus,
    AgentResponse,
    AgentListResponse,
    ActionResponse
)

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/agents", tags=["agents"])

# WebSocket connections
websocket_connections: Dict[str, List[WebSocket]] = {}

# Get agent registry
async def get_agent_registry() -> AgentRegistry:
    """
    Get the agent registry.
    """
    # Get the singleton instance
    return AgentRegistry.get_instance()

@router.post("/", response_model=AgentResponse)
async def create_agent(
    agent_config: AgentConfig,
    registry: AgentRegistry = Depends(get_agent_registry)
):
    """
    Create a new agent.
    """
    try:
        # Generate agent ID
        agent_id = f"{agent_config.agent_type}_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        # Register agent
        agent = await registry.register_agent(
            agent_config.agent_type,
            agent_id,
            {
                "name": agent_config.name,
                **agent_config.config
            }
        )

        # Get agent status
        status = await agent.get_status()

        return {
            "agent_id": agent_id,
            "name": agent_config.name,
            "agent_type": agent_config.agent_type,
            "status": status["status"],
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "config": status["config"],
            "metrics": status["metrics"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating agent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/", response_model=AgentListResponse)
async def get_agents(
    agent_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    registry: AgentRegistry = Depends(get_agent_registry)
):
    """
    Get all agents with optional filtering and pagination.

    Args:
        agent_type: Optional filter by agent type
        status: Optional filter by agent status
        limit: Maximum number of agents to return
        offset: Pagination offset
        registry: Agent registry
    """
    try:
        # Use the new get_agents method that uses the database
        result = await registry.get_agents(
            agent_type=agent_type,
            status=status,
            limit=limit,
            offset=offset
        )

        # Return the result directly
        return {
            "agents": result["agents"],
            "total": result["total"]
        }
    except Exception as e:
        logger.error(f"Error getting agents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    registry: AgentRegistry = Depends(get_agent_registry)
):
    """
    Get an agent by ID.
    """
    try:
        agent = await registry.get_agent(agent_id)

        if not agent:
            raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

        status = await agent.get_status()

        return {
            "agent_id": agent.agent_id,
            "name": status["config"].get("name", "Unnamed Agent"),
            "agent_type": agent.__class__.__name__.replace("Agent", "").lower(),
            "status": status["status"],
            "created_at": datetime.now(),  # In a real app, this would be stored in the agent
            "updated_at": datetime.now(),  # In a real app, this would be stored in the agent
            "config": status["config"],
            "metrics": status["metrics"],
            "logs": agent.logger.get_logs(limit=100)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting agent {agent_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/{agent_id}", response_model=ActionResponse)
async def delete_agent(
    agent_id: str,
    registry: AgentRegistry = Depends(get_agent_registry)
):
    """
    Delete an agent.
    """
    try:
        await registry.unregister_agent(agent_id)

        return {
            "success": True,
            "message": f"Agent {agent_id} deleted successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting agent {agent_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    agent_config: AgentConfigUpdate,
    registry: AgentRegistry = Depends(get_agent_registry)
):
    """
    Update an agent.
    """
    try:
        agent = await registry.get_agent(agent_id)

        if not agent:
            raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

        # Get current status
        current_status = await agent.get_status()
        current_config = current_status["config"]

        # Update config
        new_config = {**current_config}

        if agent_config.name:
            new_config["name"] = agent_config.name

        if agent_config.config:
            for key, value in agent_config.config.items():
                new_config[key] = value

        # Update agent
        await agent.update_config(new_config)

        # Get updated status
        status = await agent.get_status()

        return {
            "agent_id": agent.agent_id,
            "name": status["config"].get("name", "Unnamed Agent"),
            "agent_type": agent.__class__.__name__.replace("Agent", "").lower(),
            "status": status["status"],
            "created_at": datetime.now(),  # In a real app, this would be stored in the agent
            "updated_at": datetime.now(),  # In a real app, this would be stored in the agent
            "config": status["config"],
            "metrics": status["metrics"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating agent {agent_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/{agent_id}/start", response_model=AgentResponse)
async def start_agent(
    agent_id: str,
    registry: AgentRegistry = Depends(get_agent_registry)
):
    """
    Start an agent.
    """
    try:
        # Use the updated start_agent method from the registry
        result = await registry.start_agent(agent_id)

        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))

        # Get the agent to return the full response
        agent = await registry.get_agent(agent_id)

        if not agent:
            raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

        # Get updated status
        status = await agent.get_status()

        return {
            "agent_id": agent.agent_id,
            "name": status["config"].get("name", "Unnamed Agent"),
            "agent_type": agent.__class__.__name__.replace("Agent", "").lower(),
            "status": status["status"],
            "created_at": datetime.now(),  # In a real app, this would be stored in the agent
            "updated_at": datetime.now(),  # In a real app, this would be stored in the agent
            "config": status["config"],
            "metrics": status["metrics"]
        }
    except HTTPException:
        raise
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error starting agent {agent_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/{agent_id}/stop", response_model=AgentResponse)
async def stop_agent(
    agent_id: str,
    registry: AgentRegistry = Depends(get_agent_registry)
):
    """
    Stop an agent.
    """
    try:
        # Use the updated stop_agent method from the registry
        result = await registry.stop_agent(agent_id)

        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))

        # Get the agent to return the full response
        agent = await registry.get_agent(agent_id)

        if not agent:
            raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

        # Get updated status
        status = await agent.get_status()

        return {
            "agent_id": agent.agent_id,
            "name": status["config"].get("name", "Unnamed Agent"),
            "agent_type": agent.__class__.__name__.replace("Agent", "").lower(),
            "status": status["status"],
            "created_at": datetime.now(),  # In a real app, this would be stored in the agent
            "updated_at": datetime.now(),  # In a real app, this would be stored in the agent
            "config": status["config"],
            "metrics": status["metrics"]
        }
    except HTTPException:
        raise
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error stopping agent {agent_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{agent_id}/status", response_model=AgentStatus)
async def get_agent_status(
    agent_id: str,
    registry: AgentRegistry = Depends(get_agent_registry)
):
    """
    Get agent status.
    """
    try:
        agent = await registry.get_agent(agent_id)

        if not agent:
            raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

        status = await agent.get_status()

        return status
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting agent status {agent_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/{agent_id}/execute", response_model=ActionResponse)
async def execute_agent_action(
    agent_id: str,
    action: AgentAction,
    registry: AgentRegistry = Depends(get_agent_registry)
):
    """
    Execute an action on an agent.
    """
    try:
        agent = await registry.get_agent(agent_id)

        if not agent:
            raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

        result = await agent.execute_action({
            "type": action.type,
            **action.parameters
        })

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing action on agent {agent_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{agent_id}/logs")
async def get_agent_logs(
    agent_id: str,
    limit: int = Query(100, ge=1, le=1000),
    level: Optional[str] = None,
    offset: int = Query(0, ge=0),
    registry: AgentRegistry = Depends(get_agent_registry)
):
    """
    Get agent logs.

    Args:
        agent_id: Agent ID
        limit: Maximum number of logs to return
        level: Optional filter by log level
        offset: Pagination offset
        registry: Agent registry
    """
    try:
        # Check if agent exists
        agent = await registry.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

        # Get agent repository
        agent_repo = get_agent_repository()

        # Get logs from database
        logs = await agent_repo.get_agent_logs(
            agent_id=agent_id,
            level=level,
            limit=limit,
            offset=offset
        )

        return logs
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting agent logs {agent_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.websocket("/{agent_id}/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    agent_id: str,
    registry: AgentRegistry = Depends(get_agent_registry)
):
    """
    WebSocket endpoint for real-time agent updates.
    """
    await websocket.accept()

    # Check if agent exists
    agent = await registry.get_agent(agent_id)
    if not agent:
        await websocket.send_text(json.dumps({
            "error": f"Agent {agent_id} not found"
        }))
        await websocket.close()
        return

    # Add connection to list
    if agent_id not in websocket_connections:
        websocket_connections[agent_id] = []
    websocket_connections[agent_id].append(websocket)

    try:
        while True:
            # Send agent status every 5 seconds
            status = await agent.get_status()
            await websocket.send_text(json.dumps(status))
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        # Remove connection from list
        websocket_connections[agent_id].remove(websocket)
        if not websocket_connections[agent_id]:
            del websocket_connections[agent_id]
    except Exception as e:
        logger.error(f"WebSocket error for agent {agent_id}: {str(e)}")
        await websocket.close()

# Function to broadcast updates to all connected clients
async def broadcast_update(agent_id: str, data: Dict[str, Any]):
    """
    Broadcast an update to all connected clients for an agent.
    """
    if agent_id in websocket_connections:
        for connection in websocket_connections[agent_id]:
            try:
                await connection.send_text(json.dumps(data))
            except Exception as e:
                logger.error(f"Error broadcasting to WebSocket: {str(e)}")
