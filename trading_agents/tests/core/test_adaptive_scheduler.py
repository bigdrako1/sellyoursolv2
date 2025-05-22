"""
Tests for the AdaptiveScheduler class.
"""
import pytest
from datetime import datetime, timedelta

from core.adaptive_scheduler import (
    AdaptiveScheduler,
    AgentMetrics,
    MarketCondition,
    SystemLoad
)

def test_agent_metrics_initialization():
    """Test AgentMetrics initialization."""
    # Create metrics
    metrics = AgentMetrics()
    
    # Check initial state
    assert metrics.execution_times == []
    assert metrics.timeout_count == 0
    assert metrics.error_count == 0
    assert metrics.last_execution is None
    assert metrics.last_error is None
    
def test_agent_metrics_add_execution_time():
    """Test adding execution time."""
    # Create metrics
    metrics = AgentMetrics()
    
    # Add execution time
    metrics.add_execution_time(1.5)
    
    # Check state
    assert len(metrics.execution_times) == 1
    assert metrics.execution_times[0] == 1.5
    assert metrics.last_execution is not None
    
def test_agent_metrics_add_timeout():
    """Test adding timeout."""
    # Create metrics
    metrics = AgentMetrics()
    
    # Add timeout
    metrics.add_timeout()
    
    # Check state
    assert metrics.timeout_count == 1
    assert metrics.last_execution is not None
    
def test_agent_metrics_add_error():
    """Test adding error."""
    # Create metrics
    metrics = AgentMetrics()
    
    # Add error
    metrics.add_error("Test error")
    
    # Check state
    assert metrics.error_count == 1
    assert metrics.last_error == "Test error"
    assert metrics.last_execution is not None
    
def test_agent_metrics_get_average_execution_time():
    """Test getting average execution time."""
    # Create metrics
    metrics = AgentMetrics()
    
    # Add execution times
    metrics.add_execution_time(1.0)
    metrics.add_execution_time(2.0)
    metrics.add_execution_time(3.0)
    
    # Get average
    avg = metrics.get_average_execution_time()
    
    # Check result
    assert avg == 2.0
    
def test_agent_metrics_get_execution_time_variance():
    """Test getting execution time variance."""
    # Create metrics
    metrics = AgentMetrics()
    
    # Add execution times
    metrics.add_execution_time(1.0)
    metrics.add_execution_time(2.0)
    metrics.add_execution_time(3.0)
    
    # Get variance
    var = metrics.get_execution_time_variance()
    
    # Check result
    assert var == 1.0
    
def test_agent_metrics_get_reliability_score():
    """Test getting reliability score."""
    # Create metrics
    metrics = AgentMetrics()
    
    # Perfect score
    assert metrics.get_reliability_score() == 1.0
    
    # Add timeout
    metrics.add_timeout()
    assert metrics.get_reliability_score() == 0.9
    
    # Add error
    metrics.add_error("Test error")
    assert metrics.get_reliability_score() == 0.8
    
def test_market_condition_initialization():
    """Test MarketCondition initialization."""
    # Create market condition
    market = MarketCondition()
    
    # Check initial state
    assert market.volatility == 0.5
    assert market.trading_volume == 0.5
    assert market.trend == 0.0
    assert market.liquidity == 0.5
    
def test_market_condition_get_activity_score():
    """Test getting activity score."""
    # Create market condition
    market = MarketCondition(volatility=0.8, trading_volume=0.6)
    
    # Get activity score
    score = market.get_activity_score()
    
    # Check result
    assert score == 0.7
    
def test_market_condition_get_opportunity_score():
    """Test getting opportunity score."""
    # Create market condition
    market = MarketCondition(volatility=0.8, liquidity=0.7, trend=0.5)
    
    # Get opportunity score
    score = market.get_opportunity_score()
    
    # Check result
    assert score == (0.8 + 0.7 + 0.5) / 3.0
    
def test_system_load_initialization():
    """Test SystemLoad initialization."""
    # Create system load
    load = SystemLoad()
    
    # Check initial state
    assert load.cpu_usage == 0.0
    assert load.memory_usage == 0.0
    assert load.network_usage == 0.0
    assert load.io_usage == 0.0
    
def test_system_load_get_overall_load():
    """Test getting overall load."""
    # Create system load
    load = SystemLoad(cpu_usage=0.8, memory_usage=0.6, network_usage=0.4, io_usage=0.2)
    
    # Get overall load
    overall = load.get_overall_load()
    
    # Check result
    assert overall == 0.5
    
