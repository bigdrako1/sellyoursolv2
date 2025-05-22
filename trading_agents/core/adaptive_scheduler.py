"""
Adaptive Scheduler for dynamic agent scheduling.

This module provides an adaptive scheduler that dynamically adjusts
agent execution schedules based on performance metrics, market conditions,
and system load.
"""
import logging
import time
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import statistics
import math

logger = logging.getLogger(__name__)

class AgentMetrics:
    """
    Tracks performance metrics for an agent.
    
    Attributes:
        execution_times: Recent execution times
        timeout_count: Number of timeouts
        error_count: Number of errors
        last_execution: Timestamp of last execution
        last_error: Last error message
    """
    
    def __init__(self):
        self.execution_times: List[float] = []
        self.timeout_count: int = 0
        self.error_count: int = 0
        self.last_execution: Optional[datetime] = None
        self.last_error: Optional[str] = None
        
    def add_execution_time(self, execution_time: float):
        """
        Add an execution time measurement.
        
        Args:
            execution_time: Execution time in seconds
        """
        self.execution_times.append(execution_time)
        self.last_execution = datetime.now()
        
        # Keep only the last 10 measurements
        if len(self.execution_times) > 10:
            self.execution_times = self.execution_times[-10:]
            
    def add_timeout(self):
        """Record a timeout."""
        self.timeout_count += 1
        self.last_execution = datetime.now()
        
    def add_error(self, error: str):
        """
        Record an error.
        
        Args:
            error: Error message
        """
        self.error_count += 1
        self.last_error = error
        self.last_execution = datetime.now()
        
    def get_average_execution_time(self) -> Optional[float]:
        """
        Get the average execution time.
        
        Returns:
            Average execution time or None if no data
        """
        if not self.execution_times:
            return None
            
        return statistics.mean(self.execution_times)
        
    def get_execution_time_variance(self) -> Optional[float]:
        """
        Get the variance in execution time.
        
        Returns:
            Execution time variance or None if insufficient data
        """
        if len(self.execution_times) < 2:
            return None
            
        try:
            return statistics.variance(self.execution_times)
        except statistics.StatisticsError:
            return None
            
    def get_reliability_score(self) -> float:
        """
        Calculate a reliability score for the agent.
        
        Returns:
            Reliability score (0.0 to 1.0)
        """
        # Start with perfect score
        score = 1.0
        
        # Penalize for timeouts
        timeout_penalty = min(self.timeout_count * 0.1, 0.5)
        score -= timeout_penalty
        
        # Penalize for errors
        error_penalty = min(self.error_count * 0.1, 0.5)
        score -= error_penalty
        
        # Ensure score is between 0 and 1
        return max(0.0, min(1.0, score))

class MarketCondition:
    """
    Represents current market conditions.
    
    Attributes:
        volatility: Market volatility level
        trading_volume: Trading volume level
        trend: Market trend direction
        liquidity: Market liquidity level
    """
    
    def __init__(
        self,
        volatility: float = 0.5,
        trading_volume: float = 0.5,
        trend: float = 0.0,
        liquidity: float = 0.5
    ):
        """
        Initialize market conditions.
        
        Args:
            volatility: Volatility level (0.0 to 1.0)
            trading_volume: Trading volume level (0.0 to 1.0)
            trend: Trend direction (-1.0 to 1.0)
            liquidity: Liquidity level (0.0 to 1.0)
        """
        self.volatility = volatility
        self.trading_volume = trading_volume
        self.trend = trend
        self.liquidity = liquidity
        
    def get_activity_score(self) -> float:
        """
        Calculate market activity score.
        
        Returns:
            Activity score (0.0 to 1.0)
        """
        # Higher volatility and volume indicate more active markets
        return (self.volatility + self.trading_volume) / 2.0
        
    def get_opportunity_score(self) -> float:
        """
        Calculate market opportunity score.
        
        Returns:
            Opportunity score (0.0 to 1.0)
        """
        # Opportunities increase with volatility and liquidity
        # Strong trends (either direction) also increase opportunities
        return (self.volatility + self.liquidity + abs(self.trend)) / 3.0

