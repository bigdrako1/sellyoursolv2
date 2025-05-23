"""
Sentiment Analysis Agent for trading based on social media sentiment.

This module provides the SentimentAgent class that analyzes social media sentiment
to inform trading decisions.
"""
import logging
import asyncio
import time
from typing import Dict, List, Any, Optional, Tuple, Set
from decimal import Decimal
import json
import os
from datetime import datetime, timedelta
import re
import statistics
from collections import defaultdict

from core.base_agent import BaseAgent
from core.agent_registry import AgentRegistry
from core.execution_engine import ExecutionPriority
from exchanges.exchange_factory import ExchangeFactory
from models.order import Order, OrderSide, OrderType
from models.position import Position
from models.market import Market
from utils.config import Config

logger = logging.getLogger(__name__)

class SentimentSource:
    """Base class for sentiment data sources."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the sentiment source.

        Args:
            config: Source configuration
        """
        self.config = config
        self.enabled = config.get("enabled", True)
        self.weight = config.get("weight", 1.0)

    async def fetch_sentiment(self, symbol: str, lookback_hours: int) -> Dict[str, Any]:
        """
        Fetch sentiment data for a symbol.

        Args:
            symbol: Trading symbol
            lookback_hours: Hours to look back

        Returns:
            Sentiment data
        """
        raise NotImplementedError("Subclasses must implement this method")

