"""
Mobile API endpoints.

This module provides API endpoints for the mobile application.
"""
import logging
import json
from typing import Dict, List, Any, Optional, Tuple, Union
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field

from core.agent_registry import AgentRegistry
from core.user_manager import UserManager
from models.user import User
from models.agent import Agent
from models.market import Market
from exchanges.exchange_factory import ExchangeFactory
from utils.config import Config

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/mobile", tags=["mobile"])

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models
class LoginRequest(BaseModel):
    """Login request model."""
    username: str
    password: str

class LoginResponse(BaseModel):
    """Login response model."""
    access_token: str
    token_type: str
    user_id: str
    username: str

class AgentSummary(BaseModel):
    """Agent summary model."""
    agent_id: str
    name: str
    type: str
    status: str
    metrics: Dict[str, Any]
    created_at: datetime

class AgentDetail(BaseModel):
    """Agent detail model."""
    agent_id: str
    name: str
    type: str
    status: str
    config: Dict[str, Any]
    metrics: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

class CreateAgentRequest(BaseModel):
    """Create agent request model."""
    name: str
    type: str
    config: Dict[str, Any]

class MarketSummary(BaseModel):
    """Market summary model."""
    symbol: str
    base: str
    quote: str
    price: float
    change_24h: float
    volume_24h: float

class OrderSummary(BaseModel):
    """Order summary model."""
    order_id: str
    symbol: str
    type: str
    side: str
    amount: float
    price: float
    status: str
    created_at: datetime

class CreateOrderRequest(BaseModel):
    """Create order request model."""
    symbol: str
    type: str
    side: str
    amount: float
    price: Optional[float] = None

class PositionSummary(BaseModel):
    """Position summary model."""
    symbol: str
    side: str
    amount: float
    entry_price: float
    current_price: float
    pnl: float
    pnl_percentage: float
    created_at: datetime

class NotificationSummary(BaseModel):
    """Notification summary model."""
    notification_id: str
    type: str
    title: str
    message: str
    read: bool
    created_at: datetime

# Dependencies
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Get current user from token.
    
    Args:
        token: JWT token
        
    Returns:
        User object
    """
    user_manager = UserManager.get_instance()
    user = await user_manager.get_user_by_token(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
    return user

# Routes
@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Login endpoint.
    
    Args:
        request: Login request
        
    Returns:
        Login response
    """
    try:
        user_manager = UserManager.get_instance()
        user = await user_manager.authenticate(request.username, request.password)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password")
            
        # Generate token
        token = await user_manager.generate_token(user)
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user.user_id,
            "username": user.username
        }
        
    except Exception as e:
        logger.error(f"Error in login: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/agents", response_model=List[AgentSummary])
async def get_agents(user: User = Depends(get_current_user)):
    """
    Get all agents for the current user.
    
    Args:
        user: Current user
        
    Returns:
        List of agent summaries
    """
    try:
        agent_registry = AgentRegistry.get_instance()
        agents = await agent_registry.get_agents_by_user(user.user_id)
        
        return [
            {
                "agent_id": agent.agent_id,
                "name": agent.name,
                "type": agent.agent_type,
                "status": agent.status,
                "metrics": agent.metrics,
                "created_at": agent.created_at
            }
            for agent in agents
        ]
        
    except Exception as e:
        logger.error(f"Error in get_agents: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/agents/{agent_id}", response_model=AgentDetail)
