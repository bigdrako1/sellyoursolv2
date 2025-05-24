"""
Reinforcement learning module for trading agents.

This module provides reinforcement learning tools for trading agents,
including environments, agents, and training utilities.
"""
import logging
from typing import Dict, Any, Optional, List, Union, Tuple
import math
import numpy as np
from datetime import datetime, timedelta
import os
import pickle
import json
import random
from collections import deque

logger = logging.getLogger(__name__)

class TradingEnvironment:
    """
    Trading environment for reinforcement learning.
    
    This class provides a trading environment for reinforcement
    learning agents, simulating market conditions and trading
    actions.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the trading environment.
        
        Args:
            config: Environment configuration
        """
        self.config = config or {}
        
        # Environment parameters
        self.initial_balance = self.config.get("initial_balance", 10000.0)
        self.transaction_fee = self.config.get("transaction_fee", 0.001)
        self.window_size = self.config.get("window_size", 20)
        self.reward_scaling = self.config.get("reward_scaling", 1.0)
        
        # Market data
        self.prices = []
        self.features = {}
        self.current_step = 0
        self.done = False
        
        # Trading state
        self.balance = self.initial_balance
        self.shares_held = 0
        self.cost_basis = 0
        self.total_shares_bought = 0
        self.total_shares_sold = 0
        self.total_fees_paid = 0
        
        # Action and observation space
        self.action_space = self.config.get("action_space", 3)  # Buy, Sell, Hold
        self.observation_space = self.config.get("observation_space", self.window_size * len(self.features))
        
        logger.info("Trading environment initialized")
        
    def reset(
        self,
        prices: Optional[List[float]] = None,
        features: Optional[Dict[str, List[float]]] = None
    ) -> np.ndarray:
        """
        Reset the environment.
        
        Args:
            prices: Price series
            features: Feature dictionary
            
        Returns:
            Initial observation
        """
        # Set market data
        if prices is not None:
            self.prices = prices
            
        if features is not None:
            self.features = features
            
        # Reset trading state
        self.balance = self.initial_balance
        self.shares_held = 0
        self.cost_basis = 0
        self.total_shares_bought = 0
        self.total_shares_sold = 0
        self.total_fees_paid = 0
        
        # Reset environment state
        self.current_step = self.window_size
        self.done = False
        
        # Return initial observation
        return self._get_observation()
        
    def step(self, action: int) -> Tuple[np.ndarray, float, bool, Dict[str, Any]]:
        """
        Take a step in the environment.
        
        Args:
            action: Action to take (0: Buy, 1: Sell, 2: Hold)
            
        Returns:
            Tuple of (observation, reward, done, info)
        """
        # Ensure action is valid
        if action < 0 or action >= self.action_space:
            logger.warning(f"Invalid action: {action}")
            action = 2  # Default to Hold
            
        # Get current price
        current_price = self.prices[self.current_step]
        
        # Execute action
        reward = 0
        info = {}
        
        if action == 0:  # Buy
            # Calculate maximum shares that can be bought
            max_shares = self.balance / (current_price * (1 + self.transaction_fee))
            shares_bought = max_shares
            
            # Calculate cost and fees
            cost = shares_bought * current_price
            fees = cost * self.transaction_fee
            
            # Update trading state
            self.balance -= (cost + fees)
            self.shares_held += shares_bought
            self.cost_basis = current_price
            self.total_shares_bought += shares_bought
            self.total_fees_paid += fees
            
            info["action"] = "buy"
            info["shares_bought"] = shares_bought
            info["cost"] = cost
            info["fees"] = fees
            
        elif action == 1:  # Sell
            if self.shares_held > 0:
                # Calculate proceeds and fees
                proceeds = self.shares_held * current_price
                fees = proceeds * self.transaction_fee
                
                # Calculate profit/loss
                profit = proceeds - (self.shares_held * self.cost_basis) - fees
                
                # Update trading state
                self.balance += (proceeds - fees)
                self.total_shares_sold += self.shares_held
                self.total_fees_paid += fees
                self.shares_held = 0
                
                # Calculate reward based on profit
                reward = profit * self.reward_scaling
                
                info["action"] = "sell"
                info["shares_sold"] = self.shares_held
                info["proceeds"] = proceeds
                info["fees"] = fees
                info["profit"] = profit
            else:
                info["action"] = "sell"
                info["error"] = "no_shares_held"
                
        else:  # Hold
            info["action"] = "hold"
            
        # Move to next step
        self.current_step += 1
        
        # Check if done
        if self.current_step >= len(self.prices) - 1:
            self.done = True
            
            # Sell any remaining shares
            if self.shares_held > 0:
                # Calculate proceeds and fees
                proceeds = self.shares_held * current_price
                fees = proceeds * self.transaction_fee
                
                # Calculate profit/loss
                profit = proceeds - (self.shares_held * self.cost_basis) - fees
                
                # Update trading state
                self.balance += (proceeds - fees)
                self.total_shares_sold += self.shares_held
                self.total_fees_paid += fees
                self.shares_held = 0
                
                # Add to reward
                reward += profit * self.reward_scaling
                
                info["final_sell"] = True
                info["shares_sold"] = self.shares_held
                info["proceeds"] = proceeds
                info["fees"] = fees
                info["profit"] = profit
                
            # Calculate final portfolio value
            final_value = self.balance + (self.shares_held * current_price)
            
            # Calculate return
            returns = (final_value / self.initial_balance - 1) * 100
            
            info["final_balance"] = self.balance
            info["final_shares_held"] = self.shares_held
            info["final_portfolio_value"] = final_value
            info["returns"] = returns
            
        # Get next observation
        observation = self._get_observation()
        
        return observation, reward, self.done, info
        
    def _get_observation(self) -> np.ndarray:
        """
        Get the current observation.
        
        Returns:
            Observation vector
        """
        # Get window of price data
        price_window = self.prices[self.current_step - self.window_size:self.current_step]
        
        # Normalize price window
        price_mean = np.mean(price_window)
        price_std = np.std(price_window)
        normalized_prices = [(p - price_mean) / price_std if price_std > 0 else 0 for p in price_window]
        
        # Get feature windows
        feature_windows = []
        for feature_name, feature_values in self.features.items():
            if len(feature_values) > self.current_step:
                feature_window = feature_values[self.current_step - self.window_size:self.current_step]
                
                # Normalize feature window
                feature_mean = np.mean([f for f in feature_window if not np.isnan(f)])
                feature_std = np.std([f for f in feature_window if not np.isnan(f)])
                
                normalized_feature = [
                    (f - feature_mean) / feature_std if not np.isnan(f) and feature_std > 0 else 0
                    for f in feature_window
                ]
                
                feature_windows.extend(normalized_feature)
                
        # Combine price and feature data
        observation = np.array(normalized_prices + feature_windows)
        
        # Add portfolio state
        portfolio_state = [
            self.balance / self.initial_balance,
            self.shares_held * self.prices[self.current_step] / self.initial_balance,
            1 if self.shares_held > 0 else 0
        ]
        
        return np.concatenate((observation, portfolio_state))


