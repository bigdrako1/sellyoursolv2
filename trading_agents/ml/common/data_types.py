"""
Common data types for machine learning components.

This module defines common data types and structures used across
machine learning components.
"""
from enum import Enum
from typing import Dict, List, Any, Optional, Tuple, Union, NamedTuple
from datetime import datetime
import numpy as np
import pandas as pd

class DataSource(Enum):
    """Data source types."""
    MARKET = "market"
    ORDERBOOK = "orderbook"
    TRADES = "trades"
    SENTIMENT = "sentiment"
    ONCHAIN = "onchain"
    FUNDAMENTAL = "fundamental"
    ALTERNATIVE = "alternative"
    TECHNICAL = "technical"
    CUSTOM = "custom"

class FeatureType(Enum):
    """Feature types."""
    PRICE = "price"
    VOLUME = "volume"
    VOLATILITY = "volatility"
    MOMENTUM = "momentum"
    TREND = "trend"
    SENTIMENT = "sentiment"
    ONCHAIN = "onchain"
    LIQUIDITY = "liquidity"
    CORRELATION = "correlation"
    CUSTOM = "custom"

class TimeFrame(Enum):
    """Time frames for data aggregation."""
    MINUTE_1 = "1m"
    MINUTE_5 = "5m"
    MINUTE_15 = "15m"
    MINUTE_30 = "30m"
    HOUR_1 = "1h"
    HOUR_4 = "4h"
    HOUR_12 = "12h"
    DAY_1 = "1d"
    DAY_3 = "3d"
    WEEK_1 = "1w"
    MONTH_1 = "1M"

class PredictionTarget(Enum):
    """Prediction target types."""
    PRICE_DIRECTION = "price_direction"
    PRICE_VALUE = "price_value"
    PRICE_CHANGE = "price_change"
    VOLATILITY = "volatility"
    TREND = "trend"
    REGIME = "regime"
    CUSTOM = "custom"

class PredictionHorizon(Enum):
    """Prediction time horizons."""
    MINUTE_5 = "5m"
    MINUTE_15 = "15m"
    MINUTE_30 = "30m"
    HOUR_1 = "1h"
    HOUR_4 = "4h"
    HOUR_12 = "12h"
    DAY_1 = "1d"
    DAY_3 = "3d"
    WEEK_1 = "1w"

class ModelType(Enum):
    """Model types."""
    LINEAR = "linear"
    TREE = "tree"
    ENSEMBLE = "ensemble"
    NEURAL_NETWORK = "neural_network"
    DEEP_LEARNING = "deep_learning"
    REINFORCEMENT = "reinforcement"
    CUSTOM = "custom"

class Feature(NamedTuple):
    """Feature definition."""
    name: str
    type: FeatureType
    source: DataSource
    description: str
    timeframe: Optional[TimeFrame] = None
    parameters: Optional[Dict[str, Any]] = None

class DataPoint(NamedTuple):
    """Data point for model training and inference."""
    timestamp: datetime
    symbol: str
    features: Dict[str, float]
    target: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

class PredictionResult(NamedTuple):
    """Prediction result."""
    timestamp: datetime
    symbol: str
    target: PredictionTarget
    horizon: PredictionHorizon
    value: float
    confidence: float
    model_id: str
    features_used: List[str]
    metadata: Optional[Dict[str, Any]] = None

class ModelMetadata(NamedTuple):
    """Model metadata."""
    model_id: str
    model_type: ModelType
    target: PredictionTarget
    horizon: PredictionHorizon
    features: List[Feature]
    created_at: datetime
    updated_at: datetime
    version: str
    performance: Dict[str, float]
    parameters: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None

class DatasetMetadata(NamedTuple):
    """Dataset metadata."""
    dataset_id: str
    symbols: List[str]
    timeframe: TimeFrame
    start_date: datetime
    end_date: datetime
    features: List[Feature]
    target: Optional[PredictionTarget] = None
    num_samples: int
    created_at: datetime
    metadata: Optional[Dict[str, Any]] = None

class TrainingJob(NamedTuple):
    """Training job definition."""
    job_id: str
    model_type: ModelType
    dataset_id: str
    target: PredictionTarget
    horizon: PredictionHorizon
    parameters: Dict[str, Any]
    status: str
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    model_id: Optional[str] = None
    performance: Optional[Dict[str, float]] = None
    metadata: Optional[Dict[str, Any]] = None

class EvaluationResult(NamedTuple):
    """Model evaluation result."""
    model_id: str
    dataset_id: str
    metrics: Dict[str, float]
    confusion_matrix: Optional[np.ndarray] = None
    roc_curve: Optional[List[Tuple[float, float]]] = None
    feature_importance: Optional[Dict[str, float]] = None
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None
