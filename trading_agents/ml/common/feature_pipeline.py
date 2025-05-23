"""
Feature pipeline for machine learning models.

This module provides classes and functions for feature pipeline
construction, transformation, and selection.
"""
import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple, Union, Callable
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
from sklearn.feature_selection import SelectKBest, f_classif, mutual_info_classif, RFE
from sklearn.decomposition import PCA
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.base import BaseEstimator, TransformerMixin

from trading_agents.ml.common.data_types import (
    Feature, DatasetMetadata, PredictionTarget
)

logger = logging.getLogger(__name__)

class FeatureSelector:
    """Base class for feature selection methods."""
    
    def __init__(self, name: str):
        """
        Initialize the feature selector.
        
        Args:
            name: Feature selector name
        """
        self.name = name
        
    def select(self, X: pd.DataFrame, y: pd.Series) -> List[str]:
        """
        Select features from data.
        
        Args:
            X: Feature DataFrame
            y: Target series
            
        Returns:
            List of selected feature names
        """
        raise NotImplementedError("Subclasses must implement this method")

class CorrelationSelector(FeatureSelector):
    """Selects features based on correlation with target."""
    
    def __init__(self, threshold: float = 0.1):
        """
        Initialize the correlation selector.
        
        Args:
            threshold: Minimum absolute correlation threshold
        """
        super().__init__("correlation_selector")
        self.threshold = threshold
        
    def select(self, X: pd.DataFrame, y: pd.Series) -> List[str]:
        """
        Select features based on correlation with target.
        
        Args:
            X: Feature DataFrame
            y: Target series
            
        Returns:
            List of selected feature names
        """
        # Calculate correlation with target
        correlations = {}
        for column in X.columns:
            if X[column].dtype in [np.float64, np.float32, np.int64, np.int32]:
                corr = X[column].corr(y)
                if not np.isnan(corr):
                    correlations[column] = abs(corr)
        
        # Select features above threshold
        selected_features = [col for col, corr in correlations.items() if corr >= self.threshold]
        
        logger.info(f"Selected {len(selected_features)} features using correlation (threshold={self.threshold})")
        
        return selected_features

class MutualInformationSelector(FeatureSelector):
    """Selects features based on mutual information with target."""
    
    def __init__(self, k: int = 20):
        """
        Initialize the mutual information selector.
        
        Args:
            k: Number of features to select
        """
        super().__init__("mutual_information_selector")
        self.k = k
        
    def select(self, X: pd.DataFrame, y: pd.Series) -> List[str]:
        """
        Select features based on mutual information with target.
        
        Args:
            X: Feature DataFrame
            y: Target series
            
        Returns:
            List of selected feature names
        """
        # Handle classification vs regression
        if y.dtype == 'object' or y.dtype == 'bool' or len(y.unique()) < 10:
            # Classification
            selector = SelectKBest(mutual_info_classif, k=min(self.k, X.shape[1]))
        else:
            # Regression
            from sklearn.feature_selection import mutual_info_regression
            selector = SelectKBest(mutual_info_regression, k=min(self.k, X.shape[1]))
            
        # Fit selector
        selector.fit(X, y)
        
        # Get selected feature mask
        selected_mask = selector.get_support()
        
        # Get selected feature names
        selected_features = X.columns[selected_mask].tolist()
        
        logger.info(f"Selected {len(selected_features)} features using mutual information (k={self.k})")
        
        return selected_features

class RecursiveFeatureSelector(FeatureSelector):
    """Selects features using recursive feature elimination."""
    
    def __init__(self, n_features: int = 20, step: float = 0.2):
        """
        Initialize the recursive feature selector.
        
        Args:
            n_features: Number of features to select
            step: Step size for feature elimination (fraction of features)
        """
        super().__init__("recursive_feature_selector")
        self.n_features = n_features
        self.step = step
        
    def select(self, X: pd.DataFrame, y: pd.Series) -> List[str]:
        """
        Select features using recursive feature elimination.
        
        Args:
            X: Feature DataFrame
            y: Target series
            
        Returns:
            List of selected feature names
        """
        # Handle classification vs regression
        if y.dtype == 'object' or y.dtype == 'bool' or len(y.unique()) < 10:
            # Classification
            estimator = RandomForestClassifier(n_estimators=100, random_state=42)
        else:
            # Regression
            estimator = RandomForestRegressor(n_estimators=100, random_state=42)
            
        # Calculate step size
        n_features_to_select = min(self.n_features, X.shape[1])
        step = max(1, int(X.shape[1] * self.step))
        
        # Create RFE selector
        selector = RFE(
            estimator=estimator,
            n_features_to_select=n_features_to_select,
            step=step,
            verbose=0
        )
        
        # Fit selector
        selector.fit(X, y)
        
        # Get selected feature mask
        selected_mask = selector.get_support()
        
        # Get selected feature names
        selected_features = X.columns[selected_mask].tolist()
        
        logger.info(f"Selected {len(selected_features)} features using recursive feature elimination")
        
        return selected_features

