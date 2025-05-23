"""
Trading environment for reinforcement learning.

This module provides a trading environment for reinforcement learning agents.
"""
import logging
import numpy as np
import pandas as pd
import gym
from gym import spaces
from typing import Dict, List, Any, Optional, Tuple, Union
from datetime import datetime

from trading_agents.ml.common.feature_engineering import (
    PriceFeatureExtractor, VolumeFeatureExtractor, 
    MomentumFeatureExtractor, VolatilityFeatureExtractor
)

logger = logging.getLogger(__name__)

class TradingEnvironment(gym.Env):
    """Trading environment for reinforcement learning."""
    
    metadata = {'render.modes': ['human']}
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the trading environment.
        
        Args:
            config: Environment configuration
        """
        super(TradingEnvironment, self).__init__()
        
        self.config = config
        
        # Data parameters
        self.data = None
        self.current_step = 0
        self.start_index = 0
        self.end_index = 0
        self.window_size = config.get("window_size", 30)
        
        # Trading parameters
        self.initial_balance = config.get("initial_balance", 10000.0)
        self.transaction_fee = config.get("transaction_fee", 0.001)
        self.reward_scaling = config.get("reward_scaling", 1.0)
        self.max_position = config.get("max_position", 1.0)
        
        # State
        self.balance = self.initial_balance
        self.position = 0.0
        self.position_value = 0.0
        self.total_value = self.initial_balance
        self.last_total_value = self.initial_balance
        self.last_action = 0  # 0: hold, 1: buy, 2: sell
        
        # Feature extractors
        self.feature_extractors = [
            PriceFeatureExtractor(),
            VolumeFeatureExtractor(),
            MomentumFeatureExtractor(),
            VolatilityFeatureExtractor()
        ]
        
        # Action and observation spaces
        self.action_space = spaces.Discrete(3)  # 0: hold, 1: buy, 2: sell
        
        # Observation space will be set when data is loaded
        self.observation_space = None
        self.features = None
        
        # Episode history
        self.history = []
        
    def set_data(self, data: pd.DataFrame):
        """
        Set the data for the environment.
        
        Args:
            data: OHLCV DataFrame
        """
        self.data = data
        
        # Extract features
        self.features = self._extract_features(data)
        
        # Set observation space
        num_features = self.features.shape[1]
        self.observation_space = spaces.Box(
            low=-np.inf, 
            high=np.inf, 
            shape=(self.window_size, num_features + 2),  # +2 for position and balance
            dtype=np.float32
        )
        
        # Set data indices
        self.start_index = self.window_size
        self.end_index = len(data) - 1
        
        logger.info(f"Set data with {len(data)} samples and {num_features} features")
        
    def reset(self) -> np.ndarray:
        """
        Reset the environment.
        
        Returns:
            Initial observation
        """
        # Reset state
        self.balance = self.initial_balance
        self.position = 0.0
        self.position_value = 0.0
        self.total_value = self.initial_balance
        self.last_total_value = self.initial_balance
        self.last_action = 0
        
        # Reset step
        self.current_step = self.start_index
        
        # Reset history
        self.history = []
        
        # Return initial observation
        return self._get_observation()
        
    def step(self, action: int) -> Tuple[np.ndarray, float, bool, Dict[str, Any]]:
        """
        Take a step in the environment.
        
        Args:
            action: Action to take (0: hold, 1: buy, 2: sell)
            
        Returns:
            Tuple of (observation, reward, done, info)
        """
        # Get current price
        current_price = self.data.iloc[self.current_step]["close"]
        
        # Execute action
        self._execute_action(action, current_price)
        
        # Update state
        self.last_action = action
        self.current_step += 1
        
        # Calculate reward
        reward = self._calculate_reward()
        
        # Check if done
        done = self.current_step >= self.end_index
        
        # Get observation
        observation = self._get_observation()
        
        # Get info
        info = {
            "balance": self.balance,
            "position": self.position,
            "position_value": self.position_value,
            "total_value": self.total_value,
            "step": self.current_step,
            "price": current_price,
            "action": action
        }
        
        # Update history
        self.history.append(info)
        
        return observation, reward, done, info
        
    def render(self, mode='human'):
        """
        Render the environment.
        
        Args:
            mode: Rendering mode
        """
        if mode == 'human':
            current_price = self.data.iloc[self.current_step]["close"]
            print(f"Step: {self.current_step}, Price: {current_price:.2f}, "
                  f"Balance: {self.balance:.2f}, Position: {self.position:.4f}, "
                  f"Total Value: {self.total_value:.2f}, Action: {self.last_action}")
            
    def _execute_action(self, action: int, price: float):
        """
        Execute an action.
        
        Args:
            action: Action to take (0: hold, 1: buy, 2: sell)
            price: Current price
        """
        # Update last total value
        self.last_total_value = self.total_value
        
        # Execute action
        if action == 1:  # Buy
            if self.balance > 0:
                # Calculate amount to buy
                amount = self.balance / price
                fee = amount * price * self.transaction_fee
                
                # Update state
                self.position += amount
                self.balance = 0.0
                self.position_value = self.position * price - fee
                
        elif action == 2:  # Sell
            if self.position > 0:
                # Calculate amount to sell
                amount = self.position
                value = amount * price
                fee = value * self.transaction_fee
                
                # Update state
                self.position = 0.0
                self.balance += value - fee
                self.position_value = 0.0
                
        # Update total value
        self.total_value = self.balance + self.position_value
        
    def _calculate_reward(self) -> float:
        """
        Calculate reward.
        
        Returns:
            Reward value
        """
        # Calculate return
        returns = (self.total_value - self.last_total_value) / self.last_total_value
        
        # Scale reward
        reward = returns * self.reward_scaling
        
        return reward
        
    def _get_observation(self) -> np.ndarray:
        """
        Get current observation.
        
        Returns:
            Observation array
        """
        # Get feature window
        feature_window = self.features.iloc[self.current_step - self.window_size:self.current_step].values
        
        # Create position and balance arrays
        position_array = np.ones(self.window_size) * self.position / self.max_position
        balance_array = np.ones(self.window_size) * self.balance / self.initial_balance
        
        # Combine features with position and balance
        observation = np.column_stack([
            feature_window,
            position_array.reshape(-1, 1),
            balance_array.reshape(-1, 1)
        ])
        
        return observation.astype(np.float32)
        
    def _extract_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Extract features from data.
        
        Args:
            data: OHLCV DataFrame
            
        Returns:
            DataFrame with extracted features
        """
        # Initialize features DataFrame
        features = pd.DataFrame(index=data.index)
        
        # Extract features using each extractor
        for extractor in self.feature_extractors:
            extracted = extractor.extract(data)
            features = pd.concat([features, extracted], axis=1)
            
        # Fill NaN values
        features = features.fillna(0)
        
        return features
        
    def get_performance_metrics(self) -> Dict[str, float]:
        """
        Get performance metrics for the episode.
        
        Returns:
            Dictionary of performance metrics
        """
        if not self.history:
            return {}
            
        # Calculate metrics
        initial_value = self.initial_balance
        final_value = self.history[-1]["total_value"]
        
        # Total return
        total_return = (final_value - initial_value) / initial_value * 100
        
        # Sharpe ratio (assuming daily data)
        returns = [h["total_value"] / prev["total_value"] - 1 for h, prev in zip(self.history[1:], self.history[:-1])]
        sharpe_ratio = np.mean(returns) / np.std(returns) * np.sqrt(252) if len(returns) > 0 and np.std(returns) > 0 else 0
        
        # Maximum drawdown
        peak = initial_value
        max_drawdown = 0
        
        for h in self.history:
            value = h["total_value"]
            peak = max(peak, value)
            drawdown = (peak - value) / peak
            max_drawdown = max(max_drawdown, drawdown)
            
        return {
            "total_return": total_return,
            "sharpe_ratio": sharpe_ratio,
            "max_drawdown": max_drawdown * 100,
            "final_value": final_value
        }
