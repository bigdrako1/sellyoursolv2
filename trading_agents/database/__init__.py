"""
Database package for trading agents.
"""
import logging
import asyncio
import os
from typing import Dict, Any, Optional

from database.db import Database
from database.agent_repository import AgentRepository
from database.position_repository import PositionRepository
from database.market_repository import MarketRepository

logger = logging.getLogger(__name__)

# Global repositories
_agent_repository: Optional[AgentRepository] = None
_position_repository: Optional[PositionRepository] = None
_market_repository: Optional[MarketRepository] = None

async def initialize_database():
    """Initialize the database and repositories."""
    global _agent_repository, _position_repository, _market_repository
    
    logger.info("Initializing database")
    
    try:
        # Get database instance
        db = await Database.get_instance()
        
        # Initialize schema if needed
        await _initialize_schema(db)
        
        # Create repositories
        _agent_repository = AgentRepository(db)
        _position_repository = PositionRepository(db)
        _market_repository = MarketRepository(db)
        
        logger.info("Database initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise
        
async def close_database():
    """Close the database connection."""
    logger.info("Closing database connection")
    
    try:
        # Get database instance
        db = await Database.get_instance()
        
        # Close connection
        await db.close()
        
        logger.info("Database connection closed")
        
    except Exception as e:
        logger.error(f"Error closing database connection: {str(e)}")
        
async def _initialize_schema(db: Database):
    """
    Initialize the database schema.
    
    Args:
        db: Database instance
    """
    logger.info("Initializing database schema")
    
    try:
        # Check if schema exists
        schema_exists = await db.fetchval(
            "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'trading_agents')"
        )
        
        if not schema_exists:
            logger.info("Creating database schema")
            
            # Read schema file
            schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
            
            with open(schema_path, "r") as f:
                schema_sql = f.read()
                
            # Execute schema SQL
            await db.execute(schema_sql)
            
            logger.info("Database schema created")
        else:
            logger.info("Database schema already exists")
            
    except Exception as e:
        logger.error(f"Error initializing database schema: {str(e)}")
        raise
        
def get_agent_repository() -> AgentRepository:
    """
    Get the agent repository.
    
    Returns:
        Agent repository
    """
    if _agent_repository is None:
        raise RuntimeError("Database not initialized")
        
    return _agent_repository
    
def get_position_repository() -> PositionRepository:
    """
    Get the position repository.
    
    Returns:
        Position repository
    """
    if _position_repository is None:
        raise RuntimeError("Database not initialized")
        
    return _position_repository
    
def get_market_repository() -> MarketRepository:
    """
    Get the market repository.
    
    Returns:
        Market repository
    """
    if _market_repository is None:
        raise RuntimeError("Database not initialized")
        
    return _market_repository