class FeaturePipeline:
    """Feature pipeline for data preprocessing and feature selection."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the feature pipeline.
        
        Args:
            config: Pipeline configuration
        """
        self.config = config
        
        # Preprocessing options
        self.fill_na = config.get("fill_na", True)
        self.na_strategy = config.get("na_strategy", "mean")
        self.scaling = config.get("scaling", "standard")
        self.remove_outliers = config.get("remove_outliers", False)
        self.outlier_threshold = config.get("outlier_threshold", 3.0)
        
        # Feature selection options
        self.feature_selection = config.get("feature_selection", "correlation")
        self.n_features = config.get("n_features", 20)
        self.correlation_threshold = config.get("correlation_threshold", 0.1)
        
        # Initialize pipeline components
        self._init_pipeline()
        
    def _init_pipeline(self):
        """Initialize pipeline components."""
        steps = []
        
        # NA handling
        if self.fill_na:
            steps.append(("na_handler", NAHandler(strategy=self.na_strategy)))
            
        # Outlier handling
        if self.remove_outliers:
            steps.append(("outlier_handler", OutlierHandler(threshold=self.outlier_threshold)))
            
        # Scaling
        if self.scaling == "standard":
            steps.append(("scaler", StandardScaler()))
        elif self.scaling == "minmax":
            steps.append(("scaler", MinMaxScaler()))
        elif self.scaling == "robust":
            steps.append(("scaler", RobustScaler()))
            
        # Create pipeline
        self.pipeline = Pipeline(steps)
        
        # Initialize feature selector
        if self.feature_selection == "correlation":
            self.feature_selector = CorrelationSelector(threshold=self.correlation_threshold)
        elif self.feature_selection == "mutual_information":
            self.feature_selector = MutualInformationSelector(k=self.n_features)
        elif self.feature_selection == "recursive":
            self.feature_selector = RecursiveFeatureSelector(n_features=self.n_features)
        else:
            self.feature_selector = None
            
    def fit_transform(self, X: pd.DataFrame, y: pd.Series) -> Tuple[pd.DataFrame, List[str]]:
        """
        Fit pipeline to data and transform.
        
        Args:
            X: Feature DataFrame
            y: Target series
            
        Returns:
            Transformed DataFrame and list of selected features
        """
        # Fit and transform with pipeline
        X_transformed = pd.DataFrame(
            self.pipeline.fit_transform(X, y),
            columns=X.columns,
            index=X.index
        )
        
        # Select features
        if self.feature_selector:
            selected_features = self.feature_selector.select(X_transformed, y)
            X_selected = X_transformed[selected_features]
        else:
            selected_features = X_transformed.columns.tolist()
            X_selected = X_transformed
            
        return X_selected, selected_features
        
    def transform(self, X: pd.DataFrame, selected_features: List[str]) -> pd.DataFrame:
        """
        Transform data using fitted pipeline.
        
        Args:
            X: Feature DataFrame
            selected_features: List of selected features
            
        Returns:
            Transformed DataFrame with selected features
        """
        # Transform with pipeline
        X_transformed = pd.DataFrame(
            self.pipeline.transform(X),
            columns=X.columns,
            index=X.index
        )
        
        # Select features
        X_selected = X_transformed[selected_features]
        
        return X_selected

class NAHandler(BaseEstimator, TransformerMixin):
    """Handles missing values in data."""
    
    def __init__(self, strategy: str = "mean"):
        """
        Initialize the NA handler.
        
        Args:
            strategy: Strategy for filling NA values (mean, median, zero)
        """
        self.strategy = strategy
        self.fill_values = {}
        
    def fit(self, X: pd.DataFrame, y=None):
        """
        Fit the NA handler.
        
        Args:
            X: Feature DataFrame
            y: Target series (unused)
            
        Returns:
            Self
        """
        # Calculate fill values for each column
        for column in X.columns:
            if X[column].dtype in [np.float64, np.float32, np.int64, np.int32]:
                if self.strategy == "mean":
                    self.fill_values[column] = X[column].mean()
                elif self.strategy == "median":
                    self.fill_values[column] = X[column].median()
                elif self.strategy == "zero":
                    self.fill_values[column] = 0
                else:
                    self.fill_values[column] = X[column].mean()
            else:
                # For non-numeric columns, use most frequent value
                self.fill_values[column] = X[column].mode()[0] if not X[column].mode().empty else None
                
        return self
        
    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """
        Transform the data by filling NA values.
        
        Args:
            X: Feature DataFrame
            
        Returns:
            DataFrame with NA values filled
        """
        X_filled = X.copy()
        
        # Fill NA values for each column
        for column in X.columns:
            if column in self.fill_values and self.fill_values[column] is not None:
                X_filled[column] = X_filled[column].fillna(self.fill_values[column])
                
        return X_filled

class OutlierHandler(BaseEstimator, TransformerMixin):
    """Handles outliers in data."""
    
    def __init__(self, threshold: float = 3.0):
        """
        Initialize the outlier handler.
        
        Args:
            threshold: Z-score threshold for outlier detection
        """
        self.threshold = threshold
        self.means = {}
        self.stds = {}
        
    def fit(self, X: pd.DataFrame, y=None):
        """
        Fit the outlier handler.
        
        Args:
            X: Feature DataFrame
            y: Target series (unused)
            
        Returns:
            Self
        """
        # Calculate mean and std for each column
        for column in X.columns:
            if X[column].dtype in [np.float64, np.float32, np.int64, np.int32]:
                self.means[column] = X[column].mean()
                self.stds[column] = X[column].std()
                
        return self
        
    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """
        Transform the data by handling outliers.
        
        Args:
            X: Feature DataFrame
            
        Returns:
            DataFrame with outliers handled
        """
        X_transformed = X.copy()
        
        # Handle outliers for each column
        for column in X.columns:
            if column in self.means and column in self.stds and self.stds[column] > 0:
                # Calculate z-scores
                z_scores = (X_transformed[column] - self.means[column]) / self.stds[column]
                
                # Identify outliers
                outliers = abs(z_scores) > self.threshold
                
                # Replace outliers with threshold values
                if outliers.any():
                    X_transformed.loc[outliers & (z_scores > 0), column] = self.means[column] + self.threshold * self.stds[column]
                    X_transformed.loc[outliers & (z_scores < 0), column] = self.means[column] - self.threshold * self.stds[column]
                    
        return X_transformed
