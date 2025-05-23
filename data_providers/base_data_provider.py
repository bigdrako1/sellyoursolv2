"""
Base data provider class.

This module provides the base class for all data providers.
"""
import logging
from typing import Dict, List, Any, Optional, Tuple, Union
import pandas as pd

logger = logging.getLogger(__name__)

class BaseDataProvider:
    """Base class for data providers."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the data provider.
        
        Args:
            config: Provider configuration
        """
        self.config = config
        self.name = "base"
        
    async def initialize(self) -> bool:
        """
        Initialize the data provider.
        
        Returns:
            True if initialization was successful, False otherwise
        """
        raise NotImplementedError("Subclasses must implement this method")
        
    async def close(self) -> bool:
        """
        Close the data provider connection.
        
        Returns:
            True if closing was successful, False otherwise
        """
        raise NotImplementedError("Subclasses must implement this method")
        
    def get_name(self) -> str:
        """
        Get the provider name.
        
        Returns:
            Provider name
        """
        return self.name
        
    def get_config(self) -> Dict[str, Any]:
        """
        Get the provider configuration.
        
        Returns:
            Provider configuration
        """
        return self.config
