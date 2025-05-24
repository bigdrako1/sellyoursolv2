"""
Order model for trading orders.
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class Order(BaseModel):
    """Order model for trading orders."""
    id: str
    symbol: str
    type: str  # LIMIT, MARKET, STOP, etc.
    side: str  # BUY, SELL
    amount: float
    price: Optional[float] = None  # None for market orders
    status: str  # OPEN, FILLED, CANCELED, etc.
    filled: float = 0.0
    remaining: float = 0.0
    cost: float = 0.0
    fee: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    agent_id: Optional[str] = None

class OrderCreate(BaseModel):
    """Model for creating a new order."""
    symbol: str
    type: str
    side: str
    amount: float
    price: Optional[float] = None
    agent_id: Optional[str] = None

class OrderUpdate(BaseModel):
    """Model for updating an order."""
    status: Optional[str] = None
    filled: Optional[float] = None
    remaining: Optional[float] = None
    cost: Optional[float] = None
    fee: Optional[Dict[str, Any]] = None
