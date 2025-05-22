"""
Liquidation Agent implementation.
This agent monitors liquidation events and trades based on them.
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import json

from core.base_agent import BaseAgent
from core.agent_status import AgentStatus
from services.market_data_service import MarketDataService
from services.execution_service import ExecutionService
from services.position_manager import PositionManager

logger = logging.getLogger(__name__)

class LiquidationAgent(BaseAgent):
    """
    Agent that monitors liquidation events and trades based on them.
    Based on the functionality in hyperliquid trading bot.py.
    """
    
    async def _initialize(self):
        """
        Initialize agent resources.
        """
        logger.info("Initializing LiquidationAgent")
        
        # Initialize services
        self.market_data = MarketDataService(self.config.get("market_data", {}))
        self.execution = ExecutionService(self.config.get("execution", {}))
        self.position_manager = PositionManager(self.agent_id)
        
        # Get configuration
        self.symbols = self.config.get("symbols", ["BTC", "ETH", "SOL"])
        self.symbols_data = self.config.get("symbols_data", {
            "BTC": {
                "liquidation_threshold": 900000,
                "time_window_mins": 24,
                "stop_loss": 0.02,  # 2%
                "take_profit": 0.01  # 1%
            },
            "ETH": {
                "liquidation_threshold": 500000,
                "time_window_mins": 4,
                "stop_loss": 0.02,
                "take_profit": 0.01
            },
            "SOL": {
                "liquidation_threshold": 300000,
                "time_window_mins": 4,
                "stop_loss": 0.02,
                "take_profit": 0.01
            }
        })
        self.order_size_usd = self.config.get("order_size_usd", 10)
        self.leverage = self.config.get("leverage", 3)
        self.check_interval_seconds = self.config.get("check_interval_seconds", 30)
        
        # Initialize state
        self.scheduler_task = None
        
        logger.info(f"LiquidationAgent initialized with {len(self.symbols)} symbols")
        
    async def _cleanup(self):
        """
        Clean up agent resources.
        """
        logger.info("Cleaning up LiquidationAgent resources")
        
        # Cancel scheduler task if running
        if self.scheduler_task:
            self.scheduler_task.cancel()
            try:
                await self.scheduler_task
            except asyncio.CancelledError:
                pass
            
        # Close all positions
        await self.position_manager.close_all_positions()
        
        # Close services
        await self.market_data.close()
        
        logger.info("LiquidationAgent resources cleaned up")
        
    async def _on_config_update(self, old_config: Dict[str, Any], new_config: Dict[str, Any]):
        """
        Handle configuration updates.
        
        Args:
            old_config: Previous configuration
            new_config: New configuration
        """
        logger.info("Updating LiquidationAgent configuration")
        
        # Update symbols if changed
        if old_config.get("symbols") != new_config.get("symbols"):
            self.symbols = new_config.get("symbols", ["BTC", "ETH", "SOL"])
            
        # Update symbols data if changed
        if old_config.get("symbols_data") != new_config.get("symbols_data"):
            self.symbols_data = new_config.get("symbols_data", self.symbols_data)
            
        # Update check interval if changed
        if old_config.get("check_interval_seconds") != new_config.get("check_interval_seconds"):
            self.check_interval_seconds = new_config.get("check_interval_seconds", 30)
            
            # Restart scheduler with new interval if agent is running
            if self.status == AgentStatus.RUNNING and self.scheduler_task:
                self.scheduler_task.cancel()
                try:
                    await self.scheduler_task
                except asyncio.CancelledError:
                    pass
                self.scheduler_task = asyncio.create_task(self._scheduler())
                
        # Update other parameters
        self.order_size_usd = new_config.get("order_size_usd", self.order_size_usd)
        self.leverage = new_config.get("leverage", self.leverage)
        
        logger.info("LiquidationAgent configuration updated")
        
    async def start(self):
        """
        Start the agent.
        """
        await super().start()
        
        # Start the scheduler
        self.scheduler_task = asyncio.create_task(self._scheduler())
        
    async def _scheduler(self):
        """
        Scheduler for periodic liquidation checks.
        """
        try:
            while self.status == AgentStatus.RUNNING:
                await self._run_liquidation_cycle()
                await asyncio.sleep(self.check_interval_seconds)
        except asyncio.CancelledError:
            logger.info("Scheduler task cancelled")
            raise
        except Exception as e:
            logger.error(f"Error in scheduler: {str(e)}")
            self.status = AgentStatus.ERROR
            raise
            
    async def _run_liquidation_cycle(self):
        """
        Run a complete liquidation trading cycle.
        """
        logger.info("Starting liquidation trading cycle")
        
        try:
            for symbol in self.symbols:
                logger.info(f"Checking symbol {symbol}")
                
                # Get symbol configuration
                symbol_config = self.symbols_data.get(symbol, {})
                if not symbol_config:
                    logger.warning(f"No configuration found for symbol {symbol}, skipping")
                    continue
                    
                # Check if we're already in a position for this symbol
                open_positions = await self.position_manager.get_open_positions()
                symbol_positions = [p for p in open_positions if p.get("token_address") == symbol]
                
                if symbol_positions:
                    # We're already in a position for this symbol, check PnL
                    logger.info(f"Already in position for {symbol}, checking PnL")
                    await self._manage_position(symbol, symbol_positions[0], symbol_config)
                else:
                    # No position for this symbol, check liquidations
                    logger.info(f"No position for {symbol}, checking liquidations")
                    await self._check_liquidations(symbol, symbol_config)
                    
            # Update metrics
            self.metrics.set("last_cycle_completed", datetime.now().isoformat())
            self.metrics.set("symbols_count", len(self.symbols))
            
            logger.info("Liquidation trading cycle completed successfully")
            
        except Exception as e:
            logger.error(f"Error in liquidation trading cycle: {str(e)}")
            self.metrics.increment("errors")
            raise
            
    async def _check_liquidations(self, symbol: str, symbol_config: Dict[str, Any]):
        """
        Check liquidation data for a symbol and enter position if threshold is met.
        
        Args:
            symbol: Trading symbol
            symbol_config: Symbol-specific configuration
        """
        # Get liquidation threshold and time window
        liquidation_threshold = symbol_config.get("liquidation_threshold", 100000)
        time_window_mins = symbol_config.get("time_window_mins", 5)
        
        try:
            # Get liquidation data
            liquidation_amount, liquidation_price = await self.market_data.get_liquidation_data(
                symbol, time_window_mins
            )
            
            logger.info(f"Liquidation data for {symbol}: Amount=${liquidation_amount}, Price=${liquidation_price}")
            
            # Check if liquidation threshold is met
            if liquidation_amount >= liquidation_threshold and liquidation_price > 0:
                logger.info(f"Liquidation threshold met for {symbol}: ${liquidation_amount} >= ${liquidation_threshold}")
                
                # Calculate entry price (slightly below liquidation price)
                entry_price = liquidation_price * 0.995  # 0.5% below liquidation price
                
                # Enter short position
                await self._enter_short_position(symbol, entry_price, symbol_config)
            else:
                logger.info(f"Liquidation threshold not met for {symbol}: ${liquidation_amount} < ${liquidation_threshold}")
                
        except Exception as e:
            logger.error(f"Error checking liquidations for {symbol}: {str(e)}")
            self.metrics.increment("errors")
            
    async def _enter_short_position(self, symbol: str, entry_price: float, symbol_config: Dict[str, Any]):
        """
        Enter a short position for a symbol.
        
        Args:
            symbol: Trading symbol
            entry_price: Entry price
            symbol_config: Symbol-specific configuration
        """
        logger.info(f"Entering short position for {symbol} at ${entry_price}")
        
        try:
            # Calculate position size
            position_size = self.order_size_usd * self.leverage / entry_price
            
            # Get stop loss and take profit percentages
            stop_loss = symbol_config.get("stop_loss", 0.02)  # Default 2%
            take_profit = symbol_config.get("take_profit", 0.01)  # Default 1%
            
            # Open position
            position_id = await self.position_manager.open_position(
                token_address=symbol,
                amount=self.order_size_usd,
                entry_price=entry_price,
                stop_loss=stop_loss,
                take_profit=take_profit,
                execution_service=self.execution
            )
            
            logger.info(f"Opened short position {position_id} for {symbol} at ${entry_price}")
            
            # Update metrics
            self.metrics.increment("positions_opened")
            self.metrics.set(f"position_{symbol}", {
                "id": position_id,
                "entry_price": entry_price,
                "size": position_size,
                "direction": "short",
                "leverage": self.leverage,
                "timestamp": datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error entering short position for {symbol}: {str(e)}")
            self.metrics.increment("errors")
            
    async def _manage_position(self, symbol: str, position: Dict[str, Any], symbol_config: Dict[str, Any]):
        """
        Manage an existing position for a symbol.
        
        Args:
            symbol: Trading symbol
            position: Position data
            symbol_config: Symbol-specific configuration
        """
        logger.info(f"Managing position for {symbol}")
        
        try:
            # Get current price
            token_details = await self.market_data.get_token_details(symbol)
            current_price = token_details.get("price", 0.0)
            
            if current_price <= 0:
                logger.warning(f"Invalid current price for {symbol}: {current_price}")
                return
                
            # Update position with current price
            await self.position_manager.update_position_price(position["id"], current_price)
            
            # Check take profit/stop loss
            result = await self.position_manager.check_stop_loss_take_profit(
                position["id"], 
                current_price,
                self.execution
            )
            
            if result["action"] == "take_profit":
                logger.info(f"Take profit triggered for position {position['id']} ({symbol})")
                self.metrics.record_profit(position["amount"] * symbol_config.get("take_profit", 0.01))
                
            elif result["action"] == "stop_loss":
                logger.info(f"Stop loss triggered for position {position['id']} ({symbol})")
                self.metrics.record_loss(position["amount"] * symbol_config.get("stop_loss", 0.02))
                
        except Exception as e:
            logger.error(f"Error managing position for {symbol}: {str(e)}")
            self.metrics.increment("errors")
            
    async def execute_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a specific action.
        
        Args:
            action: Action to execute
            
        Returns:
            Result of the action
        """
        action_type = action.get("type")
        
        if action_type == "add_symbol":
            symbol = action.get("symbol")
            config = action.get("config", {})
            
            if symbol and symbol not in self.symbols:
                self.symbols.append(symbol)
                if config:
                    self.symbols_data[symbol] = config
                self.config["symbols"] = self.symbols
                self.config["symbols_data"] = self.symbols_data
                
                logger.info(f"Added symbol {symbol} to monitored symbols")
                return {"success": True, "message": f"Added symbol {symbol}"}
                
        elif action_type == "remove_symbol":
            symbol = action.get("symbol")
            
            if symbol and symbol in self.symbols:
                self.symbols.remove(symbol)
                if symbol in self.symbols_data:
                    del self.symbols_data[symbol]
                self.config["symbols"] = self.symbols
                self.config["symbols_data"] = self.symbols_data
                
                logger.info(f"Removed symbol {symbol} from monitored symbols")
                return {"success": True, "message": f"Removed symbol {symbol}"}
                
        elif action_type == "update_symbol_config":
            symbol = action.get("symbol")
            config = action.get("config", {})
            
            if symbol and symbol in self.symbols and config:
                if symbol not in self.symbols_data:
                    self.symbols_data[symbol] = {}
                    
                # Update config
                for key, value in config.items():
                    self.symbols_data[symbol][key] = value
                    
                self.config["symbols_data"] = self.symbols_data
                
                logger.info(f"Updated configuration for symbol {symbol}")
                return {"success": True, "message": f"Updated configuration for symbol {symbol}"}
                
        elif action_type == "close_position":
            position_id = action.get("position_id")
            
            if position_id:
                position = await self.position_manager.get_position(position_id)
                if position:
                    symbol = position["token_address"]
                    token_details = await self.market_data.get_token_details(symbol)
                    current_price = token_details.get("price", 0.0)
                    
                    closed_position = await self.position_manager.close_position(
                        position_id, 
                        current_price,
                        self.execution
                    )
                    
                    logger.info(f"Manually closed position {position_id}")
                    return {
                        "success": True, 
                        "message": f"Closed position {position_id}",
                        "data": closed_position
                    }
                    
        elif action_type == "get_liquidation_data":
            symbol = action.get("symbol")
            time_window_mins = action.get("time_window_mins", 5)
            
            if symbol:
                try:
                    liquidation_amount, liquidation_price = await self.market_data.get_liquidation_data(
                        symbol, time_window_mins
                    )
                    
                    return {
                        "success": True,
                        "message": f"Liquidation data for {symbol}",
                        "data": {
                            "symbol": symbol,
                            "liquidation_amount": liquidation_amount,
                            "liquidation_price": liquidation_price,
                            "time_window_mins": time_window_mins,
                            "timestamp": datetime.now().isoformat()
                        }
                    }
                except Exception as e:
                    logger.error(f"Error getting liquidation data for {symbol}: {str(e)}")
                    return {
                        "success": False,
                        "message": f"Error getting liquidation data: {str(e)}"
                    }
                    
        return await super().execute_action(action)
