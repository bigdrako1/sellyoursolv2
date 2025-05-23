"""
Kraken exchange integration.

This module provides integration with the Kraken cryptocurrency exchange.
"""
import logging
import asyncio
import time
import hmac
import hashlib
import base64
import urllib.parse
import json
from typing import Dict, List, Any, Optional, Tuple, Union
from decimal import Decimal
import aiohttp
from datetime import datetime

from exchanges.base_exchange import BaseExchange
from models.order import Order, OrderSide, OrderType, OrderStatus
from models.position import Position
from models.market import Market
from utils.config import Config

logger = logging.getLogger(__name__)

class KrakenExchange(BaseExchange):
    """Kraken exchange integration."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the Kraken exchange.
        
        Args:
            config: Exchange configuration
        """
        super().__init__(config)
        
        # Exchange name
        self.name = "kraken"
        
        # API endpoints
        self.base_url = "https://api.kraken.com"
        self.api_version = "0"
        
        # API credentials
        self.api_key = config.get("api_key", "")
        self.api_secret = config.get("api_secret", "")
        
        # Rate limiting
        self.rate_limit = config.get("rate_limit", 1.0)  # Requests per second
        self.last_request_time = 0
        
        # HTTP session
        self.session = None
        
    async def initialize(self) -> bool:
        """
        Initialize the exchange connection.
        
        Returns:
            True if initialization was successful, False otherwise
        """
        try:
            # Create HTTP session
            self.session = aiohttp.ClientSession()
            
            # Test connection
            await self.fetch_markets()
            
            logger.info(f"Initialized Kraken exchange")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing Kraken exchange: {str(e)}")
            return False
            
    async def close(self) -> bool:
        """
        Close the exchange connection.
        
        Returns:
            True if closing was successful, False otherwise
        """
        try:
            if self.session:
                await self.session.close()
                self.session = None
                
            logger.info(f"Closed Kraken exchange")
            return True
            
        except Exception as e:
            logger.error(f"Error closing Kraken exchange: {str(e)}")
            return False
            
    async def fetch_markets(self) -> List[Market]:
        """
        Fetch available markets.
        
        Returns:
            List of markets
        """
        try:
            # Make API request
            response = await self._public_request("AssetPairs")
            
            # Parse response
            markets = []
            for symbol, data in response.get("result", {}).items():
                # Create market
                market = Market(
                    symbol=symbol,
                    base=data.get("base", ""),
                    quote=data.get("quote", ""),
                    active=True,
                    precision={
                        "price": data.get("pair_decimals", 8),
                        "amount": data.get("lot_decimals", 8)
                    },
                    limits={
                        "amount": {
                            "min": float(data.get("ordermin", 0)),
                            "max": None
                        },
                        "price": {
                            "min": None,
                            "max": None
                        },
                        "cost": {
                            "min": None,
                            "max": None
                        }
                    },
                    info=data
                )
                
                markets.append(market)
                
            logger.info(f"Fetched {len(markets)} markets from Kraken")
            return markets
            
        except Exception as e:
            logger.error(f"Error fetching markets from Kraken: {str(e)}")
            return []
            
    async def fetch_ticker(self, symbol: str) -> Dict[str, Any]:
        """
        Fetch ticker for a symbol.
        
        Args:
            symbol: Trading symbol
            
        Returns:
            Ticker data
        """
        try:
            # Make API request
            response = await self._public_request("Ticker", {"pair": symbol})
            
            # Parse response
            result = response.get("result", {})
            ticker_data = result.get(symbol, {})
            
            if not ticker_data:
                # Try with normalized symbol
                normalized_symbol = self._normalize_symbol(symbol)
                ticker_data = result.get(normalized_symbol, {})
                
            # Create ticker
            ticker = {
                "symbol": symbol,
                "timestamp": int(time.time() * 1000),
                "datetime": datetime.now().isoformat(),
                "high": float(ticker_data.get("h", [0])[0]),
                "low": float(ticker_data.get("l", [0])[0]),
                "bid": float(ticker_data.get("b", [0])[0]),
                "ask": float(ticker_data.get("a", [0])[0]),
                "vwap": float(ticker_data.get("p", [0])[0]),
                "open": float(ticker_data.get("o", 0)),
                "close": float(ticker_data.get("c", [0])[0]),
                "last": float(ticker_data.get("c", [0])[0]),
                "change": None,
                "percentage": None,
                "average": None,
                "baseVolume": float(ticker_data.get("v", [0])[0]),
                "quoteVolume": None,
                "info": ticker_data
            }
            
            return ticker
            
        except Exception as e:
            logger.error(f"Error fetching ticker for {symbol} from Kraken: {str(e)}")
            return {}
            
    async def fetch_ohlcv(self, symbol: str, timeframe: str = "1h", since: int = None, limit: int = None) -> List[List[float]]:
        """
        Fetch OHLCV data for a symbol.
        
        Args:
            symbol: Trading symbol
            timeframe: Timeframe (1m, 5m, 15m, 30m, 1h, 4h, 1d)
            since: Timestamp in milliseconds for start time
            limit: Maximum number of candles to fetch
            
        Returns:
            List of OHLCV candles
        """
        try:
            # Convert timeframe to Kraken interval
            interval = self._get_timeframe_minutes(timeframe)
            
            # Prepare parameters
            params = {
                "pair": symbol,
                "interval": interval
            }
            
            if since:
                params["since"] = int(since / 1000)  # Convert to seconds
                
            # Make API request
            response = await self._public_request("OHLC", params)
            
            # Parse response
            result = response.get("result", {})
            ohlcv_data = []
            
            for symbol_data in result.values():
                if isinstance(symbol_data, list):
                    for candle in symbol_data:
                        ohlcv_data.append([
                            int(candle[0]) * 1000,  # Timestamp (ms)
                            float(candle[1]),       # Open
                            float(candle[2]),       # High
                            float(candle[3]),       # Low
                            float(candle[4]),       # Close
                            float(candle[6])        # Volume
                        ])
                    break
                    
            # Apply limit
            if limit and len(ohlcv_data) > limit:
                ohlcv_data = ohlcv_data[-limit:]
                
            return ohlcv_data
            
        except Exception as e:
            logger.error(f"Error fetching OHLCV for {symbol} from Kraken: {str(e)}")
            return []
            
    async def fetch_balance(self) -> Dict[str, Dict[str, float]]:
        """
        Fetch account balance.
        
        Returns:
            Dictionary of balances by currency
        """
        try:
            # Make API request
            response = await self._private_request("Balance")
            
            # Parse response
            result = response.get("result", {})
            
            # Create balance dictionary
            balance = {}
            for currency, amount in result.items():
                # Remove currency prefix
                currency = currency[1:] if currency.startswith("X") or currency.startswith("Z") else currency
                
                balance[currency] = {
                    "free": float(amount),
                    "used": 0.0,
                    "total": float(amount)
                }
                
            return balance
            
        except Exception as e:
            logger.error(f"Error fetching balance from Kraken: {str(e)}")
            return {}
            
    async def create_order(self, order: Order) -> Dict[str, Any]:
        """
        Create a new order.
        
        Args:
            order: Order to create
            
        Returns:
            Order result
        """
        try:
            # Prepare parameters
            params = {
                "pair": order.symbol,
                "type": "buy" if order.side == OrderSide.BUY else "sell",
                "ordertype": self._get_order_type(order.type),
                "volume": str(order.amount)
            }
            
            # Add price for limit orders
            if order.type == OrderType.LIMIT and order.price is not None:
                params["price"] = str(order.price)
                
            # Make API request
            response = await self._private_request("AddOrder", params)
            
            # Parse response
            result = response.get("result", {})
            
            # Create order result
            order_result = {
                "id": result.get("txid", [None])[0],
                "symbol": order.symbol,
                "type": order.type.value,
                "side": order.side.value,
                "amount": order.amount,
                "price": order.price,
                "status": OrderStatus.OPEN.value,
                "timestamp": int(time.time() * 1000),
                "datetime": datetime.now().isoformat(),
                "info": result
            }
            
            return order_result
            
        except Exception as e:
            logger.error(f"Error creating order on Kraken: {str(e)}")
            return {}
            
    async def cancel_order(self, order_id: str) -> bool:
        """
        Cancel an order.
        
        Args:
            order_id: Order ID to cancel
            
        Returns:
            True if cancellation was successful, False otherwise
        """
        try:
            # Prepare parameters
            params = {
                "txid": order_id
            }
            
            # Make API request
            response = await self._private_request("CancelOrder", params)
            
            # Parse response
            result = response.get("result", {})
            
            # Check if cancellation was successful
            return result.get("count", 0) > 0
            
        except Exception as e:
            logger.error(f"Error canceling order {order_id} on Kraken: {str(e)}")
            return False
            
    async def fetch_order(self, order_id: str) -> Dict[str, Any]:
        """
        Fetch an order by ID.
        
        Args:
            order_id: Order ID to fetch
            
        Returns:
            Order data
        """
        try:
            # Prepare parameters
            params = {
                "txid": order_id
            }
            
            # Make API request
            response = await self._private_request("QueryOrders", params)
            
            # Parse response
            result = response.get("result", {})
            order_data = result.get(order_id, {})
            
            # Create order result
            order_result = {
                "id": order_id,
                "symbol": order_data.get("pair", ""),
                "type": order_data.get("ordertype", ""),
                "side": order_data.get("type", ""),
                "amount": float(order_data.get("vol", 0)),
                "price": float(order_data.get("price", 0)),
                "status": self._get_order_status(order_data.get("status", "")),
                "timestamp": int(order_data.get("opentm", 0) * 1000),
                "datetime": datetime.fromtimestamp(order_data.get("opentm", 0)).isoformat(),
                "info": order_data
            }
            
            return order_result
            
        except Exception as e:
            logger.error(f"Error fetching order {order_id} from Kraken: {str(e)}")
            return {}
            
    async def fetch_orders(self, symbol: str = None) -> List[Dict[str, Any]]:
        """
        Fetch all orders.
        
        Args:
            symbol: Trading symbol (optional)
            
        Returns:
            List of orders
        """
        try:
            # Make API request
            response = await self._private_request("OpenOrders")
            
            # Parse response
            result = response.get("result", {})
            open_orders = result.get("open", {})
            
            # Create order list
            orders = []
            for order_id, order_data in open_orders.items():
                # Filter by symbol if provided
                if symbol and order_data.get("pair", "") != symbol:
                    continue
                    
                # Create order result
                order_result = {
                    "id": order_id,
                    "symbol": order_data.get("pair", ""),
                    "type": order_data.get("ordertype", ""),
                    "side": order_data.get("type", ""),
                    "amount": float(order_data.get("vol", 0)),
                    "price": float(order_data.get("price", 0)),
                    "status": self._get_order_status(order_data.get("status", "")),
                    "timestamp": int(order_data.get("opentm", 0) * 1000),
                    "datetime": datetime.fromtimestamp(order_data.get("opentm", 0)).isoformat(),
                    "info": order_data
                }
                
                orders.append(order_result)
                
            return orders
            
        except Exception as e:
            logger.error(f"Error fetching orders from Kraken: {str(e)}")
            return []
            
    async def _public_request(self, method: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Make a public API request.
        
        Args:
            method: API method
            params: Request parameters
            
        Returns:
            API response
        """
        # Apply rate limiting
        await self._apply_rate_limit()
        
        # Build URL
        url = f"{self.base_url}/{self.api_version}/public/{method}"
        
        # Make request
        async with self.session.get(url, params=params) as response:
            # Check response
            if response.status != 200:
                raise Exception(f"API request failed with status {response.status}")
                
            # Parse response
            data = await response.json()
            
            # Check for errors
            if data.get("error"):
                raise Exception(f"API error: {data['error']}")
                
            return data
            
    async def _private_request(self, method: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Make a private API request.
        
        Args:
            method: API method
            params: Request parameters
            
        Returns:
            API response
        """
        # Apply rate limiting
        await self._apply_rate_limit()
        
        # Build URL
        url = f"{self.base_url}/{self.api_version}/private/{method}"
        
        # Prepare parameters
        params = params or {}
        params["nonce"] = int(time.time() * 1000)
        
        # Create signature
        signature = self._create_signature(method, params)
        
        # Prepare headers
        headers = {
            "API-Key": self.api_key,
            "API-Sign": signature
        }
        
        # Make request
        async with self.session.post(url, data=params, headers=headers) as response:
            # Check response
            if response.status != 200:
                raise Exception(f"API request failed with status {response.status}")
                
            # Parse response
            data = await response.json()
            
            # Check for errors
            if data.get("error"):
                raise Exception(f"API error: {data['error']}")
                
            return data
            
    def _create_signature(self, method: str, params: Dict[str, Any]) -> str:
        """
        Create API request signature.
        
        Args:
            method: API method
            params: Request parameters
            
        Returns:
            Request signature
        """
        # Create post data
        post_data = urllib.parse.urlencode(params)
        
        # Create signature
        encoded = (str(params["nonce"]) + post_data).encode()
        message = f"/{self.api_version}/private/{method}".encode() + hashlib.sha256(encoded).digest()
        
        # Create HMAC
        signature = hmac.new(base64.b64decode(self.api_secret), message, hashlib.sha512)
        
        # Return base64 encoded signature
        return base64.b64encode(signature.digest()).decode()
        
    async def _apply_rate_limit(self):
        """Apply rate limiting to API requests."""
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        
        if time_since_last_request < 1.0 / self.rate_limit:
            await asyncio.sleep(1.0 / self.rate_limit - time_since_last_request)
            
        self.last_request_time = time.time()
        
    def _get_timeframe_minutes(self, timeframe: str) -> int:
        """
        Convert timeframe to minutes.
        
        Args:
            timeframe: Timeframe string
            
        Returns:
            Timeframe in minutes
        """
        timeframes = {
            "1m": 1,
            "5m": 5,
            "15m": 15,
            "30m": 30,
            "1h": 60,
            "4h": 240,
            "1d": 1440,
            "1w": 10080
        }
        
        return timeframes.get(timeframe, 60)
        
    def _get_order_type(self, order_type: OrderType) -> str:
        """
        Convert order type to Kraken order type.
        
        Args:
            order_type: Order type
            
        Returns:
            Kraken order type
        """
        order_types = {
            OrderType.MARKET: "market",
            OrderType.LIMIT: "limit",
            OrderType.STOP_LOSS: "stop-loss",
            OrderType.TAKE_PROFIT: "take-profit"
        }
        
        return order_types.get(order_type, "market")
        
    def _get_order_status(self, status: str) -> str:
        """
        Convert Kraken order status to standard status.
        
        Args:
            status: Kraken order status
            
        Returns:
            Standard order status
        """
        statuses = {
            "open": OrderStatus.OPEN.value,
            "closed": OrderStatus.CLOSED.value,
            "canceled": OrderStatus.CANCELED.value,
            "expired": OrderStatus.EXPIRED.value
        }
        
        return statuses.get(status, OrderStatus.UNKNOWN.value)
        
    def _normalize_symbol(self, symbol: str) -> str:
        """
        Normalize symbol for Kraken API.
        
        Args:
            symbol: Trading symbol
            
        Returns:
            Normalized symbol
        """
        # Kraken uses different symbol format
        if "/" in symbol:
            base, quote = symbol.split("/")
            
            # Add X/Z prefix for certain currencies
            if base in ["BTC", "ETH", "LTC", "XRP", "XLM"]:
                base = f"X{base}"
                
            if quote in ["USD", "EUR", "GBP", "JPY", "CAD"]:
                quote = f"Z{quote}"
                
            return f"{base}{quote}"
            
        return symbol
