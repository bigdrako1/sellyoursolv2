"""
Cache adapters for the trading agents system.

This package provides adapters for different cache backends.
"""
from typing import Dict, Any, Optional, Type
import logging

logger = logging.getLogger(__name__)

# Import adapters
try:
    from .redis_adapter import RedisAdapter
    REDIS_AVAILABLE = True
except ImportError:
    logger.warning("Redis adapter not available. Install redis and aioredis packages.")
    REDIS_AVAILABLE = False

class CacheAdapterFactory:
    """
    Factory for creating cache adapters.
    
    This class provides methods to create and manage different cache adapters.
    """
    
    @staticmethod
    def create_adapter(adapter_type: str, config: Dict[str, Any] = None) -> Optional[Any]:
        """
        Create a cache adapter.
        
        Args:
            adapter_type: Type of adapter to create
            config: Adapter configuration
            
        Returns:
            Cache adapter instance or None if adapter type is not supported
        """
        config = config or {}
        
        if adapter_type.lower() == "redis":
            if not REDIS_AVAILABLE:
                logger.error("Redis adapter requested but not available. Install redis and aioredis packages.")
                return None
                
            return RedisAdapter(**config)
            
        logger.error(f"Unsupported cache adapter type: {adapter_type}")
        return None
