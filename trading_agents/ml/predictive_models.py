"""
Predictive models module for machine learning.

This module provides predictive models for machine learning,
including price prediction, trend prediction, and volatility
prediction.
"""
import logging
from typing import Dict, Any, Optional, List, Union, Tuple
import math
import numpy as np
from datetime import datetime, timedelta
import os
import pickle
import json

from .feature_engineering import FeatureEngineering

logger = logging.getLogger(__name__)

class PredictiveModel:
    """
    Base class for predictive models.
    
    This class provides a base for predictive models with
    common methods for training, prediction, and evaluation.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the predictive model.
        
        Args:
            config: Model configuration
        """
        self.config = config or {}
        self.model = None
        self.feature_engineering = FeatureEngineering()
        self.model_type = "base"
        self.model_name = self.config.get("model_name", "base_model")
        self.trained = False
        
    def train(
        self,
        features: Dict[str, List[float]],
        target: List[float],
        **kwargs
    ) -> Dict[str, Any]:
        """
        Train the model.
        
        Args:
            features: Feature dictionary
            target: Target values
            **kwargs: Additional training parameters
            
        Returns:
            Training metrics
        """
        raise NotImplementedError("Subclasses must implement train method")
        
    def predict(
        self,
        features: Dict[str, List[float]],
        **kwargs
    ) -> List[float]:
        """
        Make predictions.
        
        Args:
            features: Feature dictionary
            **kwargs: Additional prediction parameters
            
        Returns:
            Predictions
        """
        raise NotImplementedError("Subclasses must implement predict method")
        
    def evaluate(
        self,
        features: Dict[str, List[float]],
        target: List[float],
        **kwargs
    ) -> Dict[str, Any]:
        """
        Evaluate the model.
        
        Args:
            features: Feature dictionary
            target: Target values
            **kwargs: Additional evaluation parameters
            
        Returns:
            Evaluation metrics
        """
        raise NotImplementedError("Subclasses must implement evaluate method")
        
    def save(self, path: str) -> bool:
        """
        Save the model.
        
        Args:
            path: Path to save the model
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(path), exist_ok=True)
            
            # Save model
            with open(path, "wb") as f:
                pickle.dump(self.model, f)
                
            # Save metadata
            metadata = {
                "model_type": self.model_type,
                "model_name": self.model_name,
                "trained": self.trained,
                "config": self.config,
                "created_at": datetime.now().isoformat()
            }
            
            with open(f"{path}.json", "w") as f:
                json.dump(metadata, f)
                
            logger.info(f"Model saved to {path}")
            return True
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            return False
            
    def load(self, path: str) -> bool:
        """
        Load the model.
        
        Args:
            path: Path to load the model from
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Load model
            with open(path, "rb") as f:
                self.model = pickle.load(f)
                
            # Load metadata
            try:
                with open(f"{path}.json", "r") as f:
                    metadata = json.load(f)
                    
                self.model_type = metadata.get("model_type", self.model_type)
                self.model_name = metadata.get("model_name", self.model_name)
                self.trained = metadata.get("trained", False)
                self.config.update(metadata.get("config", {}))
            except Exception as e:
                logger.warning(f"Error loading model metadata: {str(e)}")
                
            logger.info(f"Model loaded from {path}")
            return True
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            return False


