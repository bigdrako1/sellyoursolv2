"""
Hyperliquid Trading Agent implementation.

This module provides an agent that trades on Hyperliquid based on liquidation events.
"""
import asyncio
import logging
import requests
import json
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from ..core.base_agent import BaseAgent
from ..core.agent_status import AgentStatus
from ..core.resource_pool import ResourcePool

logger = logging.getLogger(__name__)

class HyperliquidTradingAgent(BaseAgent):
    """
    Agent that trades on Hyperliquid based on liquidation events.
    
    This agent is based on the functionality in hyperliquid_trading_bot.py.
    """
    
    async def _initialize(self):
        """Initialize the Hyperliquid trading agent."""
        logger.info(f"Initializing Hyperliquid trading agent {self.agent_id}")
        
        # Validate configuration
        self._validate_config()
        
        # Initialize state
        self.api_url = self.config.get("api_url", "https://api.hyperliquid.xyz")
        self.ws_url = self.config.get("ws_url", "wss://api.hyperliquid.xyz/ws")
        self.private_key = self.config.get("private_key", "")
        self.wallet_address = self.config.get("wallet_address", "")
        self.min_liquidation_size = self.config.get("min_liquidation_size", 10000)
        self.max_position_size = self.config.get("max_position_size", 1000)
        self.risk_per_trade = self.config.get("risk_per_trade", 1.0)
        self.take_profit_pct = self.config.get("take_profit_pct", 2.0)
        self.stop_loss_pct = self.config.get("stop_loss_pct", 1.0)
        self.liquidation_threshold = self.config.get("liquidation_threshold", 0.05)
        
        # Initialize trading state
        self.active_positions = {}
        self.pending_orders = {}
        self.liquidation_events = []
        self.ws_connection = None
        
        logger.info(f"Hyperliquid trading agent {self.agent_id} initialized")
        
    async def _cleanup(self):
        """Clean up resources."""
        logger.info(f"Cleaning up Hyperliquid trading agent {self.agent_id}")
        
        # Close WebSocket connection if open
        if self.ws_connection:
            await self.ws_connection.close()
            self.ws_connection = None
        
    async def _on_config_update(self, old_config: Dict[str, Any], new_config: Dict[str, Any]):
        """Handle configuration updates."""
        logger.info(f"Updating configuration for Hyperliquid trading agent {self.agent_id}")
        
        # Update configuration
        self.api_url = new_config.get("api_url", self.api_url)
        self.ws_url = new_config.get("ws_url", self.ws_url)
        self.private_key = new_config.get("private_key", self.private_key)
        self.wallet_address = new_config.get("wallet_address", self.wallet_address)
        self.min_liquidation_size = new_config.get("min_liquidation_size", self.min_liquidation_size)
        self.max_position_size = new_config.get("max_position_size", self.max_position_size)
        self.risk_per_trade = new_config.get("risk_per_trade", self.risk_per_trade)
        self.take_profit_pct = new_config.get("take_profit_pct", self.take_profit_pct)
        self.stop_loss_pct = new_config.get("stop_loss_pct", self.stop_loss_pct)
        self.liquidation_threshold = new_config.get("liquidation_threshold", self.liquidation_threshold)
        
        logger.info(f"Configuration updated for Hyperliquid trading agent {self.agent_id}")
        
    async def _run_cycle(self, resource_pool: ResourcePool) -> Dict[str, Any]:
        """Run a single agent cycle."""
        logger.info(f"Running cycle for Hyperliquid trading agent {self.agent_id}")
        
        results = {
            "liquidations_detected": 0,
            "trades_executed": 0,
            "positions_managed": 0,
            "errors": 0
        }
        
        try:
            # Connect to WebSocket if not connected
            if not self.ws_connection:
                await self._connect_to_websocket()
                
            # Get account information
            account_info = await self._get_account_info()
            
            # Get market data
            market_data = await self._get_market_data()
            
            # Get liquidation events
            liquidation_events = await self._get_liquidation_events()
            results["liquidations_detected"] = len(liquidation_events)
            
            # Process liquidation events
            for event in liquidation_events:
                if self._should_trade_on_liquidation(event, market_data):
                    trade_result = await self._execute_trade_on_liquidation(event, market_data, account_info)
                    if trade_result.get("success"):
                        results["trades_executed"] += 1
                        
            # Manage existing positions
            for position_id, position in self.active_positions.items():
                position_result = await self._manage_position(position_id, position, market_data)
                if position_result.get("action_taken"):
                    results["positions_managed"] += 1
                    
            logger.info(f"Cycle completed for Hyperliquid trading agent {self.agent_id}: {results}")
            
        except Exception as e:
            logger.error(f"Error in Hyperliquid trading cycle: {str(e)}")
            results["errors"] += 1
            
        return results
        
    async def _connect_to_websocket(self):
        """Connect to the Hyperliquid WebSocket API."""
        logger.info(f"Connecting to Hyperliquid WebSocket API: {self.ws_url}")
        
        # This is a placeholder for the actual WebSocket connection
        # In a real implementation, this would connect to the WebSocket API
        # and set up event handlers
        
        self.ws_connection = {
            "connected": True,
            "last_message_time": datetime.now()
        }
        
        logger.info("Connected to Hyperliquid WebSocket API")
        
    async def _get_account_info(self) -> Dict[str, Any]:
        """
        Get account information from Hyperliquid API.
        
        Returns:
            Dictionary containing account information
        """
        logger.debug("Getting account information")
        
        # This is a placeholder for the actual API call
        # In a real implementation, this would call the Hyperliquid API
        
        return {
            "wallet_address": self.wallet_address,
            "account_equity": 10000.0,
            "free_collateral": 5000.0,
            "margin_usage": 0.5,
            "positions": [
                {
                    "asset": "BTC",
                    "size": 0.1,
                    "entry_price": 50000.0,
                    "liquidation_price": 45000.0,
                    "unrealized_pnl": 500.0
                }
            ]
        }
        
    async def _get_market_data(self) -> Dict[str, Any]:
        """
        Get market data from Hyperliquid API.
        
        Returns:
            Dictionary containing market data
        """
        logger.debug("Getting market data")
        
        # This is a placeholder for the actual API call
        # In a real implementation, this would call the Hyperliquid API
        
        return {
            "assets": [
                {
                    "symbol": "BTC",
                    "price": 50000.0,
                    "funding_rate": 0.01,
                    "open_interest": 1000000.0,
                    "volume_24h": 5000000.0
                },
                {
                    "symbol": "ETH",
                    "price": 3000.0,
                    "funding_rate": 0.02,
                    "open_interest": 500000.0,
                    "volume_24h": 2000000.0
                }
            ]
        }
        
    async def _get_liquidation_events(self) -> List[Dict[str, Any]]:
        """
        Get liquidation events from Hyperliquid API.
        
        Returns:
            List of liquidation events
        """
        logger.debug("Getting liquidation events")
        
        # This is a placeholder for the actual API call
        # In a real implementation, this would call the Hyperliquid API
        
        return [
            {
                "timestamp": datetime.now().isoformat(),
                "asset": "BTC",
                "size": 10.0,
                "price": 49000.0,
                "liquidation_type": "long",
                "liquidation_value": 490000.0
            },
            {
                "timestamp": datetime.now().isoformat(),
                "asset": "ETH",
                "size": 100.0,
                "price": 2900.0,
                "liquidation_type": "short",
                "liquidation_value": 290000.0
            }
        ]
        
    def _should_trade_on_liquidation(self, event: Dict[str, Any], market_data: Dict[str, Any]) -> bool:
        """
        Determine if we should trade based on a liquidation event.
        
        Args:
            event: Liquidation event
            market_data: Current market data
            
        Returns:
            True if we should trade, False otherwise
        """
        # Check if the liquidation is large enough
        if event.get("liquidation_value", 0) < self.min_liquidation_size:
            logger.debug(f"Liquidation too small: {event.get('liquidation_value', 0)} < {self.min_liquidation_size}")
            return False
            
        # Check if we already have a position in this asset
        asset = event.get("asset")
        if asset in self.active_positions:
            logger.debug(f"Already have a position in {asset}")
            return False
            
        # Check if the liquidation is recent enough
        event_time = datetime.fromisoformat(event.get("timestamp"))
        if datetime.now() - event_time > timedelta(minutes=5):
            logger.debug(f"Liquidation too old: {event_time}")
            return False
            
        # Check if the liquidation is significant relative to open interest
        asset_data = next((a for a in market_data.get("assets", []) if a.get("symbol") == asset), None)
        if not asset_data:
            logger.debug(f"No market data for {asset}")
            return False
            
        open_interest = asset_data.get("open_interest", 0)
        liquidation_ratio = event.get("liquidation_value", 0) / open_interest if open_interest else 0
        
        if liquidation_ratio < self.liquidation_threshold:
            logger.debug(f"Liquidation ratio too small: {liquidation_ratio} < {self.liquidation_threshold}")
            return False
            
        logger.info(f"Should trade on liquidation: {event}")
        return True
        
    async def _execute_trade_on_liquidation(self, event: Dict[str, Any], market_data: Dict[str, Any], account_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a trade based on a liquidation event.
        
        Args:
            event: Liquidation event
            market_data: Current market data
            account_info: Account information
            
        Returns:
            Dictionary containing the result of the trade
        """
        logger.info(f"Executing trade on liquidation: {event}")
        
        # Determine trade direction (opposite of liquidation)
        liquidation_type = event.get("liquidation_type")
        trade_side = "buy" if liquidation_type == "short" else "sell"
        
        # Determine trade size
        asset = event.get("asset")
        asset_data = next((a for a in market_data.get("assets", []) if a.get("symbol") == asset), None)
        if not asset_data:
            return {"success": False, "error": f"No market data for {asset}"}
            
        asset_price = asset_data.get("price", 0)
        account_equity = account_info.get("account_equity", 0)
        
        # Calculate position size based on risk
        risk_amount = account_equity * (self.risk_per_trade / 100)
        position_size = min(risk_amount / asset_price, self.max_position_size)
        
        # Calculate take profit and stop loss levels
        take_profit_price = asset_price * (1 + self.take_profit_pct / 100) if trade_side == "buy" else asset_price * (1 - self.take_profit_pct / 100)
        stop_loss_price = asset_price * (1 - self.stop_loss_pct / 100) if trade_side == "buy" else asset_price * (1 + self.stop_loss_pct / 100)
        
        # Execute the trade
        # This is a placeholder for the actual API call
        # In a real implementation, this would call the Hyperliquid API
        
        trade_result = {
            "success": True,
            "trade_id": f"trade_{int(time.time())}",
            "asset": asset,
            "side": trade_side,
            "size": position_size,
            "price": asset_price,
            "take_profit": take_profit_price,
            "stop_loss": stop_loss_price,
            "timestamp": datetime.now().isoformat()
        }
        
        # Add to active positions
        self.active_positions[trade_result["trade_id"]] = {
            "asset": asset,
            "side": trade_side,
            "size": position_size,
            "entry_price": asset_price,
            "take_profit": take_profit_price,
            "stop_loss": stop_loss_price,
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"Trade executed: {trade_result}")
        return trade_result
        
    async def _manage_position(self, position_id: str, position: Dict[str, Any], market_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Manage an existing position.
        
        Args:
            position_id: Position ID
            position: Position data
            market_data: Current market data
            
        Returns:
            Dictionary containing the result of the position management
        """
        logger.debug(f"Managing position: {position_id}")
        
        # Get current price
        asset = position.get("asset")
        asset_data = next((a for a in market_data.get("assets", []) if a.get("symbol") == asset), None)
        if not asset_data:
            return {"action_taken": False, "error": f"No market data for {asset}"}
            
        current_price = asset_data.get("price", 0)
        
        # Check if take profit or stop loss has been hit
        take_profit_price = position.get("take_profit")
        stop_loss_price = position.get("stop_loss")
        side = position.get("side")
        
        if side == "buy":
            if current_price >= take_profit_price:
                # Take profit hit
                return await self._close_position(position_id, position, "take_profit")
            elif current_price <= stop_loss_price:
                # Stop loss hit
                return await self._close_position(position_id, position, "stop_loss")
        else:  # side == "sell"
            if current_price <= take_profit_price:
                # Take profit hit
                return await self._close_position(position_id, position, "take_profit")
            elif current_price >= stop_loss_price:
                # Stop loss hit
                return await self._close_position(position_id, position, "stop_loss")
                
        return {"action_taken": False, "message": "No action needed"}
        
    async def _close_position(self, position_id: str, position: Dict[str, Any], reason: str) -> Dict[str, Any]:
        """
        Close a position.
        
        Args:
            position_id: Position ID
            position: Position data
            reason: Reason for closing the position
            
        Returns:
            Dictionary containing the result of the position closure
        """
        logger.info(f"Closing position {position_id} due to {reason}")
        
        # Execute the trade to close the position
        # This is a placeholder for the actual API call
        # In a real implementation, this would call the Hyperliquid API
        
        close_result = {
            "success": True,
            "position_id": position_id,
            "reason": reason,
            "timestamp": datetime.now().isoformat()
        }
        
        # Remove from active positions
        if position_id in self.active_positions:
            del self.active_positions[position_id]
            
        logger.info(f"Position closed: {close_result}")
        return {"action_taken": True, "result": close_result}
        
    def _validate_config(self):
        """Validate the agent configuration."""
        # Check that private_key is provided
        if not self.config.get("private_key"):
            raise ValueError("private_key is required")
            
        # Check that wallet_address is provided
        if not self.config.get("wallet_address"):
            raise ValueError("wallet_address is required")
            
        # Check that min_liquidation_size is a positive number
        min_liquidation_size = self.config.get("min_liquidation_size", 10000)
        if not isinstance(min_liquidation_size, (int, float)) or min_liquidation_size <= 0:
            raise ValueError("min_liquidation_size must be a positive number")
            
        # Check that max_position_size is a positive number
        max_position_size = self.config.get("max_position_size", 1000)
        if not isinstance(max_position_size, (int, float)) or max_position_size <= 0:
            raise ValueError("max_position_size must be a positive number")
            
        # Check that risk_per_trade is a positive number
        risk_per_trade = self.config.get("risk_per_trade", 1.0)
        if not isinstance(risk_per_trade, (int, float)) or risk_per_trade <= 0:
            raise ValueError("risk_per_trade must be a positive number")
            
        # Check that take_profit_pct is a positive number
        take_profit_pct = self.config.get("take_profit_pct", 2.0)
        if not isinstance(take_profit_pct, (int, float)) or take_profit_pct <= 0:
            raise ValueError("take_profit_pct must be a positive number")
            
        # Check that stop_loss_pct is a positive number
        stop_loss_pct = self.config.get("stop_loss_pct", 1.0)
        if not isinstance(stop_loss_pct, (int, float)) or stop_loss_pct <= 0:
            raise ValueError("stop_loss_pct must be a positive number")
