"""
Market Condition Detection System for Trading Agents.

This module provides a system for detecting and classifying market conditions
to inform trading decisions and risk management.
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
import talib

from core.agent_registry import AgentRegistry
from exchanges.exchange_factory import ExchangeFactory
from utils.config import Config

logger = logging.getLogger(__name__)

class MarketRegime:
    """Market regime enumeration."""
    BULLISH = "bullish"
    BEARISH = "bearish"
    RANGING = "ranging"
    VOLATILE = "volatile"
    TRENDING = "trending"
    REVERSAL = "reversal"
    BREAKOUT = "breakout"
    UNKNOWN = "unknown"

class MarketConditionDetector:
    """
    Market Condition Detection System.

    This class provides methods for detecting and classifying market conditions
    to inform trading decisions and risk management.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the market condition detector.

        Args:
            config: Detector configuration
        """
        self.config = config

        # Timeframes to analyze
        self.timeframes = config.get("timeframes", ["1h", "4h", "1d"])

        # Symbols to monitor
        self.symbols = config.get("symbols", ["BTC/USDT", "ETH/USDT"])

        # Lookback periods
        self.short_period = config.get("short_period", 14)
        self.medium_period = config.get("medium_period", 50)
        self.long_period = config.get("long_period", 200)

        # Volatility thresholds
        self.low_volatility_threshold = config.get("low_volatility_threshold", 0.5)
        self.high_volatility_threshold = config.get("high_volatility_threshold", 2.0)

        # Trend thresholds
        self.trend_strength_threshold = config.get("trend_strength_threshold", 25)

        # Breakout thresholds
        self.breakout_threshold = config.get("breakout_threshold", 2.0)

        # Market data
        self.market_data = {}

        # Market conditions
        self.market_conditions = {}
        self.global_condition = MarketRegime.UNKNOWN
        self.last_update = None

        # Exchange factory
        self.exchange_factory = ExchangeFactory()

        # Initialize logger
        self.logger = logging.getLogger(__name__)
        self.logger.info("Market Condition Detector initialized")

    async def initialize(self) -> bool:
        """
        Initialize the market condition detector.

        Returns:
            True if initialization was successful, False otherwise
        """
        try:
            # Initialize exchange
            exchange_id = self.config.get("exchange_id", "binance")
            self.exchange = self.exchange_factory.create_exchange(exchange_id)
            await self.exchange.initialize()

            self.logger.info(f"Initialized exchange {exchange_id}")

            # Initialize market data
            await self.update_market_data()

            return True

        except Exception as e:
            self.logger.error(f"Error initializing Market Condition Detector: {str(e)}")
            return False

    async def update_market_data(self):
        """Update market data for all symbols and timeframes."""
        try:
            # Initialize market data structure
            self.market_data = {}

            # Get data for each symbol and timeframe
            for symbol in self.symbols:
                self.market_data[symbol] = {}

                for timeframe in self.timeframes:
                    try:
                        # Calculate lookback period based on timeframe
                        lookback_multiplier = self._get_lookback_multiplier(timeframe)
                        lookback = self.long_period * lookback_multiplier

                        # Get OHLCV data
                        since = int((datetime.now() - timedelta(days=lookback)).timestamp() * 1000)
                        ohlcv = await self.exchange.fetch_ohlcv(symbol, timeframe, since=since)

                        # Convert to DataFrame
                        df = pd.DataFrame(ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"])
                        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
                        df.set_index("timestamp", inplace=True)

                        # Store in market data
                        self.market_data[symbol][timeframe] = df

                    except Exception as e:
                        self.logger.error(f"Error getting market data for {symbol} {timeframe}: {str(e)}")

            # Update last update time
            self.last_update = datetime.now()

            self.logger.info(f"Updated market data for {len(self.symbols)} symbols and {len(self.timeframes)} timeframes")

        except Exception as e:
            self.logger.error(f"Error updating market data: {str(e)}")

    def _get_lookback_multiplier(self, timeframe: str) -> int:
        """
        Get lookback multiplier based on timeframe.

        Args:
            timeframe: Timeframe string (e.g., "1h", "4h", "1d")

        Returns:
            Lookback multiplier
        """
        if timeframe == "1m":
            return 60
        elif timeframe == "5m":
            return 30
        elif timeframe == "15m":
            return 20
        elif timeframe == "30m":
            return 15
        elif timeframe == "1h":
            return 10
        elif timeframe == "4h":
            return 7
        elif timeframe == "1d":
            return 5
        else:
            return 3

    async def detect_market_conditions(self):
        """Detect market conditions for all symbols and timeframes."""
        try:
            # Update market data first
            await self.update_market_data()

            # Initialize market conditions
            self.market_conditions = {}

            # Detect conditions for each symbol and timeframe
            for symbol in self.symbols:
                self.market_conditions[symbol] = {}

                for timeframe in self.timeframes:
                    try:
                        # Get market data
                        df = self.market_data[symbol][timeframe]

                        if df is None or len(df) < self.long_period:
                            continue

                        # Calculate indicators
                        indicators = self._calculate_indicators(df)

                        # Detect market regime
                        regime = self._detect_regime(df, indicators)

                        # Store in market conditions
                        self.market_conditions[symbol][timeframe] = {
                            "regime": regime,
                            "indicators": indicators,
                            "timestamp": datetime.now().isoformat()
                        }

                    except Exception as e:
                        self.logger.error(f"Error detecting market conditions for {symbol} {timeframe}: {str(e)}")

            # Determine global market condition
            self._determine_global_condition()

            self.logger.info(f"Detected market conditions: Global condition is {self.global_condition}")

        except Exception as e:
            self.logger.error(f"Error detecting market conditions: {str(e)}")

    def _calculate_indicators(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate technical indicators for market condition detection.

        Args:
            df: OHLCV DataFrame

        Returns:
            Dictionary of indicators
        """
        try:
            # Extract price and volume data
            close = df["close"].values
            high = df["high"].values
            low = df["low"].values
            volume = df["volume"].values

            # Calculate moving averages
            sma_short = talib.SMA(close, timeperiod=self.short_period)
            sma_medium = talib.SMA(close, timeperiod=self.medium_period)
            sma_long = talib.SMA(close, timeperiod=self.long_period)

            # Calculate volatility indicators
            atr = talib.ATR(high, low, close, timeperiod=self.short_period)
            atr_pct = (atr / close) * 100.0  # ATR as percentage of price

            # Calculate momentum indicators
            rsi = talib.RSI(close, timeperiod=self.short_period)
            macd, macd_signal, macd_hist = talib.MACD(close, fastperiod=12, slowperiod=26, signalperiod=9)

            # Calculate trend indicators
            adx = talib.ADX(high, low, close, timeperiod=self.short_period)

            # Calculate support/resistance
            bbands_upper, bbands_middle, bbands_lower = talib.BBANDS(close, timeperiod=20, nbdevup=2, nbdevdn=2)

            # Calculate volume indicators
            obv = talib.OBV(close, volume)

            # Return indicators
            return {
                "sma_short": sma_short[-1],
                "sma_medium": sma_medium[-1],
                "sma_long": sma_long[-1],
                "atr": atr[-1],
                "atr_pct": atr_pct[-1],
                "rsi": rsi[-1],
                "macd": macd[-1],
                "macd_signal": macd_signal[-1],
                "macd_hist": macd_hist[-1],
                "adx": adx[-1],
                "bbands_upper": bbands_upper[-1],
                "bbands_middle": bbands_middle[-1],
                "bbands_lower": bbands_lower[-1],
                "obv": obv[-1],
                "close": close[-1],
                "high": high[-1],
                "low": low[-1],
                "volume": volume[-1]
            }

        except Exception as e:
            self.logger.error(f"Error calculating indicators: {str(e)}")
            return {}

    def _detect_regime(self, df: pd.DataFrame, indicators: Dict[str, Any]) -> str:
        """
        Detect market regime based on indicators.

        Args:
            df: OHLCV DataFrame
            indicators: Technical indicators

        Returns:
            Market regime
        """
        try:
            # Extract indicators
            close = indicators["close"]
            sma_short = indicators["sma_short"]
            sma_medium = indicators["sma_medium"]
            sma_long = indicators["sma_long"]
            atr_pct = indicators["atr_pct"]
            rsi = indicators["rsi"]
            adx = indicators["adx"]
            macd = indicators["macd"]
            macd_signal = indicators["macd_signal"]
            macd_hist = indicators["macd_hist"]

            # Check for volatility
            if atr_pct > self.high_volatility_threshold:
                # High volatility

                # Check for breakout
                if abs(close - sma_medium) / sma_medium * 100.0 > self.breakout_threshold:
                    return MarketRegime.BREAKOUT

                return MarketRegime.VOLATILE

            elif atr_pct < self.low_volatility_threshold:
                # Low volatility (ranging)
                return MarketRegime.RANGING

            # Check for trend
            if adx > self.trend_strength_threshold:
                # Strong trend

                # Check trend direction
                if sma_short > sma_medium > sma_long:
                    return MarketRegime.BULLISH
                elif sma_short < sma_medium < sma_long:
                    return MarketRegime.BEARISH
                else:
                    return MarketRegime.TRENDING

            # Check for potential reversal
            if (sma_short > sma_medium and sma_medium < sma_long) or (sma_short < sma_medium and sma_medium > sma_long):
                # Moving average crossover

                # Confirm with RSI
                if (rsi > 70 and sma_short > sma_medium) or (rsi < 30 and sma_short < sma_medium):
                    return MarketRegime.REVERSAL

            # Default based on moving averages
            if sma_short > sma_long:
                return MarketRegime.BULLISH
            else:
                return MarketRegime.BEARISH

        except Exception as e:
            self.logger.error(f"Error detecting regime: {str(e)}")
            return MarketRegime.UNKNOWN

    def _determine_global_condition(self):
        """Determine global market condition based on individual conditions."""
        try:
            # Count regimes
            regime_counts = defaultdict(int)
            total_count = 0

            # Primary symbol (usually BTC)
            primary_symbol = self.symbols[0] if self.symbols else None

            # Weight by timeframe (higher weight for longer timeframes)
            timeframe_weights = {
                "1m": 0.2,
                "5m": 0.3,
                "15m": 0.4,
                "30m": 0.5,
                "1h": 0.7,
                "4h": 1.0,
                "1d": 1.5
            }

            # Count weighted regimes
            for symbol in self.market_conditions:
                for timeframe in self.market_conditions[symbol]:
                    condition = self.market_conditions[symbol][timeframe]
                    regime = condition.get("regime", MarketRegime.UNKNOWN)

                    # Get weight
                    weight = timeframe_weights.get(timeframe, 1.0)

                    # Double weight for primary symbol
                    if symbol == primary_symbol:
                        weight *= 2

                    # Add to counts
                    regime_counts[regime] += weight
                    total_count += weight

            # Find dominant regime
            dominant_regime = MarketRegime.UNKNOWN
            max_count = 0

            for regime, count in regime_counts.items():
                if count > max_count:
                    max_count = count
                    dominant_regime = regime

            # Set global condition
            self.global_condition = dominant_regime

        except Exception as e:
            self.logger.error(f"Error determining global condition: {str(e)}")
            self.global_condition = MarketRegime.UNKNOWN

    async def get_market_conditions(self) -> Dict[str, Any]:
        """
        Get current market conditions.

        Returns:
            Market conditions
        """
        try:
            # Detect market conditions if needed
            if self.last_update is None or (datetime.now() - self.last_update).total_seconds() > 300:
                await self.detect_market_conditions()

            # Create result
            result = {
                "global_condition": self.global_condition,
                "conditions": self.market_conditions,
                "timestamp": datetime.now().isoformat()
            }

            return result

        except Exception as e:
            self.logger.error(f"Error getting market conditions: {str(e)}")
            return {
                "global_condition": MarketRegime.UNKNOWN,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def get_symbol_condition(self, symbol: str, timeframe: str = "1h") -> Dict[str, Any]:
        """
        Get market condition for a specific symbol and timeframe.

        Args:
            symbol: Trading symbol
            timeframe: Timeframe

        Returns:
            Market condition
        """
        try:
            # Detect market conditions if needed
            if self.last_update is None or (datetime.now() - self.last_update).total_seconds() > 300:
                await self.detect_market_conditions()

            # Get condition
            if symbol in self.market_conditions and timeframe in self.market_conditions[symbol]:
                condition = self.market_conditions[symbol][timeframe]

                # Add symbol and timeframe
                condition["symbol"] = symbol
                condition["timeframe"] = timeframe

                return condition

            # Symbol or timeframe not found
            return {
                "symbol": symbol,
                "timeframe": timeframe,
                "regime": MarketRegime.UNKNOWN,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            self.logger.error(f"Error getting condition for {symbol} {timeframe}: {str(e)}")
            return {
                "symbol": symbol,
                "timeframe": timeframe,
                "regime": MarketRegime.UNKNOWN,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def get_trading_recommendations(self) -> Dict[str, Any]:
        """
        Get trading recommendations based on market conditions.

        Returns:
            Trading recommendations
        """
        try:
            # Detect market conditions if needed
            if self.last_update is None or (datetime.now() - self.last_update).total_seconds() > 300:
                await self.detect_market_conditions()

            # Initialize recommendations
            recommendations = {
                "global": self._get_recommendation_for_regime(self.global_condition),
                "symbols": {},
                "timestamp": datetime.now().isoformat()
            }

            # Get recommendations for each symbol
            for symbol in self.market_conditions:
                symbol_recommendations = {}

                for timeframe in self.market_conditions[symbol]:
                    condition = self.market_conditions[symbol][timeframe]
                    regime = condition.get("regime", MarketRegime.UNKNOWN)

                    symbol_recommendations[timeframe] = self._get_recommendation_for_regime(regime)

                # Add to recommendations
                recommendations["symbols"][symbol] = symbol_recommendations

            return recommendations

        except Exception as e:
            self.logger.error(f"Error getting trading recommendations: {str(e)}")
            return {
                "global": self._get_recommendation_for_regime(MarketRegime.UNKNOWN),
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def _get_recommendation_for_regime(self, regime: str) -> Dict[str, Any]:
        """
        Get trading recommendation for a specific market regime.

        Args:
            regime: Market regime

        Returns:
            Trading recommendation
        """
        if regime == MarketRegime.BULLISH:
            return {
                "bias": "bullish",
                "position_sizing": "normal",
                "stop_loss": "trailing",
                "take_profit": "extended",
                "strategy": "trend_following",
                "risk_level": "medium"
            }
        elif regime == MarketRegime.BEARISH:
            return {
                "bias": "bearish",
                "position_sizing": "reduced",
                "stop_loss": "tight",
                "take_profit": "normal",
                "strategy": "counter_trend",
                "risk_level": "high"
            }
        elif regime == MarketRegime.RANGING:
            return {
                "bias": "neutral",
                "position_sizing": "reduced",
                "stop_loss": "normal",
                "take_profit": "tight",
                "strategy": "range_trading",
                "risk_level": "medium"
            }
        elif regime == MarketRegime.VOLATILE:
            return {
                "bias": "neutral",
                "position_sizing": "minimum",
                "stop_loss": "wide",
                "take_profit": "tight",
                "strategy": "volatility_breakout",
                "risk_level": "high"
            }
        elif regime == MarketRegime.TRENDING:
            return {
                "bias": "follow_trend",
                "position_sizing": "normal",
                "stop_loss": "trailing",
                "take_profit": "extended",
                "strategy": "trend_following",
                "risk_level": "medium"
            }
        elif regime == MarketRegime.REVERSAL:
            return {
                "bias": "counter_trend",
                "position_sizing": "reduced",
                "stop_loss": "tight",
                "take_profit": "normal",
                "strategy": "reversal",
                "risk_level": "high"
            }
        elif regime == MarketRegime.BREAKOUT:
            return {
                "bias": "follow_breakout",
                "position_sizing": "normal",
                "stop_loss": "normal",
                "take_profit": "extended",
                "strategy": "breakout",
                "risk_level": "medium"
            }
        else:  # UNKNOWN
            return {
                "bias": "neutral",
                "position_sizing": "minimum",
                "stop_loss": "tight",
                "take_profit": "tight",
                "strategy": "wait_and_see",
                "risk_level": "high"
            }

    async def shutdown(self) -> bool:
        """
        Shut down the market condition detector.

        Returns:
            True if shutdown was successful, False otherwise
        """
        try:
            # Close exchange connection
            await self.exchange.close()

            self.logger.info("Market Condition Detector shut down")
            return True

        except Exception as e:
            self.logger.error(f"Error shutting down Market Condition Detector: {str(e)}")
            return False