class LinearRegressionModel(PredictiveModel):
    """
    Linear regression model for price prediction.
    
    This class provides a linear regression model for
    predicting prices based on features.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the linear regression model.
        
        Args:
            config: Model configuration
        """
        super().__init__(config)
        self.model_type = "linear_regression"
        self.model_name = self.config.get("model_name", "linear_regression_model")
        
    def train(
        self,
        features: Dict[str, List[float]],
        target: List[float],
        **kwargs
    ) -> Dict[str, Any]:
        """
        Train the linear regression model.
        
        Args:
            features: Feature dictionary
            target: Target values
            **kwargs: Additional training parameters
            
        Returns:
            Training metrics
        """
        try:
            # Prepare features and target
            X, y = self._prepare_data(features, target)
            
            if len(X) == 0 or len(y) == 0:
                logger.error("No valid data for training")
                return {"error": "No valid data for training"}
                
            # Train model
            self.model = self._train_linear_regression(X, y)
            self.trained = True
            
            # Calculate training metrics
            y_pred = self._predict_linear_regression(X)
            metrics = self._calculate_metrics(y, y_pred)
            
            logger.info(f"Linear regression model trained: {metrics}")
            return metrics
        except Exception as e:
            logger.error(f"Error training linear regression model: {str(e)}")
            return {"error": str(e)}
            
    def predict(
        self,
        features: Dict[str, List[float]],
        **kwargs
    ) -> List[float]:
        """
        Make predictions with the linear regression model.
        
        Args:
            features: Feature dictionary
            **kwargs: Additional prediction parameters
            
        Returns:
            Predictions
        """
        try:
            if not self.trained or self.model is None:
                logger.error("Model not trained")
                return [np.nan] * len(next(iter(features.values())))
                
            # Prepare features
            X, _ = self._prepare_data(features, [])
            
            if len(X) == 0:
                logger.error("No valid data for prediction")
                return [np.nan] * len(next(iter(features.values())))
                
            # Make predictions
            predictions = self._predict_linear_regression(X)
            
            # Pad with NaNs for missing values
            full_predictions = [np.nan] * len(next(iter(features.values())))
            valid_indices = self._get_valid_indices(features)
            
            for i, idx in enumerate(valid_indices):
                full_predictions[idx] = predictions[i]
                
            return full_predictions
        except Exception as e:
            logger.error(f"Error making predictions: {str(e)}")
            return [np.nan] * len(next(iter(features.values())))
            
    def evaluate(
        self,
        features: Dict[str, List[float]],
        target: List[float],
        **kwargs
    ) -> Dict[str, Any]:
        """
        Evaluate the linear regression model.
        
        Args:
            features: Feature dictionary
            target: Target values
            **kwargs: Additional evaluation parameters
            
        Returns:
            Evaluation metrics
        """
        try:
            if not self.trained or self.model is None:
                logger.error("Model not trained")
                return {"error": "Model not trained"}
                
            # Prepare features and target
            X, y = self._prepare_data(features, target)
            
            if len(X) == 0 or len(y) == 0:
                logger.error("No valid data for evaluation")
                return {"error": "No valid data for evaluation"}
                
            # Make predictions
            y_pred = self._predict_linear_regression(X)
            
            # Calculate metrics
            metrics = self._calculate_metrics(y, y_pred)
            
            logger.info(f"Linear regression model evaluated: {metrics}")
            return metrics
        except Exception as e:
            logger.error(f"Error evaluating model: {str(e)}")
            return {"error": str(e)}
            
    def _prepare_data(
        self,
        features: Dict[str, List[float]],
        target: List[float]
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare data for training or prediction.
        
        Args:
            features: Feature dictionary
            target: Target values
            
        Returns:
            Tuple of (X, y)
        """
        # Get feature names
        feature_names = self.config.get("feature_names", list(features.keys()))
        
        # Filter out unsupported features
        feature_names = [f for f in feature_names if f in features]
        
        if not feature_names:
            logger.error("No valid features found")
            return np.array([]), np.array([])
            
        # Get valid indices (non-NaN values)
        valid_indices = self._get_valid_indices(features, feature_names)
        
        if not valid_indices:
            logger.error("No valid data points found")
            return np.array([]), np.array([])
            
        # Prepare feature matrix
        X = np.array([[features[f][i] for f in feature_names] for i in valid_indices])
        
        # Prepare target vector if provided
        y = np.array([])
        if target:
            y = np.array([target[i] for i in valid_indices])
            
        return X, y
        
    def _get_valid_indices(
        self,
        features: Dict[str, List[float]],
        feature_names: List[str] = None
    ) -> List[int]:
        """
        Get indices of valid data points.
        
        Args:
            features: Feature dictionary
            feature_names: Feature names to check
            
        Returns:
            List of valid indices
        """
        if not feature_names:
            feature_names = self.config.get("feature_names", list(features.keys()))
            
        # Filter out unsupported features
        feature_names = [f for f in feature_names if f in features]
        
        if not feature_names:
            return []
            
        # Get length of features
        n = len(features[feature_names[0]])
        
        # Find valid indices
        valid_indices = []
        for i in range(n):
            if all(i < len(features[f]) and not np.isnan(features[f][i]) for f in feature_names):
                valid_indices.append(i)
                
        return valid_indices
        
    def _train_linear_regression(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """
        Train linear regression model.
        
        Args:
            X: Feature matrix
            y: Target vector
            
        Returns:
            Trained model parameters
        """
        # Add bias term
        X_bias = np.column_stack((np.ones(X.shape[0]), X))
        
        # Calculate coefficients using normal equation
        coeffs = np.linalg.pinv(X_bias.T @ X_bias) @ X_bias.T @ y
        
        # Return model parameters
        return {
            "intercept": coeffs[0],
            "coefficients": coeffs[1:]
        }
        
    def _predict_linear_regression(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions with linear regression model.
        
        Args:
            X: Feature matrix
            
        Returns:
            Predictions
        """
        # Add bias term
        X_bias = np.column_stack((np.ones(X.shape[0]), X))
        
        # Make predictions
        intercept = self.model["intercept"]
        coefficients = self.model["coefficients"]
        
        return X_bias @ np.concatenate(([intercept], coefficients))
        
    def _calculate_metrics(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """
        Calculate evaluation metrics.
        
        Args:
            y_true: True values
            y_pred: Predicted values
            
        Returns:
            Evaluation metrics
        """
        # Calculate MSE
        mse = np.mean((y_true - y_pred) ** 2)
        
        # Calculate RMSE
        rmse = np.sqrt(mse)
        
        # Calculate MAE
        mae = np.mean(np.abs(y_true - y_pred))
        
        # Calculate R-squared
        y_mean = np.mean(y_true)
        ss_total = np.sum((y_true - y_mean) ** 2)
        ss_residual = np.sum((y_true - y_pred) ** 2)
        r_squared = 1 - (ss_residual / ss_total) if ss_total != 0 else 0
        
        return {
            "mse": float(mse),
            "rmse": float(rmse),
            "mae": float(mae),
            "r_squared": float(r_squared)
        }
