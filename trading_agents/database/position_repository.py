"""
Repository for position data.

This module provides functions for storing and retrieving position data from the database.
"""
import logging
import json
from typing import Dict, Any, List, Optional, Tuple, Union
from datetime import datetime

from database.db import Database

logger = logging.getLogger(__name__)

class PositionRepository:
    """
    Repository for position data.
    
    This class provides methods for storing and retrieving position data from the database.
    """
    
    def __init__(self, db: Database):
        """
        Initialize the repository.
        
        Args:
            db: Database instance
        """
        self.db = db
        
    async def create_position(
        self,
        agent_id: str,
        token_address: str,
        token_symbol: Optional[str],
        token_name: Optional[str],
        entry_price: float,
        amount: float,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a new position.
        
        Args:
            agent_id: Agent ID
            token_address: Token address
            token_symbol: Token symbol
            token_name: Token name
            entry_price: Entry price
            amount: Position amount
            metadata: Additional metadata
            
        Returns:
            Created position
        """
        query = """
        INSERT INTO positions (
            agent_id, token_address, token_symbol, token_name,
            entry_price, amount, current_price, price_change,
            status, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
        """
        
        # Initial values
        current_price = entry_price
        price_change = 0.0
        status = "open"
        
        record = await self.db.fetchrow(
            query,
            agent_id,
            token_address,
            token_symbol,
            token_name,
            entry_price,
            amount,
            current_price,
            price_change,
            status,
            json.dumps(metadata or {})
        )
        
        return self.db._record_to_dict(record)
        
    async def get_position(self, position_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a position by ID.
        
        Args:
            position_id: Position ID
            
        Returns:
            Position or None if not found
        """
        query = """
        SELECT * FROM positions
        WHERE id = $1
        """
        
        record = await self.db.fetchrow(query, position_id)
        return self.db._record_to_dict(record)
        
    async def get_position_by_token(
        self,
        agent_id: str,
        token_address: str,
        status: str = "open"
    ) -> Optional[Dict[str, Any]]:
        """
        Get a position by agent ID and token address.
        
        Args:
            agent_id: Agent ID
            token_address: Token address
            status: Position status
            
        Returns:
            Position or None if not found
        """
        query = """
        SELECT * FROM positions
        WHERE agent_id = $1 AND token_address = $2 AND status = $3
        """
        
        record = await self.db.fetchrow(query, agent_id, token_address, status)
        return self.db._record_to_dict(record)
        
    async def get_agent_positions(
        self,
        agent_id: str,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Get positions for an agent.
        
        Args:
            agent_id: Agent ID
            status: Filter by status
            limit: Maximum number of positions to return
            offset: Offset for pagination
            
        Returns:
            Tuple of (positions, total count)
        """
        # Build query conditions
        conditions = ["agent_id = $1"]
        params = [agent_id]
        
        if status:
            conditions.append("status = $" + str(len(params) + 1))
            params.append(status)
            
        # Build WHERE clause
        where_clause = "WHERE " + " AND ".join(conditions)
            
        # Count query
        count_query = f"""
        SELECT COUNT(*) FROM positions
        {where_clause}
        """
        
        # Data query
        query = f"""
        SELECT * FROM positions
        {where_clause}
        ORDER BY opened_at DESC
        LIMIT $" + str(len(params) + 1) + "
        OFFSET $" + str(len(params) + 2) + "
        """
        
        # Execute queries
        total = await self.db.fetchval(count_query, *params)
        records = await self.db.fetch(query, *(params + [limit, offset]))
        
        return self.db._records_to_dicts(records), total
        
    async def update_position_price(
        self,
        position_id: str,
        current_price: float
    ) -> Optional[Dict[str, Any]]:
        """
        Update a position's current price.
        
        Args:
            position_id: Position ID
            current_price: Current price
            
        Returns:
            Updated position or None if not found
        """
        query = """
        UPDATE positions
        SET 
            current_price = $2,
            price_change = (($2 - entry_price) / entry_price)
        WHERE id = $1 AND status = 'open'
        RETURNING *
        """
        
        record = await self.db.fetchrow(query, position_id, current_price)
        return self.db._record_to_dict(record)
        
    async def close_position(
        self,
        position_id: str,
        close_price: float,
        close_reason: str
    ) -> Optional[Dict[str, Any]]:
        """
        Close a position.
        
        Args:
            position_id: Position ID
            close_price: Close price
            close_reason: Reason for closing
            
        Returns:
            Closed position or None if not found
        """
        query = """
        UPDATE positions
        SET 
            status = 'closed',
            current_price = $2,
            price_change = (($2 - entry_price) / entry_price),
            closed_at = NOW(),
            close_reason = $3,
            profit_loss = (($2 - entry_price) * amount)
        WHERE id = $1 AND status = 'open'
        RETURNING *
        """
        
        record = await self.db.fetchrow(query, position_id, close_price, close_reason)
        return self.db._record_to_dict(record)
        
    async def get_agent_profit_loss(self, agent_id: str) -> Dict[str, float]:
        """
        Get total profit/loss for an agent.
        
        Args:
            agent_id: Agent ID
            
        Returns:
            Dictionary with total profit, total loss, and net PnL
        """
        query = """
        SELECT
            COALESCE(SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END), 0) AS total_profit,
            COALESCE(SUM(CASE WHEN profit_loss < 0 THEN -profit_loss ELSE 0 END), 0) AS total_loss,
            COALESCE(SUM(profit_loss), 0) AS net_pnl
        FROM positions
        WHERE agent_id = $1 AND status = 'closed'
        """
        
        record = await self.db.fetchrow(query, agent_id)
        return self.db._record_to_dict(record)
        
    async def get_position_history(
        self,
        agent_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get position history for an agent.
        
        Args:
            agent_id: Agent ID
            start_time: Filter by start time
            end_time: Filter by end time
            limit: Maximum number of positions to return
            
        Returns:
            List of closed positions
        """
        # Build query conditions
        conditions = ["agent_id = $1", "status = 'closed'"]
        params = [agent_id]
        
        if start_time:
            conditions.append("closed_at >= $" + str(len(params) + 1))
            params.append(start_time)
            
        if end_time:
            conditions.append("closed_at <= $" + str(len(params) + 1))
            params.append(end_time)
            
        # Build WHERE clause
        where_clause = "WHERE " + " AND ".join(conditions)
            
        # Build query
        query = f"""
        SELECT * FROM positions
        {where_clause}
        ORDER BY closed_at DESC
        LIMIT $" + str(len(params) + 1) + "
        """
        
        # Execute query
        records = await self.db.fetch(query, *(params + [limit]))
        return self.db._records_to_dicts(records)
        
    async def get_position_metrics(self, agent_id: str) -> Dict[str, Any]:
        """
        Get position metrics for an agent.
        
        Args:
            agent_id: Agent ID
            
        Returns:
            Position metrics
        """
        query = """
        SELECT
            COUNT(*) FILTER (WHERE status = 'open') AS open_positions,
            COUNT(*) FILTER (WHERE status = 'closed') AS closed_positions,
            COUNT(*) FILTER (WHERE status = 'closed' AND profit_loss > 0) AS profitable_positions,
            COUNT(*) FILTER (WHERE status = 'closed' AND profit_loss <= 0) AS unprofitable_positions,
            COALESCE(AVG(CASE WHEN status = 'closed' AND profit_loss > 0 THEN price_change ELSE NULL END), 0) AS avg_profit_percentage,
            COALESCE(AVG(CASE WHEN status = 'closed' AND profit_loss <= 0 THEN price_change ELSE NULL END), 0) AS avg_loss_percentage,
            COALESCE(MAX(CASE WHEN status = 'closed' AND profit_loss > 0 THEN price_change ELSE NULL END), 0) AS max_profit_percentage,
            COALESCE(MIN(CASE WHEN status = 'closed' AND profit_loss <= 0 THEN price_change ELSE NULL END), 0) AS max_loss_percentage
        FROM positions
        WHERE agent_id = $1
        """
        
        record = await self.db.fetchrow(query, agent_id)
        return self.db._record_to_dict(record)
