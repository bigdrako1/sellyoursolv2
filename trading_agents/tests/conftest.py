"""
Pytest configuration file.
"""
import os
import sys
import pytest
import asyncio
from typing import Dict, Any, List, Generator, AsyncGenerator

# Add the parent directory to the path so we can import the trading_agents package
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from core.agent_registry import AgentRegistry
from core.agent_factory import AgentFactory
from agents.copy_trading_agent import CopyTradingAgent
from agents.liquidation_agent import LiquidationAgent
from agents.scanner_agent import ScannerAgent
from agents.sniper_agent import SniperAgent

# Mock configurations for testing
MOCK_COPY_TRADING_CONFIG = {
    "name": "Test Copy Trading Agent",
    "tracked_wallets": ["wallet1", "wallet2"],
    "check_interval_minutes": 10,
    "days_back": 1,
    "max_positions": 5,
    "position_size_usd": 20,
    "take_profit": 0.3,
    "stop_loss": 0.1,
    "min_sol_balance": 0.005,
    "do_not_trade_list": [],
    "market_data": {
        "birdeye_api_key": "test_key",
        "moondev_api_key": "test_key",
        "cache_ttl": 60
    },
    "execution": {
        "slippage": 0.01,
        "max_retries": 3,
        "retry_delay": 1.0
    }
}

MOCK_LIQUIDATION_CONFIG = {
    "name": "Test Liquidation Agent",
    "symbols": ["BTC", "ETH", "SOL"],
    "symbols_data": {
        "BTC": {
            "liquidation_threshold": 900000,
            "time_window_mins": 24,
            "stop_loss": 0.02,
            "take_profit": 0.01
        },
        "ETH": {
            "liquidation_threshold": 500000,
            "time_window_mins": 4,
            "stop_loss": 0.02,
            "take_profit": 0.01
        },
        "SOL": {
            "liquidation_threshold": 300000,
            "time_window_mins": 4,
            "stop_loss": 0.02,
            "take_profit": 0.01
        }
    },
    "order_size_usd": 10,
    "leverage": 3,
    "check_interval_seconds": 30,
    "market_data": {
        "birdeye_api_key": "test_key",
        "moondev_api_key": "test_key",
        "cache_ttl": 60
    },
    "execution": {
        "slippage": 0.01,
        "max_retries": 3,
        "retry_delay": 1.0
    }
}

MOCK_SCANNER_CONFIG = {
    "name": "Test Scanner Agent",
    "trending_tokens_limit": 200,
    "new_token_hours": 3,
    "super_cycle_tokens": [],
    "check_interval_minutes": 30,
    "market_data": {
        "birdeye_api_key": "test_key",
        "moondev_api_key": "test_key",
        "cache_ttl": 60
    }
}

MOCK_SNIPER_CONFIG = {
    "name": "Test Sniper Agent",
    "position_size_usd": 20,
    "max_positions": 5,
    "take_profit_multiplier": 4.0,
    "stop_loss_percentage": 0.1,
    "sell_amount_percentage": 0.8,
    "check_interval_minutes": 5,
    "do_not_trade_list": [],
    "max_top10_holder_percent": 0.3,
    "drop_if_mutable_metadata": True,
    "drop_if_2022_token_program": True,
    "drop_if_no_website": True,
    "drop_if_no_twitter": True,
    "drop_if_no_telegram": False,
    "only_keep_active_websites": False,
    "market_data": {
        "birdeye_api_key": "test_key",
        "moondev_api_key": "test_key",
        "cache_ttl": 60
    },
    "execution": {
        "slippage": 0.01,
        "max_retries": 3,
        "retry_delay": 1.0
    }
}

@pytest.fixture
def event_loop() -> Generator:
    """
    Create an instance of the default event loop for each test case.
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def agent_registry() -> AsyncGenerator[AgentRegistry, None]:
    """
    Create an instance of the AgentRegistry for testing.
    """
    registry = AgentRegistry()
    yield registry
    
    # Clean up by stopping all agents
    await registry.stop_all_agents()

@pytest.fixture
async def copy_trading_agent(agent_registry) -> AsyncGenerator[CopyTradingAgent, None]:
    """
    Create an instance of the CopyTradingAgent for testing.
    """
    agent = await agent_registry.register_agent("copy_trading", "copy_trading_test", MOCK_COPY_TRADING_CONFIG)
    yield agent
    
    # Clean up
    if agent.status != "stopped":
        await agent.stop()

@pytest.fixture
async def liquidation_agent(agent_registry) -> AsyncGenerator[LiquidationAgent, None]:
    """
    Create an instance of the LiquidationAgent for testing.
    """
    agent = await agent_registry.register_agent("liquidation", "liquidation_test", MOCK_LIQUIDATION_CONFIG)
    yield agent
    
    # Clean up
    if agent.status != "stopped":
        await agent.stop()

@pytest.fixture
async def scanner_agent(agent_registry) -> AsyncGenerator[ScannerAgent, None]:
    """
    Create an instance of the ScannerAgent for testing.
    """
    agent = await agent_registry.register_agent("scanner", "scanner_test", MOCK_SCANNER_CONFIG)
    yield agent
    
    # Clean up
    if agent.status != "stopped":
        await agent.stop()

@pytest.fixture
async def sniper_agent(agent_registry) -> AsyncGenerator[SniperAgent, None]:
    """
    Create an instance of the SniperAgent for testing.
    """
    agent = await agent_registry.register_agent("sniper", "sniper_test", MOCK_SNIPER_CONFIG)
    yield agent
    
    # Clean up
    if agent.status != "stopped":
        await agent.stop()
