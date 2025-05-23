"""
Portfolio Risk Management System for Trading Agents.

This module provides a centralized risk management system that monitors and manages
risk across multiple trading agents and positions.
"""
import logging
import asyncio
import time
from typing import Dict, List, Any, Optional, Tuple, Set
from decimal import Decimal
import json
import os
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from collections import defaultdict

from core.agent_registry import AgentRegistry
from exchanges.exchange_factory import ExchangeFactory
from models.order import Order, OrderSide, OrderType
from models.position import Position
from utils.config import Config

logger = logging.getLogger(__name__)

class RiskLevel:
    """Risk level enumeration."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class RiskMetric:
    """Base class for risk metrics."""

    def __init__(self, name: str, weight: float = 1.0):
        """
        Initialize a risk metric.

        Args:
            name: Metric name
            weight: Metric weight in overall risk calculation
        """
        self.name = name
        self.weight = weight
        self.value = 0.0
        self.level = RiskLevel.LOW

    def calculate(self, portfolio: Dict[str, Any]) -> float:
        """
        Calculate the risk metric.

        Args:
            portfolio: Portfolio data

        Returns:
            Risk metric value
        """
        raise NotImplementedError("Subclasses must implement this method")

    def get_level(self) -> str:
        """
        Get the risk level.

        Returns:
            Risk level
        """
        return self.level

class ExposureMetric(RiskMetric):
    """Measures portfolio exposure to specific assets or markets."""

    def __init__(self, max_exposure_pct: float = 20.0):
        """
        Initialize the exposure metric.

        Args:
            max_exposure_pct: Maximum exposure percentage for a single asset
        """
        super().__init__("exposure", 1.5)
        self.max_exposure_pct = max_exposure_pct

    def calculate(self, portfolio: Dict[str, Any]) -> float:
        """
        Calculate the exposure risk.

        Args:
            portfolio: Portfolio data

        Returns:
            Exposure risk value (0-100)
        """
        if not portfolio or not portfolio.get("positions"):
            self.value = 0.0
            self.level = RiskLevel.LOW
            return self.value

        # Calculate total portfolio value
        total_value = portfolio.get("total_value", 0.0)
        if total_value <= 0:
            self.value = 100.0
            self.level = RiskLevel.CRITICAL
            return self.value

        # Calculate exposure for each asset
        positions = portfolio.get("positions", {})
        exposures = []

        for symbol, position in positions.items():
            position_value = position.get("value", 0.0)
            exposure_pct = (position_value / total_value) * 100.0
            exposures.append(exposure_pct)

        # Find maximum exposure
        max_exposure = max(exposures) if exposures else 0.0

        # Calculate risk value (0-100)
        self.value = min(100.0, (max_exposure / self.max_exposure_pct) * 100.0)

        # Determine risk level
        if self.value < 25.0:
            self.level = RiskLevel.LOW
        elif self.value < 50.0:
            self.level = RiskLevel.MEDIUM
        elif self.value < 75.0:
            self.level = RiskLevel.HIGH
        else:
            self.level = RiskLevel.CRITICAL

        return self.value

class CorrelationMetric(RiskMetric):
    """Measures correlation between portfolio assets."""

    def __init__(self, lookback_days: int = 30):
        """
        Initialize the correlation metric.

        Args:
            lookback_days: Number of days to look back for correlation calculation
        """
        super().__init__("correlation", 1.0)
        self.lookback_days = lookback_days

    def calculate(self, portfolio: Dict[str, Any]) -> float:
        """
        Calculate the correlation risk.

        Args:
            portfolio: Portfolio data

        Returns:
            Correlation risk value (0-100)
        """
        if not portfolio or not portfolio.get("positions") or len(portfolio.get("positions", {})) < 2:
            self.value = 0.0
            self.level = RiskLevel.LOW
            return self.value

        # Get price history for each asset
        price_history = portfolio.get("price_history", {})

        if not price_history:
            self.value = 50.0  # Default to medium risk if no history
            self.level = RiskLevel.MEDIUM
            return self.value

        # Calculate correlation matrix
        symbols = list(price_history.keys())
        if len(symbols) < 2:
            self.value = 0.0
            self.level = RiskLevel.LOW
            return self.value

        # Create price DataFrame
        price_data = {}
        for symbol, history in price_history.items():
            if history:
                price_data[symbol] = [point.get("close", 0.0) for point in history]

        if len(price_data) < 2:
            self.value = 0.0
            self.level = RiskLevel.LOW
            return self.value

        # Create DataFrame
        df = pd.DataFrame(price_data)

        # Calculate correlation matrix
        corr_matrix = df.corr().abs()

        # Get average correlation
        corr_values = []
        for i in range(len(symbols)):
            for j in range(i+1, len(symbols)):
                if i != j and symbols[i] in corr_matrix.index and symbols[j] in corr_matrix.columns:
                    corr_values.append(corr_matrix.loc[symbols[i], symbols[j]])

        avg_correlation = np.mean(corr_values) if corr_values else 0.0

        # Calculate risk value (0-100)
        self.value = min(100.0, avg_correlation * 100.0)

        # Determine risk level
        if self.value < 25.0:
            self.level = RiskLevel.LOW
        elif self.value < 50.0:
            self.level = RiskLevel.MEDIUM
        elif self.value < 75.0:
            self.level = RiskLevel.HIGH
        else:
            self.level = RiskLevel.CRITICAL

        return self.value

class VolatilityMetric(RiskMetric):
    """Measures portfolio volatility."""

    def __init__(self, lookback_days: int = 30, max_volatility: float = 0.05):
        """
        Initialize the volatility metric.

        Args:
            lookback_days: Number of days to look back for volatility calculation
            max_volatility: Maximum acceptable volatility (daily standard deviation)
        """
        super().__init__("volatility", 1.2)
        self.lookback_days = lookback_days
        self.max_volatility = max_volatility

    def calculate(self, portfolio: Dict[str, Any]) -> float:
        """
        Calculate the volatility risk.

        Args:
            portfolio: Portfolio data

        Returns:
            Volatility risk value (0-100)
        """
        if not portfolio or not portfolio.get("positions"):
            self.value = 0.0
            self.level = RiskLevel.LOW
            return self.value

        # Get price history for each asset
        price_history = portfolio.get("price_history", {})
        positions = portfolio.get("positions", {})
        total_value = portfolio.get("total_value", 0.0)

        if not price_history or total_value <= 0:
            self.value = 50.0  # Default to medium risk if no history
            self.level = RiskLevel.MEDIUM
            return self.value

        # Calculate weighted volatility
        weighted_volatility = 0.0

        for symbol, position in positions.items():
            position_value = position.get("value", 0.0)
            weight = position_value / total_value if total_value > 0 else 0.0

            # Get price history for this symbol
            history = price_history.get(symbol, [])

            if not history:
                continue

            # Calculate daily returns
            prices = [point.get("close", 0.0) for point in history]
            returns = []

            for i in range(1, len(prices)):
                if prices[i-1] > 0:
                    daily_return = (prices[i] - prices[i-1]) / prices[i-1]
                    returns.append(daily_return)

            # Calculate volatility (standard deviation of returns)
            volatility = np.std(returns) if returns else 0.0

            # Add weighted volatility
            weighted_volatility += volatility * weight

        # Calculate risk value (0-100)
        self.value = min(100.0, (weighted_volatility / self.max_volatility) * 100.0)

        # Determine risk level
        if self.value < 25.0:
            self.level = RiskLevel.LOW
        elif self.value < 50.0:
            self.level = RiskLevel.MEDIUM
        elif self.value < 75.0:
            self.level = RiskLevel.HIGH
        else:
            self.level = RiskLevel.CRITICAL

        return self.value

class DrawdownMetric(RiskMetric):
    """Measures portfolio drawdown."""

    def __init__(self, max_drawdown_pct: float = 15.0):
        """
        Initialize the drawdown metric.

        Args:
            max_drawdown_pct: Maximum acceptable drawdown percentage
        """
        super().__init__("drawdown", 1.3)
        self.max_drawdown_pct = max_drawdown_pct

    def calculate(self, portfolio: Dict[str, Any]) -> float:
        """
        Calculate the drawdown risk.

        Args:
            portfolio: Portfolio data

        Returns:
            Drawdown risk value (0-100)
        """
        if not portfolio:
            self.value = 0.0
            self.level = RiskLevel.LOW
            return self.value

        # Get portfolio value history
        value_history = portfolio.get("value_history", [])

        if not value_history:
            self.value = 0.0
            self.level = RiskLevel.LOW
            return self.value

        # Calculate maximum drawdown
        values = [point.get("value", 0.0) for point in value_history]
        max_drawdown = 0.0
        peak = values[0]

        for value in values:
            if value > peak:
                peak = value
            else:
                drawdown = (peak - value) / peak * 100.0 if peak > 0 else 0.0
                max_drawdown = max(max_drawdown, drawdown)

        # Calculate risk value (0-100)
        self.value = min(100.0, (max_drawdown / self.max_drawdown_pct) * 100.0)

        # Determine risk level
        if self.value < 25.0:
            self.level = RiskLevel.LOW
        elif self.value < 50.0:
            self.level = RiskLevel.MEDIUM
        elif self.value < 75.0:
            self.level = RiskLevel.HIGH
        else:
            self.level = RiskLevel.CRITICAL

        return self.value

class LiquidityMetric(RiskMetric):
    """Measures liquidity risk of portfolio assets."""

    def __init__(self, min_daily_volume: float = 1000000.0):
        """
        Initialize the liquidity metric.

        Args:
            min_daily_volume: Minimum acceptable daily volume in USD
        """
        super().__init__("liquidity", 1.1)
        self.min_daily_volume = min_daily_volume

    def calculate(self, portfolio: Dict[str, Any]) -> float:
        """
        Calculate the liquidity risk.

        Args:
            portfolio: Portfolio data

        Returns:
            Liquidity risk value (0-100)
        """
        if not portfolio or not portfolio.get("positions"):
            self.value = 0.0
            self.level = RiskLevel.LOW
            return self.value

        # Get positions and market data
        positions = portfolio.get("positions", {})
        market_data = portfolio.get("market_data", {})
        total_value = portfolio.get("total_value", 0.0)

        if not market_data or total_value <= 0:
            self.value = 50.0  # Default to medium risk if no market data
            self.level = RiskLevel.MEDIUM
            return self.value

        # Calculate weighted liquidity risk
        weighted_risk = 0.0

        for symbol, position in positions.items():
            position_value = position.get("value", 0.0)
            weight = position_value / total_value if total_value > 0 else 0.0

            # Get market data for this symbol
            symbol_data = market_data.get(symbol, {})
            daily_volume = symbol_data.get("volume_24h", 0.0)

            # Calculate position to volume ratio
            position_to_volume = (position_value / daily_volume * 100.0) if daily_volume > 0 else 100.0

            # Calculate individual risk (0-100)
            individual_risk = min(100.0, position_to_volume * 10.0)  # Scale factor of 10

            # Add weighted risk
            weighted_risk += individual_risk * weight

        # Set risk value
        self.value = weighted_risk

        # Determine risk level
        if self.value < 25.0:
            self.level = RiskLevel.LOW
        elif self.value < 50.0:
            self.level = RiskLevel.MEDIUM
        elif self.value < 75.0:
            self.level = RiskLevel.HIGH
        else:
            self.level = RiskLevel.CRITICAL

        return self.value

class PortfolioRiskManager:
    """
    Portfolio Risk Management System.

    This class provides a centralized risk management system that monitors
    and manages risk across multiple trading agents and positions.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the portfolio risk manager.

        Args:
            config: Risk manager configuration
        """
        self.config = config

        # Risk thresholds
        self.warning_threshold = config.get("warning_threshold", 60.0)
        self.critical_threshold = config.get("critical_threshold", 80.0)
        self.max_position_size_pct = config.get("max_position_size_pct", 20.0)
        self.max_asset_correlation = config.get("max_asset_correlation", 0.7)
        self.max_portfolio_volatility = config.get("max_portfolio_volatility", 0.05)
        self.max_drawdown_pct = config.get("max_drawdown_pct", 15.0)
        self.min_daily_volume = config.get("min_daily_volume", 1000000.0)

        # Risk metrics
        self.metrics = [
            ExposureMetric(self.max_position_size_pct),
            CorrelationMetric(),
            VolatilityMetric(max_volatility=self.max_portfolio_volatility),
            DrawdownMetric(self.max_drawdown_pct),
            LiquidityMetric(self.min_daily_volume)
        ]

        # Portfolio data
        self.portfolio = {
            "positions": {},
            "total_value": 0.0,
            "price_history": {},
            "value_history": [],
            "market_data": {}
        }

        # Risk status
        self.overall_risk = 0.0
        self.risk_level = RiskLevel.LOW
        self.risk_breakdown = {}
        self.last_update = None

        # Agent registry
        self.agent_registry = AgentRegistry.get_instance()

        # Exchange factory
        self.exchange_factory = ExchangeFactory()

        # Initialize logger
        self.logger = logging.getLogger(__name__)
        self.logger.info("Portfolio Risk Manager initialized")

    async def initialize(self) -> bool:
        """
        Initialize the portfolio risk manager.

        Returns:
            True if initialization was successful, False otherwise
        """
        try:
            # Initialize exchanges
            self.exchanges = {}
            exchange_ids = self.config.get("exchanges", ["binance"])

            for exchange_id in exchange_ids:
                exchange = self.exchange_factory.create_exchange(exchange_id)
                await exchange.initialize()
                self.exchanges[exchange_id] = exchange

            self.logger.info(f"Initialized {len(self.exchanges)} exchanges")

            # Initialize portfolio data
            await self.update_portfolio_data()

            return True

        except Exception as e:
            self.logger.error(f"Error initializing Portfolio Risk Manager: {str(e)}")
            return False

    async def update_portfolio_data(self):
        """Update portfolio data from all agents and exchanges."""
        try:
            # Get all agents
            agents = await self.agent_registry.get_all_agents()

            # Reset portfolio data
            positions = {}
            total_value = 0.0

            # Collect position data from all agents
            for agent_id, agent in agents.items():
                # Skip agents that don't have positions
                if not hasattr(agent, "positions") or not agent.positions:
                    continue

                # Get agent positions
                agent_positions = agent.positions

                # Add to portfolio positions
                for symbol, position in agent_positions.items():
                    if symbol not in positions:
                        positions[symbol] = {
                            "value": 0.0,
                            "agents": []
                        }

                    # Add position value
                    position_value = position.get("value", 0.0)
                    if not position_value and "amount" in position and "entry_price" in position:
                        position_value = float(position["amount"]) * float(position["entry_price"])

                    positions[symbol]["value"] += position_value
                    positions[symbol]["agents"].append(agent_id)

                    # Add to total value
                    total_value += position_value

            # Update portfolio data
            self.portfolio["positions"] = positions
            self.portfolio["total_value"] = total_value

            # Update market data
            await self._update_market_data()

            # Update price history
            await self._update_price_history()

            # Update value history
            self._update_value_history()

            # Update last update time
            self.last_update = datetime.now()

            self.logger.info(f"Updated portfolio data: {len(positions)} positions, total value: {total_value}")

        except Exception as e:
            self.logger.error(f"Error updating portfolio data: {str(e)}")

    async def _update_market_data(self):
        """Update market data for all portfolio assets."""
        try:
            market_data = {}

            # Get symbols from positions
            symbols = list(self.portfolio["positions"].keys())

            if not symbols:
                return

            # Use first exchange for market data
            exchange = next(iter(self.exchanges.values()))

            # Get market data for each symbol
            for symbol in symbols:
                try:
                    # Get ticker
                    ticker = await exchange.fetch_ticker(symbol)

                    # Get 24h volume
                    volume_24h = ticker.get("quoteVolume", 0.0)

                    # Store market data
                    market_data[symbol] = {
                        "price": ticker.get("last", 0.0),
                        "volume_24h": volume_24h,
                        "change_24h": ticker.get("percentage", 0.0),
                        "high_24h": ticker.get("high", 0.0),
                        "low_24h": ticker.get("low", 0.0)
                    }

                except Exception as e:
                    self.logger.error(f"Error getting market data for {symbol}: {str(e)}")

            # Update portfolio market data
            self.portfolio["market_data"] = market_data

        except Exception as e:
            self.logger.error(f"Error updating market data: {str(e)}")

    async def _update_price_history(self):
        """Update price history for all portfolio assets."""
        try:
            price_history = {}

            # Get symbols from positions
            symbols = list(self.portfolio["positions"].keys())

            if not symbols:
                return

            # Use first exchange for price history
            exchange = next(iter(self.exchanges.values()))

            # Get price history for each symbol
            for symbol in symbols:
                try:
                    # Get OHLCV data (1 day timeframe, 30 days)
                    since = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)
                    ohlcv = await exchange.fetch_ohlcv(symbol, "1d", since=since)

                    # Convert to price history format
                    history = []

                    for candle in ohlcv:
                        timestamp, open_price, high, low, close, volume = candle

                        history.append({
                            "timestamp": timestamp,
                            "open": open_price,
                            "high": high,
                            "low": low,
                            "close": close,
                            "volume": volume
                        })

                    # Store price history
                    price_history[symbol] = history

                except Exception as e:
                    self.logger.error(f"Error getting price history for {symbol}: {str(e)}")

            # Update portfolio price history
            self.portfolio["price_history"] = price_history

        except Exception as e:
            self.logger.error(f"Error updating price history: {str(e)}")

    def _update_value_history(self):
        """Update portfolio value history."""
        try:
            # Get current value and timestamp
            current_value = self.portfolio["total_value"]
            timestamp = datetime.now().timestamp() * 1000

            # Add to value history
            self.portfolio["value_history"].append({
                "timestamp": timestamp,
                "value": current_value
            })

            # Limit history to 90 days
            max_history = 90
            if len(self.portfolio["value_history"]) > max_history:
                self.portfolio["value_history"] = self.portfolio["value_history"][-max_history:]

        except Exception as e:
            self.logger.error(f"Error updating value history: {str(e)}")

    async def calculate_risk(self) -> float:
        """
        Calculate overall portfolio risk.

        Returns:
            Overall risk score (0-100)
        """
        try:
            # Update portfolio data first
            await self.update_portfolio_data()

            # Calculate risk for each metric
            risk_values = []
            risk_breakdown = {}

            for metric in self.metrics:
                try:
                    # Calculate risk for this metric
                    risk_value = metric.calculate(self.portfolio)

                    # Add to risk values with weight
                    risk_values.append(risk_value * metric.weight)

                    # Add to risk breakdown
                    risk_breakdown[metric.name] = {
                        "value": risk_value,
                        "level": metric.get_level(),
                        "weight": metric.weight
                    }

                except Exception as e:
                    self.logger.error(f"Error calculating {metric.name} risk: {str(e)}")

            # Calculate overall risk (weighted average)
            total_weight = sum(metric.weight for metric in self.metrics)
            overall_risk = sum(risk_values) / total_weight if total_weight > 0 else 0.0

            # Update risk status
            self.overall_risk = overall_risk
            self.risk_breakdown = risk_breakdown

            # Determine risk level
            if overall_risk < 25.0:
                self.risk_level = RiskLevel.LOW
            elif overall_risk < 50.0:
                self.risk_level = RiskLevel.MEDIUM
            elif overall_risk < 75.0:
                self.risk_level = RiskLevel.HIGH
            else:
                self.risk_level = RiskLevel.CRITICAL

            self.logger.info(f"Calculated overall risk: {overall_risk:.2f} ({self.risk_level})")

            return overall_risk

        except Exception as e:
            self.logger.error(f"Error calculating portfolio risk: {str(e)}")
            return 0.0

    async def get_risk_report(self) -> Dict[str, Any]:
        """
        Get a comprehensive risk report.

        Returns:
            Risk report
        """
        try:
            # Calculate risk first
            await self.calculate_risk()

            # Create risk report
            report = {
                "overall_risk": self.overall_risk,
                "risk_level": self.risk_level,
                "risk_breakdown": self.risk_breakdown,
                "portfolio": {
                    "total_value": self.portfolio["total_value"],
                    "position_count": len(self.portfolio["positions"]),
                    "positions": self.portfolio["positions"]
                },
                "thresholds": {
                    "warning": self.warning_threshold,
                    "critical": self.critical_threshold
                },
                "timestamp": datetime.now().isoformat()
            }

            return report

        except Exception as e:
            self.logger.error(f"Error generating risk report: {str(e)}")
            return {
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def check_risk_limits(self) -> Dict[str, Any]:
        """
        Check if any risk limits have been breached.

        Returns:
            Risk limit check results
        """
        try:
            # Calculate risk first
            await self.calculate_risk()

            # Check overall risk
            overall_breach = False
            breached_metrics = []

            if self.overall_risk >= self.critical_threshold:
                overall_breach = True
                self.logger.warning(f"CRITICAL RISK LEVEL: Overall risk {self.overall_risk:.2f} exceeds critical threshold {self.critical_threshold}")

            elif self.overall_risk >= self.warning_threshold:
                self.logger.warning(f"WARNING RISK LEVEL: Overall risk {self.overall_risk:.2f} exceeds warning threshold {self.warning_threshold}")

            # Check individual metrics
            for metric_name, metric_data in self.risk_breakdown.items():
                risk_value = metric_data["value"]

                if risk_value >= self.critical_threshold:
                    breached_metrics.append({
                        "metric": metric_name,
                        "value": risk_value,
                        "level": "critical",
                        "threshold": self.critical_threshold
                    })
                    self.logger.warning(f"CRITICAL RISK LEVEL: {metric_name} risk {risk_value:.2f} exceeds critical threshold {self.critical_threshold}")

                elif risk_value >= self.warning_threshold:
                    breached_metrics.append({
                        "metric": metric_name,
                        "value": risk_value,
                        "level": "warning",
                        "threshold": self.warning_threshold
                    })
                    self.logger.warning(f"WARNING RISK LEVEL: {metric_name} risk {risk_value:.2f} exceeds warning threshold {self.warning_threshold}")

            # Return results
            return {
                "overall_breach": overall_breach,
                "overall_risk": self.overall_risk,
                "risk_level": self.risk_level,
                "breached_metrics": breached_metrics,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            self.logger.error(f"Error checking risk limits: {str(e)}")
            return {
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def get_risk_mitigation_actions(self) -> List[Dict[str, Any]]:
        """
        Get recommended risk mitigation actions.

        Returns:
            List of recommended actions
        """
        try:
            # Calculate risk first
            await self.calculate_risk()

            # Initialize actions
            actions = []

            # Check if risk is above warning threshold
            if self.overall_risk < self.warning_threshold:
                return actions  # No actions needed

            # Check exposure risk
            exposure_risk = self.risk_breakdown.get("exposure", {}).get("value", 0.0)
            if exposure_risk >= self.warning_threshold:
                # Find highest exposure positions
                positions = self.portfolio["positions"]
                total_value = self.portfolio["total_value"]

                if total_value > 0:
                    # Calculate exposure for each position
                    exposures = []

                    for symbol, position in positions.items():
                        position_value = position.get("value", 0.0)
                        exposure_pct = (position_value / total_value) * 100.0
                        exposures.append((symbol, exposure_pct, position_value))

                    # Sort by exposure (descending)
                    exposures.sort(key=lambda x: x[1], reverse=True)

                    # Recommend reducing highest exposures
                    for symbol, exposure_pct, position_value in exposures[:3]:  # Top 3 positions
                        if exposure_pct > self.max_position_size_pct:
                            # Calculate amount to reduce
                            target_value = total_value * (self.max_position_size_pct / 100.0)
                            reduce_amount = position_value - target_value
                            reduce_pct = (reduce_amount / position_value) * 100.0

                            actions.append({
                                "type": "reduce_position",
                                "symbol": symbol,
                                "current_exposure_pct": exposure_pct,
                                "target_exposure_pct": self.max_position_size_pct,
                                "reduce_amount": reduce_amount,
                                "reduce_pct": reduce_pct,
                                "reason": f"Position exceeds maximum exposure ({exposure_pct:.2f}% > {self.max_position_size_pct}%)"
                            })

            # Check correlation risk
            correlation_risk = self.risk_breakdown.get("correlation", {}).get("value", 0.0)
            if correlation_risk >= self.warning_threshold:
                actions.append({
                    "type": "diversify_portfolio",
                    "current_correlation": correlation_risk / 100.0,  # Convert to 0-1 scale
                    "target_correlation": self.max_asset_correlation,
                    "reason": f"Portfolio assets are highly correlated ({correlation_risk / 100.0:.2f} > {self.max_asset_correlation})"
                })

            # Check volatility risk
            volatility_risk = self.risk_breakdown.get("volatility", {}).get("value", 0.0)
            if volatility_risk >= self.warning_threshold:
                actions.append({
                    "type": "reduce_volatility",
                    "current_volatility": volatility_risk / 100.0 * self.max_portfolio_volatility,  # Convert to actual volatility
                    "target_volatility": self.max_portfolio_volatility,
                    "reason": f"Portfolio volatility is too high ({volatility_risk / 100.0 * self.max_portfolio_volatility:.4f} > {self.max_portfolio_volatility})"
                })

            # Check liquidity risk
            liquidity_risk = self.risk_breakdown.get("liquidity", {}).get("value", 0.0)
            if liquidity_risk >= self.warning_threshold:
                # Find illiquid positions
                positions = self.portfolio["positions"]
                market_data = self.portfolio["market_data"]

                illiquid_positions = []

                for symbol, position in positions.items():
                    position_value = position.get("value", 0.0)
                    symbol_data = market_data.get(symbol, {})
                    daily_volume = symbol_data.get("volume_24h", 0.0)

                    if daily_volume > 0:
                        position_to_volume = (position_value / daily_volume) * 100.0

                        if position_to_volume > 1.0:  # Position is > 1% of daily volume
                            illiquid_positions.append((symbol, position_to_volume, position_value))

                # Sort by illiquidity (descending)
                illiquid_positions.sort(key=lambda x: x[1], reverse=True)

                # Recommend reducing illiquid positions
                for symbol, position_to_volume, position_value in illiquid_positions[:3]:  # Top 3 illiquid positions
                    actions.append({
                        "type": "reduce_illiquid_position",
                        "symbol": symbol,
                        "position_to_volume_pct": position_to_volume,
                        "position_value": position_value,
                        "reason": f"Position is {position_to_volume:.2f}% of daily volume (low liquidity)"
                    })

            return actions

        except Exception as e:
            self.logger.error(f"Error getting risk mitigation actions: {str(e)}")
            return []

    async def execute_risk_mitigation(self, actions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Execute risk mitigation actions.

        Args:
            actions: List of actions to execute

        Returns:
            Execution results
        """
        try:
            results = []

            for action in actions:
                action_type = action.get("type")

                if action_type == "reduce_position":
                    symbol = action.get("symbol")
                    reduce_pct = action.get("reduce_pct", 0.0)

                    # Find agents with this position
                    agents_with_position = []
                    positions = self.portfolio["positions"]

                    if symbol in positions:
                        agents_with_position = positions[symbol].get("agents", [])

                    # Execute for each agent
                    for agent_id in agents_with_position:
                        try:
                            agent = await self.agent_registry.get_agent(agent_id)

                            # Check if agent has a reduce_position method
                            if hasattr(agent, "reduce_position"):
                                result = await agent.reduce_position(symbol, reduce_pct)

                                results.append({
                                    "action": action_type,
                                    "symbol": symbol,
                                    "agent_id": agent_id,
                                    "reduce_pct": reduce_pct,
                                    "success": result.get("success", False),
                                    "message": result.get("message", "")
                                })

                        except Exception as e:
                            self.logger.error(f"Error executing {action_type} for {symbol} on agent {agent_id}: {str(e)}")

                            results.append({
                                "action": action_type,
                                "symbol": symbol,
                                "agent_id": agent_id,
                                "reduce_pct": reduce_pct,
                                "success": False,
                                "message": str(e)
                            })

            # Update portfolio data after actions
            await self.update_portfolio_data()

            return {
                "actions_executed": len(results),
                "results": results,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            self.logger.error(f"Error executing risk mitigation: {str(e)}")
            return {
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def shutdown(self) -> bool:
        """
        Shut down the portfolio risk manager.

        Returns:
            True if shutdown was successful, False otherwise
        """
        try:
            # Close exchange connections
            for exchange_id, exchange in self.exchanges.items():
                await exchange.close()

            self.logger.info("Portfolio Risk Manager shut down")
            return True

        except Exception as e:
            self.logger.error(f"Error shutting down Portfolio Risk Manager: {str(e)}")
            return False