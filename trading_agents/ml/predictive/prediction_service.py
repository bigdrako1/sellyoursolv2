"""
Prediction service for making predictions with trained models.

This module provides a service for making predictions with trained models.
"""
import logging
import os
import json
import time
from typing import Dict, List, Any, Optional, Tuple, Union
from datetime import datetime
import pandas as pd
import numpy as np

from trading_agents.ml.predictive.base_model import BaseModel
from trading_agents.ml.predictive.model_factory import ModelFactory
from trading_agents.ml.predictive.data_preparation import DataPreparer
from trading_agents.ml.common.data_types import (
    PredictionTarget, PredictionHorizon, PredictionResult
)

logger = logging.getLogger(__name__)

class PredictionService:
    """Service for making predictions with trained models."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the prediction service.
        
        Args:
            config: Service configuration
        """
        self.config = config
        
        # Model directory
        self.model_dir = config.get("model_dir", "models")
        os.makedirs(self.model_dir, exist_ok=True)
        
        # Loaded models
        self.models: Dict[str, BaseModel] = {}
        
        # Data preparer
        self.data_preparer = DataPreparer(config)
        
        # Cache for predictions
        self.prediction_cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl = config.get("cache_ttl", 300)  # 5 minutes
        
    def load_model(self, model_id: str) -> BaseModel:
        """
        Load a model by ID.
        
        Args:
            model_id: Model ID
            
        Returns:
            Loaded model
        """
        # Check if model is already loaded
        if model_id in self.models:
            return self.models[model_id]
            
        # Load model from disk
        model_path = os.path.join(self.model_dir, f"{model_id}.pkl")
        if not os.path.exists(model_path):
            raise ValueError(f"Model not found: {model_id}")
            
        model = ModelFactory.load_model(model_path)
        
        # Cache model
        self.models[model_id] = model
        
        logger.info(f"Loaded model: {model_id}")
        
        return model
        
    def unload_model(self, model_id: str):
        """
        Unload a model from memory.
        
        Args:
            model_id: Model ID
        """
        if model_id in self.models:
            del self.models[model_id]
            logger.info(f"Unloaded model: {model_id}")
            
    def get_loaded_models(self) -> List[str]:
        """
        Get IDs of loaded models.
        
        Returns:
            List of model IDs
        """
        return list(self.models.keys())
        
    def predict(self, model_id: str, data: pd.DataFrame, symbol: str) -> PredictionResult:
        """
        Make a prediction with a model.
        
        Args:
            model_id: Model ID
            data: OHLCV DataFrame
            symbol: Trading symbol
            
        Returns:
            Prediction result
        """
        # Check cache
        cache_key = f"{model_id}_{symbol}_{data.index[-1].timestamp()}"
        if cache_key in self.prediction_cache:
            cache_entry = self.prediction_cache[cache_key]
            if time.time() - cache_entry["timestamp"] < self.cache_ttl:
                logger.debug(f"Using cached prediction for {model_id} on {symbol}")
                return cache_entry["prediction"]
                
        # Load model
        model = self.load_model(model_id)
        
        # Extract features
        features = self.data_preparer._extract_features(data)
        
        # Make prediction
        if hasattr(model, "predict_with_confidence"):
            # Regression model with confidence
            predictions, confidence = model.predict_with_confidence(features)
            prediction_value = float(predictions[-1])
            confidence_value = float(confidence[-1])
        elif hasattr(model, "predict_proba"):
            # Classification model with probabilities
            predictions = model.predict(features)
            probabilities = model.predict_proba(features)
            prediction_value = float(predictions[-1])
            
            # Get confidence from probability of predicted class
            if len(probabilities[-1]) == 2:
                # Binary classification
                confidence_value = float(probabilities[-1][int(prediction_value)])
            else:
                # Multi-class classification
                confidence_value = float(probabilities[-1][int(prediction_value)])
        else:
            # Basic prediction without confidence
            predictions = model.predict(features)
            prediction_value = float(predictions[-1])
            confidence_value = 0.5  # Default confidence
            
        # Create prediction result
        result = model.create_prediction(
            timestamp=data.index[-1],
            symbol=symbol,
            value=prediction_value,
            confidence=confidence_value
        )
        
        # Cache prediction
        self.prediction_cache[cache_key] = {
            "prediction": result,
            "timestamp": time.time()
        }
        
        # Clean old cache entries
        self._clean_cache()
        
        return result
        
    def _clean_cache(self):
        """Clean expired cache entries."""
        current_time = time.time()
        expired_keys = [
            key for key, entry in self.prediction_cache.items()
            if current_time - entry["timestamp"] > self.cache_ttl
        ]
        
        for key in expired_keys:
            del self.prediction_cache[key]
            
    def batch_predict(self, model_id: str, data_dict: Dict[str, pd.DataFrame]) -> Dict[str, PredictionResult]:
        """
        Make predictions for multiple symbols.
        
        Args:
            model_id: Model ID
            data_dict: Dictionary mapping symbols to OHLCV DataFrames
            
        Returns:
            Dictionary mapping symbols to prediction results
        """
        results = {}
        
        for symbol, data in data_dict.items():
            try:
                results[symbol] = self.predict(model_id, data, symbol)
            except Exception as e:
                logger.error(f"Error predicting for {symbol}: {str(e)}")
                
        return results
        
    def get_available_models(self) -> List[Dict[str, Any]]:
        """
        Get information about available models.
        
        Returns:
            List of model information dictionaries
        """
        models = []
        
        # Scan model directory
        for filename in os.listdir(self.model_dir):
            if filename.endswith("_metadata.json"):
                try:
                    # Load metadata
                    with open(os.path.join(self.model_dir, filename), "r") as f:
                        metadata = json.load(f)
                        
                    models.append(metadata)
                except Exception as e:
                    logger.error(f"Error loading model metadata {filename}: {str(e)}")
                    
        return models