def test_system_load_get_available_capacity():
    """Test getting available capacity."""
    # Create system load
    load = SystemLoad(cpu_usage=0.8, memory_usage=0.6, network_usage=0.4, io_usage=0.2)
    
    # Get available capacity
    capacity = load.get_available_capacity()
    
    # Check result
    assert capacity == 0.5
    
def test_adaptive_scheduler_initialization():
    """Test AdaptiveScheduler initialization."""
    # Create scheduler
    scheduler = AdaptiveScheduler()
    
    # Check initial state
    assert scheduler.agent_metrics == {}
    assert isinstance(scheduler.market_condition, MarketCondition)
    assert isinstance(scheduler.system_load, SystemLoad)
    
def test_adaptive_scheduler_update_execution_time():
    """Test updating execution time."""
    # Create scheduler
    scheduler = AdaptiveScheduler()
    
    # Update execution time
    scheduler.update_execution_time("test_agent", "test_task", 1.5)
    
    # Check state
    assert "test_agent" in scheduler.agent_metrics
    assert "test_task" in scheduler.agent_metrics["test_agent"]
    assert len(scheduler.agent_metrics["test_agent"]["test_task"].execution_times) == 1
    assert scheduler.agent_metrics["test_agent"]["test_task"].execution_times[0] == 1.5
    
def test_adaptive_scheduler_update_timeout():
    """Test updating timeout."""
    # Create scheduler
    scheduler = AdaptiveScheduler()
    
    # Update timeout
    scheduler.update_timeout("test_agent", "test_task")
    
    # Check state
    assert "test_agent" in scheduler.agent_metrics
    assert "test_task" in scheduler.agent_metrics["test_agent"]
    assert scheduler.agent_metrics["test_agent"]["test_task"].timeout_count == 1
    
def test_adaptive_scheduler_update_error():
    """Test updating error."""
    # Create scheduler
    scheduler = AdaptiveScheduler()
    
    # Update error
    scheduler.update_error("test_agent", "test_task", "Test error")
    
    # Check state
    assert "test_agent" in scheduler.agent_metrics
    assert "test_task" in scheduler.agent_metrics["test_agent"]
    assert scheduler.agent_metrics["test_agent"]["test_task"].error_count == 1
    assert scheduler.agent_metrics["test_agent"]["test_task"].last_error == "Test error"
    
def test_adaptive_scheduler_update_market_condition():
    """Test updating market condition."""
    # Create scheduler
    scheduler = AdaptiveScheduler()
    
    # Create market condition
    market = MarketCondition(volatility=0.8, trading_volume=0.6, trend=0.5, liquidity=0.7)
    
    # Update market condition
    scheduler.update_market_condition(market)
    
    # Check state
    assert scheduler.market_condition is market
    
def test_adaptive_scheduler_update_system_load():
    """Test updating system load."""
    # Create scheduler
    scheduler = AdaptiveScheduler()
    
    # Create system load
    load = SystemLoad(cpu_usage=0.8, memory_usage=0.6, network_usage=0.4, io_usage=0.2)
    
    # Update system load
    scheduler.update_system_load(load)
    
    # Check state
    assert scheduler.system_load is load
    
def test_adaptive_scheduler_calculate_interval():
    """Test calculating interval."""
    # Create scheduler
    scheduler = AdaptiveScheduler()
    
    # Calculate interval with default state
    interval = scheduler.calculate_interval("test_agent", "test_task", 60.0)
    
    # Check result
    assert interval == 60.0  # No adjustment with default state
    
    # Update metrics to affect interval
    scheduler.update_execution_time("test_agent", "test_task", 5.0)  # Longer execution time
    scheduler.update_timeout("test_agent", "test_task")  # Add timeout
    
    # Update market condition to more active
    scheduler.update_market_condition(MarketCondition(volatility=0.8, trading_volume=0.8))
    
    # Update system load to higher
    scheduler.update_system_load(SystemLoad(cpu_usage=0.8, memory_usage=0.8))
    
    # Calculate interval again
    interval = scheduler.calculate_interval("test_agent", "test_task", 60.0)
    
    # Check result
    assert interval != 60.0  # Should be adjusted
    
def test_adaptive_scheduler_get_stats():
    """Test getting statistics."""
    # Create scheduler
    scheduler = AdaptiveScheduler()
    
    # Get stats
    stats = scheduler.get_stats()
    
    # Check stats
    assert "agents_tracked" in stats
    assert "interval_adjustments" in stats
    assert "market_condition" in stats
    assert "system_load" in stats
