"""
Predictive Analytics Agent for trading based on machine learning predictions.

This module provides the PredictiveAgent class that uses machine learning models
to predict market movements and make trading decisions.
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
from trading_agents.ml.predictive.prediction_service import PredictionService
from trading_agents.ml.predictive.model_factory import ModelFactory
from trading_agents.ml.common.data_types import PredictionTarget, PredictionResult

logger = logging.getLogger(__name__)

class PredictiveAgent(BaseAgent):
    """
    Agent for trading based on machine learning predictions.
    """
    
    def __init__(self, agent_id: str, config: Dict[str, Any]):
        """
        Initialize the predictive agent.
        
        Args:
            agent_id: Unique identifier for the agent
            config: Agent configuration
        """
        super().__init__(agent_id, config)
        
        # Agent type
        self.agent_type = "predictive"
        
        # Exchange to use
        self.exchange_id: str = config.get("exchange_id", "binance")
        
        # Symbols to monitor
        self.symbols: List[str] = config.get("symbols", ["BTC/USDT", "ETH/USDT"])
        
        # Model configuration
        self.model_id: str = config.get("model_id", "")
        self.prediction_threshold: float = config.get("prediction_threshold", 0.6)
        self.confidence_threshold: float = config.get("confidence_threshold", 0.7)
        
        # Trading parameters
        self.trade_enabled: bool = config.get("trade_enabled", False)
        self.position_size_pct: float = config.get("position_size_pct", 5.0)
        self.max_positions: int = config.get("max_positions", 3)
        self.stop_loss_pct: float = config.get("stop_loss_pct", 5.0)
        self.take_profit_pct: float = config.get("take_profit_pct", 10.0)
        
        # Data parameters
        self.timeframe: str = config.get("timeframe", "1h")
        self.lookback_periods: int = config.get("lookback_periods", 100)
        
        # Prediction service
        prediction_service_config = config.get("prediction_service", {})
        self.prediction_service = PredictionService(prediction_service_config)
        
        # Market data
        self.market_data: Dict[str, pd.DataFrame] = {}
        
        # Predictions
        self.predictions: Dict[str, PredictionResult] = {}
        
        # Active positions
        self.positions: Dict[str, Dict[str, Any]] = {}
        
        # Exchange instance
        self.exchange = None
        
        # Exchange factory
        self.exchange_factory = ExchangeFactory()
        
        # Initialize metrics
        self.metrics.update({
            "symbols_monitored": len(self.symbols),
            "predictions_made": 0,
            "trades_executed": 0,
            "active_positions": 0,
            "total_profit": 0.0,
            "last_prediction_time": None
        })
        
        logger.info(f"Initialized PredictiveAgent {agent_id} for {len(self.symbols)} symbols")
        
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
                    self.prediction_service.load_model(self.model_id)
                    logger.info(f"Loaded model {self.model_id}")
                except Exception as e:
                    logger.error(f"Error loading model {self.model_id}: {str(e)}")
                    return False
                    
            # Initialize market data
            for symbol in self.symbols:
                await self._update_market_data(symbol)
                
            return True
            
        except Exception as e:
            logger.error(f"Error initializing PredictiveAgent: {str(e)}")
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
                
            # Make predictions
            await self._make_predictions()
            
            # Execute trades if enabled
            if self.trade_enabled:
                await self._execute_trades()
                
            # Update positions
            await self._update_positions()
            
            # Update metrics
            self._update_metrics()
            
            return True
            
        except Exception as e:
            logger.error(f"Error in PredictiveAgent cycle: {str(e)}")
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
            
        except Exception as e:
            logger.error(f"Error updating market data for {symbol}: {str(e)}")
            
    async def _make_predictions(self):
        """Make predictions for all symbols."""
        try:
            # Check if model is loaded
            if not self.model_id:
                logger.warning("No model ID specified, skipping predictions")
                return
                
            # Make predictions for each symbol
            for symbol in self.symbols:
                if symbol not in self.market_data:
                    continue
                    
                try:
                    # Get market data
                    data = self.market_data[symbol]
                    
                    # Make prediction
                    prediction = self.prediction_service.predict(self.model_id, data, symbol)
                    
                    # Store prediction
                    self.predictions[symbol] = prediction
                    
                    # Update metrics
                    self.metrics["predictions_made"] += 1
                    self.metrics["last_prediction_time"] = datetime.now().isoformat()
                    
                    logger.info(f"Made prediction for {symbol}: {prediction.value} (confidence: {prediction.confidence})")
                    
                except Exception as e:
                    logger.error(f"Error making prediction for {symbol}: {str(e)}")
                    
        except Exception as e:
            logger.error(f"Error making predictions: {str(e)}")
            
    async def _execute_trades(self):
        """Execute trades based on predictions."""
        try:
            # Check if we can open more positions
            if len(self.positions) >= self.max_positions:
                logger.info(f"Maximum positions reached ({self.max_positions}), skipping trade execution")
                return
                
            # Process each symbol
            for symbol, prediction in self.predictions.items():
                # Skip if we already have a position for this symbol
                if symbol in self.positions:
                    continue
                    
                # Get prediction target
                target = prediction.target
                
                # Process based on prediction target
                if target == PredictionTarget.PRICE_DIRECTION:
                    # Price direction prediction (0 = down, 1 = up)
                    if prediction.value == 1 and prediction.confidence >= self.confidence_threshold:
                        # Bullish prediction with high confidence
                        await self._open_position(symbol, "buy", prediction)
                    elif prediction.value == 0 and prediction.confidence >= self.confidence_threshold:
                        # Bearish prediction with high confidence
                        await self._open_position(symbol, "sell", prediction)
                        
                elif target == PredictionTarget.PRICE_CHANGE:
                    # Price change prediction (percentage)
                    if prediction.value >= self.prediction_threshold and prediction.confidence >= self.confidence_threshold:
                        # Significant positive change predicted
                        await self._open_position(symbol, "buy", prediction)
                    elif prediction.value <= -self.prediction_threshold and prediction.confidence >= self.confidence_threshold:
                        # Significant negative change predicted
                        await self._open_position(symbol, "sell", prediction)
                        
                elif target == PredictionTarget.TREND:
                    # Trend prediction (1 = up, 0 = sideways, -1 = down)
                    if prediction.value == 1 and prediction.confidence >= self.confidence_threshold:
                        # Uptrend predicted
                        await self._open_position(symbol, "buy", prediction)
                    elif prediction.value == -1 and prediction.confidence >= self.confidence_threshold:
                        # Downtrend predicted
                        await self._open_position(symbol, "sell", prediction)
                        
        except Exception as e:
            logger.error(f"Error executing trades: {str(e)}")
            
    async def _open_position(self, symbol: str, direction: str, prediction: PredictionResult):
        """
        Open a position based on a prediction.
        
        Args:
            symbol: Trading symbol
            direction: Trade direction (buy/sell)
            prediction: Prediction result
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
            
            # Calculate stop loss and take profit levels
            stop_loss_price = current_price * (Decimal("1") - Decimal(str(self.stop_loss_pct / 100.0))) if order_side == OrderSide.BUY else current_price * (Decimal("1") + Decimal(str(self.stop_loss_pct / 100.0)))
            take_profit_price = current_price * (Decimal("1") + Decimal(str(self.take_profit_pct / 100.0))) if order_side == OrderSide.BUY else current_price * (Decimal("1") - Decimal(str(self.take_profit_pct / 100.0)))
            
            # Store position
            self.positions[symbol] = {
                "symbol": symbol,
                "direction": direction,
                "entry_price": float(current_price),
                "amount": float(amount),
                "stop_loss": float(stop_loss_price),
                "take_profit": float(take_profit_price),
                "entry_time": time.time(),
                "entry_order": order_result,
                "prediction": prediction.to_dict()
            }
            
            # Update metrics
            self.metrics["active_positions"] = len(self.positions)
            self.metrics["trades_executed"] += 1
            
            logger.info(f"Opened {direction} position for {symbol} at {current_price} based on prediction")
            
        except Exception as e:
            logger.error(f"Error opening position for {symbol}: {str(e)}")
            
    async def _update_positions(self):
        """Update and manage open positions."""
        try:
            # Get current prices
            prices = {}
            for symbol in self.positions:
                ticker = await self.exchange.fetch_ticker(symbol)
                prices[symbol] = Decimal(str(ticker["last"]))
                
            # Check each position
            positions_to_close = []
            
            for symbol, position in self.positions.items():
                current_price = prices[symbol]
                entry_price = Decimal(str(position["entry_price"]))
                
                # Check stop loss
                if position["direction"] == "buy" and current_price <= Decimal(str(position["stop_loss"])):
                    logger.info(f"Stop loss triggered for {symbol} at {current_price}")
                    positions_to_close.append((symbol, "stop_loss"))
                    
                elif position["direction"] == "sell" and current_price >= Decimal(str(position["stop_loss"])):
                    logger.info(f"Stop loss triggered for {symbol} at {current_price}")
                    positions_to_close.append((symbol, "stop_loss"))
                    
                # Check take profit
                elif position["direction"] == "buy" and current_price >= Decimal(str(position["take_profit"])):
                    logger.info(f"Take profit triggered for {symbol} at {current_price}")
                    positions_to_close.append((symbol, "take_profit"))
                    
                elif position["direction"] == "sell" and current_price <= Decimal(str(position["take_profit"])):
                    logger.info(f"Take profit triggered for {symbol} at {current_price}")
                    positions_to_close.append((symbol, "take_profit"))
                    
            # Close positions
            for symbol, reason in positions_to_close:
                await self._close_position(symbol, reason, prices[symbol])
                
        except Exception as e:
            logger.error(f"Error updating positions: {str(e)}")
            
    async def _close_position(self, symbol: str, reason: str, current_price: Decimal):
        """
        Close a position.
        
        Args:
            symbol: Symbol to close
            reason: Reason for closing (stop_loss, take_profit)
            current_price: Current price
        """
        try:
            position = self.positions[symbol]
            
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
            
    def _update_metrics(self):
        """Update agent metrics."""
        try:
            self.metrics.update({
                "active_positions": len(self.positions),
                "symbols_monitored": len(self.symbols)
            })
            
        except Exception as e:
            logger.error(f"Error updating metrics: {str(e)}")
            
    def get_predictions(self) -> Dict[str, Dict[str, Any]]:
        """
        Get current predictions.
        
        Returns:
            Dictionary of predictions by symbol
        """
        return {symbol: prediction.to_dict() for symbol, prediction in self.predictions.items()}
        
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
                ticker = await self.exchange.fetch_ticker(symbol)
                current_price = Decimal(str(ticker["last"]))
                await self._close_position(symbol, "manual", current_price)
                
            # Remove from symbols list
            self.symbols.remove(symbol)
            
            # Remove market data
            if symbol in self.market_data:
                del self.market_data[symbol]
                
            # Remove prediction
            if symbol in self.predictions:
                del self.predictions[symbol]
                
            # Update metrics
            self.metrics["symbols_monitored"] = len(self.symbols)
            
            logger.info(f"Removed symbol {symbol} from monitoring")
            return True
            
        except Exception as e:
            logger.error(f"Error removing symbol {symbol}: {str(e)}")
            return False
            
    async def set_model(self, model_id: str) -> bool:
        """
        Set the model to use for predictions.
        
        Args:
            model_id: Model ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Load model
            self.prediction_service.load_model(model_id)
            
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
                
            elif key == "stop_loss_pct":
                self.stop_loss_pct = float(value)
                
            elif key == "take_profit_pct":
                self.take_profit_pct = float(value)
                
            elif key == "prediction_threshold":
                self.prediction_threshold = float(value)
                
            elif key == "confidence_threshold":
                self.confidence_threshold = float(value)
                
            elif key == "timeframe":
                self.timeframe = str(value)
                
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
                ticker = await self.exchange.fetch_ticker(symbol)
                current_price = Decimal(str(ticker["last"]))
                await self._close_position(symbol, "shutdown", current_price)
                
            # Close exchange connection
            await self.exchange.close()
            
            logger.info(f"Shut down PredictiveAgent {self.agent_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error shutting down PredictiveAgent: {str(e)}")
            return False
