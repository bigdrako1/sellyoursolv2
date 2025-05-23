"""
Reinforcement learning trainer for trading agents.

This module provides a trainer for reinforcement learning trading agents.
"""
import logging
import os
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from typing import Dict, List, Any, Optional, Tuple, Union
from datetime import datetime

from trading_agents.ml.reinforcement.environment import TradingEnvironment
from trading_agents.ml.reinforcement.agent import DQNAgent

logger = logging.getLogger(__name__)

class RLTrainer:
    """Trainer for reinforcement learning trading agents."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the RL trainer.
        
        Args:
            config: Trainer configuration
        """
        self.config = config
        
        # Environment configuration
        self.env_config = config.get("environment", {})
        
        # Agent configuration
        self.agent_config = config.get("agent", {})
        
        # Training configuration
        self.episodes = config.get("episodes", 100)
        self.update_target_every = config.get("update_target_every", 5)
        self.validation_episodes = config.get("validation_episodes", 10)
        
        # Data configuration
        self.train_data = None
        self.validation_data = None
        self.test_data = None
        
        # Output directory
        self.output_dir = config.get("output_dir", "results")
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Initialize environment and agent
        self.env = None
        self.agent = None
        
    def load_data(self, train_data: pd.DataFrame, validation_data: pd.DataFrame = None, test_data: pd.DataFrame = None):
        """
        Load data for training, validation, and testing.
        
        Args:
            train_data: Training data
            validation_data: Validation data
            test_data: Test data
        """
        self.train_data = train_data
        self.validation_data = validation_data
        self.test_data = test_data
        
        logger.info(f"Loaded data: train={len(train_data)} samples")
        if validation_data is not None:
            logger.info(f"validation={len(validation_data)} samples")
        if test_data is not None:
            logger.info(f"test={len(test_data)} samples")
            
    def initialize(self):
        """Initialize the environment and agent."""
        # Create environment
        self.env = TradingEnvironment(self.env_config)
        
        # Set environment data
        self.env.set_data(self.train_data)
        
        # Update agent config with environment info
        window_size = self.env_config.get("window_size", 30)
        num_features = self.env.features.shape[1] + 2  # +2 for position and balance
        
        self.agent_config.update({
            "state_size": (window_size, num_features),
            "action_size": self.env.action_space.n
        })
        
        # Create agent
        self.agent = DQNAgent(self.agent_config)
        
        logger.info(f"Initialized environment and agent")
        
    def train(self) -> Dict[str, Any]:
        """
        Train the agent.
        
        Returns:
            Dictionary of training results
        """
        if self.env is None or self.agent is None:
            self.initialize()
            
        # Train agent
        logger.info(f"Starting training for {self.episodes} episodes")
        train_metrics = self.agent.train(self.env, self.episodes, self.update_target_every)
        
        # Validate agent
        validation_metrics = None
        if self.validation_data is not None:
            validation_metrics = self.validate()
            
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_id = f"rl_agent_{timestamp}"
        
        # Save agent
        model_path = self.agent.save(model_id)
        
        # Save training metrics
        results = {
            "model_id": model_id,
            "train_metrics": train_metrics,
            "validation_metrics": validation_metrics
        }
        
        with open(os.path.join(self.output_dir, f"{model_id}_results.json"), "w") as f:
            json.dump(results, f, indent=2, default=str)
            
        # Plot results
        self._plot_results(train_metrics, validation_metrics, model_id)
        
        logger.info(f"Training completed, model saved as {model_id}")
        
        return results
        
    def validate(self) -> Dict[str, Any]:
        """
        Validate the agent on validation data.
        
        Returns:
            Dictionary of validation metrics
        """
        if self.validation_data is None:
            logger.warning("No validation data provided")
            return None
            
        # Create validation environment
        val_env = TradingEnvironment(self.env_config)
        val_env.set_data(self.validation_data)
        
        # Validation metrics
        rewards = []
        returns = []
        
        # Run validation episodes
        for episode in range(self.validation_episodes):
            # Reset environment
            state = val_env.reset()
            total_reward = 0
            
            # Episode loop
            done = False
            while not done:
                # Choose action (no exploration)
                action = self.agent.act(state, training=False)
                
                # Take action
                next_state, reward, done, info = val_env.step(action)
                
                # Update state
                state = next_state
                
                # Update total reward
                total_reward += reward
                
            # Get episode performance
            metrics = val_env.get_performance_metrics()
            total_return = metrics.get("total_return", 0.0)
            
            # Store metrics
            rewards.append(total_reward)
            returns.append(total_return)
            
            logger.info(f"Validation Episode {episode+1}/{self.validation_episodes}, "
                       f"Reward: {total_reward:.2f}, Return: {total_return:.2f}%")
                       
        # Calculate average metrics
        avg_reward = np.mean(rewards)
        avg_return = np.mean(returns)
        
        logger.info(f"Validation Results: Avg Reward: {avg_reward:.2f}, Avg Return: {avg_return:.2f}%")
        
        return {
            "rewards": rewards,
            "returns": returns,
            "avg_reward": float(avg_reward),
            "avg_return": float(avg_return)
        }
        
    def test(self, model_id: str = None) -> Dict[str, Any]:
        """
        Test the agent on test data.
        
        Args:
            model_id: Model ID to load (if None, use current agent)
            
        Returns:
            Dictionary of test metrics
        """
        if self.test_data is None:
            logger.warning("No test data provided")
            return None
            
        # Load agent if model_id is provided
        if model_id is not None:
            self.agent = DQNAgent.load(model_id)
            
        # Create test environment
        test_env = TradingEnvironment(self.env_config)
        test_env.set_data(self.test_data)
        
        # Reset environment
        state = test_env.reset()
        
        # Episode loop
        done = False
        actions = []
        
        while not done:
            # Choose action (no exploration)
            action = self.agent.act(state, training=False)
            
            # Take action
            next_state, reward, done, info = test_env.step(action)
            
            # Update state
            state = next_state
            
            # Store action
            actions.append(action)
            
        # Get episode performance
        metrics = test_env.get_performance_metrics()
        
        # Get history
        history = test_env.history
        
        # Calculate additional metrics
        num_trades = sum(1 for i in range(1, len(actions)) if actions[i] != actions[i-1] and actions[i] != 0)
        
        # Log results
        logger.info(f"Test Results: Return: {metrics['total_return']:.2f}%, "
                   f"Sharpe: {metrics['sharpe_ratio']:.2f}, "
                   f"Max Drawdown: {metrics['max_drawdown']:.2f}%, "
                   f"Trades: {num_trades}")
                   
        # Plot test results
        self._plot_test_results(history, metrics, model_id or "current_agent")
        
        return {
            "metrics": metrics,
            "num_trades": num_trades,
            "history": history
        }
        
    def _plot_results(self, train_metrics: Dict[str, List[float]], validation_metrics: Dict[str, Any], model_id: str):
        """
        Plot training and validation results.
        
        Args:
            train_metrics: Training metrics
            validation_metrics: Validation metrics
            model_id: Model ID
        """
        # Create figure
        fig, axs = plt.subplots(3, 1, figsize=(10, 15))
        
        # Plot rewards
        axs[0].plot(train_metrics["rewards"], label="Train")
        if validation_metrics:
            axs[0].axhline(y=validation_metrics["avg_reward"], color='r', linestyle='-', label="Validation Avg")
        axs[0].set_title("Rewards")
        axs[0].set_xlabel("Episode")
        axs[0].set_ylabel("Total Reward")
        axs[0].legend()
        
        # Plot returns
        axs[1].plot(train_metrics["returns"], label="Train")
        if validation_metrics:
            axs[1].axhline(y=validation_metrics["avg_return"], color='r', linestyle='-', label="Validation Avg")
        axs[1].set_title("Returns")
        axs[1].set_xlabel("Episode")
        axs[1].set_ylabel("Return (%)")
        axs[1].legend()
        
        # Plot losses
        axs[2].plot(train_metrics["losses"])
        axs[2].set_title("Training Loss")
        axs[2].set_xlabel("Training Step")
        axs[2].set_ylabel("Loss")
        
        # Save figure
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, f"{model_id}_training.png"))
        plt.close()
        
    def _plot_test_results(self, history: List[Dict[str, Any]], metrics: Dict[str, float], model_id: str):
        """
        Plot test results.
        
        Args:
            history: Episode history
            metrics: Performance metrics
            model_id: Model ID
        """
        # Extract data
        steps = [h["step"] for h in history]
        prices = [h["price"] for h in history]
        total_values = [h["total_value"] for h in history]
        actions = [h["action"] for h in history]
        
        # Create figure
        fig, axs = plt.subplots(2, 1, figsize=(12, 10))
        
        # Plot price and actions
        axs[0].plot(steps, prices, label="Price")
        
        # Plot buy and sell points
        buy_steps = [steps[i] for i in range(len(steps)) if actions[i] == 1]
        buy_prices = [prices[i] for i in range(len(prices)) if actions[i] == 1]
        sell_steps = [steps[i] for i in range(len(steps)) if actions[i] == 2]
        sell_prices = [prices[i] for i in range(len(prices)) if actions[i] == 2]
        
        axs[0].scatter(buy_steps, buy_prices, color='g', marker='^', label="Buy")
        axs[0].scatter(sell_steps, sell_prices, color='r', marker='v', label="Sell")
        
        axs[0].set_title(f"Price and Actions (Return: {metrics['total_return']:.2f}%)")
        axs[0].set_xlabel("Step")
        axs[0].set_ylabel("Price")
        axs[0].legend()
        
        # Plot portfolio value
        axs[1].plot(steps, total_values)
        axs[1].set_title(f"Portfolio Value (Sharpe: {metrics['sharpe_ratio']:.2f}, Max DD: {metrics['max_drawdown']:.2f}%)")
        axs[1].set_xlabel("Step")
        axs[1].set_ylabel("Value")
        
        # Save figure
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, f"{model_id}_test.png"))
        plt.close()
