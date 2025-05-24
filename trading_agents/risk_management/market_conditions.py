"""
Market conditions detection module.

This module provides tools for detecting market conditions,
including trend analysis, volatility analysis, and regime detection.
"""
import logging
from typing import Dict, Any, Optional, List, Union, Tuple
import math
import numpy as np
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class MarketConditions:
    """
    Market conditions detection for trading agents.
    
    This class provides methods for detecting market conditions,
    including trend analysis, volatility analysis, and regime detection.
    """
    
    @staticmethod
    def detect_trend(
        prices: List[float],
        short_period: int = 20,
        long_period: int = 50
    ) -> str:
        """
        Detect market trend using moving averages.
        
        Args:
            prices: Price series
            short_period: Short moving average period
            long_period: Long moving average period
            
        Returns:
            Trend direction ("uptrend", "downtrend", or "sideways")
        """
        if len(prices) < long_period:
            return "unknown"
            
        try:
            # Calculate short and long moving averages
            short_ma = sum(prices[-short_period:]) / short_period
            long_ma = sum(prices[-long_period:]) / long_period
            
            # Calculate price change percentage
            price_change = (prices[-1] / prices[-long_period] - 1) * 100
            
            # Determine trend
            if short_ma > long_ma and price_change > 2:
                return "uptrend"
            elif short_ma < long_ma and price_change < -2:
                return "downtrend"
            else:
                return "sideways"
        except Exception as e:
            logger.error(f"Error detecting trend: {str(e)}")
            return "unknown"
            
    @staticmethod
    def calculate_volatility(
        prices: List[float],
        period: int = 20
    ) -> float:
        """
        Calculate market volatility.
        
        Args:
            prices: Price series
            period: Lookback period
            
        Returns:
            Volatility (annualized standard deviation)
        """
        if len(prices) < period:
            return 0.0
            
        try:
            # Calculate returns
            returns = [prices[i] / prices[i-1] - 1 for i in range(1, len(prices))]
            
            # Use only the last 'period' returns
            recent_returns = returns[-period:]
            
            # Calculate standard deviation
            std_dev = math.sqrt(sum(r**2 for r in recent_returns) / len(recent_returns))
            
            # Annualize (assuming daily data)
            annualized_vol = std_dev * math.sqrt(252)
            
            return float(annualized_vol)
        except Exception as e:
            logger.error(f"Error calculating volatility: {str(e)}")
            return 0.0
            
    @staticmethod
    def detect_volatility_regime(
        prices: List[float],
        period: int = 20,
        high_vol_threshold: float = 0.3,
        low_vol_threshold: float = 0.1
    ) -> str:
        """
        Detect volatility regime.
        
        Args:
            prices: Price series
            period: Lookback period
            high_vol_threshold: High volatility threshold
            low_vol_threshold: Low volatility threshold
            
        Returns:
            Volatility regime ("high", "medium", or "low")
        """
        volatility = MarketConditions.calculate_volatility(prices, period)
        
        if volatility > high_vol_threshold:
            return "high"
        elif volatility < low_vol_threshold:
            return "low"
        else:
            return "medium"
            
    @staticmethod
    def detect_market_regime(
        prices: List[float],
        volume: Optional[List[float]] = None,
        period: int = 20
    ) -> str:
        """
        Detect market regime using price and volume.
        
        Args:
            prices: Price series
            volume: Volume series
            period: Lookback period
            
        Returns:
            Market regime ("bull", "bear", "consolidation", or "unknown")
        """
        if len(prices) < period:
            return "unknown"
            
        try:
            # Detect trend
            trend = MarketConditions.detect_trend(prices)
            
            # Calculate volatility
            volatility = MarketConditions.calculate_volatility(prices, period)
            
            # Calculate price change
            price_change = (prices[-1] / prices[-period] - 1) * 100
            
            # Check volume trend if available
            volume_trend = "unknown"
            if volume and len(volume) >= period:
                avg_volume = sum(volume[-period:]) / period
                recent_volume = sum(volume[-5:]) / 5
                
                if recent_volume > avg_volume * 1.2:
                    volume_trend = "increasing"
                elif recent_volume < avg_volume * 0.8:
                    volume_trend = "decreasing"
                else:
                    volume_trend = "stable"
            
            # Determine market regime
            if trend == "uptrend" and price_change > 5 and (volume_trend in ["increasing", "unknown"]):
                return "bull"
            elif trend == "downtrend" and price_change < -5 and (volume_trend in ["increasing", "unknown"]):
                return "bear"
            elif trend == "sideways" and volatility < 0.15:
                return "consolidation"
            else:
                return "transition"
        except Exception as e:
            logger.error(f"Error detecting market regime: {str(e)}")
            return "unknown"
            
    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> float:
        """
        Calculate Relative Strength Index (RSI).
        
        Args:
            prices: Price series
            period: RSI period
            
        Returns:
            RSI value (0-100)
        """
        if len(prices) < period + 1:
            return 50.0
            
        try:
            # Calculate price changes
            deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
            
            # Calculate gains and losses
            gains = [d if d > 0 else 0 for d in deltas]
            losses = [-d if d < 0 else 0 for d in deltas]
            
            # Use only the last 'period' values
            recent_gains = gains[-period:]
            recent_losses = losses[-period:]
            
            # Calculate average gain and loss
            avg_gain = sum(recent_gains) / period
            avg_loss = sum(recent_losses) / period
            
            if avg_loss == 0:
                return 100.0
                
            # Calculate RS and RSI
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
            
            return float(rsi)
        except Exception as e:
            logger.error(f"Error calculating RSI: {str(e)}")
            return 50.0
            
    @staticmethod
    def detect_overbought_oversold(
        prices: List[float],
        rsi_period: int = 14,
        overbought_threshold: float = 70.0,
        oversold_threshold: float = 30.0
    ) -> str:
        """
        Detect overbought or oversold conditions using RSI.
        
        Args:
            prices: Price series
            rsi_period: RSI period
            overbought_threshold: Overbought threshold
            oversold_threshold: Oversold threshold
            
        Returns:
            Market condition ("overbought", "oversold", or "neutral")
        """
        rsi = MarketConditions.calculate_rsi(prices, rsi_period)
        
        if rsi > overbought_threshold:
            return "overbought"
        elif rsi < oversold_threshold:
            return "oversold"
        else:
            return "neutral"
            
    @staticmethod
    def detect_support_resistance(
        prices: List[float],
        window: int = 10,
        threshold: float = 0.02
    ) -> Tuple[List[float], List[float]]:
        """
        Detect support and resistance levels.
        
        Args:
            prices: Price series
            window: Window size for local extrema
            threshold: Threshold for level significance
            
        Returns:
            Tuple of (support_levels, resistance_levels)
        """
        if len(prices) < 2 * window + 1:
            return [], []
            
        try:
            support_levels = []
            resistance_levels = []
            
            # Find local minima and maxima
            for i in range(window, len(prices) - window):
                # Check if this is a local minimum
                if all(prices[i] <= prices[i-j] for j in range(1, window+1)) and \
                   all(prices[i] <= prices[i+j] for j in range(1, window+1)):
                    support_levels.append(prices[i])
                
                # Check if this is a local maximum
                if all(prices[i] >= prices[i-j] for j in range(1, window+1)) and \
                   all(prices[i] >= prices[i+j] for j in range(1, window+1)):
                    resistance_levels.append(prices[i])
            
            # Filter out levels that are too close to each other
            support_levels = MarketConditions._filter_levels(support_levels, threshold)
            resistance_levels = MarketConditions._filter_levels(resistance_levels, threshold)
            
            return support_levels, resistance_levels
        except Exception as e:
            logger.error(f"Error detecting support and resistance: {str(e)}")
            return [], []
            
    @staticmethod
    def _filter_levels(levels: List[float], threshold: float) -> List[float]:
        """
        Filter out levels that are too close to each other.
        
        Args:
            levels: List of price levels
            threshold: Threshold for level significance
            
        Returns:
            Filtered list of levels
        """
        if not levels:
            return []
            
        # Sort levels
        sorted_levels = sorted(levels)
        
        # Filter out levels that are too close
        filtered_levels = [sorted_levels[0]]
        for level in sorted_levels[1:]:
            if level > filtered_levels[-1] * (1 + threshold):
                filtered_levels.append(level)
                
        return filtered_levels
