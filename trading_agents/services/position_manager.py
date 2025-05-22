"""
Position manager for tracking and managing trading positions.
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid
import asyncio

from services.execution_service import ExecutionService

logger = logging.getLogger(__name__)

class PositionManager:
    """
    Service for tracking and managing trading positions.
    """
    
    def __init__(self, agent_id: str):
        """
        Initialize the position manager.
        
        Args:
            agent_id: ID of the agent that owns this position manager
        """
        self.agent_id = agent_id
        self.positions: Dict[str, Dict[str, Any]] = {}
        
    async def open_position(
        self,
        token_address: str,
        amount: float,
        entry_price: float,
        stop_loss: Optional[float] = None,
        take_profit: Optional[float] = None,
        execution_service: Optional[ExecutionService] = None
    ) -> str:
        """
        Open a new position.
        
        Args:
            token_address: Token address
            amount: Position size in USD
            entry_price: Entry price
            stop_loss: Stop loss percentage (0.1 = 10%)
            take_profit: Take profit percentage (0.2 = 20%)
            execution_service: Execution service for executing the trade
            
        Returns:
            Position ID
        """
        # Generate position ID
        position_id = str(uuid.uuid4())
        
        # Execute trade if execution service is provided
        tx_hash = None
        if execution_service:
            transaction = await execution_service.buy_token(token_address, amount)
            tx_hash = transaction.get("tx_hash")
        
        # Create position record
        position = {
            "id": position_id,
            "agent_id": self.agent_id,
            "token_address": token_address,
            "amount": amount,
            "entry_price": entry_price,
            "current_price": entry_price,
            "stop_loss": stop_loss,
            "take_profit": take_profit,
            "status": "open",
            "pnl": 0.0,
            "pnl_percentage": 0.0,
            "entry_time": datetime.now().isoformat(),
            "exit_time": None,
            "exit_price": None,
            "tx_hash": tx_hash
        }
        
        # Store position
        self.positions[position_id] = position
        
        logger.info(f"Opened position {position_id} for token {token_address}")
        
        return position_id
        
    async def close_position(
        self,
        position_id: str,
        exit_price: float,
        execution_service: Optional[ExecutionService] = None
    ) -> Dict[str, Any]:
        """
        Close a position.
        
        Args:
            position_id: Position ID
            exit_price: Exit price
            execution_service: Execution service for executing the trade
            
        Returns:
            Updated position
        """
        # Check if position exists
        if position_id not in self.positions:
            raise ValueError(f"Position {position_id} not found")
            
        position = self.positions[position_id]
        
        # Check if position is already closed
        if position["status"] != "open":
            raise ValueError(f"Position {position_id} is already {position['status']}")
            
        # Execute trade if execution service is provided
        if execution_service:
            await execution_service.sell_token(position["token_address"], position["amount"])
        
        # Calculate PnL
        entry_price = position["entry_price"]
        pnl = (exit_price - entry_price) / entry_price
        pnl_amount = position["amount"] * pnl
        
        # Update position
        position["status"] = "closed"
        position["exit_price"] = exit_price
        position["exit_time"] = datetime.now().isoformat()
        position["pnl"] = pnl_amount
        position["pnl_percentage"] = pnl * 100  # Convert to percentage
        
        logger.info(f"Closed position {position_id} with PnL: {pnl_amount:.2f} USD ({pnl * 100:.2f}%)")
        
        return position
        
    async def update_position_price(self, position_id: str, current_price: float) -> Dict[str, Any]:
        """
        Update the current price of a position.
        
        Args:
            position_id: Position ID
            current_price: Current price
            
        Returns:
            Updated position
        """
        # Check if position exists
        if position_id not in self.positions:
            raise ValueError(f"Position {position_id} not found")
            
        position = self.positions[position_id]
        
        # Check if position is open
        if position["status"] != "open":
            return position
            
        # Update price and calculate unrealized PnL
        entry_price = position["entry_price"]
        pnl = (current_price - entry_price) / entry_price
        pnl_amount = position["amount"] * pnl
        
        position["current_price"] = current_price
        position["pnl"] = pnl_amount
        position["pnl_percentage"] = pnl * 100  # Convert to percentage
        
        return position
        
    async def check_stop_loss_take_profit(
        self,
        position_id: str,
        current_price: float,
        execution_service: Optional[ExecutionService] = None
    ) -> Dict[str, Any]:
        """
        Check if stop loss or take profit has been triggered.
        
        Args:
            position_id: Position ID
            current_price: Current price
            execution_service: Execution service for executing the trade
            
        Returns:
            Position status
        """
        # Check if position exists
        if position_id not in self.positions:
            raise ValueError(f"Position {position_id} not found")
            
        position = self.positions[position_id]
        
        # Check if position is open
        if position["status"] != "open":
            return {"position_id": position_id, "status": position["status"], "action": "none"}
            
        # Update price
        await self.update_position_price(position_id, current_price)
        
        # Check stop loss
        if position["stop_loss"] is not None:
            entry_price = position["entry_price"]
            pnl_percentage = (current_price - entry_price) / entry_price * 100
            
            if pnl_percentage <= -position["stop_loss"] * 100:
                # Stop loss triggered
                await self.close_position(position_id, current_price, execution_service)
                logger.info(f"Stop loss triggered for position {position_id}")
                return {"position_id": position_id, "status": "closed", "action": "stop_loss"}
                
        # Check take profit
        if position["take_profit"] is not None:
            entry_price = position["entry_price"]
            pnl_percentage = (current_price - entry_price) / entry_price * 100
            
            if pnl_percentage >= position["take_profit"] * 100:
                # Take profit triggered
                await self.close_position(position_id, current_price, execution_service)
                logger.info(f"Take profit triggered for position {position_id}")
                return {"position_id": position_id, "status": "closed", "action": "take_profit"}
                
        return {"position_id": position_id, "status": "open", "action": "none"}
        
    async def get_position(self, position_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a position by ID.
        
        Args:
            position_id: Position ID
            
        Returns:
            Position or None if not found
        """
        return self.positions.get(position_id)
        
    async def get_open_positions(self) -> List[Dict[str, Any]]:
        """
        Get all open positions.
        
        Returns:
            List of open positions
        """
        return [p for p in self.positions.values() if p["status"] == "open"]
        
    async def get_closed_positions(self) -> List[Dict[str, Any]]:
        """
        Get all closed positions.
        
        Returns:
            List of closed positions
        """
        return [p for p in self.positions.values() if p["status"] == "closed"]
        
    async def get_all_positions(self) -> List[Dict[str, Any]]:
        """
        Get all positions.
        
        Returns:
            List of all positions
        """
        return list(self.positions.values())
        
    async def close_all_positions(self, current_prices: Optional[Dict[str, float]] = None, execution_service: Optional[ExecutionService] = None) -> List[Dict[str, Any]]:
        """
        Close all open positions.
        
        Args:
            current_prices: Dictionary mapping token addresses to current prices
            execution_service: Execution service for executing trades
            
        Returns:
            List of closed positions
        """
        open_positions = await self.get_open_positions()
        closed_positions = []
        
        for position in open_positions:
            try:
                position_id = position["id"]
                token_address = position["token_address"]
                
                # Get current price
                current_price = None
                if current_prices and token_address in current_prices:
                    current_price = current_prices[token_address]
                else:
                    # Use last known price
                    current_price = position["current_price"]
                    
                # Close position
                closed_position = await self.close_position(position_id, current_price, execution_service)
                closed_positions.append(closed_position)
            except Exception as e:
                logger.error(f"Error closing position {position['id']}: {str(e)}")
                
        return closed_positions
