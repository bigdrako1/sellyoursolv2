"""
Reinforcement Learning Agent for trading based on trained RL models.

This module provides the ReinforcementAgent class that uses trained reinforcement
learning models to make trading decisions.
"""
import logging
import asyncio
import time
from typing import Dict, List, Any, Optional, Tuple, Set
from decimal import Decimal
import json
import os
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

from core.base_agent import BaseAgent
from core.agent_registry import AgentRegistry
from core.execution_engine import ExecutionPriority
from exchanges.exchange_factory import ExchangeFactory
from models.order import Order, OrderSide, OrderType
from models.position import Position
from models.market import Market
from utils.config import Config
from trading_agents.ml.reinforcement.agent import DQNAgent
from trading_agents.ml.common.feature_engineering import (
    PriceFeatureExtractor, VolumeFeatureExtractor, 
    MomentumFeatureExtractor, VolatilityFeatureExtractor
)

logger = logging.getLogger(__name__)

class ReinforcementAgent(BaseAgent):
    """
    Agent for trading based on reinforcement learning models.
    """
    
    def __init__(self, agent_id: str, config: Dict[str, Any]):
        """
        Initialize the reinforcement learning agent.
        
        Args:
            agent_id: Unique identifier for the agent
            config: Agent configuration
        """
        super().__init__(agent_id, config)
        
        # Agent type
        self.agent_type = "reinforcement"
        
        # Exchange to use
        self.exchange_id: str = config.get("exchange_id", "binance")
        
        # Symbols to monitor
        self.symbols: List[str] = config.get("symbols", ["BTC/USDT"])
        
        # Model configuration
        self.model_id: str = config.get("model_id", "")
        self.model_dir: str = config.get("model_dir", "models")
        
        # Trading parameters
        self.trade_enabled: bool = config.get("trade_enabled", False)
        self.position_size_pct: float = config.get("position_size_pct", 5.0)
        self.max_positions: int = config.get("max_positions", 1)
        
        # Data parameters
        self.timeframe: str = config.get("timeframe", "1h")
        self.window_size: int = config.get("window_size", 30)
        self.lookback_periods: int = config.get("lookback_periods", 100)
        
        # Feature extractors
        self.feature_extractors = [
            PriceFeatureExtractor(),
            VolumeFeatureExtractor(),
            MomentumFeatureExtractor(),
            VolatilityFeatureExtractor()
        ]
        
        # RL agent
        self.rl_agent = None
        
        # Market data
        self.market_data: Dict[str, pd.DataFrame] = {}
        
        # Features
        self.features: Dict[str, pd.DataFrame] = {}
        
        # Current state
        self.current_state: Dict[str, np.ndarray] = {}
        
        # Current action
        self.current_action: Dict[str, int] = {}
        
        # Active positions
        self.positions: Dict[str, Dict[str, Any]] = {}
        
        # Exchange instance
        self.exchange = None
        
        # Exchange factory
        self.exchange_factory = ExchangeFactory()
        
        # Initialize metrics
        self.metrics.update({
            "symbols_monitored": len(self.symbols),
            "trades_executed": 0,
            "active_positions": 0,
            "total_profit": 0.0,
            "last_action_time": None
        })
        
        logger.info(f"Initialized ReinforcementAgent {agent_id} for {len(self.symbols)} symbols")
        
    async def initialize(self) -> bool:
        """
        Initialize the agent.
        
        Returns:
            True if initialization was successful, False otherwise
        """
        try:
            # Initialize exchange
            self.exchange = self.exchange_factory.create_exchange(self.exchange_id)
            await self.exchange.initialize()
            logger.info(f"Initialized exchange {self.exchange_id}")
            
            # Load model
            if self.model_id:
                try:
                    self.rl_agent = DQNAgent.load(self.model_id, self.model_dir)
                    logger.info(f"Loaded model {self.model_id}")
                except Exception as e:
                    logger.error(f"Error loading model {self.model_id}: {str(e)}")
                    return False
                    
            # Initialize market data
            for symbol in self.symbols:
                await self._update_market_data(symbol)
                
            return True
            
        except Exception as e:
            logger.error(f"Error initializing ReinforcementAgent: {str(e)}")
            return False
            
    async def execute_cycle(self) -> bool:
        """
        Execute a single agent cycle.
        
        Returns:
            True if the cycle was successful, False otherwise
        """
        try:
            # Update market data
            for symbol in self.symbols:
                await self._update_market_data(symbol)
                
            # Make decisions
            await self._make_decisions()
            
            # Execute trades if enabled
            if self.trade_enabled:
                await self._execute_trades()
                
            # Update positions
            await self._update_positions()
            
            # Update metrics
            self._update_metrics()
            
            return True
            
        except Exception as e:
            logger.error(f"Error in ReinforcementAgent cycle: {str(e)}")
            return False
            
    async def _update_market_data(self, symbol: str):
        """
        Update market data for a symbol.
        
        Args:
            symbol: Trading symbol
        """
        try:
            # Get OHLCV data
            since = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)
            ohlcv = await self.exchange.fetch_ohlcv(symbol, self.timeframe, since=since, limit=self.lookback_periods)
            
            # Convert to DataFrame
            df = pd.DataFrame(ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"])
            df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
            df.set_index("timestamp", inplace=True)
            
            # Store in market data
            self.market_data[symbol] = df
            
            # Extract features
            self.features[symbol] = self._extract_features(df)
            
        except Exception as e:
            logger.error(f"Error updating market data for {symbol}: {str(e)}")
            
    def _extract_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Extract features from data.
        
        Args:
            data: OHLCV DataFrame
            
        Returns:
            DataFrame with extracted features
        """
        # Initialize features DataFrame
        features = pd.DataFrame(index=data.index)
        
        # Extract features using each extractor
        for extractor in self.feature_extractors:
            extracted = extractor.extract(data)
            features = pd.concat([features, extracted], axis=1)
            
        # Fill NaN values
        features = features.fillna(0)
        
        return features
        
    def _get_state(self, symbol: str) -> np.ndarray:
        """
        Get current state for a symbol.
        
        Args:
            symbol: Trading symbol
            
        Returns:
            State array
        """
        # Get feature window
        features = self.features[symbol]
        if len(features) < self.window_size:
            # Not enough data
            return None
            
        feature_window = features.iloc[-self.window_size:].values
        
        # Get position and balance
        position = 1.0 if symbol in self.positions else 0.0
        balance = 1.0 if symbol not in self.positions else 0.0
        
        # Create position and balance arrays
        position_array = np.ones(self.window_size) * position
        balance_array = np.ones(self.window_size) * balance
        
        # Combine features with position and balance
        state = np.column_stack([
            feature_window,
            position_array.reshape(-1, 1),
            balance_array.reshape(-1, 1)
        ])
        
        return state.astype(np.float32)
        
    async def _make_decisions(self):
        """Make decisions for all symbols."""
        try:
            # Check if model is loaded
            if not self.rl_agent:
                logger.warning("No model loaded, skipping decisions")
                return
                
            # Make decisions for each symbol
            for symbol in self.symbols:
                if symbol not in self.features:
                    continue
                    
                try:
                    # Get current state
                    state = self._get_state(symbol)
                    if state is None:
                        continue
                        
                    # Store current state
                    self.current_state[symbol] = state
                    
                    # Get action from RL agent
                    action = self.rl_agent.act(state, training=False)
                    
                    # Store current action
                    self.current_action[symbol] = action
                    
                    # Update metrics
                    self.metrics["last_action_time"] = datetime.now().isoformat()
                    
                    logger.info(f"Made decision for {symbol}: action={action}")
                    
                except Exception as e:
                    logger.error(f"Error making decision for {symbol}: {str(e)}")
                    
        except Exception as e:
            logger.error(f"Error making decisions: {str(e)}")
            
    async def _execute_trades(self):
        """Execute trades based on decisions."""
        try:
            # Check if we can open more positions
            if len(self.positions) >= self.max_positions:
                logger.info(f"Maximum positions reached ({self.max_positions}), skipping trade execution")
                return
                
            # Process each symbol
            for symbol, action in self.current_action.items():
                # Skip if we already have a position for this symbol
                if symbol in self.positions:
                    # Check if we should close the position
                    if action == 2:  # Sell
                        await self._close_position(symbol, "sell_signal")
                    continue
                    
                # Process based on action
                if action == 1:  # Buy
                    await self._open_position(symbol, "buy")
                    
        except Exception as e:
            logger.error(f"Error executing trades: {str(e)}")
            
    async def _open_position(self, symbol: str, direction: str):
        """
        Open a position.
        
        Args:
            symbol: Trading symbol
            direction: Trade direction (buy/sell)
        """
        try:
            # Get current price
            ticker = await self.exchange.fetch_ticker(symbol)
            current_price = Decimal(str(ticker["last"]))
            
            # Calculate position size
            balance = await self.exchange.fetch_balance()
            quote_currency = symbol.split('/')[1]
            available_balance = Decimal(str(balance.get(quote_currency, {}).get("free", 0)))
            
            position_size = available_balance * Decimal(str(self.position_size_pct / 100.0))
            amount = position_size / current_price
            
            # Create order
            order_side = OrderSide.BUY if direction == "buy" else OrderSide.SELL
            
            order = Order(
                symbol=symbol,
                side=order_side,
                type=OrderType.MARKET,
                amount=float(amount)
            )
            
            # Execute order
            order_result = await self.exchange.create_order(order)
            
            # Store position
            self.positions[symbol] = {
                "symbol": symbol,
                "direction": direction,
                "entry_price": float(current_price),
                "amount": float(amount),
                "entry_time": time.time(),
                "entry_order": order_result
            }
            
            # Update metrics
            self.metrics["active_positions"] = len(self.positions)
            self.metrics["trades_executed"] += 1
            
            logger.info(f"Opened {direction} position for {symbol} at {current_price}")
            
        except Exception as e:
            logger.error(f"Error opening position for {symbol}: {str(e)}")
            
    async def _close_position(self, symbol: str, reason: str):
        """
        Close a position.
        
        Args:
            symbol: Symbol to close
            reason: Reason for closing
        """
        try:
            position = self.positions[symbol]
            
            # Get current price
            ticker = await self.exchange.fetch_ticker(symbol)
            current_price = Decimal(str(ticker["last"]))
            
            # Create close order
            order_side = OrderSide.SELL if position["direction"] == "buy" else OrderSide.BUY
            
            order = Order(
                symbol=symbol,
                side=order_side,
                type=OrderType.MARKET,
                amount=float(position["amount"])
            )
            
            # Execute order
            order_result = await self.exchange.create_order(order)
            
            # Calculate profit/loss
            entry_price = Decimal(str(position["entry_price"]))
            pnl = (current_price - entry_price) * Decimal(str(position["amount"])) if position["direction"] == "buy" else (entry_price - current_price) * Decimal(str(position["amount"]))
            
            # Update metrics
            self.metrics["total_profit"] += float(pnl)
            
            logger.info(f"Closed position for {symbol}: {reason} at {current_price}, PnL: {pnl}")
            
            # Remove position
            del self.positions[symbol]
            self.metrics["active_positions"] = len(self.positions)
            
        except Exception as e:
            logger.error(f"Error closing position for {symbol}: {str(e)}")
            
    async def _update_positions(self):
        """Update and manage open positions."""
        try:
            # Process each symbol with a position
            for symbol in list(self.positions.keys()):
                # Check if we have a current action for this symbol
                if symbol in self.current_action:
                    action = self.current_action[symbol]
                    
                    # Check if we should close the position
                    if action == 2:  # Sell
                        await self._close_position(symbol, "sell_signal")
                        
        except Exception as e:
            logger.error(f"Error updating positions: {str(e)}")
            
    def _update_metrics(self):
        """Update agent metrics."""
        try:
            self.metrics.update({
                "active_positions": len(self.positions),
                "symbols_monitored": len(self.symbols)
            })
            
        except Exception as e:
            logger.error(f"Error updating metrics: {str(e)}")
            
    def get_actions(self) -> Dict[str, Dict[str, Any]]:
        """
        Get current actions.
        
        Returns:
            Dictionary of actions by symbol
        """
        actions = {}
        for symbol, action in self.current_action.items():
            action_name = "hold"
            if action == 1:
                action_name = "buy"
            elif action == 2:
                action_name = "sell"
                
            actions[symbol] = {
                "action": action,
                "action_name": action_name,
                "timestamp": datetime.now().isoformat()
            }
            
        return actions
        
    def get_positions(self) -> Dict[str, Dict[str, Any]]:
        """
        Get active positions.
        
        Returns:
            Dictionary of active positions
        """
        return self.positions
        
    async def add_symbol(self, symbol: str) -> bool:
        """
        Add a symbol to monitor.
        
        Args:
            symbol: Symbol to add
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if symbol in self.symbols:
                logger.warning(f"Symbol {symbol} is already being monitored")
                return False
                
            # Add to symbols list
            self.symbols.append(symbol)
            
            # Initialize market data
            await self._update_market_data(symbol)
            
            # Update metrics
            self.metrics["symbols_monitored"] = len(self.symbols)
            
            logger.info(f"Added symbol {symbol} to monitoring")
            return True
            
        except Exception as e:
            logger.error(f"Error adding symbol {symbol}: {str(e)}")
            return False
            
    async def remove_symbol(self, symbol: str) -> bool:
        """
        Remove a symbol from monitoring.
        
        Args:
            symbol: Symbol to remove
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if symbol not in self.symbols:
                logger.warning(f"Symbol {symbol} is not being monitored")
                return False
                
            # Close position if exists
            if symbol in self.positions:
                await self._close_position(symbol, "manual")
                
            # Remove from symbols list
            self.symbols.remove(symbol)
            
            # Remove market data
            if symbol in self.market_data:
                del self.market_data[symbol]
                
            # Remove features
            if symbol in self.features:
                del self.features[symbol]
                
            # Remove state and action
            if symbol in self.current_state:
                del self.current_state[symbol]
                
            if symbol in self.current_action:
                del self.current_action[symbol]
                
            # Update metrics
            self.metrics["symbols_monitored"] = len(self.symbols)
            
            logger.info(f"Removed symbol {symbol} from monitoring")
            return True
            
        except Exception as e:
            logger.error(f"Error removing symbol {symbol}: {str(e)}")
            return False
            
    async def set_model(self, model_id: str) -> bool:
        """
        Set the model to use.
        
        Args:
            model_id: Model ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Load model
            self.rl_agent = DQNAgent.load(model_id, self.model_dir)
            
            # Update model ID
            self.model_id = model_id
            
            logger.info(f"Set model to {model_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error setting model {model_id}: {str(e)}")
            return False
            
    async def set_config(self, key: str, value: Any) -> bool:
        """
        Set a configuration parameter.
        
        Args:
            key: Parameter name
            value: Parameter value
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if key == "trade_enabled":
                self.trade_enabled = bool(value)
                
            elif key == "position_size_pct":
                self.position_size_pct = float(value)
                
            elif key == "max_positions":
                self.max_positions = int(value)
                
            elif key == "timeframe":
                self.timeframe = str(value)
                
            elif key == "window_size":
                self.window_size = int(value)
                
            elif key == "lookback_periods":
                self.lookback_periods = int(value)
                
            else:
                logger.warning(f"Unknown configuration parameter: {key}")
                return False
                
            logger.info(f"Set {key} to {value}")
            return True
            
        except Exception as e:
            logger.error(f"Error setting configuration parameter {key}: {str(e)}")
            return False
            
    async def shutdown(self) -> bool:
        """
        Shut down the agent.
        
        Returns:
            True if shutdown was successful, False otherwise
        """
        try:
            # Close all positions
            for symbol in list(self.positions.keys()):
                await self._close_position(symbol, "shutdown")
                
            # Close exchange connection
            await self.exchange.close()
            
            logger.info(f"Shut down ReinforcementAgent {self.agent_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error shutting down ReinforcementAgent: {str(e)}")
            return False
