"""
Market model for trading markets.
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class Market(BaseModel):
    """Market model for trading markets."""
    symbol: str
    base: str
    quote: str
    price: float
    change_24h: float
    volume_24h: float
    high_24h: Optional[float] = None
    low_24h: Optional[float] = None
    last_updated: datetime = Field(default_factory=datetime.now)

class MarketData(BaseModel):
    """Historical market data."""
    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    timeframe: str

class OrderBook(BaseModel):
    """Order book for a market."""
    symbol: str
    timestamp: datetime
    bids: List[List[float]]  # [price, amount]
    asks: List[List[float]]  # [price, amount]

class Ticker(BaseModel):
    """Ticker for a market."""
    symbol: str
    timestamp: datetime
    bid: float
    ask: float
    last: float
    volume: float
