"""
Base classes for predictive models.

This module provides base classes for predictive models used in the trading system.
"""
import logging
import os
import json
import pickle
import time
from typing import Dict, List, Any, Optional, Tuple, Union, Callable
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_squared_error, mean_absolute_error, r2_score
)

from trading_agents.ml.common.data_types import (
    PredictionTarget, PredictionHorizon, ModelType, ModelMetadata,
    Feature, PredictionResult
)
from trading_agents.ml.common.feature_pipeline import FeaturePipeline

logger = logging.getLogger(__name__)

class BaseModel:
    """Base class for all predictive models."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the base model.

        Args:
            config: Model configuration
        """
        self.config = config

        # Model metadata
        self.model_id = config.get("model_id", f"model_{int(time.time())}")
        self.model_type = config.get("model_type", ModelType.CUSTOM)
        self.target = config.get("target", PredictionTarget.PRICE_DIRECTION)
        self.horizon = config.get("horizon", PredictionHorizon.HOUR_1)
        self.version = config.get("version", "0.1.0")

        # Model storage
        self.model_dir = config.get("model_dir", "models")
        os.makedirs(self.model_dir, exist_ok=True)

        # Feature pipeline
        self.feature_pipeline = FeaturePipeline(config.get("feature_pipeline", {}))

        # Model state
        self.model = None
        self.features = []
        self.selected_features = []
        self.performance = {}
        self.is_fitted = False
        self.created_at = datetime.now()
        self.updated_at = datetime.now()

    def fit(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, float]:
        """
        Fit the model to data.

        Args:
            X: Feature DataFrame
            y: Target series

        Returns:
            Dictionary of performance metrics
        """
        raise NotImplementedError("Subclasses must implement this method")

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions with the model.

        Args:
            X: Feature DataFrame

        Returns:
            Array of predictions
        """
        raise NotImplementedError("Subclasses must implement this method")

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make probability predictions with the model.

        Args:
            X: Feature DataFrame

        Returns:
            Array of probability predictions
        """
        raise NotImplementedError("Subclasses must implement this method")

    def evaluate(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, float]:
        """
        Evaluate the model on data.

        Args:
            X: Feature DataFrame
            y: Target series

        Returns:
            Dictionary of performance metrics
        """
        raise NotImplementedError("Subclasses must implement this method")

    def save(self, path: Optional[str] = None) -> str:
        """
        Save the model to disk.

        Args:
            path: Path to save the model (optional)

        Returns:
            Path where the model was saved
        """
        if path is None:
            path = os.path.join(self.model_dir, f"{self.model_id}.pkl")

        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(path), exist_ok=True)

        # Save model
        with open(path, "wb") as f:
            pickle.dump(self, f)

        # Save metadata
        metadata_path = os.path.join(os.path.dirname(path), f"{self.model_id}_metadata.json")
        with open(metadata_path, "w") as f:
            json.dump(self.get_metadata().asdict(), f, indent=2, default=str)

        logger.info(f"Saved model to {path}")

        return path

    @classmethod
    def load(cls, path: str) -> 'BaseModel':
        """
        Load a model from disk.

        Args:
            path: Path to load the model from

        Returns:
            Loaded model
        """
        with open(path, "rb") as f:
            model = pickle.load(f)

        logger.info(f"Loaded model from {path}")

        return model

    def get_metadata(self) -> ModelMetadata:
        """
        Get model metadata.

        Returns:
            ModelMetadata object
        """
        return ModelMetadata(
            model_id=self.model_id,
            model_type=self.model_type,
            target=self.target,
            horizon=self.horizon,
            features=self.features,
            created_at=self.created_at,
            updated_at=self.updated_at,
            version=self.version,
            performance=self.performance,
            parameters=self.config
        )

    def create_prediction(self, timestamp: datetime, symbol: str, value: float, confidence: float) -> PredictionResult:
        """
        Create a prediction result.

        Args:
            timestamp: Prediction timestamp
            symbol: Trading symbol
            value: Predicted value
            confidence: Prediction confidence

        Returns:
            PredictionResult object
        """
        return PredictionResult(
            timestamp=timestamp,
            symbol=symbol,
            target=self.target,
            horizon=self.horizon,
            value=value,
            confidence=confidence,
            model_id=self.model_id,
            features_used=self.selected_features
        )

