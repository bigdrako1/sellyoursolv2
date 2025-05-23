"""
Predictive model implementations.

This module provides concrete implementations of predictive models.
"""
import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple, Union
from sklearn.linear_model import LogisticRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF, ConstantKernel as C

from trading_agents.ml.predictive.base_model import ClassificationModel, RegressionModel
from trading_agents.ml.common.data_types import ModelType

logger = logging.getLogger(__name__)

class LogisticRegressionModel(ClassificationModel):
    """Logistic regression classification model."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the logistic regression model.

        Args:
            config: Model configuration
        """
        super().__init__(config)
        self.model_type = ModelType.LINEAR

        # Model parameters
        self.C = config.get("C", 1.0)
        self.penalty = config.get("penalty", "l2")
        self.solver = config.get("solver", "liblinear")
        self.max_iter = config.get("max_iter", 1000)
        self.class_weight = config.get("class_weight", "balanced")

    def _fit_model(self, X: pd.DataFrame, y: pd.Series):
        """
        Fit the logistic regression model.

        Args:
            X: Processed feature DataFrame
            y: Target series
        """
        self.model = LogisticRegression(
            C=self.C,
            penalty=self.penalty,
            solver=self.solver,
            max_iter=self.max_iter,
            class_weight=self.class_weight,
            random_state=42
        )

        self.model.fit(X, y)

    def _predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions with the logistic regression model.

        Args:
            X: Processed feature DataFrame

        Returns:
            Array of predictions
        """
        return self.model.predict(X)

    def _predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make probability predictions with the logistic regression model.

        Args:
            X: Processed feature DataFrame

        Returns:
            Array of probability predictions
        """
        return self.model.predict_proba(X)

    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance.

        Returns:
            Dictionary mapping feature names to importance scores
        """
        if not self.is_fitted:
            raise ValueError("Model is not fitted")

        # Get coefficients
        coefficients = self.model.coef_[0] if len(self.model.classes_) == 2 else np.mean(np.abs(self.model.coef_), axis=0)

        # Map to feature names
        importance = {feature: abs(coef) for feature, coef in zip(self.selected_features, coefficients)}

        # Normalize
        max_importance = max(importance.values()) if importance else 1.0
        importance = {feature: value / max_importance for feature, value in importance.items()}

        return importance

class RandomForestClassifierModel(ClassificationModel):
    """Random forest classification model."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the random forest model.

        Args:
            config: Model configuration
        """
        super().__init__(config)
        self.model_type = ModelType.ENSEMBLE

        # Model parameters
        self.n_estimators = config.get("n_estimators", 100)
        self.max_depth = config.get("max_depth", None)
        self.min_samples_split = config.get("min_samples_split", 2)
        self.min_samples_leaf = config.get("min_samples_leaf", 1)
        self.class_weight = config.get("class_weight", "balanced")

    def _fit_model(self, X: pd.DataFrame, y: pd.Series):
        """
        Fit the random forest model.

        Args:
            X: Processed feature DataFrame
            y: Target series
        """
        self.model = RandomForestClassifier(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            min_samples_split=self.min_samples_split,
            min_samples_leaf=self.min_samples_leaf,
            class_weight=self.class_weight,
            random_state=42,
            n_jobs=-1
        )

        self.model.fit(X, y)

    def _predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions with the random forest model.

        Args:
            X: Processed feature DataFrame

        Returns:
            Array of predictions
        """
        return self.model.predict(X)

    def _predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make probability predictions with the random forest model.

        Args:
            X: Processed feature DataFrame

        Returns:
            Array of probability predictions
        """
        return self.model.predict_proba(X)

    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance.

        Returns:
            Dictionary mapping feature names to importance scores
        """
        if not self.is_fitted:
            raise ValueError("Model is not fitted")

        # Get feature importance
        importance = {feature: imp for feature, imp in zip(self.selected_features, self.model.feature_importances_)}

        return importance

