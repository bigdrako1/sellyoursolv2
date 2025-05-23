"""
Data provider factory.

This module provides a factory for creating data providers.
"""
import logging
from typing import Dict, List, Any, Optional, Type

from data_providers.base_data_provider import BaseDataProvider
from data_providers.onchain_data_provider import OnChainDataProvider

logger = logging.getLogger(__name__)

class DataProviderFactory:
    """Factory for creating data providers."""
    
    # Registry of available data providers
    PROVIDERS = {
        "onchain": OnChainDataProvider
    }
    
    @classmethod
    def create_provider(cls, provider_type: str, config: Dict[str, Any]) -> BaseDataProvider:
        """
        Create a data provider.
        
        Args:
            provider_type: Type of data provider
            config: Provider configuration
            
        Returns:
            Created data provider
        """
        # Get provider class
        provider_class = cls.PROVIDERS.get(provider_type)
        
        if not provider_class:
            raise ValueError(f"Unknown data provider type: {provider_type}")
            
        # Create provider
        provider = provider_class(config)
        
        logger.info(f"Created {provider_type} data provider")
        
        return provider
        
    @classmethod
    def register_provider(cls, provider_type: str, provider_class: Type[BaseDataProvider]):
        """
        Register a new data provider.
        
        Args:
            provider_type: Type of data provider
            provider_class: Provider class
        """
        cls.PROVIDERS[provider_type] = provider_class
        
        logger.info(f"Registered {provider_type} data provider")
        
    @classmethod
    def get_available_providers(cls) -> List[str]:
        """
        Get available data provider types.
        
        Returns:
            List of available provider types
        """
        return list(cls.PROVIDERS.keys())
