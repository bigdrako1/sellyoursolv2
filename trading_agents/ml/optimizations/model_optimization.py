"""
Model architecture optimization for machine learning components.

This module provides optimized model architectures for machine learning components.
"""
import logging
import time
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import tensorflow as tf

logger = logging.getLogger(__name__)

class OptimizedDQNModel:
    """Optimized DQN model architecture."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the optimized DQN model.
        
        Args:
            config: Model configuration
        """
        self.config = config
        
        # Model parameters
        self.state_size = config.get("state_size", (30, 32))
        self.action_size = config.get("action_size", 3)
        self.learning_rate = config.get("learning_rate", 0.001)
        
        # Build model
        self.model = self._build_model()
        
        # Compile model
        self.model.compile(
            loss="mse",
            optimizer=tf.keras.optimizers.Adam(learning_rate=self.learning_rate)
        )
        
        # Model statistics
        self.stats = {
            "inference_count": 0,
            "inference_time": 0.0,
            "training_count": 0,
            "training_time": 0.0
        }
        
        logger.info(f"Initialized optimized DQN model with state size {self.state_size} and action size {self.action_size}")
    
    def _build_model(self) -> tf.keras.Model:
        """
        Build the neural network model.
        
        Returns:
            Keras model
        """
        # Input layer
        input_shape = self.state_size
        inputs = tf.keras.layers.Input(shape=input_shape)
        
        # Separable CNN layers for efficiency
        x = tf.keras.layers.SeparableConv1D(filters=64, kernel_size=3, padding='same', activation='relu')(inputs)
        x = tf.keras.layers.MaxPooling1D(pool_size=2)(x)
        x = tf.keras.layers.SeparableConv1D(filters=128, kernel_size=3, padding='same', activation='relu')(x)
        x = tf.keras.layers.MaxPooling1D(pool_size=2)(x)
        x = tf.keras.layers.Flatten()(x)
        
        # Dense layers with reduced size
        x = tf.keras.layers.Dense(64, activation='relu')(x)
        x = tf.keras.layers.Dropout(0.2)(x)
        
        # Output layer
        outputs = tf.keras.layers.Dense(self.action_size, activation='linear')(x)
        
        # Create model
        model = tf.keras.Model(inputs=inputs, outputs=outputs)
        
        return model
    
    def predict(self, state: np.ndarray) -> np.ndarray:
        """
        Predict action values for a state.
        
        Args:
            state: State array
            
        Returns:
            Action values
        """
        # Ensure state has correct shape
        if len(state.shape) == 2:
            state = np.expand_dims(state, axis=0)
        
        # Make prediction
        start_time = time.time()
        q_values = self.model.predict(state, verbose=0)
        inference_time = time.time() - start_time
        
        # Update statistics
        self.stats["inference_count"] += 1
        self.stats["inference_time"] += inference_time
        
        return q_values
    
    def train(self, states: np.ndarray, targets: np.ndarray) -> float:
        """
        Train the model.
        
        Args:
            states: State arrays
            targets: Target values
            
        Returns:
            Training loss
        """
        # Train model
        start_time = time.time()
        history = self.model.fit(states, targets, epochs=1, verbose=0)
        training_time = time.time() - start_time
        
        # Get loss
        loss = history.history['loss'][0]
        
        # Update statistics
        self.stats["training_count"] += 1
        self.stats["training_time"] += training_time
        
        return loss
    
    def save(self, path: str):
        """
        Save the model.
        
        Args:
            path: Model path
        """
        self.model.save(path)
        logger.info(f"Saved model to {path}")
    
    @classmethod
    def load(cls, path: str, config: Dict[str, Any]) -> 'OptimizedDQNModel':
        """
        Load a model.
        
        Args:
            path: Model path
            config: Model configuration
            
        Returns:
            Loaded model
        """
        # Create instance
        instance = cls(config)
        
        # Load model
        instance.model = tf.keras.models.load_model(path)
        
        logger.info(f"Loaded model from {path}")
        
        return instance
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get model statistics.
        
        Returns:
            Model statistics
        """
        avg_inference_time = self.stats["inference_time"] / self.stats["inference_count"] if self.stats["inference_count"] > 0 else 0
        avg_training_time = self.stats["training_time"] / self.stats["training_count"] if self.stats["training_count"] > 0 else 0
        
        return {
            "inference_count": self.stats["inference_count"],
            "inference_time": self.stats["inference_time"],
            "avg_inference_time": avg_inference_time,
            "training_count": self.stats["training_count"],
            "training_time": self.stats["training_time"],
            "avg_training_time": avg_training_time,
            "model_size": self._get_model_size()
        }
    
    def _get_model_size(self) -> int:
        """
        Get model size in bytes.
        
        Returns:
            Model size in bytes
        """
        # Save model to temporary file
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(suffix='.h5', delete=True) as tmp:
            self.model.save(tmp.name)
            size = os.path.getsize(tmp.name)
            
        return size

class OptimizedModelFactory:
    """Factory for creating optimized models."""
    
    @staticmethod
    def create_dqn_model(config: Dict[str, Any]) -> OptimizedDQNModel:
        """
        Create an optimized DQN model.
        
        Args:
            config: Model configuration
            
        Returns:
            Optimized DQN model
        """
        return OptimizedDQNModel(config)
    
    @staticmethod
    def load_dqn_model(path: str, config: Dict[str, Any]) -> OptimizedDQNModel:
        """
        Load an optimized DQN model.
        
        Args:
            path: Model path
            config: Model configuration
            
        Returns:
            Optimized DQN model
        """
        return OptimizedDQNModel.load(path, config)
