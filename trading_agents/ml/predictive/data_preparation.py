"""
Data preparation for predictive models.

This module provides functions for preparing data for predictive models.
"""
import logging
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple, Union
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split

from trading_agents.ml.common.data_types import (
    TimeFrame, PredictionTarget, PredictionHorizon, DatasetMetadata
)
from trading_agents.ml.common.feature_engineering import (
    PriceFeatureExtractor, VolumeFeatureExtractor, 
    MomentumFeatureExtractor, VolatilityFeatureExtractor
)

logger = logging.getLogger(__name__)

class DataPreparer:
    """Prepares data for predictive models."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the data preparer.
        
        Args:
            config: Configuration
        """
        self.config = config
        
        # Feature extractors
        self.feature_extractors = [
            PriceFeatureExtractor(),
            VolumeFeatureExtractor(),
            MomentumFeatureExtractor(),
            VolatilityFeatureExtractor()
        ]
        
        # Target configuration
        self.target = config.get("target", PredictionTarget.PRICE_DIRECTION)
        self.horizon = config.get("horizon", PredictionHorizon.HOUR_1)
        
        # Dataset configuration
        self.test_size = config.get("test_size", 0.2)
        self.validation_size = config.get("validation_size", 0.2)
        self.random_state = config.get("random_state", 42)
        
    def prepare_data(self, data: pd.DataFrame) -> Tuple[Dict[str, pd.DataFrame], DatasetMetadata]:
        """
        Prepare data for model training and evaluation.
        
        Args:
            data: OHLCV DataFrame with columns [timestamp, open, high, low, close, volume]
            
        Returns:
            Dictionary with train, validation, and test DataFrames, and dataset metadata
        """
        # Ensure data is sorted by timestamp
        data = data.sort_index()
        
        # Extract features
        features = self._extract_features(data)
        
        # Create target
        target = self._create_target(data)
        
        # Combine features and target
        dataset = pd.concat([features, target], axis=1)
        
        # Remove rows with NaN values
        dataset = dataset.dropna()
        
        # Split data
        train_data, test_data = train_test_split(
            dataset, 
            test_size=self.test_size,
            random_state=self.random_state,
            shuffle=False  # Time series data should not be shuffled
        )
        
        train_data, val_data = train_test_split(
            train_data,
            test_size=self.validation_size / (1 - self.test_size),
            random_state=self.random_state,
            shuffle=False  # Time series data should not be shuffled
        )
        
        # Create dataset metadata
        metadata = self._create_dataset_metadata(dataset, features.columns.tolist())
        
        # Return data splits
        return {
            "train": train_data,
            "validation": val_data,
            "test": test_data,
            "features": features.columns.tolist(),
            "target": target.name
        }, metadata
        
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
            
        return features
        
    def _create_target(self, data: pd.DataFrame) -> pd.Series:
        """
        Create target variable.
        
        Args:
            data: OHLCV DataFrame
            
        Returns:
            Target series
        """
        # Get horizon in minutes
        horizon_minutes = self._get_horizon_minutes()
        
        if self.target == PredictionTarget.PRICE_DIRECTION:
            # Future price direction (up/down)
            future_price = data['close'].shift(-horizon_minutes)
            target = (future_price > data['close']).astype(int)
            target.name = 'price_direction'
            
        elif self.target == PredictionTarget.PRICE_CHANGE:
            # Future price change percentage
            future_price = data['close'].shift(-horizon_minutes)
            target = (future_price - data['close']) / data['close'] * 100
            target.name = 'price_change_pct'
            
        elif self.target == PredictionTarget.PRICE_VALUE:
            # Future price value
            target = data['close'].shift(-horizon_minutes)
            target.name = 'future_price'
            
        elif self.target == PredictionTarget.VOLATILITY:
            # Future volatility
            future_returns = data['close'].pct_change().shift(-horizon_minutes)
            target = future_returns.rolling(horizon_minutes).std() * np.sqrt(252 * 1440 / horizon_minutes)  # Annualized
            target.name = 'future_volatility'
            
        elif self.target == PredictionTarget.TREND:
            # Future trend (up/down/sideways)
            future_price = data['close'].shift(-horizon_minutes)
            price_change_pct = (future_price - data['close']) / data['close'] * 100
            
            # Define thresholds for trend classification
            threshold = 0.5  # 0.5% change threshold
            
            # Classify trend
            target = pd.Series(index=data.index, dtype='int')
            target[price_change_pct > threshold] = 1  # Up trend
            target[price_change_pct < -threshold] = -1  # Down trend
            target[(price_change_pct >= -threshold) & (price_change_pct <= threshold)] = 0  # Sideways
            target.name = 'future_trend'
            
        else:
            raise ValueError(f"Unsupported target: {self.target}")
            
        return target
        
    def _get_horizon_minutes(self) -> int:
        """
        Get horizon in minutes.
        
        Returns:
            Horizon in minutes
        """
        if self.horizon == PredictionHorizon.MINUTE_5:
            return 5
        elif self.horizon == PredictionHorizon.MINUTE_15:
            return 15
        elif self.horizon == PredictionHorizon.MINUTE_30:
            return 30
        elif self.horizon == PredictionHorizon.HOUR_1:
            return 60
        elif self.horizon == PredictionHorizon.HOUR_4:
            return 240
        elif self.horizon == PredictionHorizon.HOUR_12:
            return 720
        elif self.horizon == PredictionHorizon.DAY_1:
            return 1440
        elif self.horizon == PredictionHorizon.DAY_3:
            return 4320
        elif self.horizon == PredictionHorizon.WEEK_1:
            return 10080
        else:
            raise ValueError(f"Unsupported horizon: {self.horizon}")
            
    def _create_dataset_metadata(self, dataset: pd.DataFrame, features: List[str]) -> DatasetMetadata:
        """
        Create dataset metadata.
        
        Args:
            dataset: Dataset DataFrame
            features: List of feature names
            
        Returns:
            DatasetMetadata object
        """
        return DatasetMetadata(
            dataset_id=f"dataset_{int(datetime.now().timestamp())}",
            symbols=[self.config.get("symbol", "unknown")],
            timeframe=TimeFrame.MINUTE_1,  # Assuming 1-minute data
            start_date=dataset.index[0],
            end_date=dataset.index[-1],
            features=[],  # Feature metadata would be added here
            target=self.target,
            num_samples=len(dataset),
            created_at=datetime.now()
        )
