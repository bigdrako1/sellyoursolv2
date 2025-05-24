"""
Agent model for trading agents.
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class AgentConfig(BaseModel):
    """Configuration for a trading agent."""
    exchange_id: str
    symbols: List[str]
    model_id: Optional[str] = None
    trade_enabled: bool = False
    risk_limits: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None

class AgentMetrics(BaseModel):
    """Performance metrics for a trading agent."""
    return_pct: float = 0.0
    win_rate: float = 0.0
    trades_count: int = 0
    profit_factor: Optional[float] = None
    max_drawdown: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    last_updated: datetime = Field(default_factory=datetime.now)

class Agent(BaseModel):
    """Trading agent model."""
    id: str
    name: str
    type: str
    status: str
    config: AgentConfig
    metrics: AgentMetrics
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class AgentCreate(BaseModel):
    """Model for creating a new agent."""
    name: str
    type: str
    config: AgentConfig

class AgentUpdate(BaseModel):
    """Model for updating an agent."""
    name: Optional[str] = None
    status: Optional[str] = None
    config: Optional[AgentConfig] = None

class AgentType(BaseModel):
    """Agent type model."""
    id: str
    name: str
    description: str
    parameters: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
