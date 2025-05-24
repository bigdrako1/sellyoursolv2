"""
Agent interface for trading agents.

This module defines the interface that all trading agents must implement.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime


class TradingAgent(ABC):
    """
    Abstract base class for all trading agents.
    
    All trading agents must implement this interface to be compatible
    with the MoonDev Trading AI framework.
    """
    
    @abstractmethod
    def initialize(self, config: Dict[str, Any]) -> bool:
        """
        Initialize the agent with the given configuration.
        
        Args:
            config: Agent configuration
            
        Returns:
            True if initialization was successful, False otherwise
        """
        pass
        
    @abstractmethod
    def start(self) -> bool:
        """
        Start the agent.
        
        Returns:
            True if the agent was started successfully, False otherwise
        """
        pass
        
    @abstractmethod
    def stop(self) -> bool:
        """
        Stop the agent.
        
        Returns:
            True if the agent was stopped successfully, False otherwise
        """
        pass
        
    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """
        Get the current status of the agent.
        
        Returns:
            Dictionary containing the agent's status
        """
        pass
        
    @abstractmethod
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get the agent's performance metrics.
        
        Returns:
            Dictionary containing the agent's metrics
        """
        pass
        
    @abstractmethod
    def execute_action(self, action_type: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a custom action.
        
        Args:
            action_type: Type of action to execute
            parameters: Action parameters
            
        Returns:
            Dictionary containing the result of the action
        """
        pass
        
    @abstractmethod
    def update_config(self, config: Dict[str, Any]) -> bool:
        """
        Update the agent's configuration.
        
        Args:
            config: New configuration
            
        Returns:
            True if the configuration was updated successfully, False otherwise
        """
        pass
        
    @abstractmethod
    def get_logs(self, limit: int = 100, level: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get the agent's logs.
        
        Args:
            limit: Maximum number of logs to return
            level: Log level filter
            
        Returns:
            List of log entries
        """
        pass


class AIAgent(TradingAgent):
    """
    Abstract base class for AI agents.
    
    AI agents extend the basic trading agent interface with
    additional methods for AI-specific functionality.
    """
    
    @abstractmethod
    def train(self, training_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Train the AI agent with the given data.
        
        Args:
            training_data: Training data
            
        Returns:
            Dictionary containing training results
        """
        pass
        
    @abstractmethod
    def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make a prediction using the AI agent.
        
        Args:
            input_data: Input data for prediction
            
        Returns:
            Dictionary containing prediction results
        """
        pass
        
    @abstractmethod
    def evaluate(self, evaluation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate the AI agent's performance.
        
        Args:
            evaluation_data: Evaluation data
            
        Returns:
            Dictionary containing evaluation results
        """
        pass
        
    @abstractmethod
    def save_model(self, path: str) -> bool:
        """
        Save the AI agent's model.
        
        Args:
            path: Path to save the model
            
        Returns:
            True if the model was saved successfully, False otherwise
        """
        pass
        
    @abstractmethod
    def load_model(self, path: str) -> bool:
        """
        Load the AI agent's model.
        
        Args:
            path: Path to load the model from
            
        Returns:
            True if the model was loaded successfully, False otherwise
        """
        pass
