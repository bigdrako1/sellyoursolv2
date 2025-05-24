#!/usr/bin/env python3
"""
Trading Agents Service - FastAPI backend for managing Python trading bots
"""

import asyncio
import json
import logging
import os
import subprocess
import sys
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Trading Agents Service",
    description="Backend service for managing Python trading bots",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class AgentConfig(BaseModel):
    name: str
    agent_type: str
    config: Dict[str, Any] = Field(default_factory=dict)

class AgentConfigUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

class TradingAgent(BaseModel):
    id: str
    name: str
    agent_type: str
    status: str = "stopped"  # running, stopped, error, starting, stopping
    created_at: str
    updated_at: str
    config: Dict[str, Any] = Field(default_factory=dict)
    metrics: Optional[Dict[str, Any]] = None
    process_id: Optional[int] = None

class LogEntry(BaseModel):
    id: str
    agent_id: str
    level: str  # info, warning, error, debug
    message: str
    timestamp: str
    metadata: Optional[Dict[str, Any]] = None

class ActionResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

# In-memory storage (in production, use a proper database)
agents_db: Dict[str, TradingAgent] = {}
logs_db: Dict[str, List[LogEntry]] = {}
processes: Dict[str, subprocess.Popen] = {}

# WebSocket connections for real-time updates
websocket_connections: Dict[str, List[WebSocket]] = {}

# Python bot file mappings
PYTHON_BOT_MAPPING = {
    'copy_trading': {
        'name': 'Copy Trading Bot',
        'file': 'copybot.py',
        'description': 'Automatically copies trades from successful wallets'
    },
    'sol_scanner': {
        'name': 'SOL Scanner',
        'file': 'solscanner.py',
        'description': 'Scans for new token launches on Solana'
    },
    'hyperliquid_trading': {
        'name': 'HyperLiquid Trading Bot',
        'file': 'hyperliquid_trading_bot.py',
        'description': 'Trades liquidations on HyperLiquid exchange'
    },
    'sniper': {
        'name': 'Sniper Bot',
        'file': 'sniperbot.py',
        'description': 'Snipes new token launches with security checks'
    }
}

def get_current_timestamp() -> str:
    """Get current timestamp in ISO format"""
    return datetime.utcnow().isoformat() + "Z"

def add_log_entry(agent_id: str, level: str, message: str, metadata: Optional[Dict] = None):
    """Add a log entry for an agent"""
    if agent_id not in logs_db:
        logs_db[agent_id] = []
    
    log_entry = LogEntry(
        id=str(uuid.uuid4()),
        agent_id=agent_id,
        level=level,
        message=message,
        timestamp=get_current_timestamp(),
        metadata=metadata or {}
    )
    
    logs_db[agent_id].append(log_entry)
    
    # Keep only last 1000 logs per agent
    if len(logs_db[agent_id]) > 1000:
        logs_db[agent_id] = logs_db[agent_id][-1000:]
    
    # Broadcast to WebSocket connections
    asyncio.create_task(broadcast_log_update(agent_id, log_entry))

async def broadcast_log_update(agent_id: str, log_entry: LogEntry):
    """Broadcast log update to WebSocket connections"""
    if agent_id in websocket_connections:
        message = {
            "type": "log_update",
            "data": log_entry.dict()
        }
        
        # Remove disconnected connections
        active_connections = []
        for ws in websocket_connections[agent_id]:
            try:
                await ws.send_text(json.dumps(message))
                active_connections.append(ws)
            except:
                pass
        
        websocket_connections[agent_id] = active_connections

def start_python_bot(agent: TradingAgent) -> bool:
    """Start a Python trading bot process"""
    try:
        bot_info = PYTHON_BOT_MAPPING.get(agent.agent_type)
        if not bot_info:
            raise ValueError(f"Unknown agent type: {agent.agent_type}")
        
        script_path = Path(bot_info['file'])
        if not script_path.exists():
            raise FileNotFoundError(f"Bot script not found: {script_path}")
        
        # Create config file for the bot
        config_file = f"config_{agent.id}.json"
        with open(config_file, 'w') as f:
            json.dump(agent.config, f, indent=2)
        
        # Start the process
        cmd = [sys.executable, str(script_path), "--config", config_file]
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        processes[agent.id] = process
        agent.process_id = process.pid
        agent.status = "running"
        agent.updated_at = get_current_timestamp()
        
        add_log_entry(agent.id, "info", f"Started {agent.name} (PID: {process.pid})")
        
        # Start monitoring the process
        asyncio.create_task(monitor_process(agent.id))
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to start agent {agent.id}: {e}")
        agent.status = "error"
        agent.updated_at = get_current_timestamp()
        add_log_entry(agent.id, "error", f"Failed to start: {str(e)}")
        return False

def stop_python_bot(agent: TradingAgent) -> bool:
    """Stop a Python trading bot process"""
    try:
        if agent.id in processes:
            process = processes[agent.id]
            process.terminate()
            
            # Wait for process to terminate
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
            
            del processes[agent.id]
            
        agent.status = "stopped"
        agent.process_id = None
        agent.updated_at = get_current_timestamp()
        
        add_log_entry(agent.id, "info", f"Stopped {agent.name}")
        
        # Clean up config file
        config_file = f"config_{agent.id}.json"
        if os.path.exists(config_file):
            os.remove(config_file)
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to stop agent {agent.id}: {e}")
        agent.status = "error"
        agent.updated_at = get_current_timestamp()
        add_log_entry(agent.id, "error", f"Failed to stop: {str(e)}")
        return False