class SystemLoad:
    """
    Represents system load metrics.
    
    Attributes:
        cpu_usage: CPU usage percentage
        memory_usage: Memory usage percentage
        network_usage: Network usage percentage
        io_usage: I/O usage percentage
    """
    
    def __init__(
        self,
        cpu_usage: float = 0.0,
        memory_usage: float = 0.0,
        network_usage: float = 0.0,
        io_usage: float = 0.0
    ):
        """
        Initialize system load.
        
        Args:
            cpu_usage: CPU usage percentage (0.0 to 1.0)
            memory_usage: Memory usage percentage (0.0 to 1.0)
            network_usage: Network usage percentage (0.0 to 1.0)
            io_usage: I/O usage percentage (0.0 to 1.0)
        """
        self.cpu_usage = cpu_usage
        self.memory_usage = memory_usage
        self.network_usage = network_usage
        self.io_usage = io_usage
        
    def get_overall_load(self) -> float:
        """
        Calculate overall system load.
        
        Returns:
            Overall load (0.0 to 1.0)
        """
        return (self.cpu_usage + self.memory_usage + self.network_usage + self.io_usage) / 4.0
        
    def get_available_capacity(self) -> float:
        """
        Calculate available system capacity.
        
        Returns:
            Available capacity (0.0 to 1.0)
        """
        return 1.0 - self.get_overall_load()

