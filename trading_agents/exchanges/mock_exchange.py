"""
Mock exchange client for testing.

This module provides a mock exchange client for testing
without connecting to a real exchange.
"""
import logging
import time
import random
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple

from .base_exchange import BaseExchange

logger = logging.getLogger(__name__)

class MockExchange(BaseExchange):
    """
    Mock exchange client for testing.

    This class provides a mock exchange client for testing
    without connecting to a real exchange.
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the mock exchange client.

        Args:
            config: Exchange configuration
        """
        super().__init__(config)
        self.name = "Mock Exchange"
        self.id = "mock"

        # Initialize mock data
        self._init_mock_data()

        logger.info("Initialized mock exchange client")

    def _init_mock_data(self):
        """Initialize mock data."""
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
            },
            "SOL/USDT": {
                "symbol": "SOL/USDT",
                "base": "SOL",
                "quote": "USDT",
                "active": True,
                "precision": {
                    "price": 2,
                    "amount": 4
                },
                "limits": {
                    "amount": {
                        "min": 0.0001,
                        "max": 100000
                    },
                    "price": {
                        "min": 0.01,
                        "max": 10000
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
            "SOL": {
                "free": 100.0,
                "used": 50.0,
                "total": 150.0
            },
            "USDT": {
                "free": 10000.0,
                "used": 5000.0,
                "total": 15000.0
            }
        }

        # Mock orders
        self._orders = []
        self._next_order_id = 1

        # Mock positions
        self._positions = []

        # Mock prices
        self._prices = {
            "BTC/USDT": 30000.0,
            "ETH/USDT": 2000.0,
            "SOL/USDT": 100.0
        }

        # Create some initial orders and positions
        self._create_initial_data()

    def _create_initial_data(self):
        """Create initial orders and positions."""
        # Create some orders
        for i in range(5):
            symbol = random.choice(self.symbols)
            side = random.choice(["buy", "sell"])
            order_type = random.choice(["limit", "market"])
            price = self._prices[symbol] * (1 + random.uniform(-0.05, 0.05))
            amount = random.uniform(0.1, 1.0)
            status = random.choice(["open", "closed", "canceled"])
            filled = amount if status == "closed" else (0.0 if status == "canceled" else random.uniform(0, amount))
            remaining = amount - filled
            
            timestamp = int(time.time() * 1000) - random.randint(0, 86400000)
            
            order = {
                "id": f"order{self._next_order_id}",
                "symbol": symbol,
                "type": order_type,
                "side": side,
                "price": price if order_type == "limit" else None,
                "amount": amount,
                "filled": filled,
                "remaining": remaining,
                "status": status,
                "timestamp": timestamp,
                "datetime": datetime.fromtimestamp(timestamp / 1000).isoformat(),
                "fee": {
                    "cost": filled * price * 0.001,
                    "currency": "USDT"
                }
            }
            
            self._orders.append(order)
            self._next_order_id += 1
        
        # Create some positions
        for symbol in self.symbols:
            if random.random() < 0.7:  # 70% chance to create a position
                side = random.choice(["long", "short"])
                amount = random.uniform(0.1, 1.0)
                entry_price = self._prices[symbol] * (1 + random.uniform(-0.1, 0.1))
                current_price = self._prices[symbol]
                
                if side == "long":
                    pnl = (current_price - entry_price) * amount
                    pnl_percentage = (current_price / entry_price - 1) * 100
                else:
                    pnl = (entry_price - current_price) * amount
                    pnl_percentage = (entry_price / current_price - 1) * 100
                
                timestamp = int(time.time() * 1000) - random.randint(0, 86400000)
                
                position = {
                    "symbol": symbol,
                    "side": side,
                    "amount": amount,
                    "entry_price": entry_price,
                    "current_price": current_price,
                    "pnl": pnl,
                    "pnl_percentage": pnl_percentage,
                    "liquidation_price": entry_price * (0.5 if side == "long" else 1.5),
                    "leverage": 2.0,
                    "margin": entry_price * amount / 2,
                    "timestamp": timestamp,
                    "datetime": datetime.fromtimestamp(timestamp / 1000).isoformat()
                }
                
                self._positions.append(position)

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
        if symbol not in self.symbols:
            raise ValueError(f"Symbol not found: {symbol}")
        
        # Update price with some random movement
        self._prices[symbol] *= (1 + random.uniform(-0.01, 0.01))
        
        price = self._prices[symbol]
        timestamp = int(time.time() * 1000)
        
        return {
            "symbol": symbol,
            "timestamp": timestamp,
            "datetime": datetime.fromtimestamp(timestamp / 1000).isoformat(),
            "high": price * 1.02,
            "low": price * 0.98,
            "bid": price * 0.999,
            "ask": price * 1.001,
            "last": price,
            "open": price * (1 - random.uniform(-0.02, 0.02)),
            "close": price,
            "change": price * random.uniform(-0.02, 0.02),
            "percentage": random.uniform(-2, 2),
            "average": price,
            "volume": random.uniform(100, 1000),
            "quoteVolume": price * random.uniform(100, 1000)
        }

    async def fetch_order_book(self, symbol: str, limit: int = 20) -> Dict[str, Any]:
        """
        Fetch order book for a symbol.

        Args:
            symbol: Market symbol
            limit: Number of orders to fetch

        Returns:
            Order book data
        """
        if symbol not in self.symbols:
            raise ValueError(f"Symbol not found: {symbol}")
        
        price = self._prices[symbol]
        timestamp = int(time.time() * 1000)
        
        # Generate bids and asks
        bids = []
        asks = []
        
        for i in range(limit):
            bid_price = price * (1 - 0.001 * i)
            ask_price = price * (1 + 0.001 * i)
            bid_amount = random.uniform(0.1, 1.0)
            ask_amount = random.uniform(0.1, 1.0)
            
            bids.append([bid_price, bid_amount])
            asks.append([ask_price, ask_amount])
        
        return {
            "symbol": symbol,
            "timestamp": timestamp,
            "datetime": datetime.fromtimestamp(timestamp / 1000).isoformat(),
            "bids": bids,
            "asks": asks
        }

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
        if symbol not in self.symbols:
            raise ValueError(f"Symbol not found: {symbol}")
        
        limit = limit or 100
        now = int(time.time() * 1000)
        
        if timeframe == "1m":
            interval = 60000
        elif timeframe == "5m":
            interval = 300000
        elif timeframe == "15m":
            interval = 900000
        elif timeframe == "30m":
            interval = 1800000
        elif timeframe == "1h":
            interval = 3600000
        elif timeframe == "4h":
            interval = 14400000
        elif timeframe == "1d":
            interval = 86400000
        else:
            interval = 3600000  # Default to 1h
        
        # Use since if provided
        if since:
            start = since
        else:
            start = now - interval * limit
        
        result = []
        price = self._prices[symbol] * 0.9  # Start a bit lower
        
        for i in range(limit):
            timestamp = start + i * interval
            
            # Generate some random price movement
            price *= (1 + random.uniform(-0.01, 0.01))
            open_price = price
            high_price = price * (1 + random.uniform(0, 0.01))
            low_price = price * (1 - random.uniform(0, 0.01))
            close_price = price * (1 + random.uniform(-0.005, 0.005))
            volume = random.uniform(10, 100)
            
            result.append([
                timestamp,
                open_price,
                high_price,
                low_price,
                close_price,
                volume
            ])
            
            # Update price for next candle
            price = close_price
        
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
        if symbol not in self.symbols:
            raise ValueError(f"Symbol not found: {symbol}")
        
        if order_type not in ["limit", "market"]:
            raise ValueError(f"Invalid order type: {order_type}")
        
        if side not in ["buy", "sell"]:
            raise ValueError(f"Invalid order side: {side}")
        
        if order_type == "limit" and price is None:
            raise ValueError("Price is required for limit orders")
        
        timestamp = int(time.time() * 1000)
        order_id = f"order{self._next_order_id}"
        self._next_order_id += 1
        
        # For market orders, use current price
        if order_type == "market":
            price = self._prices[symbol]
        
        # Simulate immediate fill for market orders
        status = "open"
        filled = 0.0
        remaining = amount
        
        if order_type == "market":
            status = "closed"
            filled = amount
            remaining = 0.0
        
        order = {
            "id": order_id,
            "symbol": symbol,
            "type": order_type,
            "side": side,
            "price": price,
            "amount": amount,
            "filled": filled,
            "remaining": remaining,
            "status": status,
            "timestamp": timestamp,
            "datetime": datetime.fromtimestamp(timestamp / 1000).isoformat(),
            "fee": {
                "cost": filled * price * 0.001,
                "currency": "USDT"
            }
        }
        
        self._orders.append(order)
        
        # Update balance
        if status == "closed":
            self._update_balance_for_order(order)
        
        return order

    def _update_balance_for_order(self, order: Dict[str, Any]):
        """
        Update balance for a filled order.

        Args:
            order: Order data
        """
        symbol = order["symbol"]
        base, quote = symbol.split("/")
        
        if order["side"] == "buy":
            # Decrease quote currency (e.g., USDT)
            cost = order["filled"] * order["price"]
            fee = order["fee"]["cost"]
            total_cost = cost + fee
            
            self._balance[quote]["free"] -= total_cost
            self._balance[quote]["total"] -= total_cost
            
            # Increase base currency (e.g., BTC)
            self._balance[base]["free"] += order["filled"]
            self._balance[base]["total"] += order["filled"]
        else:  # sell
            # Decrease base currency
            self._balance[base]["free"] -= order["filled"]
            self._balance[base]["total"] -= order["filled"]
            
            # Increase quote currency
            proceeds = order["filled"] * order["price"]
            fee = order["fee"]["cost"]
            net_proceeds = proceeds - fee
            
            self._balance[quote]["free"] += net_proceeds
            self._balance[quote]["total"] += net_proceeds

    async def cancel_order(self, order_id: str, symbol: Optional[str] = None) -> Dict[str, Any]:
        """
        Cancel an order.

        Args:
            order_id: Order ID
            symbol: Market symbol

        Returns:
            Canceled order data
        """
        for order in self._orders:
            if order["id"] == order_id:
                if symbol is None or order["symbol"] == symbol:
                    if order["status"] == "open":
                        order["status"] = "canceled"
                        return order
                    else:
                        raise ValueError(f"Order is not open: {order_id}")
        
        raise ValueError(f"Order not found: {order_id}")

    async def fetch_order(self, order_id: str, symbol: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch an order.

        Args:
            order_id: Order ID
            symbol: Market symbol

        Returns:
            Order data
        """
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
        orders = self._orders
        
        if symbol:
            orders = [o for o in orders if o["symbol"] == symbol]
        
        if since:
            orders = [o for o in orders if o["timestamp"] >= since]
        
        # Sort by timestamp (newest first)
        orders = sorted(orders, key=lambda o: o["timestamp"], reverse=True)
        
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
        orders = [o for o in self._orders if o["status"] == "open"]
        
        if symbol:
            orders = [o for o in orders if o["symbol"] == symbol]
        
        if since:
            orders = [o for o in orders if o["timestamp"] >= since]
        
        # Sort by timestamp (newest first)
        orders = sorted(orders, key=lambda o: o["timestamp"], reverse=True)
        
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
        orders = [o for o in self._orders if o["status"] in ["closed", "canceled"]]
        
        if symbol:
            orders = [o for o in orders if o["symbol"] == symbol]
        
        if since:
            orders = [o for o in orders if o["timestamp"] >= since]
        
        # Sort by timestamp (newest first)
        orders = sorted(orders, key=lambda o: o["timestamp"], reverse=True)
        
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
        positions = self._positions
        
        if symbol:
            positions = [p for p in positions if p["symbol"] == symbol]
        
        # Update current prices and PnL
        for position in positions:
            symbol = position["symbol"]
            position["current_price"] = self._prices[symbol]
            
            if position["side"] == "long":
                position["pnl"] = (position["current_price"] - position["entry_price"]) * position["amount"]
                position["pnl_percentage"] = (position["current_price"] / position["entry_price"] - 1) * 100
            else:
                position["pnl"] = (position["entry_price"] - position["current_price"]) * position["amount"]
                position["pnl_percentage"] = (position["entry_price"] / position["current_price"] - 1) * 100
        
        return positions
