"""
Configuration management for the trading agents system.

This module provides a configuration manager for loading and
accessing configuration settings from environment variables
and configuration files.
"""
import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List, Union

logger = logging.getLogger(__name__)

class Config:
    """
    Configuration manager for the trading agents system.

    This class provides methods for loading and accessing
    configuration settings from environment variables and
    configuration files.

    Attributes:
        config: Dictionary of configuration settings
        env: Current environment (development, production, etc.)
    """

    _instance = None

    def __new__(cls, *args, **kwargs):
        """Create a singleton instance."""
        if cls._instance is None:
            cls._instance = super(Config, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the configuration manager.

        Args:
            config_path: Path to configuration file
        """
        # Skip initialization if already initialized
        if getattr(self, "_initialized", False):
            return

        # Initialize configuration
        self.config = {}
        self.env = os.environ.get("ENVIRONMENT", "development")

        # Load configuration
        self._load_config(config_path)

        # Mark as initialized
        self._initialized = True

        logger.info(f"Configuration loaded for environment: {self.env}")

    def _load_config(self, config_path: Optional[str] = None):
        """
        Load configuration from file and environment variables.

        Args:
            config_path: Path to configuration file
        """
        # Load from file if provided
        if config_path:
            try:
                with open(config_path, "r") as f:
                    self.config = json.load(f)
                logger.info(f"Loaded configuration from {config_path}")
            except Exception as e:
                logger.error(f"Error loading configuration from {config_path}: {str(e)}")

        # Load from environment variables
        self._load_from_env()

    def _load_from_env(self):
        """Load configuration from environment variables."""
        # Database configuration
        self.config["database"] = {
            "url": os.environ.get("DATABASE_URL", "mongodb://localhost:27017/trading_ai"),
            "username": os.environ.get("MONGO_USERNAME", ""),
            "password": os.environ.get("MONGO_PASSWORD", "")
        }

        # Redis configuration
        self.config["redis"] = {
            "url": os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
            "password": os.environ.get("REDIS_PASSWORD", "")
        }

        # JWT configuration
        self.config["jwt"] = {
            "secret": os.environ.get("JWT_SECRET", "dev_jwt_secret"),
            "expiry": int(os.environ.get("JWT_EXPIRY", "86400"))
        }

        # API keys
        self.config["api_keys"] = {
            "glassnode": os.environ.get("GLASSNODE_API_KEY", ""),
            "cryptoquant": os.environ.get("CRYPTOQUANT_API_KEY", ""),
            "intotheblock": os.environ.get("INTOTHEBLOCK_API_KEY", "")
        }

        # Logging configuration
        self.config["logging"] = {
            "level": os.environ.get("LOG_LEVEL", "info"),
            "file": os.environ.get("LOG_FILE", "")
        }

        # Server configuration
        self.config["server"] = {
            "host": os.environ.get("SERVER_HOST", "0.0.0.0"),
            "port": int(os.environ.get("SERVER_PORT", "8000")),
            "workers": int(os.environ.get("SERVER_WORKERS", "1")),
            "reload": os.environ.get("SERVER_RELOAD", "true").lower() == "true"
        }

        # Cache configuration
        self.config["cache"] = {
            "ttl": int(os.environ.get("CACHE_TTL", "300")),
            "max_size": int(os.environ.get("CACHE_MAX_SIZE", "10000")),
            "disk_cache_enabled": os.environ.get("DISK_CACHE_ENABLED", "true").lower() == "true",
            "disk_cache_dir": os.environ.get("DISK_CACHE_DIR", "cache"),
            "disk_cache_max_size": int(os.environ.get("DISK_CACHE_MAX_SIZE", "104857600"))  # 100 MB
        }

        # Exchange configuration
        self.config["exchanges"] = {
            "binance": {
                "api_key": os.environ.get("BINANCE_API_KEY", ""),
                "api_secret": os.environ.get("BINANCE_API_SECRET", ""),
                "testnet": os.environ.get("BINANCE_TESTNET", "true").lower() == "true"
            }
        }

        # ML configuration
        self.config["ml"] = {
            "models_dir": os.environ.get("ML_MODELS_DIR", "models"),
            "data_dir": os.environ.get("ML_DATA_DIR", "data")
        }

    def get(self, key: str, default: Any = None) -> Any:
        """
        Get a configuration value.

        Args:
            key: Configuration key (dot notation for nested keys)
            default: Default value if key not found

        Returns:
            Configuration value or default
        """
        # Split key by dots
        keys = key.split(".")

        # Navigate through nested dictionaries
        value = self.config
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default

        return value

    def set(self, key: str, value: Any):
        """
        Set a configuration value.

        Args:
            key: Configuration key (dot notation for nested keys)
            value: Configuration value
        """
        # Split key by dots
        keys = key.split(".")

        # Navigate through nested dictionaries
        config = self.config
        for i, k in enumerate(keys[:-1]):
            if k not in config:
                config[k] = {}
            config = config[k]

        # Set value
        config[keys[-1]] = value

    def get_all(self) -> Dict[str, Any]:
        """
        Get all configuration settings.

        Returns:
            Dictionary of all configuration settings
        """
        return self.config.copy()

    def is_development(self) -> bool:
        """
        Check if environment is development.

        Returns:
            True if environment is development, False otherwise
        """
        return self.env == "development"

    def is_production(self) -> bool:
        """
        Check if environment is production.

        Returns:
            True if environment is production, False otherwise
        """
        return self.env == "production"

    def is_testing(self) -> bool:
        """
        Check if environment is testing.

        Returns:
            True if environment is testing, False otherwise
        """
        return self.env == "testing"