class AdaptiveScheduler:
    """
    Dynamically adjusts agent execution schedules.
    
    This class analyzes agent performance metrics, market conditions,
    and system load to optimize execution schedules for agents.
    
    Attributes:
        agent_metrics: Performance metrics by agent and task type
        market_condition: Current market condition
        system_load: Current system load
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the adaptive scheduler.
        
        Args:
            config: Scheduler configuration
        """
        config = config or {}
        
        # Configuration
        self.min_interval = config.get("min_interval", 1.0)  # seconds
        self.max_interval = config.get("max_interval", 3600.0)  # seconds
        self.default_interval = config.get("default_interval", 60.0)  # seconds
        self.market_weight = config.get("market_weight", 0.4)
        self.performance_weight = config.get("performance_weight", 0.4)
        self.system_weight = config.get("system_weight", 0.2)
        
        # State
        self.agent_metrics: Dict[str, Dict[str, AgentMetrics]] = {}
        self.market_condition = MarketCondition()
        self.system_load = SystemLoad()
        
        # Statistics
        self._interval_adjustments = 0
        self._total_agents_tracked = 0
        
        logger.info("Adaptive scheduler initialized")
        
    def update_execution_time(self, agent_id: str, task_type: str, execution_time: float):
        """
        Update execution time for an agent task.
        
        Args:
            agent_id: Agent ID
            task_type: Task type
            execution_time: Execution time in seconds
        """
        # Get or create agent metrics
        agent_metrics = self._get_agent_metrics(agent_id, task_type)
        
        # Add execution time
        agent_metrics.add_execution_time(execution_time)
        
    def update_timeout(self, agent_id: str, task_type: str):
        """
        Update timeout count for an agent task.
        
        Args:
            agent_id: Agent ID
            task_type: Task type
        """
        # Get or create agent metrics
        agent_metrics = self._get_agent_metrics(agent_id, task_type)
        
        # Add timeout
        agent_metrics.add_timeout()
        
    def update_error(self, agent_id: str, task_type: str, error: str):
        """
        Update error count for an agent task.
        
        Args:
            agent_id: Agent ID
            task_type: Task type
            error: Error message
        """
        # Get or create agent metrics
        agent_metrics = self._get_agent_metrics(agent_id, task_type)
        
        # Add error
        agent_metrics.add_error(error)
        
    def update_market_condition(self, market_condition: MarketCondition):
        """
        Update current market condition.
        
        Args:
            market_condition: New market condition
        """
        self.market_condition = market_condition
        
    def update_system_load(self, system_load: SystemLoad):
        """
        Update current system load.
        
        Args:
            system_load: New system load
        """
        self.system_load = system_load
        
    def calculate_interval(
        self,
        agent_id: str,
        task_type: str,
        base_interval: float
    ) -> float:
        """
        Calculate the optimal execution interval for an agent task.
        
        Args:
            agent_id: Agent ID
            task_type: Task type
            base_interval: Base interval in seconds
            
        Returns:
            Optimal interval in seconds
        """
        # Get agent metrics
        agent_metrics = self._get_agent_metrics(agent_id, task_type)
        
        # Calculate performance factor (0.0 to 2.0)
        # Lower is better (faster execution, fewer errors)
        performance_factor = self._calculate_performance_factor(agent_metrics)
        
        # Calculate market factor (0.0 to 2.0)
        # Lower is better (more active markets need more frequent updates)
        market_factor = self._calculate_market_factor()
        
        # Calculate system factor (0.0 to 2.0)
        # Higher is better (higher load means less frequent updates)
        system_factor = self._calculate_system_factor()
        
        # Calculate weighted adjustment factor
        adjustment_factor = (
            performance_factor * self.performance_weight +
            market_factor * self.market_weight +
            system_factor * self.system_weight
        )
        
        # Apply adjustment to base interval
        interval = base_interval * adjustment_factor
        
        # Ensure interval is within bounds
        interval = max(self.min_interval, min(self.max_interval, interval))
        
        # Increment adjustment counter
        self._interval_adjustments += 1
        
        logger.debug(
            f"Calculated interval for {agent_id}:{task_type}: {interval:.2f}s "
            f"(base: {base_interval:.2f}s, adjustment: {adjustment_factor:.2f})"
        )
        
        return interval
        
    def _get_agent_metrics(self, agent_id: str, task_type: str) -> AgentMetrics:
        """
        Get or create agent metrics.
        
        Args:
            agent_id: Agent ID
            task_type: Task type
            
        Returns:
            Agent metrics
        """
        # Initialize agent dictionary if needed
        if agent_id not in self.agent_metrics:
            self.agent_metrics[agent_id] = {}
            self._total_agents_tracked += 1
            
        # Initialize task metrics if needed
        if task_type not in self.agent_metrics[agent_id]:
            self.agent_metrics[agent_id][task_type] = AgentMetrics()
            
        return self.agent_metrics[agent_id][task_type]
        
    def _calculate_performance_factor(self, metrics: AgentMetrics) -> float:
        """
        Calculate performance factor for an agent.
        
        Args:
            metrics: Agent metrics
            
        Returns:
            Performance factor (0.0 to 2.0)
        """
        # Get average execution time
        avg_time = metrics.get_average_execution_time()
        
        # If no execution time data, use neutral factor
        if avg_time is None:
            return 1.0
            
        # Calculate execution time factor (0.5 to 1.5)
        # Longer execution times result in higher factors
        time_factor = 0.5 + min(avg_time / 10.0, 1.0)
        
        # Calculate reliability factor (0.5 to 1.5)
        # Lower reliability results in higher factors
        reliability_score = metrics.get_reliability_score()
        reliability_factor = 0.5 + (1.0 - reliability_score)
        
        # Combine factors
        return (time_factor + reliability_factor) / 2.0
        
    def _calculate_market_factor(self) -> float:
        """
        Calculate market factor.
        
        Returns:
            Market factor (0.0 to 2.0)
        """
        # Get market activity score
        activity_score = self.market_condition.get_activity_score()
        
        # Calculate market factor (0.5 to 1.5)
        # More active markets result in lower factors (more frequent updates)
        return 1.5 - activity_score
        
    def _calculate_system_factor(self) -> float:
        """
        Calculate system factor.
        
        Returns:
            System factor (0.0 to 2.0)
        """
        # Get system load
        load = self.system_load.get_overall_load()
        
        # Calculate system factor (0.5 to 1.5)
        # Higher load results in higher factors (less frequent updates)
        return 0.5 + load
        
    def get_stats(self) -> Dict[str, Any]:
        """
        Get scheduler statistics.
        
        Returns:
            Dictionary of statistics
        """
        return {
            "agents_tracked": self._total_agents_tracked,
            "interval_adjustments": self._interval_adjustments,
            "market_condition": {
                "volatility": self.market_condition.volatility,
                "trading_volume": self.market_condition.trading_volume,
                "trend": self.market_condition.trend,
                "liquidity": self.market_condition.liquidity
            },
            "system_load": {
                "cpu_usage": self.system_load.cpu_usage,
                "memory_usage": self.system_load.memory_usage,
                "network_usage": self.system_load.network_usage,
                "io_usage": self.system_load.io_usage
            }
        }
