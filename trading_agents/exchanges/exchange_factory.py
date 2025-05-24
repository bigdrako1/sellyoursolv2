"""
Exchange factory for creating exchange clients.

This module provides a factory for creating exchange clients
based on the exchange ID.
"""
import logging
from typing import Dict, Any, Optional

from .base_exchange import BaseExchange
from .binance_exchange import BinanceExchange
from .mock_exchange import MockExchange

logger = logging.getLogger(__name__)

class ExchangeFactory:
    """
    Factory for creating exchange clients.

    This class provides methods for creating exchange clients
    based on the exchange ID.
    """

    @staticmethod
    def create_exchange(exchange_id: str, config: Optional[Dict[str, Any]] = None) -> BaseExchange:
        """
        Create an exchange client.

        Args:
            exchange_id: Exchange ID
            config: Exchange configuration

        Returns:
            Exchange client

        Raises:
            ValueError: If the exchange ID is not supported
        """
        config = config or {}

        # Create exchange client based on ID
        if exchange_id == "binance":
            return BinanceExchange(config)
        elif exchange_id == "mock":
            return MockExchange(config)
        else:
            raise ValueError(f"Unsupported exchange: {exchange_id}")

    @staticmethod
    def get_supported_exchanges() -> Dict[str, Dict[str, Any]]:
        """
        Get supported exchanges.

        Returns:
            Dictionary of supported exchanges with metadata
        """
        return {
            "binance": {
                "name": "Binance",
                "description": "Binance cryptocurrency exchange",
                "features": ["spot", "futures", "margin"],
                "url": "https://www.binance.com"
            },
            "mock": {
                "name": "Mock Exchange",
                "description": "Mock exchange for testing",
                "features": ["spot", "futures", "margin"],
                "url": "https://example.com"
            }
        }
