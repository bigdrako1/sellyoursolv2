"""
Repository for agent data.

This module provides functions for storing and retrieving agent data from the database.
"""
import logging
import json
from typing import Dict, Any, List, Optional, Tuple, Union
from datetime import datetime

from database.db import Database

logger = logging.getLogger(__name__)

class AgentRepository:
    """
    Repository for agent data.
    
    This class provides methods for storing and retrieving agent data from the database.
    """
    
    def __init__(self, db: Database):
        """
        Initialize the repository.
        
        Args:
            db: Database instance
        """
        self.db = db
        
    async def create_agent(
        self,
        agent_id: str,
        agent_type: str,
        name: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a new agent.
        
        Args:
            agent_id: Agent ID
            agent_type: Agent type
            name: Agent name
            config: Agent configuration
            
        Returns:
            Created agent
        """
        query = """
        INSERT INTO agents (agent_id, agent_type, name, status, config)
        VALUES ($1, $2, $3, 'initialized', $4)
        RETURNING *
        """
        
        record = await self.db.fetchrow(query, agent_id, agent_type, name, json.dumps(config))
        return self.db._record_to_dict(record)
        
    async def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """
        Get an agent by ID.
        
        Args:
            agent_id: Agent ID
            
        Returns:
            Agent or None if not found
        """
        query = """
        SELECT * FROM agent_status_view
        WHERE agent_id = $1
        """
        
        record = await self.db.fetchrow(query, agent_id)
        return self.db._record_to_dict(record)
        
    async def get_agents(
        self,
        agent_type: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Get agents with optional filtering.
        
        Args:
            agent_type: Filter by agent type
            status: Filter by status
            limit: Maximum number of agents to return
            offset: Offset for pagination
            
        Returns:
            Tuple of (agents, total count)
        """
        # Build query conditions
        conditions = []
        params = []
        
        if agent_type:
            conditions.append("agent_type = $" + str(len(params) + 1))
            params.append(agent_type)
            
        if status:
            conditions.append("status = $" + str(len(params) + 1))
            params.append(status)
            
        # Build WHERE clause
        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)
            
        # Count query
        count_query = f"""
        SELECT COUNT(*) FROM agents
        {where_clause}
        """
        
        # Data query
        query = f"""
        SELECT * FROM agent_status_view
        {where_clause}
        ORDER BY created_at DESC
        LIMIT $" + str(len(params) + 1) + "
        OFFSET $" + str(len(params) + 2) + "
        """
        
        # Execute queries
        total = await self.db.fetchval(count_query, *params)
        records = await self.db.fetch(query, *(params + [limit, offset]))
        
        return self.db._records_to_dicts(records), total
        
    async def update_agent(
        self,
        agent_id: str,
        name: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Update an agent.
        
        Args:
            agent_id: Agent ID
            name: New name (optional)
            config: New configuration (optional)
            
        Returns:
            Updated agent or None if not found
        """
        # Get current agent
        current = await self.get_agent(agent_id)
        if not current:
            return None
            
        # Build update parts
        update_parts = []
        params = [agent_id]
        
        if name is not None:
            update_parts.append("name = $" + str(len(params) + 1))
            params.append(name)
            
        if config is not None:
            update_parts.append("config = $" + str(len(params) + 1))
            params.append(json.dumps(config))
            
        # If nothing to update, return current agent
        if not update_parts:
            return current
            
        # Build update query
        query = f"""
        UPDATE agents
        SET {", ".join(update_parts)}
        WHERE agent_id = $1
        RETURNING *
        """
        
        # Execute update
        record = await self.db.fetchrow(query, *params)
        return self.db._record_to_dict(record)
        
    async def delete_agent(self, agent_id: str) -> bool:
        """
        Delete an agent.
        
        Args:
            agent_id: Agent ID
            
        Returns:
            True if deleted, False if not found
        """
        query = """
        DELETE FROM agents
        WHERE agent_id = $1
        RETURNING agent_id
        """
        
        result = await self.db.fetchval(query, agent_id)
        return result is not None
        
    async def update_agent_status(self, agent_id: str, status: str) -> Optional[Dict[str, Any]]:
        """
        Update an agent's status.
        
        Args:
            agent_id: Agent ID
            status: New status
            
        Returns:
            Updated agent or None if not found
        """
        query = """
        UPDATE agents
        SET status = $2
        WHERE agent_id = $1
        RETURNING *
        """
        
        record = await self.db.fetchrow(query, agent_id, status)
        return self.db._record_to_dict(record)
        
    async def add_agent_log(
        self,
        agent_id: str,
        level: str,
        message: str,
        timestamp: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Add a log entry for an agent.
        
        Args:
            agent_id: Agent ID
            level: Log level
            message: Log message
            timestamp: Log timestamp (default: now)
            
        Returns:
            Created log entry
        """
        query = """
        INSERT INTO agent_logs (agent_id, level, message, timestamp)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        """
        
        if timestamp is None:
            timestamp = datetime.now()
            
        record = await self.db.fetchrow(query, agent_id, level, message, timestamp)
        return self.db._record_to_dict(record)
        
    async def get_agent_logs(
        self,
        agent_id: str,
        level: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get logs for an agent.
        
        Args:
            agent_id: Agent ID
            level: Filter by log level
            limit: Maximum number of logs to return
            offset: Offset for pagination
            
        Returns:
            List of log entries
        """
        # Build query conditions
        conditions = ["agent_id = $1"]
        params = [agent_id]
        
        if level:
            conditions.append("level = $" + str(len(params) + 1))
            params.append(level)
            
        # Build WHERE clause
        where_clause = "WHERE " + " AND ".join(conditions)
            
        # Build query
        query = f"""
        SELECT * FROM agent_logs
        {where_clause}
        ORDER BY timestamp DESC
        LIMIT $" + str(len(params) + 1) + "
        OFFSET $" + str(len(params) + 2) + "
        """
        
        # Execute query
        records = await self.db.fetch(query, *(params + [limit, offset]))
        return self.db._records_to_dicts(records)
        
    async def add_agent_metric(
        self,
        agent_id: str,
        metric_name: str,
        metric_value: Union[float, str],
        metric_type: str,
        timestamp: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Add a metric for an agent.
        
        Args:
            agent_id: Agent ID
            metric_name: Metric name
            metric_value: Metric value
            metric_type: Metric type (gauge, counter, etc.)
            timestamp: Metric timestamp (default: now)
            
        Returns:
            Created metric
        """
        query = """
        INSERT INTO agent_metrics (agent_id, metric_name, metric_value, metric_value_str, metric_type, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        """
        
        if timestamp is None:
            timestamp = datetime.now()
            
        # Determine which value field to use
        metric_value_float = None
        metric_value_str = None
        
        if isinstance(metric_value, (int, float)):
            metric_value_float = float(metric_value)
        else:
            metric_value_str = str(metric_value)
            
        record = await self.db.fetchrow(
            query,
            agent_id,
            metric_name,
            metric_value_float,
            metric_value_str,
            metric_type,
            timestamp
        )
        
        return self.db._record_to_dict(record)
        
    async def get_agent_metrics(
        self,
        agent_id: str,
        metric_name: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get metrics for an agent.
        
        Args:
            agent_id: Agent ID
            metric_name: Filter by metric name
            start_time: Filter by start time
            end_time: Filter by end time
            limit: Maximum number of metrics to return
            
        Returns:
            List of metrics
        """
        # Build query conditions
        conditions = ["agent_id = $1"]
        params = [agent_id]
        
        if metric_name:
            conditions.append("metric_name = $" + str(len(params) + 1))
            params.append(metric_name)
            
        if start_time:
            conditions.append("timestamp >= $" + str(len(params) + 1))
            params.append(start_time)
            
        if end_time:
            conditions.append("timestamp <= $" + str(len(params) + 1))
            params.append(end_time)
            
        # Build WHERE clause
        where_clause = "WHERE " + " AND ".join(conditions)
            
        # Build query
        query = f"""
        SELECT * FROM agent_metrics
        {where_clause}
        ORDER BY timestamp DESC
        LIMIT $" + str(len(params) + 1) + "
        """
        
        # Execute query
        records = await self.db.fetch(query, *(params + [limit]))
        return self.db._records_to_dicts(records)
