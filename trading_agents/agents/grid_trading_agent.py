"""
Grid Trading Agent for automated grid trading strategies.

This module provides the GridTradingAgent class that implements a grid trading strategy
with dynamic grid sizing and auto-rebalancing features.
"""
import logging
import asyncio
import time
from typing import Dict, List, Any, Optional, Tuple, Set
from decimal import Decimal
import json
import os
from datetime import datetime, timedelta
import math

from core.base_agent import BaseAgent
from core.agent_registry import AgentRegistry
from core.execution_engine import ExecutionPriority
from exchanges.exchange_factory import ExchangeFactory
from models.order import Order, OrderSide, OrderType
from models.position import Position
from models.market import Market
from utils.config import Config

logger = logging.getLogger(__name__)

class GridLevel:
    """
    Represents a level in the grid trading strategy.
    """

    def __init__(
        self,
        price: Decimal,
        buy_order_id: Optional[str] = None,
        sell_order_id: Optional[str] = None,
        status: str = "pending"
    ):
        """
        Initialize a grid level.

        Args:
            price: Price level
            buy_order_id: ID of the buy order at this level
            sell_order_id: ID of the sell order at this level
            status: Status of the level (pending, active, filled)
        """
        self.price = price
        self.buy_order_id = buy_order_id
        self.sell_order_id = sell_order_id
        self.status = status
        self.last_updated = time.time()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "price": str(self.price),
            "buy_order_id": self.buy_order_id,
            "sell_order_id": self.sell_order_id,
            "status": self.status,
            "last_updated": self.last_updated
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'GridLevel':
        """Create from dictionary."""
        return cls(
            price=Decimal(data["price"]),
            buy_order_id=data.get("buy_order_id"),
            sell_order_id=data.get("sell_order_id"),
            status=data.get("status", "pending")
        )

