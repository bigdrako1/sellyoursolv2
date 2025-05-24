"""
Feature engineering module for machine learning.

This module provides feature engineering tools for machine learning,
including technical indicators, market features, and data preprocessing.
"""
import logging
from typing import Dict, Any, Optional, List, Union, Tuple
import math
import numpy as np
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class FeatureEngineering:
    """
    Feature engineering for machine learning.
    
    This class provides methods for feature engineering,
    including technical indicators, market features, and
    data preprocessing.
    """
    
    @staticmethod
    def calculate_sma(prices: List[float], period: int = 20) -> List[float]:
        """
        Calculate Simple Moving Average (SMA).
        
        Args:
            prices: Price series
            period: SMA period
            
        Returns:
            SMA values
        """
        if len(prices) < period:
            return [np.nan] * len(prices)
            
        sma = []
        for i in range(len(prices)):
            if i < period - 1:
                sma.append(np.nan)
            else:
                sma.append(sum(prices[i-period+1:i+1]) / period)
                
        return sma
        
    @staticmethod
    def calculate_ema(prices: List[float], period: int = 20) -> List[float]:
        """
        Calculate Exponential Moving Average (EMA).
        
        Args:
            prices: Price series
            period: EMA period
            
        Returns:
            EMA values
        """
        if len(prices) < period:
            return [np.nan] * len(prices)
            
        ema = [np.nan] * (period - 1)
        
        # First EMA is SMA
        ema.append(sum(prices[:period]) / period)
        
        # Calculate multiplier
        multiplier = 2 / (period + 1)
        
        # Calculate EMA
        for i in range(period, len(prices)):
            ema.append(prices[i] * multiplier + ema[-1] * (1 - multiplier))
            
        return ema
        
    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> List[float]:
        """
        Calculate Relative Strength Index (RSI).
        
        Args:
            prices: Price series
            period: RSI period
            
        Returns:
            RSI values
        """
        if len(prices) < period + 1:
            return [np.nan] * len(prices)
            
        # Calculate price changes
        deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
        deltas = [0] + deltas  # Add 0 for the first price
        
        # Calculate gains and losses
        gains = [d if d > 0 else 0 for d in deltas]
        losses = [-d if d < 0 else 0 for d in deltas]
        
        # Initialize RSI values
        rsi = [np.nan] * period
        
        # Calculate first average gain and loss
        avg_gain = sum(gains[1:period+1]) / period
        avg_loss = sum(losses[1:period+1]) / period
        
        # Calculate RSI
        for i in range(period, len(prices)):
            # Update average gain and loss
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period
            
            if avg_loss == 0:
                rsi.append(100)
            else:
                rs = avg_gain / avg_loss
                rsi.append(100 - (100 / (1 + rs)))
                
        return rsi
        
    @staticmethod
    def calculate_macd(
        prices: List[float],
        fast_period: int = 12,
        slow_period: int = 26,
        signal_period: int = 9
    ) -> Tuple[List[float], List[float], List[float]]:
        """
        Calculate Moving Average Convergence Divergence (MACD).
        
        Args:
            prices: Price series
            fast_period: Fast EMA period
            slow_period: Slow EMA period
            signal_period: Signal EMA period
            
        Returns:
            Tuple of (macd_line, signal_line, histogram)
        """
        if len(prices) < slow_period + signal_period:
            return [np.nan] * len(prices), [np.nan] * len(prices), [np.nan] * len(prices)
            
        # Calculate fast and slow EMAs
        fast_ema = FeatureEngineering.calculate_ema(prices, fast_period)
        slow_ema = FeatureEngineering.calculate_ema(prices, slow_period)
        
        # Calculate MACD line
        macd_line = [np.nan] * len(prices)
        for i in range(len(prices)):
            if np.isnan(fast_ema[i]) or np.isnan(slow_ema[i]):
                continue
            macd_line[i] = fast_ema[i] - slow_ema[i]
            
        # Calculate signal line
        signal_line = FeatureEngineering.calculate_ema(
            [x for x in macd_line if not np.isnan(x)],
            signal_period
        )
        
        # Pad signal line with NaNs
        signal_line = [np.nan] * (len(macd_line) - len(signal_line)) + signal_line
        
        # Calculate histogram
        histogram = [np.nan] * len(prices)
        for i in range(len(prices)):
            if np.isnan(macd_line[i]) or np.isnan(signal_line[i]):
                continue
            histogram[i] = macd_line[i] - signal_line[i]
            
        return macd_line, signal_line, histogram
        
    @staticmethod
    def calculate_bollinger_bands(
        prices: List[float],
        period: int = 20,
        num_std: float = 2.0
    ) -> Tuple[List[float], List[float], List[float]]:
        """
        Calculate Bollinger Bands.
        
        Args:
            prices: Price series
            period: SMA period
            num_std: Number of standard deviations
            
        Returns:
            Tuple of (upper_band, middle_band, lower_band)
        """
        if len(prices) < period:
            return [np.nan] * len(prices), [np.nan] * len(prices), [np.nan] * len(prices)
            
        # Calculate middle band (SMA)
        middle_band = FeatureEngineering.calculate_sma(prices, period)
        
        # Calculate standard deviation
        std_dev = [np.nan] * len(prices)
        for i in range(period - 1, len(prices)):
            std_dev[i] = math.sqrt(
                sum((prices[i-period+1:i+1] - middle_band[i])**2) / period
            )
            
        # Calculate upper and lower bands
        upper_band = [np.nan] * len(prices)
        lower_band = [np.nan] * len(prices)
        
        for i in range(len(prices)):
            if np.isnan(middle_band[i]) or np.isnan(std_dev[i]):
                continue
            upper_band[i] = middle_band[i] + num_std * std_dev[i]
            lower_band[i] = middle_band[i] - num_std * std_dev[i]
            
        return upper_band, middle_band, lower_band
        
    @staticmethod
    def calculate_atr(
        high_prices: List[float],
        low_prices: List[float],
        close_prices: List[float],
        period: int = 14
    ) -> List[float]:
        """
        Calculate Average True Range (ATR).
        
        Args:
            high_prices: High price series
            low_prices: Low price series
            close_prices: Close price series
            period: ATR period
            
        Returns:
            ATR values
        """
        if len(high_prices) < period + 1 or len(low_prices) < period + 1 or len(close_prices) < period + 1:
            return [np.nan] * len(high_prices)
            
        # Calculate true range
        tr = [np.nan]  # First TR is NaN
        
        for i in range(1, len(close_prices)):
            tr1 = high_prices[i] - low_prices[i]
            tr2 = abs(high_prices[i] - close_prices[i-1])
            tr3 = abs(low_prices[i] - close_prices[i-1])
            tr.append(max(tr1, tr2, tr3))
            
        # Calculate ATR
        atr = [np.nan] * period
        
        # First ATR is simple average of TR
        atr.append(sum(tr[1:period+1]) / period)
        
        # Calculate ATR using smoothing
        for i in range(period + 1, len(close_prices)):
            atr.append((atr[-1] * (period - 1) + tr[i]) / period)
            
        return atr
        
    @staticmethod
    def calculate_stochastic(
        high_prices: List[float],
        low_prices: List[float],
        close_prices: List[float],
        k_period: int = 14,
        d_period: int = 3
    ) -> Tuple[List[float], List[float]]:
        """
        Calculate Stochastic Oscillator.
        
        Args:
            high_prices: High price series
            low_prices: Low price series
            close_prices: Close price series
            k_period: %K period
            d_period: %D period
            
        Returns:
            Tuple of (%K, %D)
        """
        if len(high_prices) < k_period or len(low_prices) < k_period or len(close_prices) < k_period:
            return [np.nan] * len(close_prices), [np.nan] * len(close_prices)
            
        # Calculate %K
        k = [np.nan] * (k_period - 1)
        
        for i in range(k_period - 1, len(close_prices)):
            highest_high = max(high_prices[i-k_period+1:i+1])
            lowest_low = min(low_prices[i-k_period+1:i+1])
            
            if highest_high == lowest_low:
                k.append(50)
            else:
                k.append(100 * (close_prices[i] - lowest_low) / (highest_high - lowest_low))
                
        # Calculate %D (SMA of %K)
        d = FeatureEngineering.calculate_sma(k, d_period)
        
        return k, d
        
    @staticmethod
    def normalize_features(features: List[float], method: str = "z-score") -> List[float]:
        """
        Normalize features.
        
        Args:
            features: Feature values
            method: Normalization method ("z-score", "min-max", or "decimal-scaling")
            
        Returns:
            Normalized features
        """
        if not features or all(np.isnan(x) for x in features):
            return features
            
        # Remove NaN values for calculation
        valid_features = [x for x in features if not np.isnan(x)]
        
        if not valid_features:
            return features
            
        if method == "z-score":
            # Z-score normalization
            mean = sum(valid_features) / len(valid_features)
            std_dev = math.sqrt(sum((x - mean)**2 for x in valid_features) / len(valid_features))
            
            if std_dev == 0:
                return [0 if not np.isnan(x) else np.nan for x in features]
                
            return [(x - mean) / std_dev if not np.isnan(x) else np.nan for x in features]
            
        elif method == "min-max":
            # Min-max normalization
            min_val = min(valid_features)
            max_val = max(valid_features)
            
            if min_val == max_val:
                return [0.5 if not np.isnan(x) else np.nan for x in features]
                
            return [(x - min_val) / (max_val - min_val) if not np.isnan(x) else np.nan for x in features]
            
        elif method == "decimal-scaling":
            # Decimal scaling
            max_abs = max(abs(x) for x in valid_features)
            d = math.ceil(math.log10(max_abs)) if max_abs > 0 else 0
            
            return [x / (10**d) if not np.isnan(x) else np.nan for x in features]
            
        else:
            # Default to no normalization
            return features
            
    @staticmethod
    def create_features(
        ohlcv_data: Dict[str, List[float]],
        include_indicators: List[str] = None
    ) -> Dict[str, List[float]]:
        """
        Create features from OHLCV data.
        
        Args:
            ohlcv_data: OHLCV data dictionary
            include_indicators: List of indicators to include
            
        Returns:
            Features dictionary
        """
        if not include_indicators:
            include_indicators = ["sma", "ema", "rsi", "macd", "bollinger", "atr", "stochastic"]
            
        # Extract OHLCV data
        open_prices = ohlcv_data.get("open", [])
        high_prices = ohlcv_data.get("high", [])
        low_prices = ohlcv_data.get("low", [])
        close_prices = ohlcv_data.get("close", [])
        volume = ohlcv_data.get("volume", [])
        
        if not close_prices:
            return {}
            
        # Initialize features dictionary
        features = {
            "close": close_prices,
            "returns": [np.nan] + [close_prices[i] / close_prices[i-1] - 1 for i in range(1, len(close_prices))]
        }
        
        # Add volume features
        if volume:
            features["volume"] = volume
            features["volume_sma"] = FeatureEngineering.calculate_sma(volume, 20)
            
        # Add technical indicators
        if "sma" in include_indicators:
            features["sma_20"] = FeatureEngineering.calculate_sma(close_prices, 20)
            features["sma_50"] = FeatureEngineering.calculate_sma(close_prices, 50)
            features["sma_200"] = FeatureEngineering.calculate_sma(close_prices, 200)
            
        if "ema" in include_indicators:
            features["ema_12"] = FeatureEngineering.calculate_ema(close_prices, 12)
            features["ema_26"] = FeatureEngineering.calculate_ema(close_prices, 26)
            
        if "rsi" in include_indicators:
            features["rsi_14"] = FeatureEngineering.calculate_rsi(close_prices, 14)
            
        if "macd" in include_indicators:
            macd_line, signal_line, histogram = FeatureEngineering.calculate_macd(close_prices)
            features["macd_line"] = macd_line
            features["macd_signal"] = signal_line
            features["macd_histogram"] = histogram
            
        if "bollinger" in include_indicators:
            upper, middle, lower = FeatureEngineering.calculate_bollinger_bands(close_prices)
            features["bb_upper"] = upper
            features["bb_middle"] = middle
            features["bb_lower"] = lower
            
        if "atr" in include_indicators and high_prices and low_prices:
            features["atr_14"] = FeatureEngineering.calculate_atr(high_prices, low_prices, close_prices)
            
        if "stochastic" in include_indicators and high_prices and low_prices:
            k, d = FeatureEngineering.calculate_stochastic(high_prices, low_prices, close_prices)
            features["stoch_k"] = k
            features["stoch_d"] = d
            
        return features
