"""
Metrics collection for agents.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

class MetricsCollector:
    """
    Metrics collector for agents.
    Provides methods to track and retrieve agent performance metrics.
    """
    
    def __init__(self, agent_id: str):
        """
        Initialize the metrics collector.
        
        Args:
            agent_id: The ID of the agent
        """
        self.agent_id = agent_id
        self.metrics: Dict[str, Any] = {
            "positions_opened": 0,
            "positions_closed_profit": 0,
            "positions_closed_loss": 0,
            "total_profit": 0.0,
            "total_loss": 0.0,
            "win_rate": 0.0,
            "average_profit": 0.0,
            "average_loss": 0.0,
            "largest_profit": 0.0,
            "largest_loss": 0.0,
            "active_positions": 0,
            "api_calls": 0,
            "errors": 0,
            "last_updated": datetime.now().isoformat()
        }
        
        # Historical metrics for time series analysis
        self.historical_metrics: List[Dict[str, Any]] = []
    
    def increment(self, metric: str, value: int = 1):
        """
        Increment a numeric metric.
        
        Args:
            metric: The metric to increment
            value: The value to increment by (default: 1)
        """
        if metric in self.metrics:
            if isinstance(self.metrics[metric], (int, float)):
                self.metrics[metric] += value
                self.metrics["last_updated"] = datetime.now().isoformat()
    
    def set(self, metric: str, value: Any):
        """
        Set a metric to a specific value.
        
        Args:
            metric: The metric to set
            value: The value to set
        """
        self.metrics[metric] = value
        self.metrics["last_updated"] = datetime.now().isoformat()
    
    def record_profit(self, amount: float):
        """
        Record a profit.
        
        Args:
            amount: The profit amount
        """
        self.metrics["total_profit"] += amount
        self.increment("positions_closed_profit")
        
        if amount > self.metrics["largest_profit"]:
            self.metrics["largest_profit"] = amount
            
        # Update average profit
        if self.metrics["positions_closed_profit"] > 0:
            self.metrics["average_profit"] = self.metrics["total_profit"] / self.metrics["positions_closed_profit"]
            
        # Update win rate
        total_closed = self.metrics["positions_closed_profit"] + self.metrics["positions_closed_loss"]
        if total_closed > 0:
            self.metrics["win_rate"] = self.metrics["positions_closed_profit"] / total_closed
            
        self.metrics["last_updated"] = datetime.now().isoformat()
    
    def record_loss(self, amount: float):
        """
        Record a loss.
        
        Args:
            amount: The loss amount (positive value)
        """
        self.metrics["total_loss"] += amount
        self.increment("positions_closed_loss")
        
        if amount > self.metrics["largest_loss"]:
            self.metrics["largest_loss"] = amount
            
        # Update average loss
        if self.metrics["positions_closed_loss"] > 0:
            self.metrics["average_loss"] = self.metrics["total_loss"] / self.metrics["positions_closed_loss"]
            
        # Update win rate
        total_closed = self.metrics["positions_closed_profit"] + self.metrics["positions_closed_loss"]
        if total_closed > 0:
            self.metrics["win_rate"] = self.metrics["positions_closed_profit"] / total_closed
            
        self.metrics["last_updated"] = datetime.now().isoformat()
    
    def snapshot(self):
        """
        Take a snapshot of current metrics and add to historical metrics.
        """
        snapshot = {
            "timestamp": datetime.now().isoformat(),
            **self.metrics
        }
        self.historical_metrics.append(snapshot)
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get the current metrics.
        
        Returns:
            Dictionary of metrics
        """
        return self.metrics
    
    def get_historical_metrics(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get historical metrics.
        
        Args:
            limit: Maximum number of historical metrics to return (newest first)
            
        Returns:
            List of historical metrics
        """
        if limit:
            return self.historical_metrics[-limit:]
        return self.historical_metrics
    
    def to_json(self) -> str:
        """
        Convert metrics to JSON string.
        
        Returns:
            JSON string representation of metrics
        """
        return json.dumps(self.metrics)
