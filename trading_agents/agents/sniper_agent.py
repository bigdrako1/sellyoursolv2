"""
Sniper Agent implementation.
This agent snipes new tokens with potential for quick gains.
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
import re

from core.base_agent import BaseAgent
from core.agent_status import AgentStatus
from services.market_data_service import MarketDataService
from services.execution_service import ExecutionService
from services.position_manager import PositionManager

logger = logging.getLogger(__name__)

class SniperAgent(BaseAgent):
    """
    Agent that snipes new tokens with potential for quick gains.
    Based on the functionality in sniperbot.py.
    """
    
    async def _initialize(self):
        """
        Initialize agent resources.
        """
        logger.info("Initializing SniperAgent")
        
        # Initialize services
        self.market_data = MarketDataService(self.config.get("market_data", {}))
        self.execution = ExecutionService(self.config.get("execution", {}))
        self.position_manager = PositionManager(self.agent_id)
        
        # Get configuration
        self.position_size_usd = self.config.get("position_size_usd", 20)
        self.max_positions = self.config.get("max_positions", 5)
        self.take_profit_multiplier = self.config.get("take_profit_multiplier", 4.0)  # 4x
        self.stop_loss_percentage = self.config.get("stop_loss_percentage", 0.1)  # 10%
        self.sell_amount_percentage = self.config.get("sell_amount_percentage", 0.8)  # 80%
        self.check_interval_minutes = self.config.get("check_interval_minutes", 5)
        self.do_not_trade_list = self.config.get("do_not_trade_list", [])
        
        # Security check parameters
        self.max_top10_holder_percent = self.config.get("max_top10_holder_percent", 0.3)  # 30%
        self.drop_if_mutable_metadata = self.config.get("drop_if_mutable_metadata", True)
        self.drop_if_2022_token_program = self.config.get("drop_if_2022_token_program", True)
        
        # Social media check parameters
        self.drop_if_no_website = self.config.get("drop_if_no_website", True)
        self.drop_if_no_twitter = self.config.get("drop_if_no_twitter", True)
        self.drop_if_no_telegram = self.config.get("drop_if_no_telegram", False)
        self.only_keep_active_websites = self.config.get("only_keep_active_websites", False)
        
        # Initialize state
        self.potential_tokens = []
        self.closed_positions = self.config.get("closed_positions", [])
        self.scheduler_task = None
        
        logger.info(f"SniperAgent initialized with position_size_usd={self.position_size_usd}, max_positions={self.max_positions}")
        
    async def _cleanup(self):
        """
        Clean up agent resources.
        """
        logger.info("Cleaning up SniperAgent resources")
        
        # Cancel scheduler task if running
        if self.scheduler_task:
            self.scheduler_task.cancel()
            try:
                await self.scheduler_task
            except asyncio.CancelledError:
                pass
            
        # Close all positions
        await self.position_manager.close_all_positions()
        
        # Close services
        await self.market_data.close()
        
        logger.info("SniperAgent resources cleaned up")
        
    async def _on_config_update(self, old_config: Dict[str, Any], new_config: Dict[str, Any]):
        """
        Handle configuration updates.
        
        Args:
            old_config: Previous configuration
            new_config: New configuration
        """
        logger.info("Updating SniperAgent configuration")
        
        # Update position size if changed
        if old_config.get("position_size_usd") != new_config.get("position_size_usd"):
            self.position_size_usd = new_config.get("position_size_usd", 20)
            
        # Update max positions if changed
        if old_config.get("max_positions") != new_config.get("max_positions"):
            self.max_positions = new_config.get("max_positions", 5)
            
        # Update take profit multiplier if changed
        if old_config.get("take_profit_multiplier") != new_config.get("take_profit_multiplier"):
            self.take_profit_multiplier = new_config.get("take_profit_multiplier", 4.0)
            
        # Update stop loss percentage if changed
        if old_config.get("stop_loss_percentage") != new_config.get("stop_loss_percentage"):
            self.stop_loss_percentage = new_config.get("stop_loss_percentage", 0.1)
            
        # Update sell amount percentage if changed
        if old_config.get("sell_amount_percentage") != new_config.get("sell_amount_percentage"):
            self.sell_amount_percentage = new_config.get("sell_amount_percentage", 0.8)
            
        # Update check interval if changed
        if old_config.get("check_interval_minutes") != new_config.get("check_interval_minutes"):
            self.check_interval_minutes = new_config.get("check_interval_minutes", 5)
            
            # Restart scheduler with new interval if agent is running
            if self.status == AgentStatus.RUNNING and self.scheduler_task:
                self.scheduler_task.cancel()
                try:
                    await self.scheduler_task
                except asyncio.CancelledError:
                    pass
                self.scheduler_task = asyncio.create_task(self._scheduler())
                
        # Update do not trade list if changed
        if old_config.get("do_not_trade_list") != new_config.get("do_not_trade_list"):
            self.do_not_trade_list = new_config.get("do_not_trade_list", [])
            
        # Update security check parameters if changed
        if old_config.get("max_top10_holder_percent") != new_config.get("max_top10_holder_percent"):
            self.max_top10_holder_percent = new_config.get("max_top10_holder_percent", 0.3)
            
        if old_config.get("drop_if_mutable_metadata") != new_config.get("drop_if_mutable_metadata"):
            self.drop_if_mutable_metadata = new_config.get("drop_if_mutable_metadata", True)
            
        if old_config.get("drop_if_2022_token_program") != new_config.get("drop_if_2022_token_program"):
            self.drop_if_2022_token_program = new_config.get("drop_if_2022_token_program", True)
            
        # Update social media check parameters if changed
        if old_config.get("drop_if_no_website") != new_config.get("drop_if_no_website"):
            self.drop_if_no_website = new_config.get("drop_if_no_website", True)
            
        if old_config.get("drop_if_no_twitter") != new_config.get("drop_if_no_twitter"):
            self.drop_if_no_twitter = new_config.get("drop_if_no_twitter", True)
            
        if old_config.get("drop_if_no_telegram") != new_config.get("drop_if_no_telegram"):
            self.drop_if_no_telegram = new_config.get("drop_if_no_telegram", False)
            
        if old_config.get("only_keep_active_websites") != new_config.get("only_keep_active_websites"):
            self.only_keep_active_websites = new_config.get("only_keep_active_websites", False)
            
        # Update closed positions if changed
        if old_config.get("closed_positions") != new_config.get("closed_positions"):
            self.closed_positions = new_config.get("closed_positions", [])
            
        logger.info("SniperAgent configuration updated")
        
    async def start(self):
        """
        Start the agent.
        """
        await super().start()
        
        # Start the scheduler
        self.scheduler_task = asyncio.create_task(self._scheduler())
        
    async def _scheduler(self):
        """
        Scheduler for periodic token sniping.
        """
        try:
            while self.status == AgentStatus.RUNNING:
                await self._run_sniping_cycle()
                await asyncio.sleep(self.check_interval_minutes * 60)
        except asyncio.CancelledError:
            logger.info("Scheduler task cancelled")
            raise
        except Exception as e:
            logger.error(f"Error in scheduler: {str(e)}")
            self.status = AgentStatus.ERROR
            raise
            
    async def _run_sniping_cycle(self):
        """
        Run a complete token sniping cycle.
        """
        logger.info("Starting token sniping cycle")
        
        try:
            # 1. Check wallet balance
            await self._check_wallet_balance()
            
            # 2. Manage existing positions (take profit/stop loss)
            await self._manage_positions()
            
            # 3. Find potential tokens to snipe
            await self._find_potential_tokens()
            
            # 4. Open new positions if possible
            await self._open_new_positions()
            
            # Update metrics
            self.metrics.set("last_cycle_completed", datetime.now().isoformat())
            self.metrics.set("potential_tokens_count", len(self.potential_tokens))
            
            logger.info("Token sniping cycle completed successfully")
            
        except Exception as e:
            logger.error(f"Error in token sniping cycle: {str(e)}")
            self.metrics.increment("errors")
            raise
            
    async def _check_wallet_balance(self):
        """
        Check if wallet has sufficient balance.
        """
        logger.info("Checking wallet balance")
        
        # In a real implementation, this would check the actual wallet balance
        # For now, we'll simulate it with a fixed value
        sol_balance = 0.1  # Simulated SOL balance
        
        if sol_balance < 0.005:
            logger.warning(f"SOL balance ({sol_balance}) is below minimum (0.005)")
            self.metrics.set("sol_balance_warning", True)
        else:
            logger.info(f"SOL balance ({sol_balance}) is sufficient")
            self.metrics.set("sol_balance_warning", False)
            
        self.metrics.set("sol_balance", sol_balance)
        
    async def _manage_positions(self):
        """
        Manage existing positions (take profit/stop loss).
        """
        logger.info("Managing existing positions")
        
        # Get open positions
        open_positions = await self.position_manager.get_open_positions()
        
        logger.info(f"Found {len(open_positions)} open positions")
        
        # First check for winning positions (take profit)
        for position in open_positions:
            token_address = position.get("token_address")
            
            # Skip tokens in do_not_trade_list
            if token_address in self.do_not_trade_list:
                logger.info(f"Skipping position management for {token_address} (in do_not_trade_list)")
                continue
                
            try:
                # Get current token price
                token_details = await self.market_data.get_token_details(token_address)
                current_price = token_details.get("price", 0.0)
                
                # Update position with current price
                await self.position_manager.update_position_price(position["id"], current_price)
                
                # Calculate PnL
                entry_price = position["entry_price"]
                pnl_percentage = (current_price - entry_price) / entry_price
                
                # Check take profit
                take_profit_target = self.take_profit_multiplier - 1.0  # Convert multiplier to percentage
                if pnl_percentage >= take_profit_target:
                    logger.info(f"Take profit triggered for position {position['id']} ({token_address})")
                    
                    # Calculate sell size (partial sell)
                    sell_size = position["amount"] * self.sell_amount_percentage
                    
                    # Close position (partial)
                    await self.position_manager.close_position(position["id"], current_price, self.execution)
                    
                    self.metrics.record_profit(position["amount"] * take_profit_target * self.sell_amount_percentage)
                    
                    # Add to closed positions
                    if token_address not in self.closed_positions:
                        self.closed_positions.append(token_address)
                        
                        # Update config with closed positions
                        self.config["closed_positions"] = self.closed_positions
                        
                # Check stop loss
                if pnl_percentage <= -self.stop_loss_percentage:
                    logger.info(f"Stop loss triggered for position {position['id']} ({token_address})")
                    
                    # Close position (full)
                    await self.position_manager.close_position(position["id"], current_price, self.execution)
                    
                    self.metrics.record_loss(position["amount"] * self.stop_loss_percentage)
                    
                    # Add to closed positions
                    if token_address not in self.closed_positions:
                        self.closed_positions.append(token_address)
                        
                        # Update config with closed positions
                        self.config["closed_positions"] = self.closed_positions
                        
            except Exception as e:
                logger.error(f"Error managing position for {token_address}: {str(e)}")
                self.metrics.increment("errors")
                
    async def _find_potential_tokens(self):
        """
        Find potential tokens to snipe.
        """
        logger.info("Finding potential tokens to snipe")
        
        # Get trending tokens
        trending_tokens = await self.market_data.get_trending_tokens(100)
        
        # Filter out tokens in closed positions
        filtered_tokens = [
            token for token in trending_tokens 
            if token.get("address") not in self.closed_positions
            and token.get("address") not in self.do_not_trade_list
        ]
        
        logger.info(f"Found {len(filtered_tokens)} tokens after filtering out closed positions")
        
        # Apply security checks and social media checks
        potential_tokens = []
        
        for token in filtered_tokens:
            token_address = token.get("address")
            
            try:
                # Get token security data
                security_data = await self._get_token_security(token_address)
                
                if not security_data:
                    logger.info(f"Skipping token {token_address} (no security data)")
                    continue
                    
                # Check top10 holder percentage
                top10_holder_percent = security_data.get("top10HolderPercent", 1.0)
                if top10_holder_percent > self.max_top10_holder_percent:
                    logger.info(f"Skipping token {token_address} (top10 holder percentage too high: {top10_holder_percent})")
                    continue
                    
                # Check mutable metadata
                if self.drop_if_mutable_metadata and security_data.get("mutableMetadata", False):
                    logger.info(f"Skipping token {token_address} (mutable metadata)")
                    continue
                    
                # Check token program
                if self.drop_if_2022_token_program and security_data.get("isToken2022", False):
                    logger.info(f"Skipping token {token_address} (2022 token program)")
                    continue
                    
                # Extract social media links
                social_links = await self._extract_social_links(token.get("description", ""))
                
                # Check website
                if self.drop_if_no_website and not social_links.get("website"):
                    logger.info(f"Skipping token {token_address} (no website)")
                    continue
                    
                # Check Twitter
                if self.drop_if_no_twitter and not social_links.get("twitter"):
                    logger.info(f"Skipping token {token_address} (no Twitter)")
                    continue
                    
                # Check Telegram
                if self.drop_if_no_telegram and not social_links.get("telegram"):
                    logger.info(f"Skipping token {token_address} (no Telegram)")
                    continue
                    
                # Check if website is active
                if self.only_keep_active_websites and social_links.get("website"):
                    website_active = await self._check_website(social_links["website"])
                    if not website_active:
                        logger.info(f"Skipping token {token_address} (website not active)")
                        continue
                        
                # Token passed all checks, add to potential tokens
                token["security_data"] = security_data
                token["social_links"] = social_links
                potential_tokens.append(token)
                
            except Exception as e:
                logger.error(f"Error checking token {token_address}: {str(e)}")
                self.metrics.increment("errors")
                
        self.potential_tokens = potential_tokens
        
        logger.info(f"Found {len(self.potential_tokens)} potential tokens after all checks")
        
    async def _get_token_security(self, token_address: str) -> Dict[str, Any]:
        """
        Get token security data.
        
        Args:
            token_address: Token address
            
        Returns:
            Token security data
        """
        # In a real implementation, this would call a specific API to get token security data
        # For now, we'll simulate it with dummy data
        return {
            "creatorAddress": f"creator_{token_address[:8]}",
            "mutableMetadata": False,
            "top10HolderPercent": 0.2,  # 20%
            "isToken2022": False,
            "freezeable": False
        }
        
    async def _extract_social_links(self, description: str) -> Dict[str, str]:
        """
        Extract social media links from token description.
        
        Args:
            description: Token description
            
        Returns:
            Dictionary of social media links
        """
        links = {"twitter": None, "website": None, "telegram": None}
        
        if not description:
            return links
            
        # Try to parse as JSON
        try:
            # Clean up description for JSON parsing
            description = description.replace("'", '"')
            description_data = json.loads(description)
            
            if isinstance(description_data, list):
                for item in description_data:
                    if isinstance(item, dict):
                        for key, value in item.items():
                            if "twitter" in key.lower() or "twitter.com" in str(value).lower() or "x.com" in str(value).lower():
                                links["twitter"] = value
                            elif "telegram" in key.lower() or "t.me" in str(value).lower():
                                links["telegram"] = value
                            elif "website" in key.lower() or "http" in str(value).lower():
                                if "t.me" not in str(value).lower():
                                    links["website"] = value
        except (json.JSONDecodeError, AttributeError):
            # If JSON parsing fails, try regex
            twitter_match = re.search(r'https?://(?:www\.)?(?:twitter\.com|x\.com)/\w+', description)
            if twitter_match:
                links["twitter"] = twitter_match.group(0)
                
            telegram_match = re.search(r'https?://(?:www\.)?t\.me/\w+', description)
            if telegram_match:
                links["telegram"] = telegram_match.group(0)
                
            website_match = re.search(r'https?://(?:www\.)?(?!twitter\.com|t\.me)[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:/\S*)?', description)
            if website_match:
                links["website"] = website_match.group(0)
                
        return links
        
    async def _check_website(self, url: str) -> bool:
        """
        Check if a website is active.
        
        Args:
            url: Website URL
            
        Returns:
            True if the website is active, False otherwise
        """
        # In a real implementation, this would make an HTTP request to check the website
        # For now, we'll simulate it with a fixed value
        return True
        
    async def _open_new_positions(self):
        """
        Open new positions for potential tokens.
        """
        logger.info("Opening new positions for potential tokens")
        
        # Get open positions
        open_positions = await self.position_manager.get_open_positions()
        open_positions_count = len(open_positions)
        
        # Check if we can open more positions
        if open_positions_count >= self.max_positions:
            logger.info(f"Already at maximum positions ({open_positions_count}/{self.max_positions})")
            return
            
        # Check available balance
        available_balance = await self.execution.get_available_balance()
        
        if available_balance < self.position_size_usd:
            logger.warning(f"Insufficient balance ({available_balance} USD) for new positions")
            return
            
        logger.info(f"Can open up to {self.max_positions - open_positions_count} new positions")
        
        # Try to open positions for potential tokens
        positions_opened = 0
        
        for token in self.potential_tokens:
            # Stop if we've reached the maximum
            if open_positions_count + positions_opened >= self.max_positions:
                break
                
            token_address = token.get("address")
            
            # Skip if already in closed positions
            if token_address in self.closed_positions:
                continue
                
            # Skip if in do_not_trade_list
            if token_address in self.do_not_trade_list:
                continue
                
            try:
                # Get token details
                token_details = await self.market_data.get_token_details(token_address)
                current_price = token_details.get("price", 0.0)
                
                # Open position
                position_id = await self.position_manager.open_position(
                    token_address=token_address,
                    amount=self.position_size_usd,
                    entry_price=current_price,
                    stop_loss=self.stop_loss_percentage,
                    take_profit=self.take_profit_multiplier - 1.0,  # Convert multiplier to percentage
                    execution_service=self.execution
                )
                
                logger.info(f"Opened position {position_id} for token {token_address}")
                
                # Update metrics
                self.metrics.increment("positions_opened")
                positions_opened += 1
                
            except Exception as e:
                logger.error(f"Error opening position for {token_address}: {str(e)}")
                self.metrics.increment("errors")
                
        logger.info(f"Opened {positions_opened} new positions")
        
    async def execute_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a specific action.
        
        Args:
            action: Action to execute
            
        Returns:
            Result of the action
        """
        action_type = action.get("type")
        
        if action_type == "get_potential_tokens":
            return {
                "success": True,
                "message": f"Found {len(self.potential_tokens)} potential tokens",
                "data": {
                    "potential_tokens": self.potential_tokens[:100]  # Limit to 100 tokens to avoid large responses
                }
            }
            
        elif action_type == "add_to_do_not_trade_list":
            token_address = action.get("token_address")
            
            if token_address and token_address not in self.do_not_trade_list:
                self.do_not_trade_list.append(token_address)
                self.config["do_not_trade_list"] = self.do_not_trade_list
                
                logger.info(f"Added token {token_address} to do not trade list")
                return {"success": True, "message": f"Added token {token_address} to do not trade list"}
                
        elif action_type == "remove_from_do_not_trade_list":
            token_address = action.get("token_address")
            
            if token_address and token_address in self.do_not_trade_list:
                self.do_not_trade_list.remove(token_address)
                self.config["do_not_trade_list"] = self.do_not_trade_list
                
                logger.info(f"Removed token {token_address} from do not trade list")
                return {"success": True, "message": f"Removed token {token_address} from do not trade list"}
                
        elif action_type == "close_position":
            position_id = action.get("position_id")
            
            if position_id:
                position = await self.position_manager.get_position(position_id)
                if position:
                    token_address = position["token_address"]
                    token_details = await self.market_data.get_token_details(token_address)
                    current_price = token_details.get("price", 0.0)
                    
                    closed_position = await self.position_manager.close_position(
                        position_id, 
                        current_price,
                        self.execution
                    )
                    
                    # Add to closed positions
                    if token_address not in self.closed_positions:
                        self.closed_positions.append(token_address)
                        self.config["closed_positions"] = self.closed_positions
                    
                    logger.info(f"Manually closed position {position_id}")
                    return {
                        "success": True, 
                        "message": f"Closed position {position_id}",
                        "data": closed_position
                    }
                    
        return await super().execute_action(action)
