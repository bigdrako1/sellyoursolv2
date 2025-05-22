"""
Tests for the BaseAgent class.
"""
import pytest
from core.agent_status import AgentStatus

@pytest.mark.asyncio
async def test_agent_lifecycle(copy_trading_agent):
    """
    Test the agent lifecycle (start, stop).
    """
    # Check initial state
    assert copy_trading_agent.status == AgentStatus.INITIALIZED
    
    # Start the agent
    await copy_trading_agent.start()
    assert copy_trading_agent.status == AgentStatus.RUNNING
    
    # Stop the agent
    await copy_trading_agent.stop()
    assert copy_trading_agent.status == AgentStatus.STOPPED

@pytest.mark.asyncio
async def test_agent_config_update(copy_trading_agent):
    """
    Test updating agent configuration.
    """
    # Check initial config
    assert copy_trading_agent.config["name"] == "Test Copy Trading Agent"
    assert copy_trading_agent.config["check_interval_minutes"] == 10
    
    # Update config
    new_config = copy_trading_agent.config.copy()
    new_config["name"] = "Updated Agent Name"
    new_config["check_interval_minutes"] = 5
    
    await copy_trading_agent.update_config(new_config)
    
    # Check updated config
    assert copy_trading_agent.config["name"] == "Updated Agent Name"
    assert copy_trading_agent.config["check_interval_minutes"] == 5

@pytest.mark.asyncio
async def test_agent_get_status(copy_trading_agent):
    """
    Test getting agent status.
    """
    # Get status
    status = await copy_trading_agent.get_status()
    
    # Check status
    assert status["agent_id"] == copy_trading_agent.agent_id
    assert status["status"] == copy_trading_agent.status.value
    assert "metrics" in status
    assert "config" in status
    assert status["config"] == copy_trading_agent.config

@pytest.mark.asyncio
async def test_agent_execute_action(copy_trading_agent):
    """
    Test executing an action on the agent.
    """
    # Execute a non-existent action
    result = await copy_trading_agent.execute_action({"type": "nonexistent_action"})
    
    # Check result
    assert not result["success"]
    assert "not supported" in result["message"]

@pytest.mark.asyncio
async def test_copy_trading_agent_actions(copy_trading_agent):
    """
    Test specific actions for the copy trading agent.
    """
    # Start the agent
    await copy_trading_agent.start()
    
    # Add a wallet
    result = await copy_trading_agent.execute_action({
        "type": "add_wallet",
        "wallet": "test_wallet"
    })
    
    # Check result
    assert result["success"]
    assert "test_wallet" in copy_trading_agent.tracked_wallets
    
    # Remove the wallet
    result = await copy_trading_agent.execute_action({
        "type": "remove_wallet",
        "wallet": "test_wallet"
    })
    
    # Check result
    assert result["success"]
    assert "test_wallet" not in copy_trading_agent.tracked_wallets
    
    # Stop the agent
    await copy_trading_agent.stop()

@pytest.mark.asyncio
async def test_liquidation_agent_actions(liquidation_agent):
    """
    Test specific actions for the liquidation agent.
    """
    # Start the agent
    await liquidation_agent.start()
    
    # Add a symbol
    result = await liquidation_agent.execute_action({
        "type": "add_symbol",
        "symbol": "DOGE",
        "config": {
            "liquidation_threshold": 100000,
            "time_window_mins": 5,
            "stop_loss": 0.02,
            "take_profit": 0.01
        }
    })
    
    # Check result
    assert result["success"]
    assert "DOGE" in liquidation_agent.symbols
    assert "DOGE" in liquidation_agent.symbols_data
    
    # Update symbol config
    result = await liquidation_agent.execute_action({
        "type": "update_symbol_config",
        "symbol": "DOGE",
        "config": {
            "liquidation_threshold": 200000
        }
    })
    
    # Check result
    assert result["success"]
    assert liquidation_agent.symbols_data["DOGE"]["liquidation_threshold"] == 200000
    
    # Remove the symbol
    result = await liquidation_agent.execute_action({
        "type": "remove_symbol",
        "symbol": "DOGE"
    })
    
    # Check result
    assert result["success"]
    assert "DOGE" not in liquidation_agent.symbols
    assert "DOGE" not in liquidation_agent.symbols_data
    
    # Stop the agent
    await liquidation_agent.stop()

@pytest.mark.asyncio
async def test_scanner_agent_actions(scanner_agent):
    """
    Test specific actions for the scanner agent.
    """
    # Start the agent
    await scanner_agent.start()
    
    # Add a super cycle token
    result = await scanner_agent.execute_action({
        "type": "add_super_cycle_token",
        "token_address": "test_token"
    })
    
    # Check result
    assert result["success"]
    assert "test_token" in scanner_agent.super_cycle_tokens
    
    # Remove the super cycle token
    result = await scanner_agent.execute_action({
        "type": "remove_super_cycle_token",
        "token_address": "test_token"
    })
    
    # Check result
    assert result["success"]
    assert "test_token" not in scanner_agent.super_cycle_tokens
    
    # Stop the agent
    await scanner_agent.stop()

@pytest.mark.asyncio
async def test_sniper_agent_actions(sniper_agent):
    """
    Test specific actions for the sniper agent.
    """
    # Start the agent
    await sniper_agent.start()
    
    # Add a token to the do not trade list
    result = await sniper_agent.execute_action({
        "type": "add_to_do_not_trade_list",
        "token_address": "test_token"
    })
    
    # Check result
    assert result["success"]
    assert "test_token" in sniper_agent.do_not_trade_list
    
    # Remove the token from the do not trade list
    result = await sniper_agent.execute_action({
        "type": "remove_from_do_not_trade_list",
        "token_address": "test_token"
    })
    
    # Check result
    assert result["success"]
    assert "test_token" not in sniper_agent.do_not_trade_list
    
    # Stop the agent
    await sniper_agent.stop()
