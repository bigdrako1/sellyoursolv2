"""
Demo script to run a simulated version of the application with mock data.

This script creates a FastAPI application that serves mock data for the frontend.
"""
import os
import sys
import json
import random
import asyncio
import logging
import datetime
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Trading AI Demo", description="Demo API for Trading AI platform")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Mock data
class User(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    disabled: Optional[bool] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class Agent(BaseModel):
    id: str
    name: str
    type: str
    status: str
    config: Dict[str, Any]
    metrics: Dict[str, Any]
    created_at: str
    updated_at: str

class Market(BaseModel):
    symbol: str
    base: str
    quote: str
    price: float
    change_24h: float
    volume_24h: float

class Order(BaseModel):
    id: str
    symbol: str
    type: str
    side: str
    amount: float
    price: Optional[float] = None
    status: str
    created_at: str

class Position(BaseModel):
    id: str
    symbol: str
    side: str
    amount: float
    entry_price: float
    current_price: float
    pnl: float
    pnl_percentage: float
    created_at: str

class Notification(BaseModel):
    id: str
    type: str
    title: str
    message: str
    read: bool
    metadata: Optional[Dict[str, Any]] = None
    created_at: str

# Mock database
mock_users = {
    "testuser": {
        "id": "user1",
        "username": "testuser",
        "email": "test@example.com",
        "full_name": "Test User",
        "disabled": False,
        "password": "testpassword"
    }
}

mock_agents = [
    {
        "id": "agent1",
        "name": "BTC Trend Follower",
        "type": "predictive",
        "status": "running",
        "config": {
            "exchange_id": "binance",
            "symbols": ["BTC/USDT"],
            "model_id": "trend_follower_v1",
            "trade_enabled": True
        },
        "metrics": {
            "return": 12.5,
            "winRate": 65.2,
            "trades": 42
        },
        "created_at": "2023-01-15T10:30:00Z",
        "updated_at": "2023-06-20T14:45:00Z"
    },
    {
        "id": "agent2",
        "name": "ETH Momentum",
        "type": "reinforcement",
        "status": "stopped",
        "config": {
            "exchange_id": "binance",
            "symbols": ["ETH/USDT"],
            "model_id": "momentum_rl_v2",
            "trade_enabled": False
        },
        "metrics": {
            "return": 8.3,
            "winRate": 58.7,
            "trades": 27
        },
        "created_at": "2023-02-10T09:15:00Z",
        "updated_at": "2023-06-18T11:20:00Z"
    },
    {
        "id": "agent3",
        "name": "Multi-Asset Portfolio",
        "type": "hybrid",
        "status": "running",
        "config": {
            "exchange_id": "binance",
            "symbols": ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
            "model_id": "portfolio_optimizer_v1",
            "trade_enabled": True
        },
        "metrics": {
            "return": 15.7,
            "winRate": 62.1,
            "trades": 63
        },
        "created_at": "2023-03-05T14:20:00Z",
        "updated_at": "2023-06-21T09:30:00Z"
    }
]

mock_markets = [
    {
        "symbol": "BTC/USDT",
        "base": "BTC",
        "quote": "USDT",
        "price": 30245.50,
        "change_24h": 2.5,
        "volume_24h": 1250000000.0
    },
    {
        "symbol": "ETH/USDT",
        "base": "ETH",
        "quote": "USDT",
        "price": 1875.25,
        "change_24h": 1.2,
        "volume_24h": 750000000.0
    },
    {
        "symbol": "SOL/USDT",
        "base": "SOL",
        "quote": "USDT",
        "price": 24.75,
        "change_24h": 3.8,
        "volume_24h": 350000000.0
    },
    {
        "symbol": "ADA/USDT",
        "base": "ADA",
        "quote": "USDT",
        "price": 0.38,
        "change_24h": -0.5,
        "volume_24h": 120000000.0
    },
    {
        "symbol": "XRP/USDT",
        "base": "XRP",
        "quote": "USDT",
        "price": 0.48,
        "change_24h": 1.0,
        "volume_24h": 180000000.0
    }
]

mock_orders = [
    {
        "id": "order1",
        "symbol": "BTC/USDT",
        "type": "LIMIT",
        "side": "BUY",
        "amount": 0.1,
        "price": 29500.0,
        "status": "FILLED",
        "created_at": "2023-06-15T10:30:00Z"
    },
    {
        "id": "order2",
        "symbol": "ETH/USDT",
        "type": "MARKET",
        "side": "BUY",
        "amount": 1.5,
        "price": None,
        "status": "FILLED",
        "created_at": "2023-06-18T14:45:00Z"
    },
    {
        "id": "order3",
        "symbol": "SOL/USDT",
        "type": "LIMIT",
        "side": "SELL",
        "amount": 50.0,
        "price": 25.0,
        "status": "OPEN",
        "created_at": "2023-06-20T09:15:00Z"
    }
]

mock_positions = [
    {
        "id": "position1",
        "symbol": "BTC/USDT",
        "side": "LONG",
        "amount": 0.1,
        "entry_price": 29500.0,
        "current_price": 30245.50,
        "pnl": 74.55,
        "pnl_percentage": 2.53,
        "created_at": "2023-06-15T10:30:00Z"
    },
    {
        "id": "position2",
        "symbol": "ETH/USDT",
        "side": "LONG",
        "amount": 1.5,
        "entry_price": 1850.0,
        "current_price": 1875.25,
        "pnl": 37.88,
        "pnl_percentage": 1.36,
        "created_at": "2023-06-18T14:45:00Z"
    }
]

mock_notifications = [
    {
        "id": "notification1",
        "type": "agent_status",
        "title": "Agent Started",
        "message": "Agent 'BTC Trend Follower' has been started",
        "read": True,
        "metadata": {
            "agent_id": "agent1"
        },
        "created_at": "2023-06-20T09:30:00Z"
    },
    {
        "id": "notification2",
        "type": "order_update",
        "title": "Order Filled",
        "message": "Your BTC/USDT buy order has been filled at $29,500",
        "read": True,
        "metadata": {
            "order_id": "order1"
        },
        "created_at": "2023-06-15T10:35:00Z"
    },
    {
        "id": "notification3",
        "type": "price_alert",
        "title": "Price Alert",
        "message": "BTC/USDT has increased by 2.5% in the last 24 hours",
        "read": False,
        "metadata": {
            "symbol": "BTC/USDT",
            "price": 30245.50,
            "change": 2.5
        },
        "created_at": "2023-06-21T08:15:00Z"
    }
]

# Authentication functions
def get_user(username: str):
    if username in mock_users:
        user_dict = mock_users[username]
        return User(**user_dict)
    return None

def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if password != mock_users[username]["password"]:
        return False
    return user

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # In a real app, we would validate the token
    # For demo purposes, we'll just return a user
    return get_user("testuser")

# API routes
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = f"mock_token_{user.username}"
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username
    }

