"""
Position sizing module for risk management.

This module provides position sizing strategies for risk management,
including fixed size, fixed risk, and Kelly criterion.
"""
import logging
from typing import Dict, Any, Optional, List, Union
import math

logger = logging.getLogger(__name__)

class PositionSizing:
    """
    Position sizing strategies for risk management.
    
    This class provides methods for calculating position sizes
    based on different risk management strategies.
    """
    
    @staticmethod
    def fixed_size(account_balance: float, percentage: float) -> float:
        """
        Calculate position size based on a fixed percentage of account balance.
        
        Args:
            account_balance: Account balance
            percentage: Percentage of account balance to risk (0-100)
            
        Returns:
            Position size
        """
        if percentage <= 0 or percentage > 100:
            raise ValueError("Percentage must be between 0 and 100")
            
        return account_balance * (percentage / 100)
        
    @staticmethod
    def fixed_risk(
        account_balance: float,
        risk_percentage: float,
        entry_price: float,
        stop_loss_price: float,
        leverage: float = 1.0
    ) -> float:
        """
        Calculate position size based on a fixed risk percentage.
        
        Args:
            account_balance: Account balance
            risk_percentage: Percentage of account balance to risk (0-100)
            entry_price: Entry price
            stop_loss_price: Stop loss price
            leverage: Leverage multiplier
            
        Returns:
            Position size
        """
        if risk_percentage <= 0 or risk_percentage > 100:
            raise ValueError("Risk percentage must be between 0 and 100")
            
        if entry_price <= 0:
            raise ValueError("Entry price must be greater than 0")
            
        if stop_loss_price <= 0:
            raise ValueError("Stop loss price must be greater than 0")
            
        if leverage <= 0:
            raise ValueError("Leverage must be greater than 0")
            
        # Calculate risk amount
        risk_amount = account_balance * (risk_percentage / 100)
        
        # Calculate risk per unit
        risk_per_unit = abs(entry_price - stop_loss_price) / entry_price
        
        # Calculate position size
        position_size = risk_amount / (risk_per_unit * entry_price / leverage)
        
        return position_size
        
    @staticmethod
    def kelly_criterion(
        win_rate: float,
        win_loss_ratio: float,
        risk_factor: float = 1.0
    ) -> float:
        """
        Calculate position size based on the Kelly criterion.
        
        Args:
            win_rate: Win rate (0-1)
            win_loss_ratio: Ratio of average win to average loss
            risk_factor: Risk factor to adjust Kelly percentage (0-1)
            
        Returns:
            Kelly percentage (0-100)
        """
        if win_rate <= 0 or win_rate >= 1:
            raise ValueError("Win rate must be between 0 and 1")
            
        if win_loss_ratio <= 0:
            raise ValueError("Win/loss ratio must be greater than 0")
            
        if risk_factor <= 0 or risk_factor > 1:
            raise ValueError("Risk factor must be between 0 and 1")
            
        # Calculate Kelly percentage
        kelly_percentage = (win_rate * win_loss_ratio - (1 - win_rate)) / win_loss_ratio
        
        # Apply risk factor
        kelly_percentage *= risk_factor
        
        # Ensure percentage is between 0 and 100
        kelly_percentage = max(0, min(100, kelly_percentage * 100))
        
        return kelly_percentage
        
    @staticmethod
    def optimal_position_size(
        account_balance: float,
        strategy_params: Dict[str, Any],
        market_data: Dict[str, Any],
        risk_params: Dict[str, Any]
    ) -> float:
        """
        Calculate optimal position size based on multiple factors.
        
        Args:
            account_balance: Account balance
            strategy_params: Strategy parameters
            market_data: Market data
            risk_params: Risk parameters
            
        Returns:
            Optimal position size
        """
        # Extract parameters
        max_risk_per_trade = risk_params.get("max_risk_per_trade", 2.0)
        volatility_factor = risk_params.get("volatility_factor", 1.0)
        max_position_size = risk_params.get("max_position_size", 20.0)
        
        # Get market volatility
        volatility = market_data.get("volatility", 0.0)
        
        # Adjust risk based on volatility
        adjusted_risk = max_risk_per_trade * (1 - volatility * volatility_factor)
        adjusted_risk = max(0.1, min(max_risk_per_trade, adjusted_risk))
        
        # Calculate position size
        position_size = account_balance * (adjusted_risk / 100)
        
        # Apply maximum position size limit
        max_size = account_balance * (max_position_size / 100)
        position_size = min(position_size, max_size)
        
        return position_size
