"""
SOL Scanner Agent implementation.

This module provides an agent that scans for trending tokens on Solana.
"""
import asyncio
import logging
import pandas as pd
import requests
import json
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from core.base_agent import BaseAgent
from core.agent_status import AgentStatus
from core.resource_pool import ResourcePool

logger = logging.getLogger(__name__)

class SolScannerAgent(BaseAgent):
    """
    Agent that scans for trending tokens on Solana.
    
    This agent is based on the functionality in solscanner.py.
    """
    
    async def _initialize(self):
        """Initialize the SOL scanner agent."""
        logger.info(f"Initializing SOL scanner agent {self.agent_id}")
        
        # Validate configuration
        self._validate_config()
        
        # Initialize state
        self.trending_tokens = []
        self.new_tokens = []
        self.top_traders = []
        self.super_cycle_tokens = self.config.get("super_cycle_tokens", [])
        self.new_token_hours = self.config.get("new_token_hours", 3)
        self.api_key = self.config.get("birdeye_api_key", "")
        
        # Initialize file paths
        self.trending_tokens_csv = self.config.get("trending_tokens_csv", "data/birdeye_trending_tokens.csv")
        self.new_tokens_csv = self.config.get("new_tokens_csv", "data/new_tokens.csv")
        self.top_traders_csv = self.config.get("top_traders_csv", "data/top_traders_birdeye.csv")
        
        logger.info(f"SOL scanner agent {self.agent_id} initialized")
        
    async def _cleanup(self):
        """Clean up resources."""
        logger.info(f"Cleaning up SOL scanner agent {self.agent_id}")
        
        # Nothing to clean up for now
        
    async def _on_config_update(self, old_config: Dict[str, Any], new_config: Dict[str, Any]):
        """Handle configuration updates."""
        logger.info(f"Updating configuration for SOL scanner agent {self.agent_id}")
        
        # Update configuration
        self.super_cycle_tokens = new_config.get("super_cycle_tokens", self.super_cycle_tokens)
        self.new_token_hours = new_config.get("new_token_hours", self.new_token_hours)
        self.api_key = new_config.get("birdeye_api_key", self.api_key)
        
        # Update file paths
        self.trending_tokens_csv = new_config.get("trending_tokens_csv", self.trending_tokens_csv)
        self.new_tokens_csv = new_config.get("new_tokens_csv", self.new_tokens_csv)
        self.top_traders_csv = new_config.get("top_traders_csv", self.top_traders_csv)
        
        logger.info(f"Configuration updated for SOL scanner agent {self.agent_id}")
        
    async def _run_cycle(self, resource_pool: ResourcePool) -> Dict[str, Any]:
        """Run a single agent cycle."""
        logger.info(f"Running cycle for SOL scanner agent {self.agent_id}")
        
        results = {
            "trending_tokens_found": 0,
            "new_tokens_found": 0,
            "top_traders_found": 0,
            "errors": 0
        }
        
        try:
            # Get trending tokens
            trending_tokens = await self._get_trending_tokens(200)
            self.trending_tokens = trending_tokens
            results["trending_tokens_found"] = len(trending_tokens)
            
            # Get new tokens
            new_tokens = await self._get_new_tokens()
            self.new_tokens = new_tokens
            results["new_tokens_found"] = len(new_tokens)
            
            # Get top traders
            top_traders = await self._get_top_traders()
            self.top_traders = top_traders
            results["top_traders_found"] = len(top_traders)
            
            logger.info(f"Cycle completed for SOL scanner agent {self.agent_id}: {results}")
            
        except Exception as e:
            logger.error(f"Error in SOL scanner cycle: {str(e)}")
            results["errors"] += 1
            
        return results
        
    async def _get_trending_tokens(self, limit: int = 200) -> List[Dict[str, Any]]:
        """
        Get trending tokens from Birdeye API.
        
        Args:
            limit: Maximum number of tokens to retrieve
            
        Returns:
            List of trending tokens
        """
        logger.info(f"Getting trending tokens (limit: {limit})")
        
        url = "https://public-api.birdeye.so/defi/token_trending"
        headers = {
            "accept": "application/json",
            "x-chain": "solana",
            "X-API-KEY": self.api_key
        }
        
        all_tokens = []
        
        for offset in range(0, limit, 20):
            params = {
                "sort_by": "rank",
                "sort_type": "asc",
                "offset": offset,
                "limit": min(20, limit - offset)
            }
            
            try:
                response = await self._make_api_request(url, headers, params)
                
                tokens = response.get('data', {}).get('tokens', [])
                for token in tokens:
                    all_tokens.append({
                        'address': token.get('address'),
                        'liquidity': token.get('liquidity'),
                        'name': token.get('name'),
                        'volume24hUSD': token.get('volume24hUSD'),
                        'price': token.get('price')
                    })
                
                logger.info(f"Retrieved {len(tokens)} tokens (offset {offset})")
                
                if len(tokens) < 20:
                    break
                
                await asyncio.sleep(1)  # Small pause to avoid API rate limits
                
            except Exception as e:
                logger.error(f"Error getting trending tokens: {str(e)}")
                break
        
        if all_tokens:
            df = pd.DataFrame(all_tokens)
            
            # Add DexScreener link
            df['dexscreener_link'] = df['address'].apply(lambda x: f"https://dexscreener.com/solana/{x}")
            
            # Save to CSV
            df.to_csv(self.trending_tokens_csv, index=False)
            logger.info(f"Saved {len(all_tokens)} trending tokens to {self.trending_tokens_csv}")
        
        return all_tokens
        
    async def _get_new_tokens(self) -> List[Dict[str, Any]]:
        """
        Get new tokens from Birdeye API.
        
        Returns:
            List of new tokens
        """
        logger.info(f"Getting new tokens (hours: {self.new_token_hours})")
        
        url = "https://public-api.birdeye.so/defi/v2/tokens/new_listing"
        headers = {
            "accept": "application/json",
            "x-chain": "solana",
            "X-API-KEY": self.api_key
        }
        
        end_time = int(time.time())
        start_time = end_time - (self.new_token_hours * 3600)
        
        # Try to load existing tokens
        try:
            existing_df = pd.read_csv(self.new_tokens_csv)
            if not existing_df.empty:
                last_token_time = existing_df['listingTime'].max()
                start_time = max(start_time, int(last_token_time) + 1)
        except (FileNotFoundError, pd.errors.EmptyDataError):
            existing_df = pd.DataFrame()
        
        params = {
            "time_from": start_time,
            "time_to": end_time,
            "limit": 10
        }
        
        logger.info(f"Requesting new tokens from {datetime.fromtimestamp(start_time)} to {datetime.fromtimestamp(end_time)}")
        
        all_new_tokens = []
        
        try:
            while start_time < end_time:
                response = await self._make_api_request(url, headers, params)
                
                new_tokens = response.get('data', {}).get('items', [])
                if not new_tokens:
                    break
                
                all_new_tokens.extend(new_tokens)
                
                logger.info(f"Retrieved {len(new_tokens)} new tokens")
                
                last_token_time = new_tokens[-1].get('listingTime', start_time)
                start_time = last_token_time + 1
                params['time_from'] = start_time
                
                await asyncio.sleep(1)  # Small pause to avoid API rate limits
            
            if all_new_tokens:
                new_df = pd.DataFrame(all_new_tokens)
                new_df['dexscreener_link'] = new_df['address'].apply(lambda x: f"https://dexscreener.com/solana/{x}")
                
                # Combine with existing tokens and remove duplicates
                combined_df = pd.concat([existing_df, new_df]).drop_duplicates(subset=['address'], keep='last')
                combined_df.to_csv(self.new_tokens_csv, index=False)
                
                logger.info(f"Saved {len(new_df)} new tokens to {self.new_tokens_csv}")
                logger.info(f"Total tokens in file: {len(combined_df)}")
            
        except Exception as e:
            logger.error(f"Error getting new tokens: {str(e)}")
        
        return all_new_tokens
        
    async def _get_top_traders(self) -> List[Dict[str, Any]]:
        """
        Get top traders from Birdeye API.
        
        Returns:
            List of top traders
        """
        logger.info(f"Getting top traders for {len(self.super_cycle_tokens)} tokens")
        
        url = "https://public-api.birdeye.so/defi/v2/tokens/top_traders"
        headers = {
            "accept": "application/json",
            "x-chain": "solana",
            "X-API-KEY": self.api_key
        }
        
        params = {
            "time_frame": "24h",
            "sort_type": "desc",
            "sort_by": "volume",
            "limit": 10  # Maximum allowed by the API
        }
        
        all_top_traders = []
        
        for token_address in self.super_cycle_tokens:
            token_traders = []
            params["address"] = token_address
            
            for offset in range(0, 100, 10):  # Make 10 calls to get 100 traders
                params["offset"] = offset
                
                try:
                    response = await self._make_api_request(url, headers, params)
                    
                    traders = response.get('data', {}).get('items', [])
                    for trader in traders:
                        token_traders.append({
                            'tokenAddress': token_address,
                            'owner': trader.get('owner'),
                            'volume': trader.get('volume'),
                            'trades': trader.get('trade'),
                            'gmgn_link': f"https://gmgn.ai/sol/address/{trader.get('owner')}"
                        })
                    
                    logger.info(f"Retrieved {len(traders)} top traders for token {token_address} (offset {offset})")
                    
                    if len(traders) < 10:  # If we get fewer than 10, we've reached the end
                        break
                    
                    await asyncio.sleep(1)  # Small pause to avoid API rate limits
                    
                except Exception as e:
                    logger.error(f"Error getting top traders for token {token_address}: {str(e)}")
                    break
            
            all_top_traders.extend(token_traders)
            logger.info(f"Total top traders for token {token_address}: {len(token_traders)}")
        
        if all_top_traders:
            df = pd.DataFrame(all_top_traders)
            df.to_csv(self.top_traders_csv, index=False)
            logger.info(f"Saved {len(all_top_traders)} top traders to {self.top_traders_csv}")
        
        return all_top_traders
        
    async def _make_api_request(self, url: str, headers: Dict[str, str], params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make an API request with retries.
        
        Args:
            url: API URL
            headers: Request headers
            params: Request parameters
            
        Returns:
            API response as a dictionary
        """
        max_retries = 3
        retry_delay = 2
        
        for retry in range(max_retries):
            try:
                response = requests.get(url, headers=headers, params=params)
                response.raise_for_status()
                return response.json()
            except requests.exceptions.RequestException as e:
                logger.warning(f"API request failed (retry {retry+1}/{max_retries}): {str(e)}")
                if retry < max_retries - 1:
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    raise
        
        return {}  # Should never reach here due to the raise in the loop
        
    def _validate_config(self):
        """Validate the agent configuration."""
        # Check that super_cycle_tokens is a list
        if not isinstance(self.config.get("super_cycle_tokens", []), list):
            raise ValueError("super_cycle_tokens must be a list")
            
        # Check that new_token_hours is a positive number
        new_token_hours = self.config.get("new_token_hours", 3)
        if not isinstance(new_token_hours, (int, float)) or new_token_hours <= 0:
            raise ValueError("new_token_hours must be a positive number")
            
        # Check that birdeye_api_key is provided
        if not self.config.get("birdeye_api_key"):
            raise ValueError("birdeye_api_key is required")
