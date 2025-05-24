"""
Risk manager module for trading agents.

This module provides a risk manager for trading agents,
integrating position sizing, portfolio risk, and market
condition detection.
"""
import logging
from typing import Dict, Any, Optional, List, Union, Tuple
import math
import numpy as np
from datetime import datetime, timedelta

from .position_sizing import PositionSizing
from .portfolio_risk import PortfolioRisk
from .market_conditions import MarketConditions

logger = logging.getLogger(__name__)

class RiskManager:
    """
    Risk manager for trading agents.
    
    This class provides methods for managing trading risk,
    integrating position sizing, portfolio risk, and market
    condition detection.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the risk manager.
        
        Args:
            config: Risk manager configuration
        """
        self.config = config or {}
        self.position_sizing = PositionSizing()
        self.portfolio_risk = PortfolioRisk()
        self.market_conditions = MarketConditions()
        
        # Default risk parameters
        self.default_params = {
            "max_risk_per_trade": 2.0,  # Maximum risk per trade (%)
            "max_portfolio_risk": 10.0,  # Maximum portfolio risk (%)
            "max_correlation": 0.7,  # Maximum correlation between positions
            "max_drawdown": 20.0,  # Maximum drawdown (%)
            "volatility_factor": 1.0,  # Volatility adjustment factor
            "risk_free_rate": 0.0,  # Risk-free rate
            "confidence_level": 0.95,  # Confidence level for VaR
            "position_sizing_method": "fixed_risk",  # Position sizing method
            "market_regime_adjustment": True,  # Adjust for market regime
            "stop_loss_atr_multiple": 2.0,  # Stop loss ATR multiple
            "take_profit_atr_multiple": 4.0,  # Take profit ATR multiple
        }
        
        # Override defaults with config
        if config:
            self.default_params.update(config)
            
        logger.info("Risk manager initialized")
        
    def calculate_position_size(
        self,
        account_balance: float,
        symbol: str,
        entry_price: float,
        stop_loss_price: float,
        market_data: Dict[str, Any],
        agent_metrics: Optional[Dict[str, Any]] = None,
        portfolio_positions: Optional[List[Dict[str, Any]]] = None
    ) -> float:
        """
        Calculate position size for a trade.
        
        Args:
            account_balance: Account balance
            symbol: Market symbol
            entry_price: Entry price
            stop_loss_price: Stop loss price
            market_data: Market data
            agent_metrics: Agent performance metrics
            portfolio_positions: Existing portfolio positions
            
        Returns:
            Position size
        """
        try:
            # Get risk parameters
            risk_params = self._get_risk_params(symbol, market_data, agent_metrics)
            
            # Adjust risk based on market conditions
            risk_params = self._adjust_risk_for_market_conditions(
                risk_params, symbol, market_data
            )
            
            # Adjust risk based on portfolio
            risk_params = self._adjust_risk_for_portfolio(
                risk_params, symbol, portfolio_positions
            )
            
            # Calculate position size based on method
            method = risk_params.get("position_sizing_method", "fixed_risk")
            
            if method == "fixed_size":
                return self.position_sizing.fixed_size(
                    account_balance,
                    risk_params.get("max_risk_per_trade", 2.0)
                )
            elif method == "fixed_risk":
                return self.position_sizing.fixed_risk(
                    account_balance,
                    risk_params.get("max_risk_per_trade", 2.0),
                    entry_price,
                    stop_loss_price,
                    risk_params.get("leverage", 1.0)
                )
            elif method == "kelly":
                # Get win rate and win/loss ratio from agent metrics
                win_rate = agent_metrics.get("win_rate", 50.0) / 100.0 if agent_metrics else 0.5
                win_loss_ratio = agent_metrics.get("profit_factor", 1.0) if agent_metrics else 1.0
                
                # Calculate Kelly percentage
                kelly_pct = self.position_sizing.kelly_criterion(
                    win_rate,
                    win_loss_ratio,
                    risk_params.get("risk_factor", 0.5)
                )
                
                # Apply Kelly percentage to account balance
                return account_balance * (kelly_pct / 100.0)
            elif method == "optimal":
                return self.position_sizing.optimal_position_size(
                    account_balance,
                    risk_params,
                    market_data,
                    risk_params
                )
            else:
                # Default to fixed risk
                return self.position_sizing.fixed_risk(
                    account_balance,
                    risk_params.get("max_risk_per_trade", 2.0),
                    entry_price,
                    stop_loss_price,
                    risk_params.get("leverage", 1.0)
                )
        except Exception as e:
            logger.error(f"Error calculating position size: {str(e)}")
            
            # Fall back to conservative position size
            return account_balance * 0.01
            
    def calculate_stop_loss(
        self,
        symbol: str,
        entry_price: float,
        side: str,
        market_data: Dict[str, Any]
    ) -> float:
        """
        Calculate stop loss price.
        
        Args:
            symbol: Market symbol
            entry_price: Entry price
            side: Position side ("long" or "short")
            market_data: Market data
            
        Returns:
            Stop loss price
        """
        try:
            # Get risk parameters
            risk_params = self._get_risk_params(symbol, market_data)
            
            # Get ATR if available
            atr = market_data.get("atr", None)
            
            if atr is None:
                # Estimate ATR as a percentage of price
                atr = entry_price * 0.02
                
            # Get ATR multiple
            atr_multiple = risk_params.get("stop_loss_atr_multiple", 2.0)
            
            # Calculate stop loss
            if side.lower() == "long":
                stop_loss = entry_price - (atr * atr_multiple)
            else:
                stop_loss = entry_price + (atr * atr_multiple)
                
            return stop_loss
        except Exception as e:
            logger.error(f"Error calculating stop loss: {str(e)}")
            
            # Fall back to percentage-based stop loss
            if side.lower() == "long":
                return entry_price * 0.95
            else:
                return entry_price * 1.05
                
    def calculate_take_profit(
        self,
        symbol: str,
        entry_price: float,
        side: str,
        market_data: Dict[str, Any]
    ) -> float:
        """
        Calculate take profit price.
        
        Args:
            symbol: Market symbol
            entry_price: Entry price
            side: Position side ("long" or "short")
            market_data: Market data
            
        Returns:
            Take profit price
        """
        try:
            # Get risk parameters
            risk_params = self._get_risk_params(symbol, market_data)
            
            # Get ATR if available
            atr = market_data.get("atr", None)
            
            if atr is None:
                # Estimate ATR as a percentage of price
                atr = entry_price * 0.02
                
            # Get ATR multiple
            atr_multiple = risk_params.get("take_profit_atr_multiple", 4.0)
            
            # Calculate take profit
            if side.lower() == "long":
                take_profit = entry_price + (atr * atr_multiple)
            else:
                take_profit = entry_price - (atr * atr_multiple)
                
            return take_profit
        except Exception as e:
            logger.error(f"Error calculating take profit: {str(e)}")
            
            # Fall back to percentage-based take profit
            if side.lower() == "long":
                return entry_price * 1.1
            else:
                return entry_price * 0.9
                
    def evaluate_portfolio_risk(
        self,
        positions: List[Dict[str, Any]],
        market_data: Dict[str, Any],
        account_balance: float
    ) -> Dict[str, Any]:
        """
        Evaluate portfolio risk.
        
        Args:
            positions: List of positions
            market_data: Market data
            account_balance: Account balance
            
        Returns:
            Portfolio risk metrics
        """
        try:
            # Calculate portfolio value
            portfolio_value = sum(
                p.get("amount", 0) * market_data.get(p.get("symbol", ""), {}).get("price", 0)
                for p in positions
            )
            
            # Calculate position weights
            weights = [
                p.get("amount", 0) * market_data.get(p.get("symbol", ""), {}).get("price", 0) / portfolio_value
                for p in positions
            ] if portfolio_value > 0 else []
            
            # Get historical returns for each position
            returns = [
                market_data.get(p.get("symbol", ""), {}).get("returns", [])
                for p in positions
            ]
            
            # Calculate portfolio metrics
            metrics = {
                "portfolio_value": portfolio_value,
                "portfolio_exposure": portfolio_value / account_balance if account_balance > 0 else 0,
                "num_positions": len(positions),
                "max_position_weight": max(weights) if weights else 0,
                "min_position_weight": min(weights) if weights else 0,
            }
            
            # Calculate advanced metrics if returns are available
            if all(len(r) > 0 for r in returns):
                # Calculate portfolio variance
                portfolio_variance = self.portfolio_risk.calculate_portfolio_variance(weights, returns)
                
                # Calculate portfolio volatility
                portfolio_volatility = math.sqrt(portfolio_variance)
                
                # Calculate maximum drawdown
                portfolio_returns = [
                    sum(w * r[i] for w, r in zip(weights, returns))
                    for i in range(len(returns[0]))
                ]
                max_drawdown = self.portfolio_risk.calculate_max_drawdown(portfolio_returns)
                
                # Calculate Sharpe ratio
                sharpe_ratio = self.portfolio_risk.calculate_sharpe_ratio(
                    portfolio_returns,
                    self.default_params.get("risk_free_rate", 0.0)
                )
                
                # Calculate VaR and CVaR
                var = self.portfolio_risk.calculate_var(
                    portfolio_returns,
                    self.default_params.get("confidence_level", 0.95)
                )
                cvar = self.portfolio_risk.calculate_cvar(
                    portfolio_returns,
                    self.default_params.get("confidence_level", 0.95)
                )
                
                # Add metrics
                metrics.update({
                    "portfolio_volatility": portfolio_volatility,
                    "max_drawdown": max_drawdown,
                    "sharpe_ratio": sharpe_ratio,
                    "var": var,
                    "cvar": cvar
                })
                
            return metrics
        except Exception as e:
            logger.error(f"Error evaluating portfolio risk: {str(e)}")
            
            # Return basic metrics
            return {
                "portfolio_value": sum(
                    p.get("amount", 0) * market_data.get(p.get("symbol", ""), {}).get("price", 0)
                    for p in positions
                ),
                "num_positions": len(positions)
            }
            
    def _get_risk_params(
        self,
        symbol: str,
        market_data: Dict[str, Any],
        agent_metrics: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Get risk parameters for a symbol.
        
        Args:
            symbol: Market symbol
            market_data: Market data
            agent_metrics: Agent performance metrics
            
        Returns:
            Risk parameters
        """
        # Start with default parameters
        params = self.default_params.copy()
        
        # Override with symbol-specific parameters if available
        symbol_params = self.config.get("symbols", {}).get(symbol, {})
        if symbol_params:
            params.update(symbol_params)
            
        # Adjust based on agent metrics if available
        if agent_metrics:
            # Adjust risk based on win rate
            win_rate = agent_metrics.get("win_rate", 50.0)
            if win_rate > 60:
                params["max_risk_per_trade"] = min(params["max_risk_per_trade"] * 1.2, 5.0)
            elif win_rate < 40:
                params["max_risk_per_trade"] = params["max_risk_per_trade"] * 0.8
                
            # Adjust risk based on profit factor
            profit_factor = agent_metrics.get("profit_factor", 1.0)
            if profit_factor > 1.5:
                params["max_risk_per_trade"] = min(params["max_risk_per_trade"] * 1.1, 5.0)
            elif profit_factor < 0.8:
                params["max_risk_per_trade"] = params["max_risk_per_trade"] * 0.7
                
        return params
        
    def _adjust_risk_for_market_conditions(
        self,
        risk_params: Dict[str, Any],
        symbol: str,
        market_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Adjust risk parameters based on market conditions.
        
        Args:
            risk_params: Risk parameters
            symbol: Market symbol
            market_data: Market data
            
        Returns:
            Adjusted risk parameters
        """
        # Skip if market regime adjustment is disabled
        if not risk_params.get("market_regime_adjustment", True):
            return risk_params
            
        # Get prices
        prices = market_data.get("prices", [])
        if not prices or len(prices) < 20:
            return risk_params
            
        # Detect market regime
        market_regime = self.market_conditions.detect_market_regime(prices)
        
        # Adjust risk based on market regime
        adjusted_params = risk_params.copy()
        
        if market_regime == "bull":
            # Increase risk in bull markets
            adjusted_params["max_risk_per_trade"] = min(risk_params["max_risk_per_trade"] * 1.2, 5.0)
            adjusted_params["take_profit_atr_multiple"] = risk_params["take_profit_atr_multiple"] * 1.2
        elif market_regime == "bear":
            # Decrease risk in bear markets
            adjusted_params["max_risk_per_trade"] = risk_params["max_risk_per_trade"] * 0.8
            adjusted_params["stop_loss_atr_multiple"] = risk_params["stop_loss_atr_multiple"] * 0.8
        elif market_regime == "consolidation":
            # Adjust for range-bound markets
            adjusted_params["max_risk_per_trade"] = risk_params["max_risk_per_trade"] * 0.9
            adjusted_params["take_profit_atr_multiple"] = risk_params["take_profit_atr_multiple"] * 0.9
            
        # Detect volatility regime
        volatility_regime = self.market_conditions.detect_volatility_regime(prices)
        
        # Adjust risk based on volatility
        if volatility_regime == "high":
            # Decrease risk in high volatility
            adjusted_params["max_risk_per_trade"] = adjusted_params["max_risk_per_trade"] * 0.8
            adjusted_params["stop_loss_atr_multiple"] = adjusted_params["stop_loss_atr_multiple"] * 1.2
        elif volatility_regime == "low":
            # Adjust for low volatility
            adjusted_params["stop_loss_atr_multiple"] = adjusted_params["stop_loss_atr_multiple"] * 0.8
            adjusted_params["take_profit_atr_multiple"] = adjusted_params["take_profit_atr_multiple"] * 0.8
            
        return adjusted_params
        
    def _adjust_risk_for_portfolio(
        self,
        risk_params: Dict[str, Any],
        symbol: str,
        portfolio_positions: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Adjust risk parameters based on portfolio.
        
        Args:
            risk_params: Risk parameters
            symbol: Market symbol
            portfolio_positions: Existing portfolio positions
            
        Returns:
            Adjusted risk parameters
        """
        if not portfolio_positions:
            return risk_params
            
        # Count positions with the same symbol
        symbol_positions = [p for p in portfolio_positions if p.get("symbol") == symbol]
        
        # Adjust risk based on existing positions
        adjusted_params = risk_params.copy()
        
        if symbol_positions:
            # Reduce risk if already have positions in this symbol
            adjusted_params["max_risk_per_trade"] = risk_params["max_risk_per_trade"] * 0.8
            
        # Check portfolio concentration
        symbols = [p.get("symbol") for p in portfolio_positions]
        unique_symbols = set(symbols)
        
        if len(portfolio_positions) >= 5:
            # Reduce risk as portfolio grows
            reduction_factor = min(1.0, 5.0 / len(portfolio_positions))
            adjusted_params["max_risk_per_trade"] = risk_params["max_risk_per_trade"] * reduction_factor
            
        return adjusted_params
