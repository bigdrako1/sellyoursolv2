# Reinforcement Learning Agent

The Reinforcement Learning Agent uses trained reinforcement learning models to make trading decisions. It leverages models trained through deep reinforcement learning to determine optimal actions in different market conditions.

## Features

- **Reinforcement Learning Integration**: Uses trained RL models for trading decisions
- **State-Based Decision Making**: Makes decisions based on current market state
- **Adaptive Trading**: Learns from market patterns and adapts to changing conditions
- **Multi-Symbol Support**: Can monitor and trade multiple symbols
- **Configurable Risk Management**: Adjustable position sizing and maximum positions

## Configuration

The Reinforcement Learning Agent can be configured with the following parameters:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `exchange_id` | String | Exchange to use | `"binance"` |
| `symbols` | Array | Symbols to monitor | `["BTC/USDT"]` |
| `model_id` | String | ID of the model to use | `""` |
| `model_dir` | String | Directory containing models | `"models"` |
| `trade_enabled` | Boolean | Enable/disable trade execution | `false` |
| `position_size_pct` | Number | Position size as percentage of available balance | `5.0` |
| `max_positions` | Integer | Maximum number of concurrent positions | `1` |
| `timeframe` | String | Timeframe for market data | `"1h"` |
| `window_size` | Integer | Window size for state representation | `30` |
| `lookback_periods` | Integer | Number of periods to look back for market data | `100` |
| `cycle_interval` | Number | Interval between agent cycles (seconds) | `300` |

## Metrics

The Reinforcement Learning Agent tracks the following metrics:

| Metric | Type | Description |
|--------|------|-------------|
| `symbols_monitored` | Gauge | Number of symbols being monitored |
| `trades_executed` | Counter | Number of trades executed |
| `active_positions` | Gauge | Number of active positions |
| `total_profit` | Gauge | Total profit from executed trades |
| `last_action_time` | Timestamp | Timestamp of the last action |

## Commands

The Reinforcement Learning Agent supports the following commands:

| Command | Description | Parameters |
|---------|-------------|------------|
| `get_actions` | Get current actions | None |
| `get_positions` | Get active positions | None |
| `add_symbol` | Add a symbol to monitor | `symbol`: Symbol to add |
| `remove_symbol` | Remove a symbol from monitoring | `symbol`: Symbol to remove |
| `set_model` | Set the model to use | `model_id`: Model ID |
| `enable_trading` | Enable/disable trade execution | `value`: Enable/disable trade execution |
| `set_position_size` | Set position size percentage | `value`: Position size as percentage of available balance |
| `set_max_positions` | Set maximum number of concurrent positions | `value`: Maximum number of concurrent positions |

## Usage Examples

### Creating a Reinforcement Learning Agent

```python
from core.agent_registry import AgentRegistry

# Get agent registry
registry = AgentRegistry.get_instance()

# Create reinforcement learning agent
agent_config = {
    "exchange_id": "binance",
    "symbols": ["BTC/USDT"],
    "model_id": "rl_agent_20230615_123456",
    "trade_enabled": False
}

agent_id = await registry.create_agent("reinforcement", agent_config)
```

### Getting Actions

```python
# Get agent
agent = await registry.get_agent(agent_id)

# Get actions
actions = await agent.execute_command("get_actions")

# Print actions
for symbol, action_info in actions.items():
    print(f"Symbol: {symbol}")
    print(f"Action: {action_info['action_name']}")
    print(f"Timestamp: {action_info['timestamp']}")
    print("---")
```

### Setting a Model

```python
# Set model
await agent.execute_command("set_model", {"model_id": "rl_agent_20230701_234567"})
```

### Enabling Trading

```python
# Enable trading
await agent.execute_command("enable_trading", {"value": True})

# Set position size
await agent.execute_command("set_position_size", {"value": 2.5})

# Set maximum positions
await agent.execute_command("set_max_positions", {"value": 2})
```

## Implementation Details

### Decision Process

The Reinforcement Learning Agent works as follows:

1. Fetch market data for each monitored symbol
2. Extract features from market data
3. Create state representation for the RL model
4. Use the RL model to determine the optimal action
5. Execute trades based on the model's decisions
6. Update positions based on new decisions

### Action Space

The agent uses a discrete action space with the following actions:

- **0: Hold**: Maintain current position
- **1: Buy**: Open a long position
- **2: Sell**: Close a long position or open a short position

### State Representation

The state representation includes:

- **Market Features**: Technical indicators and price patterns
- **Position Information**: Current position status
- **Balance Information**: Available balance

### Risk Management

The agent includes several risk management features:

- **Trading Disabled by Default**: Trading must be explicitly enabled
- **Position Sizing**: Configurable position size as percentage of available balance
- **Maximum Positions**: Limit on the number of concurrent positions

## Model Training

The Reinforcement Learning Agent uses models trained with the RL training framework. The training process involves:

1. **Environment Setup**: Creating a simulated trading environment
2. **Agent Training**: Training the agent using deep reinforcement learning
3. **Model Evaluation**: Evaluating the model on historical data
4. **Model Deployment**: Saving the trained model for use by the agent

For details on training RL models, see the [Reinforcement Learning Training](reinforcement_learning_training.md) documentation.

## Performance Considerations

- The agent's performance depends on the quality of the underlying RL model
- Models trained on specific market conditions may not generalize well to new conditions
- The window size and feature set should match those used during model training
- The cycle interval should be set based on the timeframe used for training
