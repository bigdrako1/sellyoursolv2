# Arbitrage Agent

The Arbitrage Agent is designed to identify and execute arbitrage opportunities across multiple exchanges. It monitors price differences between exchanges and can execute trades to profit from these differences.

## Features

- **Multi-Exchange Monitoring**: Monitors multiple exchanges for price differences
- **Direct Arbitrage**: Identifies opportunities to buy on one exchange and sell on another
- **Triangular Arbitrage**: Identifies opportunities to trade through multiple currency pairs on a single exchange
- **Configurable Profit Threshold**: Set minimum profit threshold for executing trades
- **Risk Management**: Configurable maximum trade amount and execution delay
- **Opportunity History**: Maintains a history of identified arbitrage opportunities
- **Real-Time Metrics**: Tracks performance metrics like opportunities found, executed, and total profit

## Configuration

The Arbitrage Agent can be configured with the following parameters:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `exchanges` | Array | List of exchanges to monitor | `["binance", "coinbase", "kraken"]` |
| `symbols` | Array | List of symbols to monitor | `["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT"]` |
| `min_profit_threshold` | Number | Minimum profit threshold (percentage) | `0.5` |
| `max_trade_amount` | Number | Maximum trade amount | `100.0` |
| `execution_delay` | Number | Execution delay (seconds) | `0.5` |
| `execute_trades` | Boolean | Enable/disable trade execution | `false` |
| `enable_triangular` | Boolean | Enable/disable triangular arbitrage | `true` |
| `max_path_length` | Integer | Maximum path length for triangular arbitrage | `3` |
| `max_opportunities` | Integer | Maximum number of opportunities to store in history | `100` |
| `cycle_interval` | Number | Interval between agent cycles (seconds) | `5` |

## Metrics

The Arbitrage Agent tracks the following metrics:

| Metric | Type | Description |
|--------|------|-------------|
| `opportunities_found` | Counter | Number of arbitrage opportunities found |
| `opportunities_executed` | Counter | Number of arbitrage opportunities executed |
| `total_profit` | Gauge | Total profit from executed arbitrage opportunities |
| `last_opportunity_time` | Timestamp | Timestamp of the last arbitrage opportunity found |
| `exchanges_monitored` | Gauge | Number of exchanges being monitored |
| `symbols_monitored` | Gauge | Number of symbols being monitored |

## Commands

The Arbitrage Agent supports the following commands:

| Command | Description | Parameters |
|---------|-------------|------------|
| `get_opportunities` | Get arbitrage opportunities history | None |
| `set_profit_threshold` | Set minimum profit threshold | `value`: Minimum profit threshold (percentage) |
| `set_execute_trades` | Enable/disable trade execution | `value`: Enable/disable trade execution |
| `add_exchange` | Add an exchange to monitor | `exchange_id`: Exchange identifier |
| `remove_exchange` | Remove an exchange from monitoring | `exchange_id`: Exchange identifier |
| `add_symbol` | Add a symbol to monitor | `symbol`: Trading symbol |
| `remove_symbol` | Remove a symbol from monitoring | `symbol`: Trading symbol |

## Usage Examples

### Creating an Arbitrage Agent

```python
from core.agent_registry import AgentRegistry

# Get agent registry
registry = AgentRegistry.get_instance()

# Create arbitrage agent
agent_config = {
    "exchanges": ["binance", "coinbase"],
    "symbols": ["BTC/USDT", "ETH/USDT"],
    "min_profit_threshold": 0.8,
    "max_trade_amount": 50.0,
    "execute_trades": False
}

agent_id = await registry.create_agent("arbitrage", agent_config)
```

### Getting Arbitrage Opportunities

```python
# Get agent
agent = await registry.get_agent(agent_id)

# Get opportunities
opportunities = await agent.execute_command("get_opportunities")

# Print opportunities
for opportunity in opportunities:
    print(f"Symbol: {opportunity['symbol']}")
    print(f"Buy on {opportunity['buy_exchange']} at {opportunity['buy_price']}")
    print(f"Sell on {opportunity['sell_exchange']} at {opportunity['sell_price']}")
    print(f"Profit: {opportunity['estimated_profit_pct']}%")
    print(f"Amount: {opportunity['estimated_profit_amount']}")
    print("---")
```

### Enabling Trade Execution

```python
# Enable trade execution
await agent.execute_command("set_execute_trades", {"value": True})
```

## Implementation Details

The Arbitrage Agent works by:

1. Fetching order book data from multiple exchanges
2. Identifying opportunities where the bid price on one exchange is higher than the ask price on another
3. Calculating potential profit and comparing it to the minimum threshold
4. Executing trades if enabled and profitable

For triangular arbitrage, it:

1. Builds a graph of trading pairs on a single exchange
2. Finds cycles in the graph (e.g., BTC → ETH → USDT → BTC)
3. Calculates the product of exchange rates along the cycle
4. Executes trades if the product is greater than 1 (after accounting for fees)

## Risk Management

The Arbitrage Agent includes several risk management features:

- **Minimum Profit Threshold**: Only executes trades with expected profit above the threshold
- **Maximum Trade Amount**: Limits the size of each trade
- **Execution Delay**: Adds a delay before executing trades to account for market changes
- **Disabled by Default**: Trade execution is disabled by default and must be explicitly enabled

## Performance Considerations

- The agent's performance depends on the number of exchanges and symbols being monitored
- More exchanges and symbols increase the chance of finding opportunities but also increase resource usage
- The cycle interval should be set based on the number of exchanges and symbols to avoid API rate limits
- Triangular arbitrage is more computationally intensive than direct arbitrage