async def get_agent(agent_id: str, user: User = Depends(get_current_user)):
    """
    Get agent details.
    
    Args:
        agent_id: Agent ID
        user: Current user
        
    Returns:
        Agent details
    """
    try:
        agent_registry = AgentRegistry.get_instance()
        agent = await agent_registry.get_agent(agent_id)
        
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
            
        if agent.user_id != user.user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this agent")
            
        return {
            "agent_id": agent.agent_id,
            "name": agent.name,
            "type": agent.agent_type,
            "status": agent.status,
            "config": agent.config,
            "metrics": agent.metrics,
            "created_at": agent.created_at,
            "updated_at": agent.updated_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_agent: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/agents", response_model=AgentDetail)
async def create_agent(request: CreateAgentRequest, user: User = Depends(get_current_user)):
    """
    Create a new agent.
    
    Args:
        request: Create agent request
        user: Current user
        
    Returns:
        Created agent details
    """
    try:
        agent_registry = AgentRegistry.get_instance()
        
        # Create agent
        agent_id = await agent_registry.create_agent(
            agent_type=request.type,
            config=request.config,
            name=request.name,
            user_id=user.user_id
        )
        
        # Get created agent
        agent = await agent_registry.get_agent(agent_id)
        
        return {
            "agent_id": agent.agent_id,
            "name": agent.name,
            "type": agent.agent_type,
            "status": agent.status,
            "config": agent.config,
            "metrics": agent.metrics,
            "created_at": agent.created_at,
            "updated_at": agent.updated_at
        }
        
    except Exception as e:
        logger.error(f"Error in create_agent: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str, user: User = Depends(get_current_user)):
    """
    Delete an agent.
    
    Args:
        agent_id: Agent ID
        user: Current user
        
    Returns:
        Success message
    """
    try:
        agent_registry = AgentRegistry.get_instance()
        agent = await agent_registry.get_agent(agent_id)
        
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
            
        if agent.user_id != user.user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this agent")
            
        # Delete agent
        success = await agent_registry.delete_agent(agent_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete agent")
            
        return {"message": "Agent deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_agent: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/agents/{agent_id}/start")
async def start_agent(agent_id: str, user: User = Depends(get_current_user)):
    """
    Start an agent.
    
    Args:
        agent_id: Agent ID
        user: Current user
        
    Returns:
        Success message
    """
    try:
        agent_registry = AgentRegistry.get_instance()
        agent = await agent_registry.get_agent(agent_id)
        
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
            
        if agent.user_id != user.user_id:
            raise HTTPException(status_code=403, detail="Not authorized to start this agent")
            
        # Start agent
        success = await agent_registry.start_agent(agent_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to start agent")
            
        return {"message": "Agent started successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in start_agent: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/agents/{agent_id}/stop")
async def stop_agent(agent_id: str, user: User = Depends(get_current_user)):
    """
    Stop an agent.
    
    Args:
        agent_id: Agent ID
        user: Current user
        
    Returns:
        Success message
    """
    try:
        agent_registry = AgentRegistry.get_instance()
        agent = await agent_registry.get_agent(agent_id)
        
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
            
        if agent.user_id != user.user_id:
            raise HTTPException(status_code=403, detail="Not authorized to stop this agent")
            
        # Stop agent
        success = await agent_registry.stop_agent(agent_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to stop agent")
            
        return {"message": "Agent stopped successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in stop_agent: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/agents/{agent_id}/command")
async def execute_agent_command(
    agent_id: str,
    command: str = Body(..., embed=True),
    parameters: Dict[str, Any] = Body({}, embed=True),
    user: User = Depends(get_current_user)
):
    """
    Execute a command on an agent.
    
    Args:
        agent_id: Agent ID
        command: Command name
        parameters: Command parameters
        user: Current user
        
    Returns:
        Command result
    """
    try:
        agent_registry = AgentRegistry.get_instance()
        agent = await agent_registry.get_agent(agent_id)
        
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
            
        if agent.user_id != user.user_id:
            raise HTTPException(status_code=403, detail="Not authorized to execute commands on this agent")
            
        # Execute command
        result = await agent_registry.execute_command(agent_id, command, parameters)
        
        return {"result": result}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in execute_agent_command: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/markets", response_model=List[MarketSummary])
async def get_markets(
    exchange: str = Query("binance", description="Exchange name"),
    user: User = Depends(get_current_user)
):
    """
    Get markets from an exchange.
    
    Args:
        exchange: Exchange name
        user: Current user
        
    Returns:
        List of market summaries
    """
    try:
        exchange_factory = ExchangeFactory()
        exchange_instance = exchange_factory.create_exchange(exchange)
        
        # Initialize exchange
        await exchange_instance.initialize()
        
        try:
            # Fetch markets
            markets = await exchange_instance.fetch_markets()
            
            # Fetch tickers
            tickers = {}
            for market in markets[:100]:  # Limit to 100 markets to avoid rate limiting
                try:
                    ticker = await exchange_instance.fetch_ticker(market.symbol)
                    tickers[market.symbol] = ticker
                except Exception:
                    pass
                    
            # Create market summaries
            market_summaries = []
            for market in markets[:100]:
                ticker = tickers.get(market.symbol, {})
                
                market_summary = {
                    "symbol": market.symbol,
                    "base": market.base,
                    "quote": market.quote,
                    "price": ticker.get("last", 0.0),
                    "change_24h": ticker.get("percentage", 0.0),
                    "volume_24h": ticker.get("baseVolume", 0.0)
                }
                
                market_summaries.append(market_summary)
                
            return market_summaries
            
        finally:
            # Close exchange
            await exchange_instance.close()
            
    except Exception as e:
        logger.error(f"Error in get_markets: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/orders", response_model=List[OrderSummary])
async def get_orders(
    exchange: str = Query("binance", description="Exchange name"),
    symbol: Optional[str] = Query(None, description="Trading symbol"),
    user: User = Depends(get_current_user)
):
    """
    Get orders from an exchange.
    
    Args:
        exchange: Exchange name
        symbol: Trading symbol (optional)
        user: Current user
        
    Returns:
        List of order summaries
    """
    try:
        exchange_factory = ExchangeFactory()
        exchange_instance = exchange_factory.create_exchange(exchange)
        
        # Initialize exchange
        await exchange_instance.initialize()
        
        try:
            # Fetch orders
            orders = await exchange_instance.fetch_orders(symbol)
            
            # Create order summaries
            order_summaries = []
            for order in orders:
                order_summary = {
                    "order_id": order.get("id", ""),
                    "symbol": order.get("symbol", ""),
                    "type": order.get("type", ""),
                    "side": order.get("side", ""),
                    "amount": order.get("amount", 0.0),
                    "price": order.get("price", 0.0),
                    "status": order.get("status", ""),
                    "created_at": datetime.fromtimestamp(order.get("timestamp", 0) / 1000)
                }
                
                order_summaries.append(order_summary)
                
            return order_summaries
            
        finally:
            # Close exchange
            await exchange_instance.close()
            
    except Exception as e:
        logger.error(f"Error in get_orders: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/orders", response_model=OrderSummary)
async def create_order(
    request: CreateOrderRequest,
    exchange: str = Query("binance", description="Exchange name"),
    user: User = Depends(get_current_user)
):
    """
    Create a new order.
    
    Args:
        request: Create order request
        exchange: Exchange name
        user: Current user
        
    Returns:
        Created order summary
    """
    try:
        exchange_factory = ExchangeFactory()
        exchange_instance = exchange_factory.create_exchange(exchange)
        
        # Initialize exchange
        await exchange_instance.initialize()
        
        try:
            # Create order
            from models.order import Order, OrderSide, OrderType
            
            order = Order(
                symbol=request.symbol,
                side=OrderSide(request.side),
                type=OrderType(request.type),
                amount=request.amount,
                price=request.price
            )
            
            order_result = await exchange_instance.create_order(order)
            
            # Create order summary
            order_summary = {
                "order_id": order_result.get("id", ""),
                "symbol": order_result.get("symbol", ""),
                "type": order_result.get("type", ""),
                "side": order_result.get("side", ""),
                "amount": order_result.get("amount", 0.0),
                "price": order_result.get("price", 0.0),
                "status": order_result.get("status", ""),
                "created_at": datetime.fromtimestamp(order_result.get("timestamp", 0) / 1000)
            }
            
            return order_summary
            
        finally:
            # Close exchange
            await exchange_instance.close()
            
    except Exception as e:
        logger.error(f"Error in create_order: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/positions", response_model=List[PositionSummary])
async def get_positions(
    exchange: str = Query("binance", description="Exchange name"),
    user: User = Depends(get_current_user)
):
    """
    Get positions from an exchange.
    
    Args:
        exchange: Exchange name
        user: Current user
        
    Returns:
        List of position summaries
    """
    try:
        exchange_factory = ExchangeFactory()
        exchange_instance = exchange_factory.create_exchange(exchange)
        
        # Initialize exchange
        await exchange_instance.initialize()
        
        try:
            # Fetch positions
            positions = await exchange_instance.fetch_positions()
            
            # Create position summaries
            position_summaries = []
            for position in positions:
                position_summary = {
                    "symbol": position.symbol,
                    "side": position.side.value,
                    "amount": position.amount,
                    "entry_price": position.entry_price,
                    "current_price": position.current_price,
                    "pnl": position.pnl,
                    "pnl_percentage": position.pnl_percentage,
                    "created_at": position.created_at
                }
                
                position_summaries.append(position_summary)
                
            return position_summaries
            
        finally:
            # Close exchange
            await exchange_instance.close()
            
    except Exception as e:
        logger.error(f"Error in get_positions: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/notifications", response_model=List[NotificationSummary])
async def get_notifications(user: User = Depends(get_current_user)):
    """
    Get notifications for the current user.
    
    Args:
        user: Current user
        
    Returns:
        List of notification summaries
    """
    try:
        from core.notification_manager import NotificationManager
        
        notification_manager = NotificationManager.get_instance()
        notifications = await notification_manager.get_notifications(user.user_id)
        
        return [
            {
                "notification_id": notification.notification_id,
                "type": notification.type,
                "title": notification.title,
                "message": notification.message,
                "read": notification.read,
                "created_at": notification.created_at
            }
            for notification in notifications
        ]
        
    except Exception as e:
        logger.error(f"Error in get_notifications: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: User = Depends(get_current_user)):
    """
    Mark a notification as read.
    
    Args:
        notification_id: Notification ID
        user: Current user
        
    Returns:
        Success message
    """
    try:
        from core.notification_manager import NotificationManager
        
        notification_manager = NotificationManager.get_instance()
        success = await notification_manager.mark_notification_read(notification_id, user.user_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
            
        return {"message": "Notification marked as read"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in mark_notification_read: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
