"""
Logging utilities for agents.
"""
import logging
import sys
from datetime import datetime
from typing import List, Dict, Any, Optional

class Logger:
    """
    Logger class for agents.
    Provides structured logging with agent context and log storage for retrieval.
    """
    
    def __init__(self, agent_id: str, max_logs: int = 1000):
        """
        Initialize the logger.
        
        Args:
            agent_id: The ID of the agent
            max_logs: Maximum number of logs to store in memory
        """
        self.agent_id = agent_id
        self.max_logs = max_logs
        self.logs: List[Dict[str, Any]] = []
        
        # Set up Python logger
        self.logger = logging.getLogger(f"agent.{agent_id}")
        self.logger.setLevel(logging.INFO)
        
        # Add console handler if not already added
        if not self.logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
    
    def _add_log(self, level: str, message: str):
        """
        Add a log entry to the in-memory log store.
        
        Args:
            level: Log level
            message: Log message
        """
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "agent_id": self.agent_id,
            "level": level,
            "message": message
        }
        
        self.logs.append(log_entry)
        
        # Trim logs if they exceed max_logs
        if len(self.logs) > self.max_logs:
            self.logs = self.logs[-self.max_logs:]
            
        return log_entry
    
    def info(self, message: str):
        """
        Log an info message.
        
        Args:
            message: The message to log
        """
        self.logger.info(message)
        return self._add_log("INFO", message)
    
    def warning(self, message: str):
        """
        Log a warning message.
        
        Args:
            message: The message to log
        """
        self.logger.warning(message)
        return self._add_log("WARNING", message)
    
    def error(self, message: str):
        """
        Log an error message.
        
        Args:
            message: The message to log
        """
        self.logger.error(message)
        return self._add_log("ERROR", message)
    
    def debug(self, message: str):
        """
        Log a debug message.
        
        Args:
            message: The message to log
        """
        self.logger.debug(message)
        return self._add_log("DEBUG", message)
    
    def get_logs(self, limit: Optional[int] = None, level: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get logs from the in-memory store.
        
        Args:
            limit: Maximum number of logs to return (newest first)
            level: Filter logs by level
            
        Returns:
            List of log entries
        """
        filtered_logs = self.logs
        
        if level:
            filtered_logs = [log for log in filtered_logs if log["level"] == level]
            
        if limit:
            filtered_logs = filtered_logs[-limit:]
            
        return filtered_logs