@app.post("/api/mobile/login", response_model=Token)
async def mobile_login(login_request: LoginRequest):
    user = authenticate_user(login_request.username, login_request.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = f"mock_token_{user.username}"
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username
    }

@app.get("/api/mobile/agents", response_model=List[Agent])
async def get_agents(current_user: User = Depends(get_current_user)):
    return mock_agents

@app.get("/api/mobile/agents/{agent_id}", response_model=Agent)
async def get_agent(agent_id: str, current_user: User = Depends(get_current_user)):
    for agent in mock_agents:
        if agent["id"] == agent_id:
            return agent
    raise HTTPException(status_code=404, detail="Agent not found")

@app.post("/api/mobile/agents/{agent_id}/start")
async def start_agent(agent_id: str, current_user: User = Depends(get_current_user)):
    for agent in mock_agents:
        if agent["id"] == agent_id:
            agent["status"] = "running"
            agent["updated_at"] = datetime.datetime.now().isoformat() + "Z"
            return agent
    raise HTTPException(status_code=404, detail="Agent not found")

@app.post("/api/mobile/agents/{agent_id}/stop")
async def stop_agent(agent_id: str, current_user: User = Depends(get_current_user)):
    for agent in mock_agents:
        if agent["id"] == agent_id:
            agent["status"] = "stopped"
            agent["updated_at"] = datetime.datetime.now().isoformat() + "Z"
            return agent
    raise HTTPException(status_code=404, detail="Agent not found")

@app.get("/api/mobile/markets", response_model=List[Market])
async def get_markets(current_user: User = Depends(get_current_user)):
    # Update prices with random changes
    for market in mock_markets:
        change = random.uniform(-0.5, 0.5)
        market["price"] *= (1 + change / 100)
        market["change_24h"] += change
    return mock_markets

@app.get("/api/mobile/orders", response_model=List[Order])
async def get_orders(current_user: User = Depends(get_current_user)):
    return mock_orders

@app.get("/api/mobile/positions", response_model=List[Position])
async def get_positions(current_user: User = Depends(get_current_user)):
    # Update positions with current market prices
    for position in mock_positions:
        for market in mock_markets:
            if position["symbol"] == market["symbol"]:
                position["current_price"] = market["price"]
                if position["side"] == "LONG":
                    position["pnl"] = (position["current_price"] - position["entry_price"]) * position["amount"]
                    position["pnl_percentage"] = (position["current_price"] / position["entry_price"] - 1) * 100
                else:
                    position["pnl"] = (position["entry_price"] - position["current_price"]) * position["amount"]
                    position["pnl_percentage"] = (position["entry_price"] / position["current_price"] - 1) * 100
    return mock_positions

@app.get("/api/mobile/notifications", response_model=List[Notification])
async def get_notifications(current_user: User = Depends(get_current_user)):
    return mock_notifications

@app.post("/api/mobile/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: User = Depends(get_current_user)):
    for notification in mock_notifications:
        if notification["id"] == notification_id:
            notification["read"] = True
            return {"message": "Notification marked as read"}
    raise HTTPException(status_code=404, detail="Notification not found")

# WebSocket for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Send market updates every 5 seconds
            await asyncio.sleep(5)
            # Update market prices
            for market in mock_markets:
                change = random.uniform(-0.5, 0.5)
                market["price"] *= (1 + change / 100)
                market["change_24h"] += change
            # Send update
            await manager.send_personal_message(json.dumps({"type": "market_update", "data": mock_markets}), websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Main function
def main():
    uvicorn.run("run_demo:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    main()