class DQNAgent:
    """
    Deep Q-Network agent for reinforcement learning.
    
    This class provides a DQN agent for reinforcement learning
    in trading environments.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the DQN agent.
        
        Args:
            config: Agent configuration
        """
        self.config = config or {}
        
        # Agent parameters
        self.state_size = self.config.get("state_size", 23)
        self.action_size = self.config.get("action_size", 3)
        self.memory_size = self.config.get("memory_size", 1000)
        self.gamma = self.config.get("gamma", 0.95)
        self.epsilon = self.config.get("epsilon", 1.0)
        self.epsilon_min = self.config.get("epsilon_min", 0.01)
        self.epsilon_decay = self.config.get("epsilon_decay", 0.995)
        self.learning_rate = self.config.get("learning_rate", 0.001)
        self.batch_size = self.config.get("batch_size", 32)
        
        # Initialize memory
        self.memory = deque(maxlen=self.memory_size)
        
        # Initialize model
        self.model = self._build_model()
        self.target_model = self._build_model()
        self.update_target_model()
        
        logger.info("DQN agent initialized")
        
    def _build_model(self) -> Dict[str, Any]:
        """
        Build a simple neural network model.
        
        Returns:
            Model parameters
        """
        # This is a simplified model representation
        # In a real implementation, this would use a deep learning framework
        
        # Initialize weights with random values
        input_layer = np.random.randn(self.state_size, 24) * 0.1
        hidden_layer = np.random.randn(24, 24) * 0.1
        output_layer = np.random.randn(24, self.action_size) * 0.1
        
        # Initialize biases with zeros
        input_bias = np.zeros(24)
        hidden_bias = np.zeros(24)
        output_bias = np.zeros(self.action_size)
        
        return {
            "input_layer": input_layer,
            "hidden_layer": hidden_layer,
            "output_layer": output_layer,
            "input_bias": input_bias,
            "hidden_bias": hidden_bias,
            "output_bias": output_bias
        }
        
    def update_target_model(self):
        """Update target model with weights from main model."""
        self.target_model = {k: v.copy() for k, v in self.model.items()}
        
    def remember(self, state: np.ndarray, action: int, reward: float, next_state: np.ndarray, done: bool):
        """
        Store experience in memory.
        
        Args:
            state: Current state
            action: Action taken
            reward: Reward received
            next_state: Next state
            done: Whether episode is done
        """
        self.memory.append((state, action, reward, next_state, done))
        
    def act(self, state: np.ndarray) -> int:
        """
        Choose an action based on the current state.
        
        Args:
            state: Current state
            
        Returns:
            Action to take
        """
        # Epsilon-greedy action selection
        if np.random.rand() <= self.epsilon:
            return random.randrange(self.action_size)
            
        # Get Q-values from model
        q_values = self._predict(state)
        
        return np.argmax(q_values)
        
    def replay(self, batch_size: Optional[int] = None) -> float:
        """
        Train the model with experiences from memory.
        
        Args:
            batch_size: Number of experiences to sample
            
        Returns:
            Loss value
        """
        if batch_size is None:
            batch_size = self.batch_size
            
        # Check if memory has enough experiences
        if len(self.memory) < batch_size:
            return 0.0
            
        # Sample batch from memory
        minibatch = random.sample(self.memory, batch_size)
        
        # Initialize arrays for training
        states = np.zeros((batch_size, self.state_size))
        targets = np.zeros((batch_size, self.action_size))
        
        # Prepare training data
        for i, (state, action, reward, next_state, done) in enumerate(minibatch):
            states[i] = state
            
            # Get target Q-values
            target = self._predict(state)
            
            if done:
                target[action] = reward
            else:
                # Get Q-values for next state from target model
                t = self._predict(next_state, use_target=True)
                target[action] = reward + self.gamma * np.amax(t)
                
            targets[i] = target
            
        # Train model
        loss = self._train(states, targets)
        
        # Decay epsilon
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay
            
        return loss
        
    def _predict(self, state: np.ndarray, use_target: bool = False) -> np.ndarray:
        """
        Make predictions with the model.
        
        Args:
            state: Input state
            use_target: Whether to use target model
            
        Returns:
            Q-values
        """
        # Reshape state if needed
        if state.ndim == 1:
            state = state.reshape(1, -1)
            
        # Select model
        model = self.target_model if use_target else self.model
        
        # Forward pass
        hidden = np.tanh(state @ model["input_layer"] + model["input_bias"])
        hidden = np.tanh(hidden @ model["hidden_layer"] + model["hidden_bias"])
        output = hidden @ model["output_layer"] + model["output_bias"]
        
        return output[0]
        
    def _train(self, states: np.ndarray, targets: np.ndarray) -> float:
        """
        Train the model.
        
        Args:
            states: Input states
            targets: Target Q-values
            
        Returns:
            Loss value
        """
        # This is a simplified training function
        # In a real implementation, this would use backpropagation
        
        # Calculate loss
        predictions = np.zeros((len(states), self.action_size))
        for i, state in enumerate(states):
            predictions[i] = self._predict(state)
            
        loss = np.mean((predictions - targets) ** 2)
        
        # Update weights (simplified)
        # In a real implementation, this would use gradient descent
        
        return loss
        
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
                "state_size": self.state_size,
                "action_size": self.action_size,
                "epsilon": self.epsilon,
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
                
            # Update target model
            self.update_target_model()
                
            # Load metadata
            try:
                with open(f"{path}.json", "r") as f:
                    metadata = json.load(f)
                    
                self.state_size = metadata.get("state_size", self.state_size)
                self.action_size = metadata.get("action_size", self.action_size)
                self.epsilon = metadata.get("epsilon", self.epsilon)
                self.config.update(metadata.get("config", {}))
            except Exception as e:
                logger.warning(f"Error loading model metadata: {str(e)}")
                
            logger.info(f"Model loaded from {path}")
            return True
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            return False
