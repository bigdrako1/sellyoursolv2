"""
Copy Trading Agent implementation.
This agent monitors and copies trades from successful wallets.
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import pandas as pd
import json

from core.base_agent import BaseAgent
from core.agent_status import AgentStatus
from services.market_data_service import MarketDataService
from services.execution_service import ExecutionService
from services.position_manager import PositionManager

logger = logging.getLogger(__name__)

class CopyTradingAgent(BaseAgent):
    """
    Agent that monitors wallets and copies their trades.
    Based on the functionality in copybot.py.
    """
    
    async def _initialize(self):
        """
        Initialize agent resources.
        """
        logger.info("Initializing CopyTradingAgent")
        
        # Initialize services
        self.market_data = MarketDataService(self.config.get("market_data", {}))
        self.execution = ExecutionService(self.config.get("execution", {}))
        self.position_manager = PositionManager(self.agent_id)
        
        # Get configuration
        self.tracked_wallets = self.config.get("tracked_wallets", [])
        self.check_interval_minutes = self.config.get("check_interval_minutes", 10)
        self.days_back = self.config.get("days_back", 1)
        self.max_positions = self.config.get("max_positions", 5)
        self.position_size_usd = self.config.get("position_size_usd", 20)
        self.take_profit = self.config.get("take_profit", 0.3)  # 30% profit target
        self.stop_loss = self.config.get("stop_loss", 0.1)  # 10% stop loss
        self.min_sol_balance = self.config.get("min_sol_balance", 0.005)
        self.do_not_trade_list = self.config.get("do_not_trade_list", [])
        
        # Initialize state
        self.recent_transactions = []
        self.trending_tokens = []
        self.closed_positions = []
        self.scheduler_task = None
        
        # Load closed positions from config or initialize empty
        self.closed_positions = self.config.get("closed_positions", [])
        
        logger.info(f"CopyTradingAgent initialized with {len(self.tracked_wallets)} tracked wallets")
        
    async def _cleanup(self):
        """
        Clean up agent resources.
        """
        logger.info("Cleaning up CopyTradingAgent resources")
        
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
        
        logger.info("CopyTradingAgent resources cleaned up")
        
    async def _on_config_update(self, old_config: Dict[str, Any], new_config: Dict[str, Any]):
        """
        Handle configuration updates.
        
        Args:
            old_config: Previous configuration
            new_config: New configuration
        """
        logger.info("Updating CopyTradingAgent configuration")
        
        # Update tracked wallets if changed
        if old_config.get("tracked_wallets") != new_config.get("tracked_wallets"):
            self.tracked_wallets = new_config.get("tracked_wallets", [])
            
        # Update check interval if changed
        if old_config.get("check_interval_minutes") != new_config.get("check_interval_minutes"):
            self.check_interval_minutes = new_config.get("check_interval_minutes", 10)
            
            # Restart scheduler with new interval if agent is running
            if self.status == AgentStatus.RUNNING and self.scheduler_task:
                self.scheduler_task.cancel()
                try:
                    await self.scheduler_task
                except asyncio.CancelledError:
                    pass
                self.scheduler_task = asyncio.create_task(self._scheduler())
                
        # Update other parameters
        self.days_back = new_config.get("days_back", self.days_back)
        self.max_positions = new_config.get("max_positions", self.max_positions)
        self.position_size_usd = new_config.get("position_size_usd", self.position_size_usd)
        self.take_profit = new_config.get("take_profit", self.take_profit)
        self.stop_loss = new_config.get("stop_loss", self.stop_loss)
        self.min_sol_balance = new_config.get("min_sol_balance", self.min_sol_balance)
        self.do_not_trade_list = new_config.get("do_not_trade_list", self.do_not_trade_list)
        
        logger.info("CopyTradingAgent configuration updated")
        
    async def start(self):
        """
        Start the agent.
        """
        await super().start()
        
        # Start the scheduler
        self.scheduler_task = asyncio.create_task(self._scheduler())
        
    async def _scheduler(self):
        """
        Scheduler for periodic wallet checks.
        """
        try:
            while self.status == AgentStatus.RUNNING:
                await self._run_copy_trading_cycle()
                await asyncio.sleep(self.check_interval_minutes * 60)
        except asyncio.CancelledError:
            logger.info("Scheduler task cancelled")
            raise
        except Exception as e:
            logger.error(f"Error in scheduler: {str(e)}")
            self.status = AgentStatus.ERROR
            raise
            
    async def _run_copy_trading_cycle(self):
        """
        Run a complete copy trading cycle.
        """
        logger.info("Starting copy trading cycle")
        
        try:
            # 1. Check wallet balance
            await self._check_wallet_balance()
            
            # 2. Fetch recent transactions from tracked wallets
            await self._fetch_recent_transactions()
            
            # 3. Analyze transactions to find trending tokens
            await self._analyze_transactions()
            
            # 4. Manage existing positions (take profit/stop loss)
            await self._manage_positions()
            
            # 5. Open new positions if possible
            await self._open_new_positions()
            
            logger.info("Copy trading cycle completed successfully")
            
            # Update metrics
            self.metrics.set("last_cycle_completed", datetime.now().isoformat())
            self.metrics.set("tracked_wallets_count", len(self.tracked_wallets))
            self.metrics.set("trending_tokens_count", len(self.trending_tokens))
            
        except Exception as e:
            logger.error(f"Error in copy trading cycle: {str(e)}")
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
        
        if sol_balance < self.min_sol_balance:
            logger.warning(f"SOL balance ({sol_balance}) is below minimum ({self.min_sol_balance})")
            self.metrics.set("sol_balance_warning", True)
        else:
            logger.info(f"SOL balance ({sol_balance}) is sufficient")
            self.metrics.set("sol_balance_warning", False)
            
        self.metrics.set("sol_balance", sol_balance)
        
    async def _fetch_recent_transactions(self):
        """
        Fetch recent transactions from tracked wallets.
        """
        logger.info(f"Fetching recent transactions from {len(self.tracked_wallets)} wallets")
        
        all_transactions = []
        
        for wallet in self.tracked_wallets:
            try:
                # Calculate the date threshold based on days_back
                since = datetime.now() - timedelta(days=self.days_back)
                
                # Fetch transactions for this wallet
                transactions = await self.market_data.get_wallet_transactions(wallet, 100, since)
                
                logger.info(f"Fetched {len(transactions)} transactions for wallet {wallet}")
                
                # Add to all transactions
                all_transactions.extend(transactions)
                
            except Exception as e:
                logger.error(f"Error fetching transactions for wallet {wallet}: {str(e)}")
                self.metrics.increment("errors")
                
        # Remove duplicates based on token address
        unique_tokens = {}
        for tx in all_transactions:
            token_address = tx.get("token_address")
            if token_address and token_address not in unique_tokens:
                unique_tokens[token_address] = tx
                
        self.recent_transactions = list(unique_tokens.values())
        
        logger.info(f"Found {len(self.recent_transactions)} unique token transactions")
        
    async def _analyze_transactions(self):
        """
        Analyze transactions to find trending tokens.
        """
        logger.info("Analyzing transactions to find trending tokens")
        
        # Filter out tokens in the closed positions list
        filtered_transactions = [
            tx for tx in self.recent_transactions 
            if tx.get("token_address") not in self.closed_positions
            and tx.get("token_address") not in self.do_not_trade_list
        ]
        
        # Sort by timestamp (newest first)
        filtered_transactions.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        # Get token details for each transaction
        trending_tokens = []
        
        for tx in filtered_transactions:
            token_address = tx.get("token_address")
            if not token_address:
                continue
                
            try:
                # Get token details
                token_details = await self.market_data.get_token_details(token_address)
                
                # Apply filters
                if self._apply_token_filters(token_details):
                    trending_tokens.append({
                        "contract_address": token_address,
                        "symbol": token_details.get("symbol", "UNKNOWN"),
                        "name": token_details.get("name", "Unknown"),
                        "price": token_details.get("price", 0.0),
                        "liquidity": token_details.get("liquidity", 0.0),
                        "market_cap": token_details.get("market_cap", 0.0),
                        "top_holder_percentage": token_details.get("top_holder_percentage", 0.0),
                        "timestamp": tx.get("timestamp", "")
                    })
                    
            except Exception as e:
                logger.error(f"Error getting details for token {token_address}: {str(e)}")
                
        self.trending_tokens = trending_tokens
        
        logger.info(f"Found {len(self.trending_tokens)} trending tokens after filtering")
        
    def _apply_token_filters(self, token_details: Dict[str, Any]) -> bool:
        """
        Apply filters to determine if a token should be traded.
        
        Args:
            token_details: Token details
            
        Returns:
            True if the token passes all filters, False otherwise
        """
        # Minimum liquidity filter
        min_liquidity = self.config.get("min_liquidity", 10000)  # $10k minimum liquidity
        if token_details.get("liquidity", 0) < min_liquidity:
            return False
            
        # Maximum holder concentration filter
        max_holder_concentration = self.config.get("max_holder_concentration", 0.5)  # 50% max for top holders
        if token_details.get("top_holder_percentage", 1.0) > max_holder_concentration:
            return False
            
        # Security checks
        if token_details.get("is_honeypot", False):
            return False
            
        if token_details.get("is_blacklisted", False):
            return False
            
        # Pass all filters
        return True
        
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
                
                # Check take profit/stop loss
                result = await self.position_manager.check_stop_loss_take_profit(
                    position["id"], 
                    current_price,
                    self.execution
                )
                
                if result["action"] == "take_profit":
                    logger.info(f"Take profit triggered for position {position['id']} ({token_address})")
                    self.metrics.record_profit(position["amount"] * self.take_profit)
                    
                    # Add to closed positions
                    if token_address not in self.closed_positions:
                        self.closed_positions.append(token_address)
                        
                        # Update config with closed positions
                        self.config["closed_positions"] = self.closed_positions
                        
                elif result["action"] == "stop_loss":
                    logger.info(f"Stop loss triggered for position {position['id']} ({token_address})")
                    self.metrics.record_loss(position["amount"] * self.stop_loss)
                    
                    # Add to closed positions
                    if token_address not in self.closed_positions:
                        self.closed_positions.append(token_address)
                        
                        # Update config with closed positions
                        self.config["closed_positions"] = self.closed_positions
                        
            except Exception as e:
                logger.error(f"Error managing position for {token_address}: {str(e)}")
                self.metrics.increment("errors")
                
    async def _open_new_positions(self):
        """
        Open new positions if possible.
        """
        logger.info("Checking for new positions to open")
        
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
        
        # Try to open positions for trending tokens
        positions_opened = 0
        
        for token in self.trending_tokens:
            # Stop if we've reached the maximum
            if open_positions_count + positions_opened >= self.max_positions:
                break
                
            token_address = token.get("contract_address")
            
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
                    stop_loss=self.stop_loss,
                    take_profit=self.take_profit,
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
        
        if action_type == "add_wallet":
            wallet = action.get("wallet")
            if wallet and wallet not in self.tracked_wallets:
                self.tracked_wallets.append(wallet)
                self.config["tracked_wallets"] = self.tracked_wallets
                logger.info(f"Added wallet {wallet} to tracked wallets")
                return {"success": True, "message": f"Added wallet {wallet}"}
                
        elif action_type == "remove_wallet":
            wallet = action.get("wallet")
            if wallet and wallet in self.tracked_wallets:
                self.tracked_wallets.remove(wallet)
                self.config["tracked_wallets"] = self.tracked_wallets
                logger.info(f"Removed wallet {wallet} from tracked wallets")
                return {"success": True, "message": f"Removed wallet {wallet}"}
                
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
                    
        elif action_type == "get_trending_tokens":
            return {
                "success": True,
                "message": f"Found {len(self.trending_tokens)} trending tokens",
                "data": {
                    "trending_tokens": self.trending_tokens
                }
            }
            
        return await super().execute_action(action)
