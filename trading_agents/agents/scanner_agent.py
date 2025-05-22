"""
Scanner Agent implementation.
This agent scans for promising tokens on the Solana blockchain.
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json

from core.base_agent import BaseAgent
from core.agent_status import AgentStatus
from services.market_data_service import MarketDataService
from services.execution_service import ExecutionService
from services.position_manager import PositionManager

logger = logging.getLogger(__name__)

class ScannerAgent(BaseAgent):
    """
    Agent that scans for promising tokens on the Solana blockchain.
    Based on the functionality in solscanner.py.
    """
    
    async def _initialize(self):
        """
        Initialize agent resources.
        """
        logger.info("Initializing ScannerAgent")
        
        # Initialize services
        self.market_data = MarketDataService(self.config.get("market_data", {}))
        self.execution = ExecutionService(self.config.get("execution", {}))
        self.position_manager = PositionManager(self.agent_id)
        
        # Get configuration
        self.trending_tokens_limit = self.config.get("trending_tokens_limit", 200)
        self.new_token_hours = self.config.get("new_token_hours", 3)
        self.super_cycle_tokens = self.config.get("super_cycle_tokens", [])
        self.check_interval_minutes = self.config.get("check_interval_minutes", 30)
        
        # Initialize state
        self.trending_tokens = []
        self.new_tokens = []
        self.top_traders = []
        self.scheduler_task = None
        
        logger.info(f"ScannerAgent initialized with trending_tokens_limit={self.trending_tokens_limit}, new_token_hours={self.new_token_hours}")
        
    async def _cleanup(self):
        """
        Clean up agent resources.
        """
        logger.info("Cleaning up ScannerAgent resources")
        
        # Cancel scheduler task if running
        if self.scheduler_task:
            self.scheduler_task.cancel()
            try:
                await self.scheduler_task
            except asyncio.CancelledError:
                pass
            
        # Close services
        await self.market_data.close()
        
        logger.info("ScannerAgent resources cleaned up")
        
    async def _on_config_update(self, old_config: Dict[str, Any], new_config: Dict[str, Any]):
        """
        Handle configuration updates.
        
        Args:
            old_config: Previous configuration
            new_config: New configuration
        """
        logger.info("Updating ScannerAgent configuration")
        
        # Update trending tokens limit if changed
        if old_config.get("trending_tokens_limit") != new_config.get("trending_tokens_limit"):
            self.trending_tokens_limit = new_config.get("trending_tokens_limit", 200)
            
        # Update new token hours if changed
        if old_config.get("new_token_hours") != new_config.get("new_token_hours"):
            self.new_token_hours = new_config.get("new_token_hours", 3)
            
        # Update super cycle tokens if changed
        if old_config.get("super_cycle_tokens") != new_config.get("super_cycle_tokens"):
            self.super_cycle_tokens = new_config.get("super_cycle_tokens", [])
            
        # Update check interval if changed
        if old_config.get("check_interval_minutes") != new_config.get("check_interval_minutes"):
            self.check_interval_minutes = new_config.get("check_interval_minutes", 30)
            
            # Restart scheduler with new interval if agent is running
            if self.status == AgentStatus.RUNNING and self.scheduler_task:
                self.scheduler_task.cancel()
                try:
                    await self.scheduler_task
                except asyncio.CancelledError:
                    pass
                self.scheduler_task = asyncio.create_task(self._scheduler())
                
        logger.info("ScannerAgent configuration updated")
        
    async def start(self):
        """
        Start the agent.
        """
        await super().start()
        
        # Start the scheduler
        self.scheduler_task = asyncio.create_task(self._scheduler())
        
    async def _scheduler(self):
        """
        Scheduler for periodic token scanning.
        """
        try:
            while self.status == AgentStatus.RUNNING:
                await self._run_scanning_cycle()
                await asyncio.sleep(self.check_interval_minutes * 60)
        except asyncio.CancelledError:
            logger.info("Scheduler task cancelled")
            raise
        except Exception as e:
            logger.error(f"Error in scheduler: {str(e)}")
            self.status = AgentStatus.ERROR
            raise
            
    async def _run_scanning_cycle(self):
        """
        Run a complete token scanning cycle.
        """
        logger.info("Starting token scanning cycle")
        
        try:
            # 1. Get trending tokens
            await self._get_trending_tokens()
            
            # 2. Get new tokens
            await self._get_new_tokens()
            
            # 3. Get top traders for super cycle tokens
            if self.super_cycle_tokens:
                await self._get_top_traders()
                
            # Update metrics
            self.metrics.set("last_cycle_completed", datetime.now().isoformat())
            self.metrics.set("trending_tokens_count", len(self.trending_tokens))
            self.metrics.set("new_tokens_count", len(self.new_tokens))
            self.metrics.set("top_traders_count", len(self.top_traders))
            
            logger.info("Token scanning cycle completed successfully")
            
        except Exception as e:
            logger.error(f"Error in token scanning cycle: {str(e)}")
            self.metrics.increment("errors")
            raise
            
    async def _get_trending_tokens(self):
        """
        Get trending tokens from the market data service.
        """
        logger.info(f"Getting trending tokens (limit={self.trending_tokens_limit})")
        
        try:
            # Get trending tokens
            tokens = await self.market_data.get_trending_tokens(self.trending_tokens_limit)
            
            # Add dexscreener link
            for token in tokens:
                token["dexscreener_link"] = f"https://dexscreener.com/solana/{token['address']}"
                
            self.trending_tokens = tokens
            
            logger.info(f"Found {len(self.trending_tokens)} trending tokens")
            
        except Exception as e:
            logger.error(f"Error getting trending tokens: {str(e)}")
            self.metrics.increment("errors")
            
    async def _get_new_tokens(self):
        """
        Get new tokens listed in the last few hours.
        """
        logger.info(f"Getting new tokens listed in the last {self.new_token_hours} hours")
        
        try:
            # Calculate time range
            end_time = datetime.now()
            start_time = end_time - timedelta(hours=self.new_token_hours)
            
            # In a real implementation, this would call a specific API to get new token listings
            # For now, we'll filter trending tokens by their creation time
            new_tokens = []
            
            for token in self.trending_tokens:
                # Check if token has creation time information
                if "created_at" in token:
                    token_time = datetime.fromisoformat(token["created_at"].replace("Z", "+00:00"))
                    if token_time >= start_time:
                        new_tokens.append(token)
                        
            self.new_tokens = new_tokens
            
            logger.info(f"Found {len(self.new_tokens)} new tokens")
            
        except Exception as e:
            logger.error(f"Error getting new tokens: {str(e)}")
            self.metrics.increment("errors")
            
    async def _get_top_traders(self):
        """
        Get top traders for super cycle tokens.
        """
        logger.info(f"Getting top traders for {len(self.super_cycle_tokens)} super cycle tokens")
        
        try:
            all_top_traders = []
            
            for token_address in self.super_cycle_tokens:
                # In a real implementation, this would call a specific API to get top traders
                # For now, we'll simulate it with dummy data
                
                # Simulate 10 top traders for each token
                for i in range(10):
                    trader = {
                        "tokenAddress": token_address,
                        "owner": f"trader{i}_{token_address[:8]}",
                        "volume": 1000000 / (i + 1),  # Decreasing volume
                        "trades": 100 / (i + 1),  # Decreasing number of trades
                        "gmgn_link": f"https://gmgn.ai/sol/address/trader{i}_{token_address[:8]}"
                    }
                    all_top_traders.append(trader)
                    
            self.top_traders = all_top_traders
            
            logger.info(f"Found {len(self.top_traders)} top traders")
            
        except Exception as e:
            logger.error(f"Error getting top traders: {str(e)}")
            self.metrics.increment("errors")
            
    async def _apply_token_filters(self, token: Dict[str, Any]) -> bool:
        """
        Apply filters to determine if a token is promising.
        
        Args:
            token: Token data
            
        Returns:
            True if the token passes all filters, False otherwise
        """
        # Minimum liquidity filter
        min_liquidity = self.config.get("min_liquidity", 10000)  # $10k minimum liquidity
        if token.get("liquidity", 0) < min_liquidity:
            return False
            
        # Minimum volume filter
        min_volume = self.config.get("min_volume", 5000)  # $5k minimum 24h volume
        if token.get("volume_24h", 0) < min_volume:
            return False
            
        # Maximum holder concentration filter (if available)
        if "top_holder_percentage" in token:
            max_holder_concentration = self.config.get("max_holder_concentration", 0.5)  # 50% max for top holders
            if token["top_holder_percentage"] > max_holder_concentration:
                return False
                
        # Pass all filters
        return True
        
    async def execute_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a specific action.
        
        Args:
            action: Action to execute
            
        Returns:
            Result of the action
        """
        action_type = action.get("type")
        
        if action_type == "get_trending_tokens":
            return {
                "success": True,
                "message": f"Found {len(self.trending_tokens)} trending tokens",
                "data": {
                    "trending_tokens": self.trending_tokens[:100]  # Limit to 100 tokens to avoid large responses
                }
            }
            
        elif action_type == "get_new_tokens":
            return {
                "success": True,
                "message": f"Found {len(self.new_tokens)} new tokens",
                "data": {
                    "new_tokens": self.new_tokens
                }
            }
            
        elif action_type == "get_top_traders":
            return {
                "success": True,
                "message": f"Found {len(self.top_traders)} top traders",
                "data": {
                    "top_traders": self.top_traders[:100]  # Limit to 100 traders to avoid large responses
                }
            }
            
        elif action_type == "add_super_cycle_token":
            token_address = action.get("token_address")
            
            if token_address and token_address not in self.super_cycle_tokens:
                self.super_cycle_tokens.append(token_address)
                self.config["super_cycle_tokens"] = self.super_cycle_tokens
                
                logger.info(f"Added token {token_address} to super cycle tokens")
                return {"success": True, "message": f"Added token {token_address} to super cycle tokens"}
                
        elif action_type == "remove_super_cycle_token":
            token_address = action.get("token_address")
            
            if token_address and token_address in self.super_cycle_tokens:
                self.super_cycle_tokens.remove(token_address)
                self.config["super_cycle_tokens"] = self.super_cycle_tokens
                
                logger.info(f"Removed token {token_address} from super cycle tokens")
                return {"success": True, "message": f"Removed token {token_address} from super cycle tokens"}
                
        elif action_type == "filter_promising_tokens":
            min_liquidity = action.get("min_liquidity", self.config.get("min_liquidity", 10000))
            min_volume = action.get("min_volume", self.config.get("min_volume", 5000))
            
            # Apply filters to trending tokens
            promising_tokens = []
            
            for token in self.trending_tokens:
                if token.get("liquidity", 0) >= min_liquidity and token.get("volume_24h", 0) >= min_volume:
                    promising_tokens.append(token)
                    
            return {
                "success": True,
                "message": f"Found {len(promising_tokens)} promising tokens",
                "data": {
                    "promising_tokens": promising_tokens[:100]  # Limit to 100 tokens to avoid large responses
                }
            }
            
        return await super().execute_action(action)
