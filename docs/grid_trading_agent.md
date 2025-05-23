# Grid Trading Agent

The Grid Trading Agent implements a grid trading strategy with dynamic grid sizing and auto-rebalancing features. Grid trading is a strategy that places buy and sell orders at predetermined price levels, creating a grid of orders above and below the current market price.

## Features

- **Grid Trading Strategy**: Places buy orders below current price and sell orders above current price
- **Dynamic Grid Sizing**: Automatically adjusts grid range based on market volatility
- **Auto-Rebalancing**: Rebalances the grid when price moves significantly or outside the grid range
- **Profit Tracking**: Tracks profits from completed grid trades
- **Configurable Parameters**: Customizable grid levels, spacing, order size, and more
- **Real-Time Metrics**: Monitors performance metrics like total profit, ROI, and active orders

## Configuration

The Grid Trading Agent can be configured with the following parameters:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `exchange_id` | String | Exchange to use | `"binance"` |
| `symbol` | String | Trading symbol | `"BTC/USDT"` |
| `grid_levels` | Integer | Number of grid levels | `10` |
| `grid_spacing_pct` | Number | Grid spacing percentage | `1.0` |
| `upper_price` | Number/null | Upper price limit (null for automatic calculation) | `null` |
| `lower_price` | Number/null | Lower price limit (null for automatic calculation) | `null` |
| `order_amount` | Number | Order amount | `0.01` |
| `order_type` | String | Order type (limit or market) | `"limit"` |
| `dynamic_grid` | Boolean | Enable/disable dynamic grid sizing | `true` |
| `volatility_period` | Integer | Volatility calculation period (hours) | `24` |
| `volatility_multiplier` | Number | Volatility multiplier for grid range | `2.0` |
| `auto_rebalance` | Boolean | Enable/disable auto-rebalancing | `true` |
| `rebalance_threshold_pct` | Number | Rebalance threshold percentage | `10.0` |
| `rebalance_interval` | Integer | Minimum interval between rebalances (hours) | `24` |
| `take_profit` | Boolean | Enable/disable profit taking | `false` |
| `profit_target_pct` | Number | Profit target percentage | `5.0` |
| `trailing_stop` | Boolean | Enable/disable trailing stop | `false` |
| `trailing_stop_pct` | Number | Trailing stop percentage | `2.0` |
| `cycle_interval` | Number | Interval between agent cycles (seconds) | `60` |

## Metrics

The Grid Trading Agent tracks the following metrics:

| Metric | Type | Description |
|--------|------|-------------|
| `grid_levels` | Gauge | Number of grid levels |
| `current_price` | Gauge | Current market price |
| `upper_price` | Gauge | Upper price limit |
| `lower_price` | Gauge | Lower price limit |
| `total_profit` | Gauge | Total profit from grid trading |
| `trades_executed` | Counter | Number of trades executed |
| `active_orders` | Gauge | Number of active orders |
| `last_rebalance` | Timestamp | Timestamp of the last grid rebalance |
| `current_value` | Gauge | Current portfolio value |
| `initial_investment` | Gauge | Initial investment amount |
| `roi` | Gauge | Return on investment percentage |

## Commands

The Grid Trading Agent supports the following commands:

| Command | Description | Parameters |
|---------|-------------|------------|
| `get_grid_levels` | Get grid levels | None |
| `set_grid_levels` | Set number of grid levels | `value`: Number of grid levels |
| `set_grid_spacing` | Set grid spacing percentage | `value`: Grid spacing percentage |
| `set_order_amount` | Set order amount | `value`: Order amount |
| `enable_dynamic_grid` | Enable/disable dynamic grid sizing | `value`: Enable/disable dynamic grid sizing |
| `enable_auto_rebalance` | Enable/disable auto-rebalancing | `value`: Enable/disable auto-rebalancing |
| `change_symbol` | Change trading symbol | `symbol`: Trading symbol |

## Usage Examples

### Creating a Grid Trading Agent

```python
from core.agent_registry import AgentRegistry

# Get agent registry
registry = AgentRegistry.get_instance()

# Create grid trading agent
agent_config = {
    "exchange_id": "binance",
    "symbol": "ETH/USDT",
    "grid_levels": 20,
    "grid_spacing_pct": 0.5,
    "order_amount": 0.05,
    "dynamic_grid": True,
    "auto_rebalance": True
}

agent_id = await registry.create_agent("grid_trading", agent_config)
```

### Getting Grid Levels

```python
# Get agent
agent = await registry.get_agent(agent_id)

# Get grid levels
grid_levels = await agent.execute_command("get_grid_levels")

# Print grid levels
for level in grid_levels:
    print(f"Price: {level['price']}")
    print(f"Status: {level['status']}")
    print(f"Buy Order ID: {level['buy_order_id']}")
    print(f"Sell Order ID: {level['sell_order_id']}")
    print("---")
```

### Changing Grid Parameters

```python
# Change number of grid levels
await agent.execute_command("set_grid_levels", {"value": 15})

# Change grid spacing
await agent.execute_command("set_grid_spacing", {"value": 0.8})

# Change order amount
await agent.execute_command("set_order_amount", {"value": 0.1})
```

## Implementation Details

The Grid Trading Agent works by:

1. Calculating grid levels based on the current price, volatility, and configuration
2. Placing buy orders at grid levels below the current price
3. Placing sell orders at grid levels above the current price
4. Monitoring order status and placing new orders when existing ones are filled
5. Tracking profits from completed grid trades
6. Rebalancing the grid when necessary

### Dynamic Grid Sizing

When dynamic grid sizing is enabled, the agent:

1. Calculates price volatility over the specified period
2. Multiplies volatility by the volatility multiplier to determine grid range
3. Sets upper and lower price limits based on the current price and grid range
4. Creates grid levels evenly spaced between the upper and lower limits

### Auto-Rebalancing

When auto-rebalancing is enabled, the agent:

1. Checks if the current price is outside the grid range
2. Checks if the current price has moved significantly within the grid
3. Checks if enough time has passed since the last rebalance
4. If any of these conditions are met, cancels all existing orders and creates a new grid

## Risk Management

The Grid Trading Agent includes several risk management features:

- **Configurable Grid Range**: Set upper and lower price limits to control risk exposure
- **Dynamic Grid Sizing**: Automatically adjust grid range based on market volatility
- **Auto-Rebalancing**: Rebalance the grid when market conditions change significantly
- **Profit Tracking**: Monitor total profit and ROI to evaluate strategy performance

## Performance Considerations

- The agent's performance depends on the number of grid levels and the cycle interval
- More grid levels provide more trading opportunities but require more resources
- Shorter cycle intervals provide faster response to market changes but increase API usage
- Dynamic grid sizing and auto-rebalancing help adapt to changing market conditions
