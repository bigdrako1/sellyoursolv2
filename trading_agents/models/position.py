"""
Position model for trading positions.
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class Position(BaseModel):
    """Position model for trading positions."""
    id: str
    symbol: str
    side: str  # LONG, SHORT
    amount: float
    entry_price: float
    current_price: float
    pnl: float
    pnl_percentage: float
    liquidation_price: Optional[float] = None
    leverage: Optional[float] = None
    margin: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    agent_id: Optional[str] = None

class PositionCreate(BaseModel):
    """Model for creating a new position."""
    symbol: str
    side: str
    amount: float
    entry_price: float
    current_price: float
    agent_id: Optional[str] = None

class PositionUpdate(BaseModel):
    """Model for updating a position."""
    amount: Optional[float] = None
    current_price: Optional[float] = None
    pnl: Optional[float] = None
    pnl_percentage: Optional[float] = None
    liquidation_price: Optional[float] = None
