"""
Feature engineering pipeline for machine learning models.

This module provides classes and functions for feature extraction,
transformation, and selection.
"""
import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple, Union, Callable
from datetime import datetime, timedelta
import talib
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
from sklearn.feature_selection import SelectKBest, f_classif, mutual_info_classif
from sklearn.decomposition import PCA
from sklearn.pipeline import Pipeline

from trading_agents.ml.common.data_types import (
    DataSource, FeatureType, TimeFrame, Feature, DataPoint, DatasetMetadata
)

logger = logging.getLogger(__name__)

class FeatureExtractor:
    """Base class for feature extractors."""

    def __init__(self, name: str, feature_type: FeatureType, source: DataSource):
        """
        Initialize the feature extractor.

        Args:
            name: Feature extractor name
            feature_type: Type of features extracted
            source: Data source for extraction
        """
        self.name = name
        self.feature_type = feature_type
        self.source = source

    def extract(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Extract features from data.

        Args:
            data: Input data

        Returns:
            DataFrame with extracted features
        """
        raise NotImplementedError("Subclasses must implement this method")

    def get_feature_names(self) -> List[str]:
        """
        Get names of features extracted by this extractor.

        Returns:
            List of feature names
        """
        raise NotImplementedError("Subclasses must implement this method")

    def get_feature_metadata(self) -> List[Feature]:
        """
        Get metadata for features extracted by this extractor.

        Returns:
            List of Feature objects
        """
        raise NotImplementedError("Subclasses must implement this method")

class PriceFeatureExtractor(FeatureExtractor):
    """Extracts features from price data."""

    def __init__(self, timeframes: List[int] = None):
        """
        Initialize the price feature extractor.

        Args:
            timeframes: List of timeframes for moving averages, etc.
        """
        super().__init__("price_features", FeatureType.PRICE, DataSource.MARKET)
        self.timeframes = timeframes or [5, 10, 20, 50, 100, 200]

    def extract(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Extract price features from OHLCV data.

        Args:
            data: OHLCV DataFrame with columns [open, high, low, close, volume]

        Returns:
            DataFrame with price features
        """
        if data.empty:
            return pd.DataFrame()

        # Ensure required columns exist
        required_columns = ['open', 'high', 'low', 'close', 'volume']
        if not all(col in data.columns for col in required_columns):
            raise ValueError(f"Data must contain columns: {required_columns}")

        # Create result DataFrame
        result = pd.DataFrame(index=data.index)

        # Price features
        result['price'] = data['close']
        result['price_open'] = data['open']
        result['price_high'] = data['high']
        result['price_low'] = data['low']

        # Price changes
        result['price_change'] = data['close'].pct_change()
        result['price_change_abs'] = data['close'].diff()

        # Moving averages
        for period in self.timeframes:
            result[f'sma_{period}'] = talib.SMA(data['close'].values, timeperiod=period)
            result[f'ema_{period}'] = talib.EMA(data['close'].values, timeperiod=period)

        # Price relative to moving averages
        for period in self.timeframes:
            result[f'price_sma_ratio_{period}'] = data['close'] / result[f'sma_{period}']
            result[f'price_ema_ratio_{period}'] = data['close'] / result[f'ema_{period}']

        # Bollinger Bands
        for period in [20]:
            upper, middle, lower = talib.BBANDS(
                data['close'].values,
                timeperiod=period,
                nbdevup=2,
                nbdevdn=2
            )
            result[f'bb_upper_{period}'] = upper
            result[f'bb_middle_{period}'] = middle
            result[f'bb_lower_{period}'] = lower
            result[f'bb_width_{period}'] = (upper - lower) / middle
            result[f'bb_position_{period}'] = (data['close'] - lower) / (upper - lower)

        # Price channels
        for period in [20, 50]:
            result[f'highest_high_{period}'] = data['high'].rolling(period).max()
            result[f'lowest_low_{period}'] = data['low'].rolling(period).min()
            result[f'channel_width_{period}'] = (result[f'highest_high_{period}'] - result[f'lowest_low_{period}']) / data['close']
            result[f'channel_position_{period}'] = (data['close'] - result[f'lowest_low_{period}']) / (result[f'highest_high_{period}'] - result[f'lowest_low_{period}'])

        # Candle patterns
        result['body_size'] = abs(data['close'] - data['open']) / data['close']
        result['upper_shadow'] = (data['high'] - data[['open', 'close']].max(axis=1)) / data['close']
        result['lower_shadow'] = (data[['open', 'close']].min(axis=1) - data['low']) / data['close']
        result['body_to_range'] = abs(data['close'] - data['open']) / (data['high'] - data['low'])

        return result

    def get_feature_names(self) -> List[str]:
        """
        Get names of features extracted by this extractor.

        Returns:
            List of feature names
        """
        feature_names = [
            'price', 'price_open', 'price_high', 'price_low',
            'price_change', 'price_change_abs',
            'body_size', 'upper_shadow', 'lower_shadow', 'body_to_range'
        ]

        # Add moving average features
        for period in self.timeframes:
            feature_names.extend([
                f'sma_{period}', f'ema_{period}',
                f'price_sma_ratio_{period}', f'price_ema_ratio_{period}'
            ])

        # Add Bollinger Band features
        for period in [20]:
            feature_names.extend([
                f'bb_upper_{period}', f'bb_middle_{period}', f'bb_lower_{period}',
                f'bb_width_{period}', f'bb_position_{period}'
            ])

        # Add price channel features
        for period in [20, 50]:
            feature_names.extend([
                f'highest_high_{period}', f'lowest_low_{period}',
                f'channel_width_{period}', f'channel_position_{period}'
            ])

        return feature_names

    def get_feature_metadata(self) -> List[Feature]:
        """
        Get metadata for features extracted by this extractor.

        Returns:
            List of Feature objects
        """
        feature_names = self.get_feature_names()
        metadata = []

        for name in feature_names:
            if name.startswith('sma_') or name.startswith('ema_'):
                period = name.split('_')[1]
                description = f"{name.split('_')[0].upper()} with period {period}"
            elif name.startswith('price_sma_ratio_') or name.startswith('price_ema_ratio_'):
                period = name.split('_')[-1]
                ma_type = name.split('_')[1].upper()
                description = f"Price to {ma_type} ratio with period {period}"
            elif name.startswith('bb_'):
                parts = name.split('_')
                bb_type = parts[1]
                period = parts[2]
                description = f"Bollinger Band {bb_type} with period {period}"
            elif name.startswith('highest_high_') or name.startswith('lowest_low_'):
                period = name.split('_')[-1]
                level_type = '_'.join(name.split('_')[:-1])
                description = f"{level_type.replace('_', ' ').title()} over {period} periods"
            elif name.startswith('channel_'):
                parts = name.split('_')
                channel_type = parts[1]
                period = parts[2]
                description = f"Price channel {channel_type} with period {period}"
            else:
                description = name.replace('_', ' ').title()

            metadata.append(Feature(
                name=name,
                type=self.feature_type,
                source=self.source,
                description=description
            ))

        return metadata

class VolumeFeatureExtractor(FeatureExtractor):
    """Extracts features from volume data."""

    def __init__(self, timeframes: List[int] = None):
        """
        Initialize the volume feature extractor.

        Args:
            timeframes: List of timeframes for moving averages, etc.
        """
        super().__init__("volume_features", FeatureType.VOLUME, DataSource.MARKET)
        self.timeframes = timeframes or [5, 10, 20, 50, 100]

    def extract(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Extract volume features from OHLCV data.

        Args:
            data: OHLCV DataFrame with columns [open, high, low, close, volume]

        Returns:
            DataFrame with volume features
        """
        if data.empty:
            return pd.DataFrame()

        # Ensure required columns exist
        required_columns = ['close', 'volume']
        if not all(col in data.columns for col in required_columns):
            raise ValueError(f"Data must contain columns: {required_columns}")

        # Create result DataFrame
        result = pd.DataFrame(index=data.index)

        # Basic volume features
        result['volume'] = data['volume']
        result['volume_change'] = data['volume'].pct_change()

        # Volume moving averages
        for period in self.timeframes:
            result[f'volume_sma_{period}'] = talib.SMA(data['volume'].values, timeperiod=period)
            result[f'volume_ema_{period}'] = talib.EMA(data['volume'].values, timeperiod=period)

        # Volume relative to moving averages
        for period in self.timeframes:
            result[f'volume_sma_ratio_{period}'] = data['volume'] / result[f'volume_sma_{period}']

        # On-balance volume
        result['obv'] = talib.OBV(data['close'].values, data['volume'].values)

        # Volume and price relationship
        result['volume_price_corr_5'] = data['volume'].rolling(5).corr(data['close'])
        result['volume_price_corr_10'] = data['volume'].rolling(10).corr(data['close'])
        result['volume_price_corr_20'] = data['volume'].rolling(20).corr(data['close'])

        # Volume volatility
        result['volume_std_5'] = data['volume'].rolling(5).std() / data['volume'].rolling(5).mean()
        result['volume_std_10'] = data['volume'].rolling(10).std() / data['volume'].rolling(10).mean()
        result['volume_std_20'] = data['volume'].rolling(20).std() / data['volume'].rolling(20).mean()

        return result

    def get_feature_names(self) -> List[str]:
        """
        Get names of features extracted by this extractor.

        Returns:
            List of feature names
        """
        feature_names = [
            'volume', 'volume_change', 'obv',
            'volume_price_corr_5', 'volume_price_corr_10', 'volume_price_corr_20',
            'volume_std_5', 'volume_std_10', 'volume_std_20'
        ]

        # Add moving average features
        for period in self.timeframes:
            feature_names.extend([
                f'volume_sma_{period}', f'volume_ema_{period}',
                f'volume_sma_ratio_{period}'
            ])

        return feature_names

    def get_feature_metadata(self) -> List[Feature]:
        """
        Get metadata for features extracted by this extractor.

        Returns:
            List of Feature objects
        """
        feature_names = self.get_feature_names()
        metadata = []

        for name in feature_names:
            if name.startswith('volume_sma_') or name.startswith('volume_ema_'):
                period = name.split('_')[-1]
                ma_type = name.split('_')[1].upper()
                description = f"Volume {ma_type} with period {period}"
            elif name.startswith('volume_sma_ratio_'):
                period = name.split('_')[-1]
                description = f"Volume to SMA ratio with period {period}"
            elif name == 'obv':
                description = "On-Balance Volume"
            elif name.startswith('volume_price_corr_'):
                period = name.split('_')[-1]
                description = f"Volume-price correlation over {period} periods"
            elif name.startswith('volume_std_'):
                period = name.split('_')[-1]
                description = f"Volume coefficient of variation over {period} periods"
            else:
                description = name.replace('_', ' ').title()

            metadata.append(Feature(
                name=name,
                type=self.feature_type,
                source=self.source,
                description=description
            ))

        return metadata

class MomentumFeatureExtractor(FeatureExtractor):
    """Extracts momentum features from price data."""

    def __init__(self, timeframes: List[int] = None):
        """
        Initialize the momentum feature extractor.

        Args:
            timeframes: List of timeframes for indicators
        """
        super().__init__("momentum_features", FeatureType.MOMENTUM, DataSource.TECHNICAL)
        self.timeframes = timeframes or [9, 14, 20]

    def extract(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Extract momentum features from OHLCV data.

        Args:
            data: OHLCV DataFrame with columns [open, high, low, close, volume]

        Returns:
            DataFrame with momentum features
        """
        if data.empty:
            return pd.DataFrame()

        # Ensure required columns exist
        required_columns = ['open', 'high', 'low', 'close']
        if not all(col in data.columns for col in required_columns):
            raise ValueError(f"Data must contain columns: {required_columns}")

        # Create result DataFrame
        result = pd.DataFrame(index=data.index)

        # RSI
        for period in self.timeframes:
            result[f'rsi_{period}'] = talib.RSI(data['close'].values, timeperiod=period)

        # MACD
        macd, macd_signal, macd_hist = talib.MACD(
            data['close'].values,
            fastperiod=12,
            slowperiod=26,
            signalperiod=9
        )
        result['macd'] = macd
        result['macd_signal'] = macd_signal
        result['macd_hist'] = macd_hist
        result['macd_hist_change'] = pd.Series(macd_hist).pct_change().values

        # Stochastic
        for period in self.timeframes:
            slowk, slowd = talib.STOCH(
                data['high'].values,
                data['low'].values,
                data['close'].values,
                fastk_period=period,
                slowk_period=3,
                slowk_matype=0,
                slowd_period=3,
                slowd_matype=0
            )
            result[f'stoch_k_{period}'] = slowk
            result[f'stoch_d_{period}'] = slowd
            result[f'stoch_diff_{period}'] = slowk - slowd

        # CCI (Commodity Channel Index)
        for period in self.timeframes:
            result[f'cci_{period}'] = talib.CCI(
                data['high'].values,
                data['low'].values,
                data['close'].values,
                timeperiod=period
            )

        # ROC (Rate of Change)
        for period in self.timeframes:
            result[f'roc_{period}'] = talib.ROC(data['close'].values, timeperiod=period)

        # Williams %R
        for period in self.timeframes:
            result[f'willr_{period}'] = talib.WILLR(
                data['high'].values,
                data['low'].values,
                data['close'].values,
                timeperiod=period
            )

        # MFI (Money Flow Index)
        for period in self.timeframes:
            if 'volume' in data.columns:
                result[f'mfi_{period}'] = talib.MFI(
                    data['high'].values,
                    data['low'].values,
                    data['close'].values,
                    data['volume'].values,
                    timeperiod=period
                )

        return result

    def get_feature_names(self) -> List[str]:
        """
        Get names of features extracted by this extractor.

        Returns:
            List of feature names
        """
        feature_names = [
            'macd', 'macd_signal', 'macd_hist', 'macd_hist_change'
        ]

        # Add RSI features
        for period in self.timeframes:
            feature_names.append(f'rsi_{period}')

        # Add Stochastic features
        for period in self.timeframes:
            feature_names.extend([
                f'stoch_k_{period}', f'stoch_d_{period}', f'stoch_diff_{period}'
            ])

        # Add CCI features
        for period in self.timeframes:
            feature_names.append(f'cci_{period}')

        # Add ROC features
        for period in self.timeframes:
            feature_names.append(f'roc_{period}')

        # Add Williams %R features
        for period in self.timeframes:
            feature_names.append(f'willr_{period}')

        # Add MFI features
        for period in self.timeframes:
            feature_names.append(f'mfi_{period}')

        return feature_names

    def get_feature_metadata(self) -> List[Feature]:
        """
        Get metadata for features extracted by this extractor.

        Returns:
            List of Feature objects
        """
        feature_names = self.get_feature_names()
        metadata = []

        for name in feature_names:
            if name.startswith('rsi_'):
                period = name.split('_')[1]
                description = f"Relative Strength Index with period {period}"
            elif name.startswith('macd'):
                if name == 'macd':
                    description = "Moving Average Convergence Divergence"
                elif name == 'macd_signal':
                    description = "MACD Signal Line"
                elif name == 'macd_hist':
                    description = "MACD Histogram"
                elif name == 'macd_hist_change':
                    description = "MACD Histogram Change"
            elif name.startswith('stoch_'):
                parts = name.split('_')
                stoch_type = parts[1]
                period = parts[2]
                if stoch_type == 'k':
                    description = f"Stochastic %K with period {period}"
                elif stoch_type == 'd':
                    description = f"Stochastic %D with period {period}"
                elif stoch_type == 'diff':
                    description = f"Stochastic %K-%D with period {period}"
            elif name.startswith('cci_'):
                period = name.split('_')[1]
                description = f"Commodity Channel Index with period {period}"
            elif name.startswith('roc_'):
                period = name.split('_')[1]
                description = f"Rate of Change with period {period}"
            elif name.startswith('willr_'):
                period = name.split('_')[1]
                description = f"Williams %R with period {period}"
            elif name.startswith('mfi_'):
                period = name.split('_')[1]
                description = f"Money Flow Index with period {period}"
            else:
                description = name.replace('_', ' ').title()

            metadata.append(Feature(
                name=name,
                type=self.feature_type,
                source=self.source,
                description=description
            ))

        return metadata

class VolatilityFeatureExtractor(FeatureExtractor):
    """Extracts volatility features from price data."""

    def __init__(self, timeframes: List[int] = None):
        """
        Initialize the volatility feature extractor.

        Args:
            timeframes: List of timeframes for indicators
        """
        super().__init__("volatility_features", FeatureType.VOLATILITY, DataSource.TECHNICAL)
        self.timeframes = timeframes or [5, 10, 20, 50]

    def extract(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Extract volatility features from OHLCV data.

        Args:
            data: OHLCV DataFrame with columns [open, high, low, close, volume]

        Returns:
            DataFrame with volatility features
        """
        if data.empty:
            return pd.DataFrame()

        # Ensure required columns exist
        required_columns = ['open', 'high', 'low', 'close']
        if not all(col in data.columns for col in required_columns):
            raise ValueError(f"Data must contain columns: {required_columns}")

        # Create result DataFrame
        result = pd.DataFrame(index=data.index)

        # ATR (Average True Range)
        for period in self.timeframes:
            result[f'atr_{period}'] = talib.ATR(
                data['high'].values,
                data['low'].values,
                data['close'].values,
                timeperiod=period
            )
            result[f'atr_pct_{period}'] = result[f'atr_{period}'] / data['close'] * 100

        # Historical Volatility (Standard Deviation of Returns)
        for period in self.timeframes:
            returns = data['close'].pct_change()
            result[f'volatility_{period}'] = returns.rolling(period).std() * np.sqrt(252)  # Annualized

        # Bollinger Band Width
        for period in [20]:
            upper, middle, lower = talib.BBANDS(
                data['close'].values,
                timeperiod=period,
                nbdevup=2,
                nbdevdn=2
            )
            result[f'bbands_width_{period}'] = (upper - lower) / middle

        # High-Low Range
        for period in self.timeframes:
            result[f'range_{period}'] = (data['high'].rolling(period).max() - data['low'].rolling(period).min()) / data['close']

        # Garman-Klass Volatility
        log_hl = np.log(data['high'] / data['low'])**2
        log_co = np.log(data['close'] / data['open'])**2
        for period in self.timeframes:
            result[f'gk_vol_{period}'] = np.sqrt(0.5 * log_hl.rolling(period).mean() - (2*np.log(2)-1) * log_co.rolling(period).mean())

        # Parkinson Volatility
        log_hl = np.log(data['high'] / data['low'])**2
        for period in self.timeframes:
            result[f'park_vol_{period}'] = np.sqrt(log_hl.rolling(period).mean() / (4 * np.log(2)))

        return result

    def get_feature_names(self) -> List[str]:
        """
        Get names of features extracted by this extractor.

        Returns:
            List of feature names
        """
        feature_names = []

        # Add ATR features
        for period in self.timeframes:
            feature_names.extend([
                f'atr_{period}', f'atr_pct_{period}'
            ])

        # Add Historical Volatility features
        for period in self.timeframes:
            feature_names.append(f'volatility_{period}')

        # Add Bollinger Band Width features
        for period in [20]:
            feature_names.append(f'bbands_width_{period}')

        # Add Range features
        for period in self.timeframes:
            feature_names.append(f'range_{period}')

        # Add Garman-Klass Volatility features
        for period in self.timeframes:
            feature_names.append(f'gk_vol_{period}')

        # Add Parkinson Volatility features
        for period in self.timeframes:
            feature_names.append(f'park_vol_{period}')

        return feature_names

    def get_feature_metadata(self) -> List[Feature]:
        """
        Get metadata for features extracted by this extractor.

        Returns:
            List of Feature objects
        """
        feature_names = self.get_feature_names()
        metadata = []

        for name in feature_names:
            if name.startswith('atr_pct_'):
                period = name.split('_')[-1]
                description = f"ATR as percentage of price with period {period}"
            elif name.startswith('atr_'):
                period = name.split('_')[-1]
                description = f"Average True Range with period {period}"
            elif name.startswith('volatility_'):
                period = name.split('_')[-1]
                description = f"Historical Volatility with period {period}"
            elif name.startswith('bbands_width_'):
                period = name.split('_')[-1]
                description = f"Bollinger Bands Width with period {period}"
            elif name.startswith('range_'):
                period = name.split('_')[-1]
                description = f"High-Low Range with period {period}"
            elif name.startswith('gk_vol_'):
                period = name.split('_')[-1]
                description = f"Garman-Klass Volatility with period {period}"
            elif name.startswith('park_vol_'):
                period = name.split('_')[-1]
                description = f"Parkinson Volatility with period {period}"
            else:
                description = name.replace('_', ' ').title()

            metadata.append(Feature(
                name=name,
                type=self.feature_type,
                source=self.source,
                description=description
            ))

        return metadata