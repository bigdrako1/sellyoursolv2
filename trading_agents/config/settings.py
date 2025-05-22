"""
Application settings.
"""
import os
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# API settings
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
API_DEBUG = os.getenv("API_DEBUG", "False").lower() == "true"

# External API keys
BIRDEYE_API_KEY = os.getenv("BIRDEYE_API_KEY", "")
MOONDEV_API_KEY = os.getenv("MOONDEV_API_KEY", "")

# Database settings
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "trading_agents")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

# Cache settings
CACHE_TTL = int(os.getenv("CACHE_TTL", "60"))  # seconds

# Execution settings
EXECUTION_SLIPPAGE = float(os.getenv("EXECUTION_SLIPPAGE", "0.01"))  # 1%
EXECUTION_MAX_RETRIES = int(os.getenv("EXECUTION_MAX_RETRIES", "3"))
EXECUTION_RETRY_DELAY = float(os.getenv("EXECUTION_RETRY_DELAY", "1.0"))  # seconds

# Agent settings
DEFAULT_AGENT_CONFIG: Dict[str, Any] = {
    "market_data": {
        "birdeye_api_key": BIRDEYE_API_KEY,
        "moondev_api_key": MOONDEV_API_KEY,
        "cache_ttl": CACHE_TTL
    },
    "execution": {
        "slippage": EXECUTION_SLIPPAGE,
        "max_retries": EXECUTION_MAX_RETRIES,
        "retry_delay": EXECUTION_RETRY_DELAY
    }
}