async def monitor_process(agent_id: str):
    """Monitor a running process and update status"""
    while agent_id in processes:
        try:
            process = processes[agent_id]
            
            # Check if process is still running
            if process.poll() is not None:
                # Process has terminated
                agent = agents_db.get(agent_id)
                if agent:
                    agent.status = "stopped"
                    agent.process_id = None
                    agent.updated_at = get_current_timestamp()
                    add_log_entry(agent_id, "info", f"Process terminated with code {process.returncode}")
                
                if agent_id in processes:
                    del processes[agent_id]
                break
            
            # Read stdout/stderr (non-blocking)
            # In a real implementation, you'd want to properly handle process output
            
            await asyncio.sleep(5)  # Check every 5 seconds
            
        except Exception as e:
            logger.error(f"Error monitoring process for agent {agent_id}: {e}")
            break

# API Routes

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "trading_agents",
        "timestamp": get_current_timestamp(),
        "active_agents": len([a for a in agents_db.values() if a.status == "running"])
    }

@app.get("/agents")
async def get_agents(
    agent_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """Get all trading agents"""
    agents = list(agents_db.values())
    
    # Apply filters
    if agent_type:
        agents = [a for a in agents if a.agent_type == agent_type]
    if status:
        agents = [a for a in agents if a.status == status]
    
    # Apply pagination
    total = len(agents)
    agents = agents[offset:offset + limit]
    
    return {
        "agents": agents,
        "total": total
    }

@app.post("/agents")
async def create_agent(config: AgentConfig):
    """Create a new trading agent"""
    agent_id = str(uuid.uuid4())
    
    agent = TradingAgent(
        id=agent_id,
        name=config.name,
        agent_type=config.agent_type,
        status="stopped",
        created_at=get_current_timestamp(),
        updated_at=get_current_timestamp(),
        config=config.config
    )
    
    agents_db[agent_id] = agent
    add_log_entry(agent_id, "info", f"Created agent: {config.name}")
    
    return agent

@app.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    """Get a specific trading agent"""
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return agents_db[agent_id]

@app.put("/agents/{agent_id}")
async def update_agent(agent_id: str, updates: AgentConfigUpdate):
    """Update a trading agent"""
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent = agents_db[agent_id]
    
    if updates.name:
        agent.name = updates.name
    if updates.config:
        agent.config.update(updates.config)
    
    agent.updated_at = get_current_timestamp()
    add_log_entry(agent_id, "info", f"Updated agent configuration")
    
    return agent

@app.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str):
    """Delete a trading agent"""
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent = agents_db[agent_id]
    
    # Stop the agent if running
    if agent.status == "running":
        stop_python_bot(agent)
    
    # Clean up
    del agents_db[agent_id]
    if agent_id in logs_db:
        del logs_db[agent_id]
    if agent_id in websocket_connections:
        del websocket_connections[agent_id]
    
    return ActionResponse(success=True, message="Agent deleted successfully")

@app.post("/agents/{agent_id}/start")
async def start_agent(agent_id: str):
    """Start a trading agent"""
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent = agents_db[agent_id]
    
    if agent.status == "running":
        raise HTTPException(status_code=400, detail="Agent is already running")
    
    agent.status = "starting"
    agent.updated_at = get_current_timestamp()
    
    success = start_python_bot(agent)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to start agent")
    
    return agent

@app.post("/agents/{agent_id}/stop")
async def stop_agent(agent_id: str):
    """Stop a trading agent"""
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent = agents_db[agent_id]
    
    if agent.status != "running":
        raise HTTPException(status_code=400, detail="Agent is not running")
    
    agent.status = "stopping"
    agent.updated_at = get_current_timestamp()
    
    success = stop_python_bot(agent)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to stop agent")
    
    return agent

@app.get("/agents/{agent_id}/status")
async def get_agent_status(agent_id: str):
    """Get agent status"""
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent = agents_db[agent_id]
    
    return {
        "id": agent.id,
        "status": agent.status,
        "process_id": agent.process_id,
        "updated_at": agent.updated_at
    }

@app.get("/agents/{agent_id}/logs")
async def get_agent_logs(
    agent_id: str,
    limit: int = 100,
    level: Optional[str] = None,
    offset: int = 0
):
    """Get agent logs"""
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    logs = logs_db.get(agent_id, [])
    
    # Apply level filter
    if level:
        logs = [log for log in logs if log.level == level]
    
    # Apply pagination
    logs = logs[offset:offset + limit]
    
    return logs

@app.websocket("/agents/{agent_id}/ws")
async def websocket_endpoint(websocket: WebSocket, agent_id: str):
    """WebSocket endpoint for real-time agent updates"""
    await websocket.accept()
    
    if agent_id not in websocket_connections:
        websocket_connections[agent_id] = []
    
    websocket_connections[agent_id].append(websocket)
    
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_connections[agent_id].remove(websocket)

@app.get("/agents/types")
async def get_agent_types():
    """Get available agent types"""
    return list(PYTHON_BOT_MAPPING.keys())

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
