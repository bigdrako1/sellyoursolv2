"""
Agent factory for registering agent types.
"""
import logging
import importlib
import inspect
from typing import Dict, Type, Any

from core.base_agent import BaseAgent
from agents.copy_trading_agent import CopyTradingAgent
from agents.liquidation_agent import LiquidationAgent
from agents.scanner_agent import ScannerAgent
from agents.sniper_agent import SniperAgent

logger = logging.getLogger(__name__)

class AgentFactory:
    """
    Factory for creating agent instances.
    """
    
    _agent_types: Dict[str, Type[BaseAgent]] = {}
    
    @classmethod
    def register_agent_type(cls, agent_type: str, agent_class: Type[BaseAgent]) -> None:
        """
        Register an agent type.
        
        Args:
            agent_type: Type identifier for the agent
            agent_class: Agent class
        """
        cls._agent_types[agent_type] = agent_class
        logger.info(f"Registered agent type: {agent_type}")
        
    @classmethod
    def get_agent_class(cls, agent_type: str) -> Type[BaseAgent]:
        """
        Get agent class by type.
        
        Args:
            agent_type: Type of agent
            
        Returns:
            Agent class
            
        Raises:
            ValueError: If agent_type is not recognized
        """
        if agent_type in cls._agent_types:
            return cls._agent_types[agent_type]
            
        # Try to load agent class dynamically
        try:
            # Convert agent_type to class name (e.g., "copy_trading" -> "CopyTradingAgent")
            class_name = ''.join(word.capitalize() for word in agent_type.split('_')) + 'Agent'
            
            # Import agent module
            module = importlib.import_module(f"agents.{agent_type}_agent")
            
            # Get agent class
            for name, obj in inspect.getmembers(module):
                if inspect.isclass(obj) and issubclass(obj, BaseAgent) and obj != BaseAgent:
                    if name == class_name:
                        cls._agent_types[agent_type] = obj
                        return obj
            
            raise ValueError(f"Agent class {class_name} not found in module agents.{agent_type}_agent")
        except (ImportError, AttributeError) as e:
            raise ValueError(f"Agent type {agent_type} not recognized: {str(e)}")
            
    @classmethod
    def create_agent(cls, agent_type: str, agent_id: str, config: Dict[str, Any]) -> BaseAgent:
        """
        Create an agent instance.
        
        Args:
            agent_type: Type of agent to create
            agent_id: Unique identifier for the agent
            config: Agent configuration
            
        Returns:
            Agent instance
            
        Raises:
            ValueError: If agent_type is not recognized
        """
        agent_class = cls.get_agent_class(agent_type)
        return agent_class(agent_id, config)
        
    @classmethod
    def get_available_agent_types(cls) -> Dict[str, str]:
        """
        Get available agent types.
        
        Returns:
            Dictionary mapping agent types to descriptions
        """
        agent_types = {}
        
        for agent_type, agent_class in cls._agent_types.items():
            description = agent_class.__doc__.split('\n')[0].strip() if agent_class.__doc__ else ""
            agent_types[agent_type] = description
            
        return agent_types

# Register built-in agent types
AgentFactory.register_agent_type("copy_trading", CopyTradingAgent)
AgentFactory.register_agent_type("liquidation", LiquidationAgent)
AgentFactory.register_agent_type("scanner", ScannerAgent)
AgentFactory.register_agent_type("sniper", SniperAgent)
