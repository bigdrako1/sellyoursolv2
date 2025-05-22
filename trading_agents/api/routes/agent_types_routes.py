"""
API routes for agent types.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from core.agent_factory import AgentFactory

# Create router
router = APIRouter(prefix="/agent-types", tags=["agent-types"])

@router.get("/")
async def get_agent_types() -> Dict[str, Any]:
    """
    Get available agent types.
    
    Returns:
        Dictionary containing available agent types and their descriptions
    """
    try:
        agent_types = AgentFactory.get_available_agent_types()
        
        return {
            "agent_types": [
                {
                    "type": agent_type,
                    "description": description
                }
                for agent_type, description in agent_types.items()
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
        
@router.get("/{agent_type}")
async def get_agent_type(agent_type: str) -> Dict[str, Any]:
    """
    Get information about a specific agent type.
    
    Args:
        agent_type: Type of agent
        
    Returns:
        Dictionary containing information about the agent type
    """
    try:
        agent_types = AgentFactory.get_available_agent_types()
        
        if agent_type not in agent_types:
            raise HTTPException(status_code=404, detail=f"Agent type {agent_type} not found")
            
        # Get agent class
        agent_class = AgentFactory.get_agent_class(agent_type)
        
        # Get agent description
        description = agent_types[agent_type]
        
        # Get agent configuration schema
        # In a real implementation, this would extract the configuration schema from the agent class
        # For now, we'll return a simple schema
        config_schema = {
            "type": "object",
            "properties": {
                "market_data": {
                    "type": "object",
                    "properties": {
                        "birdeye_api_key": {"type": "string"},
                        "moondev_api_key": {"type": "string"}
                    }
                },
                "execution": {
                    "type": "object",
                    "properties": {
                        "slippage": {"type": "number"},
                        "max_retries": {"type": "integer"},
                        "retry_delay": {"type": "number"}
                    }
                }
            }
        }
        
        # Add agent-specific configuration schema
        if agent_type == "copy_trading":
            config_schema["properties"].update({
                "tracked_wallets": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "check_interval_minutes": {"type": "integer"},
                "days_back": {"type": "integer"},
                "max_positions": {"type": "integer"},
                "position_size_usd": {"type": "number"},
                "take_profit": {"type": "number"},
                "stop_loss": {"type": "number"},
                "min_sol_balance": {"type": "number"},
                "do_not_trade_list": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            })
        elif agent_type == "liquidation":
            config_schema["properties"].update({
                "symbols": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "symbols_data": {
                    "type": "object",
                    "additionalProperties": {
                        "type": "object",
                        "properties": {
                            "liquidation_threshold": {"type": "number"},
                            "time_window_mins": {"type": "integer"},
                            "stop_loss": {"type": "number"},
                            "take_profit": {"type": "number"}
                        }
                    }
                },
                "order_size_usd": {"type": "number"},
                "leverage": {"type": "number"},
                "check_interval_seconds": {"type": "integer"}
            })
        elif agent_type == "scanner":
            config_schema["properties"].update({
                "trending_tokens_limit": {"type": "integer"},
                "new_token_hours": {"type": "integer"},
                "super_cycle_tokens": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "check_interval_minutes": {"type": "integer"}
            })
        elif agent_type == "sniper":
            config_schema["properties"].update({
                "position_size_usd": {"type": "number"},
                "max_positions": {"type": "integer"},
                "take_profit_multiplier": {"type": "number"},
                "stop_loss_percentage": {"type": "number"},
                "sell_amount_percentage": {"type": "number"},
                "check_interval_minutes": {"type": "integer"},
                "do_not_trade_list": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "max_top10_holder_percent": {"type": "number"},
                "drop_if_mutable_metadata": {"type": "boolean"},
                "drop_if_2022_token_program": {"type": "boolean"},
                "drop_if_no_website": {"type": "boolean"},
                "drop_if_no_twitter": {"type": "boolean"},
                "drop_if_no_telegram": {"type": "boolean"},
                "only_keep_active_websites": {"type": "boolean"}
            })
        
        return {
            "type": agent_type,
            "description": description,
            "config_schema": config_schema
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
