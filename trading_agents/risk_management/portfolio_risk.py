"""
Portfolio risk management module.

This module provides portfolio risk management tools for trading agents,
including correlation analysis, diversification, and portfolio optimization.
"""
import logging
from typing import Dict, Any, Optional, List, Union, Tuple
import math
import numpy as np
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class PortfolioRisk:
    """
    Portfolio risk management for trading agents.
    
    This class provides methods for managing portfolio risk,
    including correlation analysis, diversification, and
    portfolio optimization.
    """
    
    @staticmethod
    def calculate_correlation(returns1: List[float], returns2: List[float]) -> float:
        """
        Calculate correlation between two return series.
        
        Args:
            returns1: First return series
            returns2: Second return series
            
        Returns:
            Correlation coefficient
        """
        if len(returns1) != len(returns2):
            raise ValueError("Return series must have the same length")
            
        if len(returns1) < 2:
            return 0.0
            
        try:
            return float(np.corrcoef(returns1, returns2)[0, 1])
        except Exception as e:
            logger.error(f"Error calculating correlation: {str(e)}")
            return 0.0
            
    @staticmethod
    def calculate_portfolio_variance(
        weights: List[float],
        returns: List[List[float]]
    ) -> float:
        """
        Calculate portfolio variance.
        
        Args:
            weights: Asset weights
            returns: Asset return series
            
        Returns:
            Portfolio variance
        """
        if len(weights) != len(returns):
            raise ValueError("Number of weights must match number of assets")
            
        if len(weights) == 0:
            return 0.0
            
        try:
            # Convert returns to numpy array
            returns_array = np.array(returns)
            
            # Calculate covariance matrix
            cov_matrix = np.cov(returns_array)
            
            # Calculate portfolio variance
            weights_array = np.array(weights)
            portfolio_variance = weights_array.T @ cov_matrix @ weights_array
            
            return float(portfolio_variance)
        except Exception as e:
            logger.error(f"Error calculating portfolio variance: {str(e)}")
            return 0.0
            
    @staticmethod
    def calculate_max_drawdown(returns: List[float]) -> float:
        """
        Calculate maximum drawdown.
        
        Args:
            returns: Return series
            
        Returns:
            Maximum drawdown percentage
        """
        if not returns:
            return 0.0
            
        try:
            # Calculate cumulative returns
            cum_returns = [1.0]
            for r in returns:
                cum_returns.append(cum_returns[-1] * (1 + r))
                
            # Calculate maximum drawdown
            max_dd = 0.0
            peak = cum_returns[0]
            
            for value in cum_returns:
                if value > peak:
                    peak = value
                dd = (peak - value) / peak
                max_dd = max(max_dd, dd)
                
            return float(max_dd * 100)
        except Exception as e:
            logger.error(f"Error calculating maximum drawdown: {str(e)}")
            return 0.0
            
    @staticmethod
    def calculate_sharpe_ratio(
        returns: List[float],
        risk_free_rate: float = 0.0
    ) -> float:
        """
        Calculate Sharpe ratio.
        
        Args:
            returns: Return series
            risk_free_rate: Risk-free rate
            
        Returns:
            Sharpe ratio
        """
        if not returns:
            return 0.0
            
        try:
            # Calculate average return
            avg_return = sum(returns) / len(returns)
            
            # Calculate standard deviation
            std_dev = math.sqrt(sum((r - avg_return) ** 2 for r in returns) / len(returns))
            
            if std_dev == 0:
                return 0.0
                
            # Calculate Sharpe ratio
            sharpe_ratio = (avg_return - risk_free_rate) / std_dev
            
            return float(sharpe_ratio)
        except Exception as e:
            logger.error(f"Error calculating Sharpe ratio: {str(e)}")
            return 0.0
            
    @staticmethod
    def optimize_portfolio(
        returns: List[List[float]],
        target_return: Optional[float] = None,
        max_weight: float = 1.0
    ) -> Tuple[List[float], float, float]:
        """
        Optimize portfolio weights for minimum variance.
        
        Args:
            returns: Asset return series
            target_return: Target portfolio return
            max_weight: Maximum weight for any asset
            
        Returns:
            Tuple of (weights, expected_return, expected_volatility)
        """
        if not returns or len(returns) == 0:
            return [], 0.0, 0.0
            
        try:
            # Convert returns to numpy array
            returns_array = np.array(returns)
            
            # Calculate mean returns and covariance matrix
            mean_returns = np.mean(returns_array, axis=1)
            cov_matrix = np.cov(returns_array)
            
            # Number of assets
            n = len(returns)
            
            # If no target return is specified, use equal weights
            if target_return is None:
                weights = [1.0 / n] * n
            else:
                # Simple optimization for minimum variance
                # This is a simplified version; in practice, use a proper optimization library
                weights = [max_weight / n] * n
                
                # Normalize weights
                total_weight = sum(weights)
                weights = [w / total_weight for w in weights]
                
            # Calculate expected return and volatility
            expected_return = sum(w * r for w, r in zip(weights, mean_returns))
            expected_volatility = math.sqrt(
                sum(weights[i] * weights[j] * cov_matrix[i, j]
                    for i in range(n) for j in range(n))
            )
            
            return weights, float(expected_return), float(expected_volatility)
        except Exception as e:
            logger.error(f"Error optimizing portfolio: {str(e)}")
            return [1.0 / len(returns)] * len(returns), 0.0, 0.0
            
    @staticmethod
    def calculate_var(
        returns: List[float],
        confidence_level: float = 0.95,
        time_horizon: int = 1
    ) -> float:
        """
        Calculate Value at Risk (VaR).
        
        Args:
            returns: Return series
            confidence_level: Confidence level (0-1)
            time_horizon: Time horizon in days
            
        Returns:
            Value at Risk percentage
        """
        if not returns:
            return 0.0
            
        try:
            # Sort returns
            sorted_returns = sorted(returns)
            
            # Calculate index for percentile
            index = int((1 - confidence_level) * len(sorted_returns))
            
            # Get VaR
            var = -sorted_returns[index]
            
            # Scale for time horizon
            var = var * math.sqrt(time_horizon)
            
            return float(var * 100)
        except Exception as e:
            logger.error(f"Error calculating VaR: {str(e)}")
            return 0.0
            
    @staticmethod
    def calculate_cvar(
        returns: List[float],
        confidence_level: float = 0.95
    ) -> float:
        """
        Calculate Conditional Value at Risk (CVaR).
        
        Args:
            returns: Return series
            confidence_level: Confidence level (0-1)
            
        Returns:
            Conditional Value at Risk percentage
        """
        if not returns:
            return 0.0
            
        try:
            # Sort returns
            sorted_returns = sorted(returns)
            
            # Calculate index for percentile
            index = int((1 - confidence_level) * len(sorted_returns))
            
            # Calculate CVaR as average of worst returns
            cvar = -sum(sorted_returns[:index]) / index if index > 0 else 0.0
            
            return float(cvar * 100)
        except Exception as e:
            logger.error(f"Error calculating CVaR: {str(e)}")
            return 0.0