class GradientBoostingClassifierModel(ClassificationModel):
    """Gradient boosting classification model."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the gradient boosting model.

        Args:
            config: Model configuration
        """
        super().__init__(config)
        self.model_type = ModelType.ENSEMBLE

        # Model parameters
        self.n_estimators = config.get("n_estimators", 100)
        self.learning_rate = config.get("learning_rate", 0.1)
        self.max_depth = config.get("max_depth", 3)
        self.subsample = config.get("subsample", 1.0)

    def _fit_model(self, X: pd.DataFrame, y: pd.Series):
        """
        Fit the gradient boosting model.

        Args:
            X: Processed feature DataFrame
            y: Target series
        """
        self.model = GradientBoostingClassifier(
            n_estimators=self.n_estimators,
            learning_rate=self.learning_rate,
            max_depth=self.max_depth,
            subsample=self.subsample,
            random_state=42
        )

        self.model.fit(X, y)

    def _predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions with the gradient boosting model.

        Args:
            X: Processed feature DataFrame

        Returns:
            Array of predictions
        """
        return self.model.predict(X)

    def _predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make probability predictions with the gradient boosting model.

        Args:
            X: Processed feature DataFrame

        Returns:
            Array of probability predictions
        """
        return self.model.predict_proba(X)

    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance.

        Returns:
            Dictionary mapping feature names to importance scores
        """
        if not self.is_fitted:
            raise ValueError("Model is not fitted")

        # Get feature importance
        importance = {feature: imp for feature, imp in zip(self.selected_features, self.model.feature_importances_)}

        return importance

class RidgeRegressionModel(RegressionModel):
    """Ridge regression model."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the ridge regression model.

        Args:
            config: Model configuration
        """
        super().__init__(config)
        self.model_type = ModelType.LINEAR

        # Model parameters
        self.alpha = config.get("alpha", 1.0)
        self.fit_intercept = config.get("fit_intercept", True)
        self.normalize = config.get("normalize", False)
        self.max_iter = config.get("max_iter", 1000)

    def _fit_model(self, X: pd.DataFrame, y: pd.Series):
        """
        Fit the ridge regression model.

        Args:
            X: Processed feature DataFrame
            y: Target series
        """
        self.model = Ridge(
            alpha=self.alpha,
            fit_intercept=self.fit_intercept,
            normalize=self.normalize,
            max_iter=self.max_iter,
            random_state=42
        )

        self.model.fit(X, y)

    def _predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions with the ridge regression model.

        Args:
            X: Processed feature DataFrame

        Returns:
            Array of predictions
        """
        return self.model.predict(X)

    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance.

        Returns:
            Dictionary mapping feature names to importance scores
        """
        if not self.is_fitted:
            raise ValueError("Model is not fitted")

        # Get coefficients
        coefficients = self.model.coef_

        # Map to feature names
        importance = {feature: abs(coef) for feature, coef in zip(self.selected_features, coefficients)}

        # Normalize
        max_importance = max(importance.values()) if importance else 1.0
        importance = {feature: value / max_importance for feature, value in importance.items()}

        return importance

class RandomForestRegressorModel(RegressionModel):
    """Random forest regression model."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the random forest regression model.

        Args:
            config: Model configuration
        """
        super().__init__(config)
        self.model_type = ModelType.ENSEMBLE

        # Model parameters
        self.n_estimators = config.get("n_estimators", 100)
        self.max_depth = config.get("max_depth", None)
        self.min_samples_split = config.get("min_samples_split", 2)
        self.min_samples_leaf = config.get("min_samples_leaf", 1)

    def _fit_model(self, X: pd.DataFrame, y: pd.Series):
        """
        Fit the random forest regression model.

        Args:
            X: Processed feature DataFrame
            y: Target series
        """
        self.model = RandomForestRegressor(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            min_samples_split=self.min_samples_split,
            min_samples_leaf=self.min_samples_leaf,
            random_state=42,
            n_jobs=-1
        )

        self.model.fit(X, y)

    def _predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions with the random forest regression model.

        Args:
            X: Processed feature DataFrame

        Returns:
            Array of predictions
        """
        return self.model.predict(X)

    def _predict_with_confidence(self, X: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Make predictions with confidence intervals.

        Args:
            X: Processed feature DataFrame

        Returns:
            Tuple of (predictions, confidence)
        """
        # Get predictions from all trees
        predictions = np.array([tree.predict(X) for tree in self.model.estimators_])

        # Calculate mean and standard deviation
        mean_prediction = np.mean(predictions, axis=0)
        std_prediction = np.std(predictions, axis=0)

        # Calculate confidence (inverse of normalized standard deviation)
        confidence = 1.0 / (1.0 + std_prediction / (np.mean(std_prediction) + 1e-10))

        return mean_prediction, confidence

    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance.

        Returns:
            Dictionary mapping feature names to importance scores
        """
        if not self.is_fitted:
            raise ValueError("Model is not fitted")

        # Get feature importance
        importance = {feature: imp for feature, imp in zip(self.selected_features, self.model.feature_importances_)}

        return importance

class GradientBoostingRegressorModel(RegressionModel):
    """Gradient boosting regression model."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the gradient boosting regression model.

        Args:
            config: Model configuration
        """
        super().__init__(config)
        self.model_type = ModelType.ENSEMBLE

        # Model parameters
        self.n_estimators = config.get("n_estimators", 100)
        self.learning_rate = config.get("learning_rate", 0.1)
        self.max_depth = config.get("max_depth", 3)
        self.subsample = config.get("subsample", 1.0)
        self.alpha = config.get("alpha", 0.9)  # For quantile regression

    def _fit_model(self, X: pd.DataFrame, y: pd.Series):
        """
        Fit the gradient boosting regression model.

        Args:
            X: Processed feature DataFrame
            y: Target series
        """
        self.model = GradientBoostingRegressor(
            n_estimators=self.n_estimators,
            learning_rate=self.learning_rate,
            max_depth=self.max_depth,
            subsample=self.subsample,
            random_state=42
        )

        self.model.fit(X, y)

    def _predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions with the gradient boosting regression model.

        Args:
            X: Processed feature DataFrame

        Returns:
            Array of predictions
        """
        return self.model.predict(X)

    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance.

        Returns:
            Dictionary mapping feature names to importance scores
        """
        if not self.is_fitted:
            raise ValueError("Model is not fitted")

        # Get feature importance
        importance = {feature: imp for feature, imp in zip(self.selected_features, self.model.feature_importances_)}

        return importance