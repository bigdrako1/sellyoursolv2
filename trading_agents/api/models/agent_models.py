"""
API models for agent-related endpoints.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class AgentConfig(BaseModel):
    """
    Agent configuration model.
    """
    agent_type: str = Field(..., description="Type of agent")
    name: str = Field(..., description="Name of the agent")
    config: Dict[str, Any] = Field(default_factory=dict, description="Agent configuration")

class AgentConfigUpdate(BaseModel):
    """
    Agent configuration update model.
    """
    name: Optional[str] = Field(None, description="Name of the agent")
    config: Optional[Dict[str, Any]] = Field(None, description="Agent configuration")

class AgentAction(BaseModel):
    """
    Agent action model.
    """
    type: str = Field(..., description="Type of action")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Action parameters")

class AgentStatus(BaseModel):
    """
    Agent status model.
    """
    agent_id: str = Field(..., description="Agent ID")
    status: str = Field(..., description="Agent status")
    metrics: Optional[Dict[str, Any]] = Field(None, description="Agent metrics")
    config: Dict[str, Any] = Field(..., description="Agent configuration")

class AgentLogEntry(BaseModel):
    """
    Agent log entry model.
    """
    timestamp: datetime = Field(..., description="Log timestamp")
    agent_id: str = Field(..., description="Agent ID")
    level: str = Field(..., description="Log level")
    message: str = Field(..., description="Log message")

class AgentResponse(BaseModel):
    """
    Agent response model.
    """
    agent_id: str = Field(..., description="Agent ID")
    name: str = Field(..., description="Agent name")
    agent_type: str = Field(..., description="Agent type")
    status: str = Field(..., description="Agent status")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    config: Dict[str, Any] = Field(..., description="Agent configuration")
    metrics: Optional[Dict[str, Any]] = Field(None, description="Agent metrics")
    logs: Optional[List[AgentLogEntry]] = Field(None, description="Agent logs")

class AgentListResponse(BaseModel):
    """
    Agent list response model.
    """
    agents: List[AgentResponse] = Field(..., description="List of agents")
    total: int = Field(..., description="Total number of agents")

class ActionResponse(BaseModel):
    """
    Action response model.
    """
    success: bool = Field(..., description="Whether the action was successful")
    message: Optional[str] = Field(None, description="Response message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
