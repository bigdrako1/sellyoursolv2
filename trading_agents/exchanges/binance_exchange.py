"""
Binance exchange client.

This module provides a client for interacting with the Binance
cryptocurrency exchange.
"""
import logging
import time
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple

from .base_exchange import BaseExchange

logger = logging.getLogger(__name__)

class BinanceExchange(BaseExchange):
    """
    Binance exchange client.

    This class provides methods for interacting with the Binance
    cryptocurrency exchange.
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the Binance exchange client.

        Args:
            config: Exchange configuration
        """
        super().__init__(config)
        self.name = "Binance"
        self.id = "binance"

        # Mock data for demo
        self._init_mock_data()

        logger.info("Initialized Binance exchange client")

    def _init_mock_data(self):
        """Initialize mock data for demo."""
        # Mock markets
        self.markets = {
            "BTC/USDT": {
                "symbol": "BTC/USDT",
                "base": "BTC",
                "quote": "USDT",
                "active": True,
                "precision": {
                    "price": 2,
                    "amount": 6
                },
                "limits": {
                    "amount": {
                        "min": 0.000001,
                        "max": 1000
                    },
                    "price": {
                        "min": 0.01,
                        "max": 1000000
                    }
                }
            },
            "ETH/USDT": {
                "symbol": "ETH/USDT",
                "base": "ETH",
                "quote": "USDT",
                "active": True,
                "precision": {
                    "price": 2,
                    "amount": 5
                },
                "limits": {
                    "amount": {
                        "min": 0.00001,
                        "max": 10000
                    },
                    "price": {
                        "min": 0.01,
                        "max": 100000
                    }
                }
            }
        }

        # Mock symbols
        self.symbols = list(self.markets.keys())

        # Mock fees
        self.fees = {
            "trading": {
                "maker": 0.001,
                "taker": 0.001
            }
        }

        # Mock balance
        self._balance = {
            "BTC": {
                "free": 1.0,
                "used": 0.5,
                "total": 1.5
            },
            "ETH": {
                "free": 10.0,
                "used": 5.0,
                "total": 15.0
            },
            "USDT": {
                "free": 10000.0,
                "used": 5000.0,
                "total": 15000.0
            }
        }

        # Mock orders
        self._orders = [
            {
                "id": "order1",
                "symbol": "BTC/USDT",
                "type": "limit",
                "side": "buy",
                "price": 30000.0,
                "amount": 0.1,
                "filled": 0.1,
                "remaining": 0.0,
                "status": "closed",
                "timestamp": int(time.time() * 1000) - 86400000,
                "datetime": datetime.fromtimestamp(int(time.time()) - 86400).isoformat(),
                "fee": {
                    "cost": 3.0,
                    "currency": "USDT"
                }
            },
            {
                "id": "order2",
                "symbol": "ETH/USDT",
                "type": "limit",
                "side": "buy",
                "price": 2000.0,
                "amount": 1.0,
                "filled": 1.0,
                "remaining": 0.0,
                "status": "closed",
                "timestamp": int(time.time() * 1000) - 43200000,
                "datetime": datetime.fromtimestamp(int(time.time()) - 43200).isoformat(),
                "fee": {
                    "cost": 2.0,
                    "currency": "USDT"
                }
            },
            {
                "id": "order3",
                "symbol": "BTC/USDT",
                "type": "limit",
                "side": "sell",
                "price": 35000.0,
                "amount": 0.05,
                "filled": 0.0,
                "remaining": 0.05,
                "status": "open",
                "timestamp": int(time.time() * 1000) - 3600000,
                "datetime": datetime.fromtimestamp(int(time.time()) - 3600).isoformat(),
                "fee": {
                    "cost": 0.0,
                    "currency": "USDT"
                }
            }
        ]

        # Mock positions
        self._positions = [
            {
                "symbol": "BTC/USDT",
                "side": "long",
                "amount": 0.1,
                "entry_price": 30000.0,
                "current_price": 32000.0,
                "pnl": 200.0,
                "pnl_percentage": 6.67,
                "liquidation_price": 15000.0,
                "leverage": 2.0,
                "margin": 1500.0,
                "timestamp": int(time.time() * 1000) - 86400000,
                "datetime": datetime.fromtimestamp(int(time.time()) - 86400).isoformat()
            },
            {
                "symbol": "ETH/USDT",
                "side": "long",
                "amount": 1.0,
                "entry_price": 2000.0,
                "current_price": 2100.0,
                "pnl": 100.0,
                "pnl_percentage": 5.0,
                "liquidation_price": 1000.0,
                "leverage": 2.0,
                "margin": 1000.0,
                "timestamp": int(time.time() * 1000) - 43200000,
                "datetime": datetime.fromtimestamp(int(time.time()) - 43200).isoformat()
            }
        ]

    async def fetch_markets(self) -> Dict[str, Any]:
        """
        Fetch available markets.

        Returns:
            Dictionary of markets
        """
        return self.markets

    async def fetch_ticker(self, symbol: str) -> Dict[str, Any]:
        """
        Fetch ticker for a symbol.

        Args:
            symbol: Market symbol

        Returns:
            Ticker data
        """
        if symbol == "BTC/USDT":
            return {
                "symbol": "BTC/USDT",
                "timestamp": int(time.time() * 1000),
                "datetime": datetime.now().isoformat(),
                "high": 32500.0,
                "low": 31500.0,
                "bid": 32000.0,
                "ask": 32100.0,
                "last": 32050.0,
                "open": 31000.0,
                "close": 32050.0,
                "change": 1050.0,
                "percentage": 3.39,
                "average": 31525.0,
                "volume": 1000.0,
                "quoteVolume": 32050000.0
            }
        elif symbol == "ETH/USDT":
            return {
                "symbol": "ETH/USDT",
                "timestamp": int(time.time() * 1000),
                "datetime": datetime.now().isoformat(),
                "high": 2150.0,
                "low": 2050.0,
                "bid": 2100.0,
                "ask": 2110.0,
                "last": 2105.0,
                "open": 2000.0,
                "close": 2105.0,
                "change": 105.0,
                "percentage": 5.25,
                "average": 2052.5,
                "volume": 10000.0,
                "quoteVolume": 21050000.0
            }
        else:
            raise ValueError(f"Symbol not found: {symbol}")

    async def fetch_order_book(self, symbol: str, limit: int = 20) -> Dict[str, Any]:
        """
        Fetch order book for a symbol.

        Args:
            symbol: Market symbol
            limit: Number of orders to fetch

        Returns:
            Order book data
        """
        if symbol == "BTC/USDT":
            return {
                "symbol": "BTC/USDT",
                "timestamp": int(time.time() * 1000),
                "datetime": datetime.now().isoformat(),
                "bids": [[32000.0, 1.0], [31900.0, 2.0], [31800.0, 3.0]],
                "asks": [[32100.0, 1.0], [32200.0, 2.0], [32300.0, 3.0]]
            }
        elif symbol == "ETH/USDT":
            return {
                "symbol": "ETH/USDT",
                "timestamp": int(time.time() * 1000),
                "datetime": datetime.now().isoformat(),
                "bids": [[2100.0, 10.0], [2090.0, 20.0], [2080.0, 30.0]],
                "asks": [[2110.0, 10.0], [2120.0, 20.0], [2130.0, 30.0]]
            }
        else:
            raise ValueError(f"Symbol not found: {symbol}")

    async def fetch_ohlcv(
        self,
        symbol: str,
        timeframe: str = "1h",
        since: Optional[int] = None,
        limit: Optional[int] = None
    ) -> List[List[float]]:
        """
        Fetch OHLCV data for a symbol.

        Args:
            symbol: Market symbol
            timeframe: Timeframe (1m, 5m, 1h, 1d, etc.)
            since: Timestamp in milliseconds
            limit: Number of candles to fetch

        Returns:
            List of OHLCV data
        """
        limit = limit or 100
        now = int(time.time() * 1000)
        
        if timeframe == "1h":
            interval = 3600000
        elif timeframe == "1d":
            interval = 86400000
        else:
            interval = 3600000  # Default to 1h
        
        result = []
        for i in range(limit):
            timestamp = now - (limit - i - 1) * interval
            if symbol == "BTC/USDT":
                base_price = 30000.0 + i * 100.0
                result.append([
                    timestamp,
                    base_price,
                    base_price + 200.0,
                    base_price - 100.0,
                    base_price + 50.0,
                    100.0 + i
                ])
            elif symbol == "ETH/USDT":
                base_price = 2000.0 + i * 10.0
                result.append([
                    timestamp,
                    base_price,
                    base_price + 20.0,
                    base_price - 10.0,
                    base_price + 5.0,
                    1000.0 + i * 10
                ])
            else:
                raise ValueError(f"Symbol not found: {symbol}")
        
        return result

    async def fetch_balance(self) -> Dict[str, Any]:
        """
        Fetch account balance.

        Returns:
            Account balance data
        """
        return {
            "info": {},
            "timestamp": int(time.time() * 1000),
            "datetime": datetime.now().isoformat(),
            "free": {k: v["free"] for k, v in self._balance.items()},
            "used": {k: v["used"] for k, v in self._balance.items()},
            "total": {k: v["total"] for k, v in self._balance.items()}
        }

    async def create_order(
        self,
        symbol: str,
        order_type: str,
        side: str,
        amount: float,
        price: Optional[float] = None,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a new order.

        Args:
            symbol: Market symbol
            order_type: Order type (limit, market, etc.)
            side: Order side (buy, sell)
            amount: Order amount
            price: Order price (required for limit orders)
            params: Additional parameters

        Returns:
            Order data
        """
        # Check if symbol exists
        if symbol not in self.symbols:
            raise ValueError(f"Symbol not found: {symbol}")
        
        # Check if order type is valid
        if order_type not in ["limit", "market"]:
            raise ValueError(f"Invalid order type: {order_type}")
        
        # Check if side is valid
        if side not in ["buy", "sell"]:
            raise ValueError(f"Invalid order side: {side}")
        
        # Check if price is provided for limit orders
        if order_type == "limit" and price is None:
            raise ValueError("Price is required for limit orders")
        
        # Create order
        order_id = f"order{len(self._orders) + 1}"
        timestamp = int(time.time() * 1000)
        
        order = {
            "id": order_id,
            "symbol": symbol,
            "type": order_type,
            "side": side,
            "price": price,
            "amount": amount,
            "filled": 0.0,
            "remaining": amount,
            "status": "open",
            "timestamp": timestamp,
            "datetime": datetime.fromtimestamp(timestamp / 1000).isoformat(),
            "fee": {
                "cost": 0.0,
                "currency": "USDT"
            }
        }
        
        # Add order to list
        self._orders.append(order)
        
        return order

    async def cancel_order(self, order_id: str, symbol: Optional[str] = None) -> Dict[str, Any]:
        """
        Cancel an order.

        Args:
            order_id: Order ID
            symbol: Market symbol

        Returns:
            Canceled order data
        """
        # Find order
        order = None
        for o in self._orders:
            if o["id"] == order_id:
                order = o
                break
        
        if not order:
            raise ValueError(f"Order not found: {order_id}")
        
        # Check if order is already closed or canceled
        if order["status"] in ["closed", "canceled"]:
            raise ValueError(f"Order already {order['status']}: {order_id}")
        
        # Cancel order
        order["status"] = "canceled"
        
        return order

    async def fetch_order(self, order_id: str, symbol: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch an order.

        Args:
            order_id: Order ID
            symbol: Market symbol

        Returns:
            Order data
        """
        # Find order
        for order in self._orders:
            if order["id"] == order_id:
                if symbol is None or order["symbol"] == symbol:
                    return order
        
        raise ValueError(f"Order not found: {order_id}")

    async def fetch_orders(
        self,
        symbol: Optional[str] = None,
        since: Optional[int] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch orders.

        Args:
            symbol: Market symbol
            since: Timestamp in milliseconds
            limit: Number of orders to fetch

        Returns:
            List of orders
        """
        # Filter orders
        orders = self._orders
        
        if symbol:
            orders = [o for o in orders if o["symbol"] == symbol]
        
        if since:
            orders = [o for o in orders if o["timestamp"] >= since]
        
        # Sort by timestamp (newest first)
        orders = sorted(orders, key=lambda o: o["timestamp"], reverse=True)
        
        # Apply limit
        if limit:
            orders = orders[:limit]
        
        return orders

    async def fetch_open_orders(
        self,
        symbol: Optional[str] = None,
        since: Optional[int] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch open orders.

        Args:
            symbol: Market symbol
            since: Timestamp in milliseconds
            limit: Number of orders to fetch

        Returns:
            List of open orders
        """
        # Filter open orders
        orders = [o for o in self._orders if o["status"] == "open"]
        
        if symbol:
            orders = [o for o in orders if o["symbol"] == symbol]
        
        if since:
            orders = [o for o in orders if o["timestamp"] >= since]
        
        # Sort by timestamp (newest first)
        orders = sorted(orders, key=lambda o: o["timestamp"], reverse=True)
        
        # Apply limit
        if limit:
            orders = orders[:limit]
        
        return orders

    async def fetch_closed_orders(
        self,
        symbol: Optional[str] = None,
        since: Optional[int] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch closed orders.

        Args:
            symbol: Market symbol
            since: Timestamp in milliseconds
            limit: Number of orders to fetch

        Returns:
            List of closed orders
        """
        # Filter closed orders
        orders = [o for o in self._orders if o["status"] in ["closed", "canceled"]]
        
        if symbol:
            orders = [o for o in orders if o["symbol"] == symbol]
        
        if since:
            orders = [o for o in orders if o["timestamp"] >= since]
        
        # Sort by timestamp (newest first)
        orders = sorted(orders, key=lambda o: o["timestamp"], reverse=True)
        
        # Apply limit
        if limit:
            orders = orders[:limit]
        
        return orders

    async def fetch_my_trades(
        self,
        symbol: Optional[str] = None,
        since: Optional[int] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch trades.

        Args:
            symbol: Market symbol
            since: Timestamp in milliseconds
            limit: Number of trades to fetch

        Returns:
            List of trades
        """
        # Mock trades based on closed orders
        trades = []
        
        for order in self._orders:
            if order["status"] == "closed" and order["filled"] > 0:
                if symbol is None or order["symbol"] == symbol:
                    if since is None or order["timestamp"] >= since:
                        trade = {
                            "id": f"trade{order['id']}",
                            "order": order["id"],
                            "symbol": order["symbol"],
                            "side": order["side"],
                            "price": order["price"],
                            "amount": order["filled"],
                            "cost": order["price"] * order["filled"],
                            "fee": order["fee"],
                            "timestamp": order["timestamp"],
                            "datetime": order["datetime"]
                        }
                        trades.append(trade)
        
        # Sort by timestamp (newest first)
        trades = sorted(trades, key=lambda t: t["timestamp"], reverse=True)
        
        # Apply limit
        if limit:
            trades = trades[:limit]
        
        return trades

    async def fetch_positions(
        self,
        symbol: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch positions.

        Args:
            symbol: Market symbol

        Returns:
            List of positions
        """
        # Filter positions
        positions = self._positions
        
        if symbol:
            positions = [p for p in positions if p["symbol"] == symbol]
        
        return positions
