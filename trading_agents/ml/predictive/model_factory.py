"""
Model factory for creating predictive models.

This module provides a factory for creating predictive models based on configuration.
"""
import logging
from typing import Dict, Any, Optional, Type

from trading_agents.ml.predictive.base_model import BaseModel, ClassificationModel, RegressionModel
from trading_agents.ml.predictive.models import (
    LogisticRegressionModel,
    RandomForestClassifierModel,
    GradientBoostingClassifierModel,
    RidgeRegressionModel,
    RandomForestRegressorModel,
    GradientBoostingRegressorModel
)
from trading_agents.ml.common.data_types import PredictionTarget, ModelType

logger = logging.getLogger(__name__)

class ModelFactory:
    """Factory for creating predictive models."""
    
    # Registry of available classification models
    CLASSIFICATION_MODELS = {
        "logistic_regression": LogisticRegressionModel,
        "random_forest": RandomForestClassifierModel,
        "gradient_boosting": GradientBoostingClassifierModel
    }
    
    # Registry of available regression models
    REGRESSION_MODELS = {
        "ridge_regression": RidgeRegressionModel,
        "random_forest": RandomForestRegressorModel,
        "gradient_boosting": GradientBoostingRegressorModel
    }
    
    @classmethod
    def create_model(cls, config: Dict[str, Any]) -> BaseModel:
        """
        Create a model based on configuration.
        
        Args:
            config: Model configuration
            
        Returns:
            Created model
        """
        # Get model type
        model_name = config.get("model_name", "random_forest")
        
        # Get prediction target
        target = config.get("target", PredictionTarget.PRICE_DIRECTION)
        
        # Determine if classification or regression
        is_classification = cls._is_classification_target(target)
        
        # Create model
        if is_classification:
            model_class = cls.CLASSIFICATION_MODELS.get(model_name)
            if model_class is None:
                logger.warning(f"Unknown classification model: {model_name}, using random_forest")
                model_class = RandomForestClassifierModel
        else:
            model_class = cls.REGRESSION_MODELS.get(model_name)
            if model_class is None:
                logger.warning(f"Unknown regression model: {model_name}, using random_forest")
                model_class = RandomForestRegressorModel
                
        # Create model instance
        model = model_class(config)
        
        logger.info(f"Created {model_name} model for target {target}")
        
        return model
        
    @classmethod
    def _is_classification_target(cls, target: PredictionTarget) -> bool:
        """
        Determine if a prediction target is classification or regression.
        
        Args:
            target: Prediction target
            
        Returns:
            True if classification, False if regression
        """
        classification_targets = [
            PredictionTarget.PRICE_DIRECTION,
            PredictionTarget.TREND,
            PredictionTarget.REGIME
        ]
        
        return target in classification_targets
        
    @classmethod
    def register_classification_model(cls, name: str, model_class: Type[ClassificationModel]):
        """
        Register a new classification model.
        
        Args:
            name: Model name
            model_class: Model class
        """
        cls.CLASSIFICATION_MODELS[name] = model_class
        logger.info(f"Registered classification model: {name}")
        
    @classmethod
    def register_regression_model(cls, name: str, model_class: Type[RegressionModel]):
        """
        Register a new regression model.
        
        Args:
            name: Model name
            model_class: Model class
        """
        cls.REGRESSION_MODELS[name] = model_class
        logger.info(f"Registered regression model: {name}")
        
    @classmethod
    def get_available_models(cls, is_classification: bool = True) -> Dict[str, Type[BaseModel]]:
        """
        Get available models.
        
        Args:
            is_classification: Whether to get classification or regression models
            
        Returns:
            Dictionary of available models
        """
        if is_classification:
            return cls.CLASSIFICATION_MODELS.copy()
        else:
            return cls.REGRESSION_MODELS.copy()
            
    @classmethod
    def load_model(cls, path: str) -> BaseModel:
        """
        Load a model from disk.
        
        Args:
            path: Path to load the model from
            
        Returns:
            Loaded model
        """
        return BaseModel.load(path)
