"""
Arbitrage Agent for identifying and executing arbitrage opportunities across multiple exchanges.

This module provides the ArbitrageAgent class that monitors multiple exchanges
for price differences and executes trades to profit from these differences.
"""
import logging
import asyncio
import time
from typing import Dict, List, Any, Optional, Tuple, Set
from decimal import Decimal
import json
import os
from datetime import datetime, timedelta
import heapq

from core.base_agent import BaseAgent
from core.agent_registry import AgentRegistry
from core.execution_engine import ExecutionPriority
from exchanges.exchange_factory import ExchangeFactory
from models.order import Order, OrderSide, OrderType
from models.position import Position
from models.market import Market
from utils.config import Config

logger = logging.getLogger(__name__)

class ArbitrageOpportunity:
    """
    Represents an arbitrage opportunity between two exchanges.
    """

    def __init__(
        self,
        symbol: str,
        buy_exchange: str,
        sell_exchange: str,
        buy_price: Decimal,
        sell_price: Decimal,
        max_volume: Decimal,
        timestamp: float,
        estimated_profit_pct: Decimal,
        estimated_profit_amount: Decimal,
        path: Optional[List[Tuple[str, str, str]]] = None
    ):
        """
        Initialize an arbitrage opportunity.

        Args:
            symbol: Trading symbol (e.g., BTC/USDT)
            buy_exchange: Exchange to buy from
            sell_exchange: Exchange to sell on
            buy_price: Price to buy at
            sell_price: Price to sell at
            max_volume: Maximum volume that can be traded
            timestamp: Timestamp when the opportunity was identified
            estimated_profit_pct: Estimated profit percentage
            estimated_profit_amount: Estimated profit amount in quote currency
            path: Trading path for multi-step arbitrage (optional)
        """
        self.symbol = symbol
        self.buy_exchange = buy_exchange
        self.sell_exchange = sell_exchange
        self.buy_price = buy_price
        self.sell_price = sell_price
        self.max_volume = max_volume
        self.timestamp = timestamp
        self.estimated_profit_pct = estimated_profit_pct
        self.estimated_profit_amount = estimated_profit_amount
        self.path = path or []
        self.executed = False
        self.execution_result: Optional[Dict[str, Any]] = None

    def __str__(self) -> str:
        """String representation of the arbitrage opportunity."""
        return (
            f"ArbitrageOpportunity({self.symbol}): "
            f"Buy on {self.buy_exchange} at {self.buy_price}, "
            f"Sell on {self.sell_exchange} at {self.sell_price}, "
            f"Profit: {self.estimated_profit_pct:.2f}% "
            f"({self.estimated_profit_amount:.2f})"
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "symbol": self.symbol,
            "buy_exchange": self.buy_exchange,
            "sell_exchange": self.sell_exchange,
            "buy_price": str(self.buy_price),
            "sell_price": str(self.sell_price),
            "max_volume": str(self.max_volume),
            "timestamp": self.timestamp,
            "estimated_profit_pct": str(self.estimated_profit_pct),
            "estimated_profit_amount": str(self.estimated_profit_amount),
            "path": self.path,
            "executed": self.executed,
            "execution_result": self.execution_result
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ArbitrageOpportunity':
        """Create from dictionary."""
        return cls(
            symbol=data["symbol"],
            buy_exchange=data["buy_exchange"],
            sell_exchange=data["sell_exchange"],
            buy_price=Decimal(data["buy_price"]),
            sell_price=Decimal(data["sell_price"]),
            max_volume=Decimal(data["max_volume"]),
            timestamp=data["timestamp"],
            estimated_profit_pct=Decimal(data["estimated_profit_pct"]),
            estimated_profit_amount=Decimal(data["estimated_profit_amount"]),
            path=data.get("path")
        )

class ArbitrageAgent(BaseAgent):
    """
    Agent for identifying and executing arbitrage opportunities across multiple exchanges.
    """

    def __init__(self, agent_id: str, config: Dict[str, Any]):
        """
        Initialize the arbitrage agent.

        Args:
            agent_id: Unique identifier for the agent
            config: Agent configuration
        """
        super().__init__(agent_id, config)

        # Agent type
        self.agent_type = "arbitrage"

        # Exchanges to monitor
        self.exchanges: List[str] = config.get("exchanges", [])

        # Symbols to monitor
        self.symbols: List[str] = config.get("symbols", [])

        # Minimum profit threshold (percentage)
        self.min_profit_threshold: Decimal = Decimal(str(config.get("min_profit_threshold", 0.5)))

        # Maximum trade amount
        self.max_trade_amount: Decimal = Decimal(str(config.get("max_trade_amount", 100.0)))

        # Execution delay (seconds)
        self.execution_delay: float = float(config.get("execution_delay", 0.5))

        # Enable/disable execution
        self.execute_trades: bool = config.get("execute_trades", False)

        # Enable/disable triangular arbitrage
        self.enable_triangular: bool = config.get("enable_triangular", False)

        # Maximum path length for triangular arbitrage
        self.max_path_length: int = config.get("max_path_length", 3)

        # Exchange instances
        self.exchange_instances: Dict[str, Any] = {}

        # Market data cache
        self.market_data: Dict[str, Dict[str, Dict[str, Any]]] = {}

        # Opportunity history
        self.opportunities: List[ArbitrageOpportunity] = []
        self.max_opportunities: int = config.get("max_opportunities", 100)

        # Exchange factory
        self.exchange_factory = ExchangeFactory()

        # Initialize metrics
        self.metrics.update({
            "opportunities_found": 0,
            "opportunities_executed": 0,
            "total_profit": 0.0,
            "last_opportunity_time": None,
            "exchanges_monitored": len(self.exchanges),
            "symbols_monitored": len(self.symbols)
        })

        logger.info(f"Initialized ArbitrageAgent {agent_id} with {len(self.exchanges)} exchanges and {len(self.symbols)} symbols")

    async def initialize(self) -> bool:
        """
        Initialize the agent.

        Returns:
            True if initialization was successful, False otherwise
        """
        try:
            # Initialize exchange instances
            for exchange_id in self.exchanges:
                try:
                    exchange = self.exchange_factory.create_exchange(exchange_id)
                    await exchange.initialize()
                    self.exchange_instances[exchange_id] = exchange
                    logger.info(f"Initialized exchange {exchange_id}")
                except Exception as e:
                    logger.error(f"Failed to initialize exchange {exchange_id}: {str(e)}")

            # Check if we have at least two exchanges
            if len(self.exchange_instances) < 2:
                logger.error("At least two exchanges are required for arbitrage")
                return False

            # Initialize market data cache
            for symbol in self.symbols:
                self.market_data[symbol] = {}

            return True

        except Exception as e:
            logger.error(f"Error initializing ArbitrageAgent: {str(e)}")
            return False

    async def execute_cycle(self) -> bool:
        """
        Execute a single agent cycle.

        Returns:
            True if the cycle was successful, False otherwise
        """
        try:
            # Update market data
            await self._update_market_data()

            # Find arbitrage opportunities
            opportunities = await self._find_opportunities()

            # Update metrics
            self.metrics["opportunities_found"] += len(opportunities)
            if opportunities:
                self.metrics["last_opportunity_time"] = datetime.now().isoformat()

            # Execute trades if enabled
            if self.execute_trades and opportunities:
                await self._execute_opportunities(opportunities)

            # Store opportunities in history
            self._update_opportunity_history(opportunities)

            return True

        except Exception as e:
            logger.error(f"Error in ArbitrageAgent cycle: {str(e)}")
            return False

    async def _update_market_data(self):
        """Update market data for all exchanges and symbols."""
        tasks = []

        for exchange_id, exchange in self.exchange_instances.items():
            for symbol in self.symbols:
                tasks.append(self._fetch_market_data(exchange_id, exchange, symbol))

        # Run tasks concurrently
        await asyncio.gather(*tasks, return_exceptions=True)

    async def _fetch_market_data(self, exchange_id: str, exchange: Any, symbol: str):
        """
        Fetch market data for a specific exchange and symbol.

        Args:
            exchange_id: Exchange identifier
            exchange: Exchange instance
            symbol: Trading symbol
        """
        try:
            # Fetch order book
            order_book = await exchange.fetch_order_book(symbol)

            # Extract best bid and ask
            best_bid = Decimal(str(order_book["bids"][0][0])) if order_book["bids"] else Decimal("0")
            best_ask = Decimal(str(order_book["asks"][0][0])) if order_book["asks"] else Decimal("0")

            # Calculate available volume
            bid_volume = sum(Decimal(str(bid[1])) for bid in order_book["bids"][:5])
            ask_volume = sum(Decimal(str(ask[1])) for ask in order_book["asks"][:5])

            # Store in market data cache
            self.market_data[symbol][exchange_id] = {
                "bid": best_bid,
                "ask": best_ask,
                "bid_volume": bid_volume,
                "ask_volume": ask_volume,
                "timestamp": time.time()
            }

        except Exception as e:
            logger.error(f"Error fetching market data for {symbol} on {exchange_id}: {str(e)}")

    async def _find_opportunities(self) -> List[ArbitrageOpportunity]:
        """
        Find arbitrage opportunities across exchanges.

        Returns:
            List of arbitrage opportunities
        """
        opportunities = []

        # Check direct arbitrage opportunities
        for symbol in self.symbols:
            # Skip if we don't have data for this symbol
            if not self.market_data.get(symbol):
                continue

            # Find best bid and ask across all exchanges
            best_bids = []
            best_asks = []

            for exchange_id, data in self.market_data[symbol].items():
                if "bid" in data and "ask" in data:
                    # Add to priority queues (negative bid for max heap)
                    heapq.heappush(best_bids, (-data["bid"], data["bid_volume"], exchange_id))
                    heapq.heappush(best_asks, (data["ask"], data["ask_volume"], exchange_id))

            # Skip if we don't have enough data
            if len(best_bids) < 2 or len(best_asks) < 2:
                continue

            # Get best bid and ask
            best_bid = heapq.heappop(best_bids)
            best_ask = heapq.heappop(best_asks)

            # Convert bid to positive value
            bid_price = -best_bid[0]
            bid_volume = best_bid[1]
            bid_exchange = best_bid[2]

            ask_price = best_ask[0]
            ask_volume = best_ask[1]
            ask_exchange = best_ask[2]

            # Skip if best bid and ask are on the same exchange
            if bid_exchange == ask_exchange:
                # Try next best bid or ask
                if len(best_bids) > 0 and len(best_asks) > 0:
                    next_bid = heapq.heappop(best_bids)
                    next_ask = heapq.heappop(best_asks)

                    # Check if next bid is better than next ask
                    if -next_bid[0] > next_ask[0]:
                        bid_price = -next_bid[0]
                        bid_volume = next_bid[1]
                        bid_exchange = next_bid[2]
                    else:
                        ask_price = next_ask[0]
                        ask_volume = next_ask[1]
                        ask_exchange = next_ask[2]
                else:
                    continue

            # Skip if still on same exchange
            if bid_exchange == ask_exchange:
                continue

            # Calculate profit
            profit_pct = ((bid_price / ask_price) - Decimal("1.0")) * Decimal("100.0")

            # Skip if profit is below threshold
            if profit_pct < self.min_profit_threshold:
                continue

            # Calculate maximum volume
            max_volume = min(ask_volume, bid_volume, self.max_trade_amount / ask_price)

            # Calculate estimated profit
            estimated_profit = (bid_price - ask_price) * max_volume

            # Create opportunity
            opportunity = ArbitrageOpportunity(
                symbol=symbol,
                buy_exchange=ask_exchange,
                sell_exchange=bid_exchange,
                buy_price=ask_price,
                sell_price=bid_price,
                max_volume=max_volume,
                timestamp=time.time(),
                estimated_profit_pct=profit_pct,
                estimated_profit_amount=estimated_profit
            )

            opportunities.append(opportunity)

        # Check triangular arbitrage if enabled
        if self.enable_triangular:
            triangular_opportunities = await self._find_triangular_opportunities()
            opportunities.extend(triangular_opportunities)

        # Sort by profit percentage (descending)
        opportunities.sort(key=lambda x: x.estimated_profit_pct, reverse=True)

        return opportunities

    async def _find_triangular_opportunities(self) -> List[ArbitrageOpportunity]:
        """
        Find triangular arbitrage opportunities within a single exchange.

        Returns:
            List of triangular arbitrage opportunities
        """
        opportunities = []

        # Check each exchange
        for exchange_id, exchange in self.exchange_instances.items():
            # Get all available symbols for this exchange
            try:
                markets = await exchange.fetch_markets()
                symbols = [market["symbol"] for market in markets]

                # Build graph of trading pairs
                graph = self._build_trading_graph(symbols)

                # Find cycles in the graph
                cycles = self._find_cycles(graph, max_length=self.max_path_length)

                # Evaluate each cycle for arbitrage opportunity
                for cycle in cycles:
                    opportunity = await self._evaluate_cycle(exchange_id, exchange, cycle)
                    if opportunity:
                        opportunities.append(opportunity)

            except Exception as e:
                logger.error(f"Error finding triangular opportunities on {exchange_id}: {str(e)}")

        return opportunities

    def _build_trading_graph(self, symbols: List[str]) -> Dict[str, Set[Tuple[str, str]]]:
        """
        Build a graph of trading pairs.

        Args:
            symbols: List of trading symbols

        Returns:
            Graph of trading pairs
        """
        graph = {}

        for symbol in symbols:
            # Parse base and quote currencies
            parts = symbol.split('/')
            if len(parts) != 2:
                continue

            base, quote = parts

            # Add edge from base to quote
            if base not in graph:
                graph[base] = set()
            graph[base].add((quote, symbol, "sell"))

            # Add edge from quote to base
            if quote not in graph:
                graph[quote] = set()
            graph[quote].add((base, symbol, "buy"))

        return graph

    def _find_cycles(self, graph: Dict[str, Set[Tuple[str, str]]], max_length: int) -> List[List[Tuple[str, str, str]]]:
        """
        Find cycles in the trading graph.

        Args:
            graph: Trading graph
            max_length: Maximum cycle length

        Returns:
            List of cycles
        """
        cycles = []

        # Start from each node
        for start_node in graph:
            self._find_cycles_dfs(graph, start_node, start_node, [], set(), cycles, max_length)

        return cycles

    def _find_cycles_dfs(
        self,
        graph: Dict[str, Set[Tuple[str, str]]],
        start_node: str,
        current_node: str,
        path: List[Tuple[str, str, str]],
        visited: Set[str],
        cycles: List[List[Tuple[str, str, str]]],
        max_length: int
    ):
        """
        Depth-first search to find cycles in the trading graph.

        Args:
            graph: Trading graph
            start_node: Starting node
            current_node: Current node
            path: Current path
            visited: Visited nodes
            cycles: List of cycles found
            max_length: Maximum cycle length
        """
        # Check if we've completed a cycle
        if current_node == start_node and path:
            cycles.append(path.copy())
            return

        # Check if we've reached the maximum path length
        if len(path) >= max_length:
            return

        # Check each neighbor
        if current_node in graph:
            for neighbor, symbol, direction in graph[current_node]:
                # Skip if we've already visited this node (except for the start node)
                if neighbor in visited and neighbor != start_node:
                    continue

                # Add to path
                path.append((current_node, neighbor, symbol, direction))
                visited.add(current_node)

                # Recurse
                self._find_cycles_dfs(graph, start_node, neighbor, path, visited, cycles, max_length)

                # Backtrack
                path.pop()
                if current_node != start_node:
                    visited.remove(current_node)

    async def _evaluate_cycle(
        self,
        exchange_id: str,
        exchange: Any,
        cycle: List[Tuple[str, str, str, str]]
    ) -> Optional[ArbitrageOpportunity]:
        """
        Evaluate a cycle for arbitrage opportunity.

        Args:
            exchange_id: Exchange identifier
            exchange: Exchange instance
            cycle: Trading cycle

        Returns:
            Arbitrage opportunity if profitable, None otherwise
        """
        try:
            # Calculate the product of exchange rates
            rate_product = Decimal("1.0")
            path = []

            # Fetch order books for all symbols in the cycle
            order_books = {}
            for _, _, symbol, _ in cycle:
                if symbol not in order_books:
                    order_books[symbol] = await exchange.fetch_order_book(symbol)

            # Calculate the product of exchange rates
            for src, dst, symbol, direction in cycle:
                order_book = order_books[symbol]

                if direction == "buy":
                    # We're buying the base currency, so we use the ask price
                    price = Decimal(str(order_book["asks"][0][0])) if order_book["asks"] else Decimal("0")
                    rate = Decimal("1.0") / price
                else:
                    # We're selling the base currency, so we use the bid price
                    price = Decimal(str(order_book["bids"][0][0])) if order_book["bids"] else Decimal("0")
                    rate = price

                # Skip if price is zero
                if price == Decimal("0"):
                    return None

                rate_product *= rate
                path.append((src, dst, symbol))

            # Calculate profit percentage
            profit_pct = (rate_product - Decimal("1.0")) * Decimal("100.0")

            # Skip if profit is below threshold
            if profit_pct < self.min_profit_threshold:
                return None

            # Calculate maximum volume and estimated profit
            # This is a simplified calculation; in reality, you'd need to calculate
            # the maximum volume that can be traded through the entire cycle
            max_volume = Decimal("0.1")  # Placeholder
            estimated_profit = max_volume * (rate_product - Decimal("1.0"))

            # Create opportunity
            opportunity = ArbitrageOpportunity(
                symbol=f"TRIANGULAR-{exchange_id}",
                buy_exchange=exchange_id,
                sell_exchange=exchange_id,
                buy_price=Decimal("1.0"),
                sell_price=rate_product,
                max_volume=max_volume,
                timestamp=time.time(),
                estimated_profit_pct=profit_pct,
                estimated_profit_amount=estimated_profit,
                path=path
            )

            return opportunity

        except Exception as e:
            logger.error(f"Error evaluating cycle on {exchange_id}: {str(e)}")
            return None

    async def _execute_opportunities(self, opportunities: List[ArbitrageOpportunity]):
        """
        Execute arbitrage opportunities.

        Args:
            opportunities: List of arbitrage opportunities
        """
        # Execute only the best opportunity
        if not opportunities:
            return

        opportunity = opportunities[0]

        try:
            logger.info(f"Executing arbitrage opportunity: {opportunity}")

            # Add execution delay
            if self.execution_delay > 0:
                await asyncio.sleep(self.execution_delay)

            # Execute direct arbitrage
            if not opportunity.path:
                result = await self._execute_direct_arbitrage(opportunity)
            else:
                # Execute triangular arbitrage
                result = await self._execute_triangular_arbitrage(opportunity)

            # Update opportunity
            opportunity.executed = True
            opportunity.execution_result = result

            # Update metrics
            self.metrics["opportunities_executed"] += 1
            self.metrics["total_profit"] += float(result.get("actual_profit", 0))

            logger.info(f"Arbitrage execution result: {result}")

        except Exception as e:
            logger.error(f"Error executing arbitrage opportunity: {str(e)}")

    async def _execute_direct_arbitrage(self, opportunity: ArbitrageOpportunity) -> Dict[str, Any]:
        """
        Execute a direct arbitrage opportunity.

        Args:
            opportunity: Arbitrage opportunity

        Returns:
            Execution result
        """
        try:
            # Get exchange instances
            buy_exchange = self.exchange_instances[opportunity.buy_exchange]
            sell_exchange = self.exchange_instances[opportunity.sell_exchange]

            # Create buy order
            buy_order = Order(
                symbol=opportunity.symbol,
                side=OrderSide.BUY,
                type=OrderType.LIMIT,
                price=float(opportunity.buy_price),
                amount=float(opportunity.max_volume)
            )

            # Create sell order
            sell_order = Order(
                symbol=opportunity.symbol,
                side=OrderSide.SELL,
                type=OrderType.LIMIT,
                price=float(opportunity.sell_price),
                amount=float(opportunity.max_volume)
            )

            # Execute buy order
            buy_result = await buy_exchange.create_order(buy_order)

            # Execute sell order
            sell_result = await sell_exchange.create_order(sell_order)

            # Calculate actual profit
            actual_profit = (float(opportunity.sell_price) - float(opportunity.buy_price)) * float(opportunity.max_volume)

            return {
                "buy_order": buy_result,
                "sell_order": sell_result,
                "actual_profit": actual_profit,
                "timestamp": time.time()
            }

        except Exception as e:
            logger.error(f"Error executing direct arbitrage: {str(e)}")
            return {
                "error": str(e),
                "timestamp": time.time()
            }

    async def _execute_triangular_arbitrage(self, opportunity: ArbitrageOpportunity) -> Dict[str, Any]:
        """
        Execute a triangular arbitrage opportunity.

        Args:
            opportunity: Arbitrage opportunity

        Returns:
            Execution result
        """
        try:
            # Get exchange instance
            exchange = self.exchange_instances[opportunity.buy_exchange]

            # Execute each step in the path
            results = []

            for src, dst, symbol in opportunity.path:
                # Determine order side
                if src in symbol.split('/')[0]:
                    # We're selling the source currency
                    side = OrderSide.SELL
                else:
                    # We're buying the source currency
                    side = OrderSide.BUY

                # Create order
                order = Order(
                    symbol=symbol,
                    side=side,
                    type=OrderType.MARKET,  # Use market orders for simplicity
                    amount=float(opportunity.max_volume)
                )

                # Execute order
                result = await exchange.create_order(order)
                results.append(result)

            # Calculate actual profit
            # This is a simplified calculation; in reality, you'd need to calculate
            # the actual profit based on the executed prices
            actual_profit = float(opportunity.estimated_profit_amount)

            return {
                "orders": results,
                "actual_profit": actual_profit,
                "timestamp": time.time()
            }

        except Exception as e:
            logger.error(f"Error executing triangular arbitrage: {str(e)}")
            return {
                "error": str(e),
                "timestamp": time.time()
            }

    def _update_opportunity_history(self, opportunities: List[ArbitrageOpportunity]):
        """
        Update opportunity history.

        Args:
            opportunities: List of new opportunities
        """
        # Add new opportunities to history
        self.opportunities.extend(opportunities)

        # Trim history if needed
        if len(self.opportunities) > self.max_opportunities:
            self.opportunities = self.opportunities[-self.max_opportunities:]

    def get_opportunity_history(self) -> List[Dict[str, Any]]:
        """
        Get opportunity history.

        Returns:
            List of opportunities as dictionaries
        """
        return [opportunity.to_dict() for opportunity in self.opportunities]

    async def shutdown(self) -> bool:
        """
        Shut down the agent.

        Returns:
            True if shutdown was successful, False otherwise
        """
        try:
            # Close exchange connections
            for exchange_id, exchange in self.exchange_instances.items():
                try:
                    await exchange.close()
                    logger.info(f"Closed exchange {exchange_id}")
                except Exception as e:
                    logger.error(f"Error closing exchange {exchange_id}: {str(e)}")

            return True

        except Exception as e:
            logger.error(f"Error shutting down ArbitrageAgent: {str(e)}")
            return False