class ClassificationModel(BaseModel):
    """Base class for classification models."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the classification model.

        Args:
            config: Model configuration
        """
        super().__init__(config)

    def fit(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, float]:
        """
        Fit the model to data.

        Args:
            X: Feature DataFrame
            y: Target series

        Returns:
            Dictionary of performance metrics
        """
        # Store feature metadata
        self.features = [
            Feature(
                name=column,
                type=None,
                source=None,
                description=column
            )
            for column in X.columns
        ]

        # Preprocess data
        X_processed, self.selected_features = self.feature_pipeline.fit_transform(X, y)

        # Fit model
        self._fit_model(X_processed, y)

        # Evaluate model
        self.performance = self.evaluate(X, y)

        # Update state
        self.is_fitted = True
        self.updated_at = datetime.now()

        return self.performance

    def _fit_model(self, X: pd.DataFrame, y: pd.Series):
        """
        Fit the underlying model.

        Args:
            X: Processed feature DataFrame
            y: Target series
        """
        raise NotImplementedError("Subclasses must implement this method")

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions with the model.

        Args:
            X: Feature DataFrame

        Returns:
            Array of predictions
        """
        if not self.is_fitted:
            raise ValueError("Model is not fitted")

        # Preprocess data
        X_processed = self.feature_pipeline.transform(X, self.selected_features)

        # Make predictions
        return self._predict(X_processed)

    def _predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions with the underlying model.

        Args:
            X: Processed feature DataFrame

        Returns:
            Array of predictions
        """
        raise NotImplementedError("Subclasses must implement this method")

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make probability predictions with the model.

        Args:
            X: Feature DataFrame

        Returns:
            Array of probability predictions
        """
        if not self.is_fitted:
            raise ValueError("Model is not fitted")

        # Preprocess data
        X_processed = self.feature_pipeline.transform(X, self.selected_features)

        # Make predictions
        return self._predict_proba(X_processed)

    def _predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make probability predictions with the underlying model.

        Args:
            X: Processed feature DataFrame

        Returns:
            Array of probability predictions
        """
        raise NotImplementedError("Subclasses must implement this method")

    def evaluate(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, float]:
        """
        Evaluate the model on data.

        Args:
            X: Feature DataFrame
            y: Target series

        Returns:
            Dictionary of performance metrics
        """
        if not self.is_fitted:
            raise ValueError("Model is not fitted")

        # Make predictions
        y_pred = self.predict(X)

        # Calculate metrics
        metrics = {
            "accuracy": accuracy_score(y, y_pred),
            "precision": precision_score(y, y_pred, average="weighted"),
            "recall": recall_score(y, y_pred, average="weighted"),
            "f1": f1_score(y, y_pred, average="weighted")
        }

        return metrics

class RegressionModel(BaseModel):
    """Base class for regression models."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the regression model.

        Args:
            config: Model configuration
        """
        super().__init__(config)

    def fit(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, float]:
        """
        Fit the model to data.

        Args:
            X: Feature DataFrame
            y: Target series

        Returns:
            Dictionary of performance metrics
        """
        # Store feature metadata
        self.features = [
            Feature(
                name=column,
                type=None,
                source=None,
                description=column
            )
            for column in X.columns
        ]

        # Preprocess data
        X_processed, self.selected_features = self.feature_pipeline.fit_transform(X, y)

        # Fit model
        self._fit_model(X_processed, y)

        # Evaluate model
        self.performance = self.evaluate(X, y)

        # Update state
        self.is_fitted = True
        self.updated_at = datetime.now()

        return self.performance

    def _fit_model(self, X: pd.DataFrame, y: pd.Series):
        """
        Fit the underlying model.

        Args:
            X: Processed feature DataFrame
            y: Target series
        """
        raise NotImplementedError("Subclasses must implement this method")

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions with the model.

        Args:
            X: Feature DataFrame

        Returns:
            Array of predictions
        """
        if not self.is_fitted:
            raise ValueError("Model is not fitted")

        # Preprocess data
        X_processed = self.feature_pipeline.transform(X, self.selected_features)

        # Make predictions
        return self._predict(X_processed)

    def _predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions with the underlying model.

        Args:
            X: Processed feature DataFrame

        Returns:
            Array of predictions
        """
        raise NotImplementedError("Subclasses must implement this method")

    def predict_with_confidence(self, X: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Make predictions with confidence intervals.

        Args:
            X: Feature DataFrame

        Returns:
            Tuple of (predictions, confidence)
        """
        if not self.is_fitted:
            raise ValueError("Model is not fitted")

        # Preprocess data
        X_processed = self.feature_pipeline.transform(X, self.selected_features)

        # Make predictions
        return self._predict_with_confidence(X_processed)

    def _predict_with_confidence(self, X: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Make predictions with confidence intervals using the underlying model.

        Args:
            X: Processed feature DataFrame

        Returns:
            Tuple of (predictions, confidence)
        """
        # Default implementation - override in subclasses
        predictions = self._predict(X)
        confidence = np.ones_like(predictions) * 0.5  # Default confidence

        return predictions, confidence

    def evaluate(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, float]:
        """
        Evaluate the model on data.

        Args:
            X: Feature DataFrame
            y: Target series

        Returns:
            Dictionary of performance metrics
        """
        if not self.is_fitted:
            raise ValueError("Model is not fitted")

        # Make predictions
        y_pred = self.predict(X)

        # Calculate metrics
        metrics = {
            "mse": mean_squared_error(y, y_pred),
            "rmse": np.sqrt(mean_squared_error(y, y_pred)),
            "mae": mean_absolute_error(y, y_pred),
            "r2": r2_score(y, y_pred)
        }

        return metrics
