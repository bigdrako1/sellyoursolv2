"""
Tests for the AgentRegistry class.
"""
import pytest
from core.agent_registry import AgentRegistry
from core.agent_status import AgentStatus

@pytest.mark.asyncio
async def test_register_agent(agent_registry):
    """
    Test registering an agent.
    """
    # Register a copy trading agent
    agent = await agent_registry.register_agent(
        "copy_trading",
        "test_agent",
        {"name": "Test Agent"}
    )
    
    # Check that the agent was registered
    assert agent is not None
    assert agent.agent_id == "test_agent"
    assert agent.config["name"] == "Test Agent"
    assert agent.status == AgentStatus.INITIALIZED
    
    # Check that the agent is in the registry
    registered_agent = await agent_registry.get_agent("test_agent")
    assert registered_agent is not None
    assert registered_agent.agent_id == "test_agent"

@pytest.mark.asyncio
async def test_register_duplicate_agent(agent_registry):
    """
    Test registering an agent with a duplicate ID.
    """
    # Register a copy trading agent
    await agent_registry.register_agent(
        "copy_trading",
        "test_agent",
        {"name": "Test Agent"}
    )
    
    # Try to register another agent with the same ID
    with pytest.raises(ValueError):
        await agent_registry.register_agent(
            "liquidation",
            "test_agent",
            {"name": "Another Test Agent"}
        )

@pytest.mark.asyncio
async def test_register_invalid_agent_type(agent_registry):
    """
    Test registering an agent with an invalid type.
    """
    # Try to register an agent with an invalid type
    with pytest.raises(ValueError):
        await agent_registry.register_agent(
            "invalid_type",
            "test_agent",
            {"name": "Test Agent"}
        )

@pytest.mark.asyncio
async def test_unregister_agent(agent_registry):
    """
    Test unregistering an agent.
    """
    # Register a copy trading agent
    await agent_registry.register_agent(
        "copy_trading",
        "test_agent",
        {"name": "Test Agent"}
    )
    
    # Unregister the agent
    await agent_registry.unregister_agent("test_agent")
    
    # Check that the agent is no longer in the registry
    agent = await agent_registry.get_agent("test_agent")
    assert agent is None

@pytest.mark.asyncio
async def test_unregister_nonexistent_agent(agent_registry):
    """
    Test unregistering a nonexistent agent.
    """
    # Try to unregister a nonexistent agent
    with pytest.raises(ValueError):
        await agent_registry.unregister_agent("nonexistent_agent")

@pytest.mark.asyncio
async def test_get_all_agents(agent_registry):
    """
    Test getting all agents.
    """
    # Register two agents
    await agent_registry.register_agent(
        "copy_trading",
        "test_agent_1",
        {"name": "Test Agent 1"}
    )
    
    await agent_registry.register_agent(
        "liquidation",
        "test_agent_2",
        {"name": "Test Agent 2"}
    )
    
    # Get all agents
    agents = await agent_registry.get_all_agents()
    
    # Check that both agents are returned
    assert len(agents) == 2
    assert any(agent.agent_id == "test_agent_1" for agent in agents)
    assert any(agent.agent_id == "test_agent_2" for agent in agents)

@pytest.mark.asyncio
async def test_start_all_agents(agent_registry):
    """
    Test starting all agents.
    """
    # Register two agents
    await agent_registry.register_agent(
        "copy_trading",
        "test_agent_1",
        {"name": "Test Agent 1"}
    )
    
    await agent_registry.register_agent(
        "liquidation",
        "test_agent_2",
        {"name": "Test Agent 2"}
    )
    
    # Start all agents
    results = await agent_registry.start_all_agents()
    
    # Check that both agents were started
    assert len(results) == 2
    assert "test_agent_1" in results
    assert "test_agent_2" in results
    assert results["test_agent_1"]["success"]
    assert results["test_agent_2"]["success"]
    
    # Check that the agents are running
    agent1 = await agent_registry.get_agent("test_agent_1")
    agent2 = await agent_registry.get_agent("test_agent_2")
    assert agent1.status == AgentStatus.RUNNING
    assert agent2.status == AgentStatus.RUNNING

@pytest.mark.asyncio
async def test_stop_all_agents(agent_registry):
    """
    Test stopping all agents.
    """
    # Register two agents
    await agent_registry.register_agent(
        "copy_trading",
        "test_agent_1",
        {"name": "Test Agent 1"}
    )
    
    await agent_registry.register_agent(
        "liquidation",
        "test_agent_2",
        {"name": "Test Agent 2"}
    )
    
    # Start all agents
    await agent_registry.start_all_agents()
    
    # Stop all agents
    results = await agent_registry.stop_all_agents()
    
    # Check that both agents were stopped
    assert len(results) == 2
    assert "test_agent_1" in results
    assert "test_agent_2" in results
    assert results["test_agent_1"]["success"]
    assert results["test_agent_2"]["success"]
    
    # Check that the agents are stopped
    agent1 = await agent_registry.get_agent("test_agent_1")
    agent2 = await agent_registry.get_agent("test_agent_2")
    assert agent1.status == AgentStatus.STOPPED
    assert agent2.status == AgentStatus.STOPPED
