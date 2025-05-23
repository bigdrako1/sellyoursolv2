"""
Reinforcement learning agents for trading.

This module provides reinforcement learning agents for trading.
"""
import logging
import os
import json
import pickle
import numpy as np
import tensorflow as tf
from typing import Dict, List, Any, Optional, Tuple, Union
from datetime import datetime
from collections import deque
import random

from trading_agents.ml.reinforcement.environment import TradingEnvironment

logger = logging.getLogger(__name__)

class DQNAgent:
    """Deep Q-Network agent for trading."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the DQN agent.
        
        Args:
            config: Agent configuration
        """
        self.config = config
        
        # Environment parameters
        self.state_size = config.get("state_size", (30, 32))
        self.action_size = config.get("action_size", 3)
        
        # Learning parameters
        self.gamma = config.get("gamma", 0.95)
        self.epsilon = config.get("epsilon", 1.0)
        self.epsilon_min = config.get("epsilon_min", 0.01)
        self.epsilon_decay = config.get("epsilon_decay", 0.995)
        self.learning_rate = config.get("learning_rate", 0.001)
        self.batch_size = config.get("batch_size", 32)
        self.train_start = config.get("train_start", 1000)
        
        # Memory
        self.memory = deque(maxlen=config.get("memory_size", 2000))
        
        # Models
        self.model = self._build_model()
        self.target_model = self._build_model()
        self.update_target_model()
        
        # Training metrics
        self.loss_history = []
        
        # Model directory
        self.model_dir = config.get("model_dir", "models")
        os.makedirs(self.model_dir, exist_ok=True)
        
    def _build_model(self) -> tf.keras.Model:
        """
        Build the neural network model.
        
        Returns:
            Keras model
        """
        # Input layer
        input_shape = self.state_size
        inputs = tf.keras.layers.Input(shape=input_shape)
        
        # CNN layers
        x = tf.keras.layers.Conv1D(filters=64, kernel_size=3, padding='same', activation='relu')(inputs)
        x = tf.keras.layers.MaxPooling1D(pool_size=2)(x)
        x = tf.keras.layers.Conv1D(filters=128, kernel_size=3, padding='same', activation='relu')(x)
        x = tf.keras.layers.MaxPooling1D(pool_size=2)(x)
        x = tf.keras.layers.Flatten()(x)
        
        # Dense layers
        x = tf.keras.layers.Dense(128, activation='relu')(x)
        x = tf.keras.layers.Dropout(0.2)(x)
        x = tf.keras.layers.Dense(64, activation='relu')(x)
        
        # Output layer
        outputs = tf.keras.layers.Dense(self.action_size, activation='linear')(x)
        
        # Create model
        model = tf.keras.Model(inputs=inputs, outputs=outputs)
        
        # Compile model
        model.compile(
            loss='mse',
            optimizer=tf.keras.optimizers.Adam(learning_rate=self.learning_rate)
        )
        
        return model
        
    def update_target_model(self):
        """Update target model with weights from main model."""
        self.target_model.set_weights(self.model.get_weights())
        
    def remember(self, state: np.ndarray, action: int, reward: float, next_state: np.ndarray, done: bool):
        """
        Store experience in memory.
        
        Args:
            state: Current state
            action: Action taken
            reward: Reward received
            next_state: Next state
            done: Whether the episode is done
        """
        self.memory.append((state, action, reward, next_state, done))
        
    def act(self, state: np.ndarray, training: bool = True) -> int:
        """
        Choose an action based on the current state.
        
        Args:
            state: Current state
            training: Whether the agent is training
            
        Returns:
            Action to take
        """
        if training and np.random.rand() <= self.epsilon:
            # Exploration: random action
            return random.randrange(self.action_size)
        else:
            # Exploitation: predict action values
            state = np.expand_dims(state, axis=0)
            q_values = self.model.predict(state, verbose=0)[0]
            return np.argmax(q_values)
            
    def replay(self) -> float:
        """
        Train the model with experiences from memory.
        
        Returns:
            Training loss
        """
        if len(self.memory) < self.train_start:
            return 0.0
            
        # Sample batch from memory
        minibatch = random.sample(self.memory, self.batch_size)
        
        # Extract batch data
        states = np.array([experience[0] for experience in minibatch])
        actions = np.array([experience[1] for experience in minibatch])
        rewards = np.array([experience[2] for experience in minibatch])
        next_states = np.array([experience[3] for experience in minibatch])
        dones = np.array([experience[4] for experience in minibatch])
        
        # Calculate target Q values
        target = self.model.predict(states, verbose=0)
        target_next = self.target_model.predict(next_states, verbose=0)
        
        for i in range(self.batch_size):
            if dones[i]:
                target[i][actions[i]] = rewards[i]
            else:
                target[i][actions[i]] = rewards[i] + self.gamma * np.amax(target_next[i])
                
        # Train model
        history = self.model.fit(states, target, epochs=1, verbose=0)
        loss = history.history['loss'][0]
        self.loss_history.append(loss)
        
        # Update epsilon
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay
            
        return loss
        
    def train(self, env: TradingEnvironment, episodes: int, update_target_every: int = 5) -> Dict[str, List[float]]:
        """
        Train the agent on the environment.
        
        Args:
            env: Trading environment
            episodes: Number of episodes to train
            update_target_every: Number of episodes between target model updates
            
        Returns:
            Dictionary of training metrics
        """
        # Training metrics
        rewards_history = []
        returns_history = []
        
        for episode in range(episodes):
            # Reset environment
            state = env.reset()
            total_reward = 0
            
            # Episode loop
            done = False
            while not done:
                # Choose action
                action = self.act(state)
                
                # Take action
                next_state, reward, done, info = env.step(action)
                
                # Store experience
                self.remember(state, action, reward, next_state, done)
                
                # Update state
                state = next_state
                
                # Update total reward
                total_reward += reward
                
                # Train model
                self.replay()
                
            # Update target model
            if episode % update_target_every == 0:
                self.update_target_model()
                
            # Get episode performance
            metrics = env.get_performance_metrics()
            total_return = metrics.get("total_return", 0.0)
            
            # Store metrics
            rewards_history.append(total_reward)
            returns_history.append(total_return)
            
            # Log progress
            logger.info(f"Episode: {episode+1}/{episodes}, Reward: {total_reward:.2f}, "
                       f"Return: {total_return:.2f}%, Epsilon: {self.epsilon:.4f}")
                       
        return {
            "rewards": rewards_history,
            "returns": returns_history,
            "losses": self.loss_history
        }
        
    def save(self, model_id: str) -> str:
        """
        Save the agent.
        
        Args:
            model_id: Model ID
            
        Returns:
            Path where the model was saved
        """
        # Create model directory
        model_path = os.path.join(self.model_dir, model_id)
        os.makedirs(model_path, exist_ok=True)
        
        # Save model
        self.model.save(os.path.join(model_path, "model"))
        
        # Save agent configuration
        with open(os.path.join(model_path, "config.json"), "w") as f:
            json.dump(self.config, f, indent=2)
            
        # Save agent state
        agent_state = {
            "epsilon": self.epsilon,
            "loss_history": self.loss_history
        }
        
        with open(os.path.join(model_path, "state.pkl"), "wb") as f:
            pickle.dump(agent_state, f)
            
        logger.info(f"Saved agent to {model_path}")
        
        return model_path
        
    @classmethod
    def load(cls, model_id: str, model_dir: str = "models") -> 'DQNAgent':
        """
        Load an agent.
        
        Args:
            model_id: Model ID
            model_dir: Model directory
            
        Returns:
            Loaded agent
        """
        # Get model path
        model_path = os.path.join(model_dir, model_id)
        
        # Load configuration
        with open(os.path.join(model_path, "config.json"), "r") as f:
            config = json.load(f)
            
        # Create agent
        agent = cls(config)
        
        # Load model
        agent.model = tf.keras.models.load_model(os.path.join(model_path, "model"))
        agent.target_model = tf.keras.models.load_model(os.path.join(model_path, "model"))
        
        # Load agent state
        with open(os.path.join(model_path, "state.pkl"), "rb") as f:
            agent_state = pickle.load(f)
            
        agent.epsilon = agent_state["epsilon"]
        agent.loss_history = agent_state["loss_history"]
        
        logger.info(f"Loaded agent from {model_path}")
        
        return agent