class GridTradingAgent(BaseAgent):
    """
    Agent for implementing grid trading strategies with dynamic grid sizing and auto-rebalancing.
    """

    def __init__(self, agent_id: str, config: Dict[str, Any]):
        """
        Initialize the grid trading agent.

        Args:
            agent_id: Unique identifier for the agent
            config: Agent configuration
        """
        super().__init__(agent_id, config)

        # Agent type
        self.agent_type = "grid_trading"

        # Exchange to use
        self.exchange_id: str = config.get("exchange_id", "binance")

        # Symbol to trade
        self.symbol: str = config.get("symbol", "BTC/USDT")

        # Grid parameters
        self.grid_levels: int = config.get("grid_levels", 10)
        self.grid_spacing_pct: Decimal = Decimal(str(config.get("grid_spacing_pct", 1.0)))
        self.upper_price: Optional[Decimal] = Decimal(str(config.get("upper_price", 0))) if config.get("upper_price") else None
        self.lower_price: Optional[Decimal] = Decimal(str(config.get("lower_price", 0))) if config.get("lower_price") else None

        # Order parameters
        self.order_amount: Decimal = Decimal(str(config.get("order_amount", 0.01)))
        self.order_type: str = config.get("order_type", "limit")

        # Dynamic grid parameters
        self.dynamic_grid: bool = config.get("dynamic_grid", False)
        self.volatility_period: int = config.get("volatility_period", 24)  # hours
        self.volatility_multiplier: Decimal = Decimal(str(config.get("volatility_multiplier", 2.0)))

        # Auto-rebalancing parameters
        self.auto_rebalance: bool = config.get("auto_rebalance", False)
        self.rebalance_threshold_pct: Decimal = Decimal(str(config.get("rebalance_threshold_pct", 10.0)))
        self.rebalance_interval: int = config.get("rebalance_interval", 24)  # hours
        self.last_rebalance: Optional[float] = None

        # Profit-taking parameters
        self.take_profit: bool = config.get("take_profit", False)
        self.profit_target_pct: Decimal = Decimal(str(config.get("profit_target_pct", 5.0)))
        self.trailing_stop: bool = config.get("trailing_stop", False)
        self.trailing_stop_pct: Decimal = Decimal(str(config.get("trailing_stop_pct", 2.0)))

        # Grid state
        self.grid_levels_data: List[GridLevel] = []
        self.current_price: Optional[Decimal] = None
        self.initial_investment: Optional[Decimal] = None
        self.current_value: Optional[Decimal] = None
        self.total_profit: Decimal = Decimal("0")
        self.trades_executed: int = 0

        # Exchange instance
        self.exchange = None

        # Exchange factory
        self.exchange_factory = ExchangeFactory()

        # Initialize metrics
        self.metrics.update({
            "grid_levels": self.grid_levels,
            "current_price": None,
            "upper_price": str(self.upper_price) if self.upper_price else None,
            "lower_price": str(self.lower_price) if self.lower_price else None,
            "total_profit": str(self.total_profit),
            "trades_executed": self.trades_executed,
            "active_orders": 0,
            "last_rebalance": None
        })

        logger.info(f"Initialized GridTradingAgent {agent_id} for {self.symbol} on {self.exchange_id}")

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

            # Get current market price
            ticker = await self.exchange.fetch_ticker(self.symbol)
            self.current_price = Decimal(str(ticker["last"]))
            self.metrics["current_price"] = str(self.current_price)

            # Calculate grid prices if not specified
            if not self.upper_price or not self.lower_price:
                await self._calculate_dynamic_grid()

            # Create grid levels
            self._create_grid_levels()

            # Calculate initial investment
            self.initial_investment = self._calculate_initial_investment()

            return True

        except Exception as e:
            logger.error(f"Error initializing GridTradingAgent: {str(e)}")
            return False

    async def execute_cycle(self) -> bool:
        """
        Execute a single agent cycle.

        Returns:
            True if the cycle was successful, False otherwise
        """
        try:
            # Update market data
            await self._update_market_data()

            # Check if rebalancing is needed
            if self.auto_rebalance and await self._should_rebalance():
                await self._rebalance_grid()

            # Check and update grid orders
            await self._check_grid_orders()

            # Place new orders if needed
            await self._place_grid_orders()

            # Update metrics
            self._update_metrics()

            return True

        except Exception as e:
            logger.error(f"Error in GridTradingAgent cycle: {str(e)}")
            return False

    async def _update_market_data(self):
        """Update market data."""
        try:
            # Get current market price
            ticker = await self.exchange.fetch_ticker(self.symbol)
            self.current_price = Decimal(str(ticker["last"]))
            self.metrics["current_price"] = str(self.current_price)

            # Calculate current portfolio value
            self.current_value = await self._calculate_portfolio_value()

        except Exception as e:
            logger.error(f"Error updating market data: {str(e)}")

    async def _calculate_dynamic_grid(self):
        """Calculate dynamic grid based on volatility."""
        try:
            if not self.dynamic_grid:
                # Use default values if dynamic grid is disabled
                if not self.upper_price:
                    self.upper_price = self.current_price * (Decimal("1") + Decimal("0.1"))
                if not self.lower_price:
                    self.lower_price = self.current_price * (Decimal("1") - Decimal("0.1"))
                return

            # Get historical data
            period = self.volatility_period * 60 * 60  # Convert hours to seconds
            since = int((datetime.now() - timedelta(hours=self.volatility_period)).timestamp() * 1000)

            # Fetch OHLCV data
            ohlcv = await self.exchange.fetch_ohlcv(self.symbol, "1h", since=since)

            if not ohlcv:
                logger.warning("No historical data available for dynamic grid calculation")
                return

            # Calculate volatility (standard deviation of price changes)
            prices = [Decimal(str(candle[4])) for candle in ohlcv]  # Close prices
            price_changes = [abs(prices[i] - prices[i-1]) / prices[i-1] for i in range(1, len(prices))]

            if not price_changes:
                logger.warning("Not enough data to calculate volatility")
                return

            # Calculate standard deviation
            mean = sum(price_changes) / len(price_changes)
            variance = sum((x - mean) ** 2 for x in price_changes) / len(price_changes)
            volatility = Decimal(str(math.sqrt(float(variance))))

            # Calculate grid range based on volatility
            range_pct = volatility * self.volatility_multiplier

            # Set upper and lower prices
            self.upper_price = self.current_price * (Decimal("1") + range_pct)
            self.lower_price = self.current_price * (Decimal("1") - range_pct)

            logger.info(f"Dynamic grid calculated: volatility={volatility}, range={range_pct}, upper={self.upper_price}, lower={self.lower_price}")

        except Exception as e:
            logger.error(f"Error calculating dynamic grid: {str(e)}")

            # Use default values if calculation fails
            if not self.upper_price:
                self.upper_price = self.current_price * (Decimal("1") + Decimal("0.1"))
            if not self.lower_price:
                self.lower_price = self.current_price * (Decimal("1") - Decimal("0.1"))

    def _create_grid_levels(self):
        """Create grid levels."""
        try:
            if not self.upper_price or not self.lower_price:
                logger.error("Cannot create grid levels: upper or lower price not set")
                return

            # Calculate price step
            price_range = self.upper_price - self.lower_price
            price_step = price_range / (self.grid_levels - 1)

            # Create grid levels
            self.grid_levels_data = []

            for i in range(self.grid_levels):
                price = self.lower_price + (price_step * i)
                self.grid_levels_data.append(GridLevel(price=price))

            logger.info(f"Created {len(self.grid_levels_data)} grid levels from {self.lower_price} to {self.upper_price}")

        except Exception as e:
            logger.error(f"Error creating grid levels: {str(e)}")

    def _calculate_initial_investment(self) -> Decimal:
        """
        Calculate the initial investment required for the grid strategy.

        Returns:
            Initial investment amount
        """
        try:
            # Calculate base currency needed for buy orders
            base_currency_needed = Decimal("0")

            for level in self.grid_levels_data:
                if level.price < self.current_price:
                    base_currency_needed += self.order_amount

            # Calculate quote currency needed for sell orders
            quote_currency_needed = Decimal("0")

            for level in self.grid_levels_data:
                if level.price >= self.current_price:
                    quote_currency_needed += self.order_amount * level.price

            # Convert quote currency to base currency equivalent
            quote_in_base = quote_currency_needed / self.current_price

            # Total initial investment in base currency
            total_investment = base_currency_needed + quote_in_base

            logger.info(f"Initial investment: {total_investment} {self.symbol.split('/')[0]}")

            return total_investment

        except Exception as e:
            logger.error(f"Error calculating initial investment: {str(e)}")
            return Decimal("0")

    async def _calculate_portfolio_value(self) -> Decimal:
        """
        Calculate the current portfolio value.

        Returns:
            Current portfolio value
        """
        try:
            # Get balances
            balances = await self.exchange.fetch_balance()

            # Get base and quote currencies
            base_currency, quote_currency = self.symbol.split('/')

            # Get amounts
            base_amount = Decimal(str(balances.get(base_currency, {}).get("free", 0)))
            quote_amount = Decimal(str(balances.get(quote_currency, {}).get("free", 0)))

            # Calculate total value in base currency
            total_value = base_amount + (quote_amount / self.current_price)

            return total_value

        except Exception as e:
            logger.error(f"Error calculating portfolio value: {str(e)}")
            return Decimal("0")

    async def _should_rebalance(self) -> bool:
        """
        Check if the grid should be rebalanced.

        Returns:
            True if rebalancing is needed, False otherwise
        """
        try:
            # Check if enough time has passed since last rebalance
            if self.last_rebalance:
                hours_since_rebalance = (time.time() - self.last_rebalance) / 3600
                if hours_since_rebalance < self.rebalance_interval:
                    return False

            # Check if price has moved outside the grid
            if self.current_price <= self.lower_price or self.current_price >= self.upper_price:
                logger.info(f"Price {self.current_price} is outside grid range [{self.lower_price}, {self.upper_price}]")
                return True

            # Check if price has moved significantly within the grid
            grid_center = (self.upper_price + self.lower_price) / 2
            distance_from_center = abs(self.current_price - grid_center) / grid_center

            if distance_from_center * 100 > self.rebalance_threshold_pct:
                logger.info(f"Price {self.current_price} is {distance_from_center * 100:.2f}% away from grid center {grid_center}")
                return True

            return False

        except Exception as e:
            logger.error(f"Error checking if rebalance is needed: {str(e)}")
            return False

    async def _rebalance_grid(self):
        """Rebalance the grid."""
        try:
            logger.info(f"Rebalancing grid for {self.symbol}")

            # Cancel all existing orders
            await self._cancel_all_orders()

            # Recalculate grid based on current price
            self.upper_price = self.current_price * (Decimal("1") + (self.grid_spacing_pct * self.grid_levels / 2 / 100))
            self.lower_price = self.current_price * (Decimal("1") - (self.grid_spacing_pct * self.grid_levels / 2 / 100))

            # If dynamic grid is enabled, use volatility-based calculation
            if self.dynamic_grid:
                await self._calculate_dynamic_grid()

            # Create new grid levels
            self._create_grid_levels()

            # Update metrics
            self.metrics["upper_price"] = str(self.upper_price)
            self.metrics["lower_price"] = str(self.lower_price)

            # Update last rebalance time
            self.last_rebalance = time.time()
            self.metrics["last_rebalance"] = datetime.fromtimestamp(self.last_rebalance).isoformat()

            logger.info(f"Grid rebalanced: {self.grid_levels} levels from {self.lower_price} to {self.upper_price}")

        except Exception as e:
            logger.error(f"Error rebalancing grid: {str(e)}")

    async def _cancel_all_orders(self):
        """Cancel all open orders."""
        try:
            # Get open orders
            open_orders = await self.exchange.fetch_open_orders(self.symbol)

            # Cancel each order
            for order in open_orders:
                try:
                    await self.exchange.cancel_order(order["id"], self.symbol)
                    logger.info(f"Cancelled order {order['id']}")
                except Exception as e:
                    logger.error(f"Error cancelling order {order['id']}: {str(e)}")

            # Reset grid level order IDs
            for level in self.grid_levels_data:
                level.buy_order_id = None
                level.sell_order_id = None
                level.status = "pending"

        except Exception as e:
            logger.error(f"Error cancelling orders: {str(e)}")

    async def _check_grid_orders(self):
        """Check and update grid orders."""
        try:
            # Get open orders
            open_orders = await self.exchange.fetch_open_orders(self.symbol)
            open_order_ids = {order["id"] for order in open_orders}

            # Get recent trades
            since = int((datetime.now() - timedelta(hours=1)).timestamp() * 1000)
            trades = await self.exchange.fetch_my_trades(self.symbol, since=since)

            # Process each grid level
            for level in self.grid_levels_data:
                # Check buy orders
                if level.buy_order_id and level.buy_order_id not in open_order_ids:
                    # Order was filled or cancelled
                    filled = any(trade["order"] == level.buy_order_id for trade in trades)

                    if filled:
                        logger.info(f"Buy order filled at {level.price}")
                        level.status = "filled_buy"
                        self.trades_executed += 1

                        # Place sell order at next level up
                        next_level_idx = self.grid_levels_data.index(level) + 1
                        if next_level_idx < len(self.grid_levels_data):
                            next_level = self.grid_levels_data[next_level_idx]
                            profit = (next_level.price - level.price) * self.order_amount
                            self.total_profit += profit

                    level.buy_order_id = None

                # Check sell orders
                if level.sell_order_id and level.sell_order_id not in open_order_ids:
                    # Order was filled or cancelled
                    filled = any(trade["order"] == level.sell_order_id for trade in trades)

                    if filled:
                        logger.info(f"Sell order filled at {level.price}")
                        level.status = "filled_sell"
                        self.trades_executed += 1

                        # Place buy order at next level down
                        next_level_idx = self.grid_levels_data.index(level) - 1
                        if next_level_idx >= 0:
                            next_level = self.grid_levels_data[next_level_idx]
                            profit = (level.price - next_level.price) * self.order_amount
                            self.total_profit += profit

                    level.sell_order_id = None

        except Exception as e:
            logger.error(f"Error checking grid orders: {str(e)}")

    async def _place_grid_orders(self):
        """Place grid orders."""
        try:
            # Count active orders
            active_orders = 0

            # Process each grid level
            for level in self.grid_levels_data:
                # Skip if price is too close to current price
                price_diff_pct = abs(level.price - self.current_price) / self.current_price * 100
                if price_diff_pct < 0.1:  # Skip if less than 0.1% away from current price
                    continue

                # Place buy order if price is below current price
                if level.price < self.current_price and not level.buy_order_id:
                    try:
                        order = Order(
                            symbol=self.symbol,
                            side=OrderSide.BUY,
                            type=OrderType.LIMIT,
                            price=float(level.price),
                            amount=float(self.order_amount)
                        )

                        result = await self.exchange.create_order(order)
                        level.buy_order_id = result["id"]
                        level.status = "active_buy"
                        active_orders += 1

                        logger.info(f"Placed buy order at {level.price}: {level.buy_order_id}")

                    except Exception as e:
                        logger.error(f"Error placing buy order at {level.price}: {str(e)}")

                # Place sell order if price is above current price
                elif level.price > self.current_price and not level.sell_order_id:
                    try:
                        order = Order(
                            symbol=self.symbol,
                            side=OrderSide.SELL,
                            type=OrderType.LIMIT,
                            price=float(level.price),
                            amount=float(self.order_amount)
                        )

                        result = await self.exchange.create_order(order)
                        level.sell_order_id = result["id"]
                        level.status = "active_sell"
                        active_orders += 1

                        logger.info(f"Placed sell order at {level.price}: {level.sell_order_id}")

                    except Exception as e:
                        logger.error(f"Error placing sell order at {level.price}: {str(e)}")

                # Count existing orders
                if level.buy_order_id or level.sell_order_id:
                    active_orders += 1

            # Update metrics
            self.metrics["active_orders"] = active_orders

        except Exception as e:
            logger.error(f"Error placing grid orders: {str(e)}")

    def _update_metrics(self):
        """Update agent metrics."""
        try:
            self.metrics.update({
                "current_price": str(self.current_price),
                "upper_price": str(self.upper_price),
                "lower_price": str(self.lower_price),
                "total_profit": str(self.total_profit),
                "trades_executed": self.trades_executed,
                "grid_levels": self.grid_levels
            })

            if self.current_value:
                self.metrics["current_value"] = str(self.current_value)

            if self.initial_investment:
                self.metrics["initial_investment"] = str(self.initial_investment)

                # Calculate ROI
                if self.initial_investment > 0 and self.current_value:
                    roi = (self.current_value - self.initial_investment) / self.initial_investment * 100
                    self.metrics["roi"] = str(roi)

        except Exception as e:
            logger.error(f"Error updating metrics: {str(e)}")

    def get_grid_levels(self) -> List[Dict[str, Any]]:
        """
        Get grid levels.

        Returns:
            List of grid levels as dictionaries
        """
        return [level.to_dict() for level in self.grid_levels_data]

    async def add_symbol(self, symbol: str) -> bool:
        """
        Change the trading symbol.

        Args:
            symbol: New trading symbol

        Returns:
            True if successful, False otherwise
        """
        try:
            # Cancel all existing orders
            await self._cancel_all_orders()

            # Update symbol
            self.symbol = symbol

            # Reset grid
            await self._update_market_data()
            await self._calculate_dynamic_grid()
            self._create_grid_levels()

            logger.info(f"Changed trading symbol to {symbol}")
            return True

        except Exception as e:
            logger.error(f"Error changing trading symbol: {str(e)}")
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
            if key == "grid_levels":
                self.grid_levels = int(value)
                await self._rebalance_grid()

            elif key == "grid_spacing_pct":
                self.grid_spacing_pct = Decimal(str(value))
                await self._rebalance_grid()

            elif key == "order_amount":
                self.order_amount = Decimal(str(value))

            elif key == "dynamic_grid":
                self.dynamic_grid = bool(value)
                if self.dynamic_grid:
                    await self._calculate_dynamic_grid()
                    self._create_grid_levels()

            elif key == "auto_rebalance":
                self.auto_rebalance = bool(value)

            elif key == "take_profit":
                self.take_profit = bool(value)

            elif key == "profit_target_pct":
                self.profit_target_pct = Decimal(str(value))

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
            # Cancel all orders
            await self._cancel_all_orders()

            # Close exchange connection
            await self.exchange.close()

            logger.info(f"Shut down GridTradingAgent {self.agent_id}")
            return True

        except Exception as e:
            logger.error(f"Error shutting down GridTradingAgent: {str(e)}")
            return False