class TwitterSentimentSource(SentimentSource):
    """Twitter sentiment data source."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the Twitter sentiment source.

        Args:
            config: Source configuration
        """
        super().__init__(config)
        self.api_key = config.get("api_key")
        self.api_secret = config.get("api_secret")
        self.bearer_token = config.get("bearer_token")

        # Disable if credentials are missing
        if not self.api_key or not self.api_secret or not self.bearer_token:
            logger.warning("Twitter API credentials missing, disabling Twitter sentiment source")
            self.enabled = False

    async def fetch_sentiment(self, symbol: str, lookback_hours: int) -> Dict[str, Any]:
        """
        Fetch Twitter sentiment data for a symbol.

        Args:
            symbol: Trading symbol
            lookback_hours: Hours to look back

        Returns:
            Sentiment data
        """
        if not self.enabled:
            return {"source": "twitter", "enabled": False}

        try:
            # In a real implementation, this would use the Twitter API
            # For now, we'll return mock data

            # Extract base currency from symbol (e.g., BTC from BTC/USDT)
            base_currency = symbol.split('/')[0]

            # Generate mock sentiment data
            sentiment_score = 0.2 + (hash(f"{base_currency}_{int(time.time() / 3600)}") % 100) / 200.0
            volume = 1000 + (hash(f"{base_currency}_vol_{int(time.time() / 3600)}") % 10000)

            return {
                "source": "twitter",
                "enabled": True,
                "symbol": symbol,
                "sentiment_score": sentiment_score,  # -1.0 to 1.0
                "volume": volume,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error fetching Twitter sentiment: {str(e)}")
            return {
                "source": "twitter",
                "enabled": True,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

class RedditSentimentSource(SentimentSource):
    """Reddit sentiment data source."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the Reddit sentiment source.

        Args:
            config: Source configuration
        """
        super().__init__(config)
        self.client_id = config.get("client_id")
        self.client_secret = config.get("client_secret")
        self.user_agent = config.get("user_agent", "SentimentAgent/1.0")
        self.subreddits = config.get("subreddits", ["CryptoCurrency", "Bitcoin", "Ethereum"])

        # Disable if credentials are missing
        if not self.client_id or not self.client_secret:
            logger.warning("Reddit API credentials missing, disabling Reddit sentiment source")
            self.enabled = False

    async def fetch_sentiment(self, symbol: str, lookback_hours: int) -> Dict[str, Any]:
        """
        Fetch Reddit sentiment data for a symbol.

        Args:
            symbol: Trading symbol
            lookback_hours: Hours to look back

        Returns:
            Sentiment data
        """
        if not self.enabled:
            return {"source": "reddit", "enabled": False}

        try:
            # In a real implementation, this would use the Reddit API
            # For now, we'll return mock data

            # Extract base currency from symbol (e.g., BTC from BTC/USDT)
            base_currency = symbol.split('/')[0]

            # Generate mock sentiment data
            sentiment_score = 0.1 + (hash(f"{base_currency}_reddit_{int(time.time() / 3600)}") % 100) / 200.0
            volume = 500 + (hash(f"{base_currency}_reddit_vol_{int(time.time() / 3600)}") % 5000)

            return {
                "source": "reddit",
                "enabled": True,
                "symbol": symbol,
                "sentiment_score": sentiment_score,  # -1.0 to 1.0
                "volume": volume,
                "subreddits": self.subreddits,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error fetching Reddit sentiment: {str(e)}")
            return {
                "source": "reddit",
                "enabled": True,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

class NewsSentimentSource(SentimentSource):
    """News sentiment data source."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the news sentiment source.

        Args:
            config: Source configuration
        """
        super().__init__(config)
        self.api_key = config.get("api_key")
        self.sources = config.get("sources", ["cryptopanic", "coindesk", "cointelegraph"])

        # Disable if credentials are missing
        if not self.api_key:
            logger.warning("News API key missing, disabling news sentiment source")
            self.enabled = False

    async def fetch_sentiment(self, symbol: str, lookback_hours: int) -> Dict[str, Any]:
        """
        Fetch news sentiment data for a symbol.

        Args:
            symbol: Trading symbol
            lookback_hours: Hours to look back

        Returns:
            Sentiment data
        """
        if not self.enabled:
            return {"source": "news", "enabled": False}

        try:
            # In a real implementation, this would use a news API
            # For now, we'll return mock data

            # Extract base currency from symbol (e.g., BTC from BTC/USDT)
            base_currency = symbol.split('/')[0]

            # Generate mock sentiment data
            sentiment_score = 0.0 + (hash(f"{base_currency}_news_{int(time.time() / 3600)}") % 100) / 200.0
            volume = 200 + (hash(f"{base_currency}_news_vol_{int(time.time() / 3600)}") % 2000)

            return {
                "source": "news",
                "enabled": True,
                "symbol": symbol,
                "sentiment_score": sentiment_score,  # -1.0 to 1.0
                "volume": volume,
                "sources": self.sources,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error fetching news sentiment: {str(e)}")
            return {
                "source": "news",
                "enabled": True,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

class SentimentSignal:
    """Represents a trading signal based on sentiment analysis."""

    def __init__(
        self,
        symbol: str,
        sentiment_score: float,
        signal_strength: float,
        direction: str,
        sources: Dict[str, Dict[str, Any]],
        timestamp: float
    ):
        """
        Initialize a sentiment signal.

        Args:
            symbol: Trading symbol
            sentiment_score: Overall sentiment score (-1.0 to 1.0)
            signal_strength: Signal strength (0.0 to 1.0)
            direction: Signal direction (buy, sell, neutral)
            sources: Sentiment data from different sources
            timestamp: Signal timestamp
        """
        self.symbol = symbol
        self.sentiment_score = sentiment_score
        self.signal_strength = signal_strength
        self.direction = direction
        self.sources = sources
        self.timestamp = timestamp
        self.executed = False
        self.execution_result: Optional[Dict[str, Any]] = None

    def __str__(self) -> str:
        """String representation of the sentiment signal."""
        return (
            f"SentimentSignal({self.symbol}): "
            f"Score: {self.sentiment_score:.2f}, "
            f"Strength: {self.signal_strength:.2f}, "
            f"Direction: {self.direction}"
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "symbol": self.symbol,
            "sentiment_score": self.sentiment_score,
            "signal_strength": self.signal_strength,
            "direction": self.direction,
            "sources": self.sources,
            "timestamp": self.timestamp,
            "executed": self.executed,
            "execution_result": self.execution_result
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SentimentSignal':
        """Create from dictionary."""
        return cls(
            symbol=data["symbol"],
            sentiment_score=data["sentiment_score"],
            signal_strength=data["signal_strength"],
            direction=data["direction"],
            sources=data["sources"],
            timestamp=data["timestamp"]
        )

class SentimentAgent(BaseAgent):
    """
    Agent for analyzing social media sentiment to inform trading decisions.
    """

    def __init__(self, agent_id: str, config: Dict[str, Any]):
        """
        Initialize the sentiment agent.

        Args:
            agent_id: Unique identifier for the agent
            config: Agent configuration
        """
        super().__init__(agent_id, config)

        # Agent type
        self.agent_type = "sentiment"

        # Exchange to use
        self.exchange_id: str = config.get("exchange_id", "binance")

        # Symbols to monitor
        self.symbols: List[str] = config.get("symbols", ["BTC/USDT", "ETH/USDT"])

        # Sentiment sources
        self.sources_config: Dict[str, Dict[str, Any]] = config.get("sources", {
            "twitter": {"enabled": True, "weight": 1.0},
            "reddit": {"enabled": True, "weight": 0.8},
            "news": {"enabled": True, "weight": 1.2}
        })

        # Sentiment parameters
        self.lookback_hours: int = config.get("lookback_hours", 24)
        self.signal_threshold: float = config.get("signal_threshold", 0.2)
        self.sentiment_window: int = config.get("sentiment_window", 6)  # hours

        # Trading parameters
        self.trade_enabled: bool = config.get("trade_enabled", False)
        self.position_size_pct: float = config.get("position_size_pct", 5.0)
        self.max_positions: int = config.get("max_positions", 3)
        self.stop_loss_pct: float = config.get("stop_loss_pct", 5.0)
        self.take_profit_pct: float = config.get("take_profit_pct", 10.0)

        # Sentiment sources
        self.sentiment_sources: Dict[str, SentimentSource] = {}

        # Sentiment history
        self.sentiment_history: Dict[str, List[Dict[str, Any]]] = {}

        # Signal history
        self.signals: List[SentimentSignal] = []
        self.max_signals: int = config.get("max_signals", 100)

        # Active positions
        self.positions: Dict[str, Dict[str, Any]] = {}

        # Exchange instance
        self.exchange = None

        # Exchange factory
        self.exchange_factory = ExchangeFactory()

        # Initialize metrics
        self.metrics.update({
            "symbols_monitored": len(self.symbols),
            "signals_generated": 0,
            "trades_executed": 0,
            "active_positions": 0,
            "total_profit": 0.0,
            "last_signal_time": None
        })

        logger.info(f"Initialized SentimentAgent {agent_id} for {len(self.symbols)} symbols")

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

            # Initialize sentiment sources
            self._initialize_sentiment_sources()

            # Initialize sentiment history
            for symbol in self.symbols:
                self.sentiment_history[symbol] = []

            return True

        except Exception as e:
            logger.error(f"Error initializing SentimentAgent: {str(e)}")
            return False

    def _initialize_sentiment_sources(self):
        """Initialize sentiment data sources."""
        try:
            # Initialize Twitter sentiment source
            if "twitter" in self.sources_config and self.sources_config["twitter"].get("enabled", True):
                self.sentiment_sources["twitter"] = TwitterSentimentSource(self.sources_config["twitter"])

            # Initialize Reddit sentiment source
            if "reddit" in self.sources_config and self.sources_config["reddit"].get("enabled", True):
                self.sentiment_sources["reddit"] = RedditSentimentSource(self.sources_config["reddit"])

            # Initialize news sentiment source
            if "news" in self.sources_config and self.sources_config["news"].get("enabled", True):
                self.sentiment_sources["news"] = NewsSentimentSource(self.sources_config["news"])

            logger.info(f"Initialized {len(self.sentiment_sources)} sentiment sources")

        except Exception as e:
            logger.error(f"Error initializing sentiment sources: {str(e)}")

    async def execute_cycle(self) -> bool:
        """
        Execute a single agent cycle.

        Returns:
            True if the cycle was successful, False otherwise
        """
        try:
            # Fetch sentiment data for each symbol
            for symbol in self.symbols:
                await self._fetch_sentiment_data(symbol)

            # Generate signals
            signals = await self._generate_signals()

            # Update signal history
            self._update_signal_history(signals)

            # Execute trades if enabled
            if self.trade_enabled and signals:
                await self._execute_signals(signals)

            # Update positions
            await self._update_positions()

            # Update metrics
            self._update_metrics()

            return True

        except Exception as e:
            logger.error(f"Error in SentimentAgent cycle: {str(e)}")
            return False

    async def _fetch_sentiment_data(self, symbol: str):
        """
        Fetch sentiment data for a symbol from all sources.

        Args:
            symbol: Trading symbol
        """
        try:
            # Fetch sentiment data from each source
            sentiment_data = {}

            for source_id, source in self.sentiment_sources.items():
                if source.enabled:
                    data = await source.fetch_sentiment(symbol, self.lookback_hours)
                    sentiment_data[source_id] = data

            # Add timestamp
            timestamp = time.time()

            # Store in history
            self.sentiment_history[symbol].append({
                "timestamp": timestamp,
                "sources": sentiment_data
            })

            # Trim history
            max_history = self.lookback_hours * 2  # Keep twice the lookback period
            if len(self.sentiment_history[symbol]) > max_history:
                self.sentiment_history[symbol] = self.sentiment_history[symbol][-max_history:]

        except Exception as e:
            logger.error(f"Error fetching sentiment data for {symbol}: {str(e)}")

    async def _generate_signals(self) -> List[SentimentSignal]:
        """
        Generate trading signals based on sentiment data.

        Returns:
            List of sentiment signals
        """
        signals = []

        try:
            # Process each symbol
            for symbol in self.symbols:
                # Skip if not enough history
                if len(self.sentiment_history[symbol]) < 2:
                    continue

                # Get recent sentiment data
                recent_data = self.sentiment_history[symbol][-self.sentiment_window:]

                # Calculate weighted sentiment score
                sentiment_score = self._calculate_sentiment_score(recent_data)

                # Skip if sentiment score is too low
                if abs(sentiment_score) < self.signal_threshold:
                    continue

                # Determine signal direction
                direction = "buy" if sentiment_score > 0 else "sell"

                # Calculate signal strength
                signal_strength = min(abs(sentiment_score) * 2, 1.0)

                # Create signal
                signal = SentimentSignal(
                    symbol=symbol,
                    sentiment_score=sentiment_score,
                    signal_strength=signal_strength,
                    direction=direction,
                    sources={source_id: source.config for source_id, source in self.sentiment_sources.items()},
                    timestamp=time.time()
                )

                signals.append(signal)

            # Update metrics
            self.metrics["signals_generated"] += len(signals)
            if signals:
                self.metrics["last_signal_time"] = datetime.now().isoformat()

            return signals

        except Exception as e:
            logger.error(f"Error generating signals: {str(e)}")
            return []

    def _calculate_sentiment_score(self, sentiment_data: List[Dict[str, Any]]) -> float:
        """
        Calculate weighted sentiment score from sentiment data.

        Args:
            sentiment_data: List of sentiment data points

        Returns:
            Weighted sentiment score (-1.0 to 1.0)
        """
        try:
            if not sentiment_data:
                return 0.0

            # Extract scores from each source
            scores = defaultdict(list)
            volumes = defaultdict(list)

            for data_point in sentiment_data:
                for source_id, source_data in data_point["sources"].items():
                    if "sentiment_score" in source_data and "volume" in source_data:
                        scores[source_id].append(source_data["sentiment_score"])
                        volumes[source_id].append(source_data["volume"])

            # Calculate weighted average for each source
            source_scores = {}

            for source_id in scores:
                if not scores[source_id]:
                    continue

                # Calculate volume-weighted average
                total_volume = sum(volumes[source_id])
                if total_volume > 0:
                    weighted_score = sum(scores[source_id][i] * volumes[source_id][i] for i in range(len(scores[source_id]))) / total_volume
                else:
                    weighted_score = sum(scores[source_id]) / len(scores[source_id])

                source_scores[source_id] = weighted_score

            # Calculate weighted average across sources
            total_weight = 0.0
            weighted_sum = 0.0

            for source_id, score in source_scores.items():
                if source_id in self.sources_config:
                    weight = self.sources_config[source_id].get("weight", 1.0)
                    weighted_sum += score * weight
                    total_weight += weight

            # Return weighted average
            if total_weight > 0:
                return weighted_sum / total_weight
            else:
                return 0.0

        except Exception as e:
            logger.error(f"Error calculating sentiment score: {str(e)}")
            return 0.0

    def _update_signal_history(self, signals: List[SentimentSignal]):
        """
        Update signal history.

        Args:
            signals: List of new signals
        """
        try:
            # Add new signals to history
            self.signals.extend(signals)

            # Trim history if needed
            if len(self.signals) > self.max_signals:
                self.signals = self.signals[-self.max_signals:]

        except Exception as e:
            logger.error(f"Error updating signal history: {str(e)}")

    async def _execute_signals(self, signals: List[SentimentSignal]):
        """
        Execute trading signals.

        Args:
            signals: List of signals to execute
        """
        try:
            # Check if we can open more positions
            if len(self.positions) >= self.max_positions:
                logger.info(f"Maximum positions reached ({self.max_positions}), skipping signal execution")
                return

            # Sort signals by strength (descending)
            sorted_signals = sorted(signals, key=lambda x: x.signal_strength, reverse=True)

            # Execute signals until max positions is reached
            for signal in sorted_signals:
                # Skip if we've reached max positions
                if len(self.positions) >= self.max_positions:
                    break

                # Skip if we already have a position for this symbol
                if signal.symbol in self.positions:
                    continue

                # Execute signal
                result = await self._execute_signal(signal)

                # Update signal
                signal.executed = True
                signal.execution_result = result

                # Update metrics
                if result and "success" in result and result["success"]:
                    self.metrics["trades_executed"] += 1

        except Exception as e:
            logger.error(f"Error executing signals: {str(e)}")

    async def _execute_signal(self, signal: SentimentSignal) -> Dict[str, Any]:
        """
        Execute a single trading signal.

        Args:
            signal: Signal to execute

        Returns:
            Execution result
        """
        try:
            # Get current price
            ticker = await self.exchange.fetch_ticker(signal.symbol)
            current_price = Decimal(str(ticker["last"]))

            # Calculate position size
            balance = await self.exchange.fetch_balance()
            quote_currency = signal.symbol.split('/')[1]
            available_balance = Decimal(str(balance.get(quote_currency, {}).get("free", 0)))

            position_size = available_balance * Decimal(str(self.position_size_pct / 100.0))
            amount = position_size / current_price

            # Create order
            order_side = OrderSide.BUY if signal.direction == "buy" else OrderSide.SELL

            order = Order(
                symbol=signal.symbol,
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
            self.positions[signal.symbol] = {
                "symbol": signal.symbol,
                "direction": signal.direction,
                "entry_price": float(current_price),
                "amount": float(amount),
                "stop_loss": float(stop_loss_price),
                "take_profit": float(take_profit_price),
                "entry_time": time.time(),
                "entry_order": order_result,
                "signal_id": id(signal)
            }

            # Update metrics
            self.metrics["active_positions"] = len(self.positions)

            logger.info(f"Executed signal for {signal.symbol}: {signal.direction} at {current_price}")

            return {
                "success": True,
                "symbol": signal.symbol,
                "direction": signal.direction,
                "price": float(current_price),
                "amount": float(amount),
                "order": order_result,
                "timestamp": time.time()
            }

        except Exception as e:
            logger.error(f"Error executing signal for {signal.symbol}: {str(e)}")
            return {
                "success": False,
                "symbol": signal.symbol,
                "error": str(e),
                "timestamp": time.time()
            }

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

    def get_sentiment_history(self, symbol: Optional[str] = None) -> Dict[str, Any]:
        """
        Get sentiment history.

        Args:
            symbol: Symbol to get history for (None for all symbols)

        Returns:
            Sentiment history
        """
        if symbol:
            return {symbol: self.sentiment_history.get(symbol, [])}
        else:
            return self.sentiment_history

    def get_signals(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get signal history.

        Args:
            limit: Maximum number of signals to return

        Returns:
            List of signals as dictionaries
        """
        signals = [signal.to_dict() for signal in self.signals]

        if limit:
            return signals[-limit:]
        else:
            return signals

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

            # Initialize sentiment history
            self.sentiment_history[symbol] = []

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

            # Remove sentiment history
            if symbol in self.sentiment_history:
                del self.sentiment_history[symbol]

            # Update metrics
            self.metrics["symbols_monitored"] = len(self.symbols)

            logger.info(f"Removed symbol {symbol} from monitoring")
            return True

        except Exception as e:
            logger.error(f"Error removing symbol {symbol}: {str(e)}")
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

            elif key == "signal_threshold":
                self.signal_threshold = float(value)

            elif key == "sentiment_window":
                self.sentiment_window = int(value)

            elif key == "lookback_hours":
                self.lookback_hours = int(value)

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

            logger.info(f"Shut down SentimentAgent {self.agent_id}")
            return True

        except Exception as e:
            logger.error(f"Error shutting down SentimentAgent: {str(e)}")
            return False