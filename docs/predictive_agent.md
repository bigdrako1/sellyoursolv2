# Predictive Analytics Agent

The Predictive Analytics Agent uses machine learning models to predict market movements and make trading decisions. It leverages trained models to forecast price direction, magnitude, or trends and executes trades based on these predictions.

## Features

- **Machine Learning Integration**: Uses trained ML models for market predictions
- **Multi-Symbol Support**: Monitors multiple trading symbols simultaneously
- **Confidence-Based Trading**: Executes trades based on prediction confidence
- **Risk Management**: Configurable position sizing, stop loss, and take profit levels
- **Model Flexibility**: Can use different models for different prediction targets
- **Real-Time Prediction**: Makes predictions based on current market data

## Configuration

The Predictive Analytics Agent can be configured with the following parameters:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `exchange_id` | String | Exchange to use | `"binance"` |
| `symbols` | Array | Symbols to monitor | `["BTC/USDT", "ETH/USDT"]` |
| `model_id` | String | ID of the model to use for predictions | `""` |
| `prediction_threshold` | Number | Threshold for prediction value to trigger a trade | `0.6` |
| `confidence_threshold` | Number | Threshold for prediction confidence to trigger a trade | `0.7` |
| `trade_enabled` | Boolean | Enable/disable trade execution | `false` |
| `position_size_pct` | Number | Position size as percentage of available balance | `5.0` |
| `max_positions` | Integer | Maximum number of concurrent positions | `3` |
| `stop_loss_pct` | Number | Stop loss percentage | `5.0` |
| `take_profit_pct` | Number | Take profit percentage | `10.0` |
| `timeframe` | String | Timeframe for market data | `"1h"` |
| `lookback_periods` | Integer | Number of periods to look back for market data | `100` |
| `prediction_service` | Object | Prediction service configuration | See below |
| `cycle_interval` | Number | Interval between agent cycles (seconds) | `300` |

### Prediction Service Configuration

The `prediction_service` parameter is an object with the following structure:

```json
{
  "model_dir": "models",
  "cache_ttl": 300
}
```

## Metrics

The Predictive Analytics Agent tracks the following metrics:

| Metric | Type | Description |
|--------|------|-------------|
| `symbols_monitored` | Gauge | Number of symbols being monitored |
| `predictions_made` | Counter | Number of predictions made |
| `trades_executed` | Counter | Number of trades executed |
| `active_positions` | Gauge | Number of active positions |
| `total_profit` | Gauge | Total profit from executed trades |
| `last_prediction_time` | Timestamp | Timestamp of the last prediction |

## Commands

The Predictive Analytics Agent supports the following commands:

| Command | Description | Parameters |
|---------|-------------|------------|
| `get_predictions` | Get current predictions | None |
| `get_positions` | Get active positions | None |
| `add_symbol` | Add a symbol to monitor | `symbol`: Symbol to add |
| `remove_symbol` | Remove a symbol from monitoring | `symbol`: Symbol to remove |
| `set_model` | Set the model to use for predictions | `model_id`: Model ID |
| `enable_trading` | Enable/disable trade execution | `value`: Enable/disable trade execution |
| `set_position_size` | Set position size percentage | `value`: Position size as percentage of available balance |
| `set_prediction_threshold` | Set prediction threshold | `value`: Threshold for prediction value to trigger a trade |
| `set_confidence_threshold` | Set confidence threshold | `value`: Threshold for prediction confidence to trigger a trade |

## Usage Examples

### Creating a Predictive Analytics Agent

```python
from core.agent_registry import AgentRegistry

# Get agent registry
registry = AgentRegistry.get_instance()

# Create predictive agent
agent_config = {
    "exchange_id": "binance",
    "symbols": ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
    "model_id": "price_direction_model_v1",
    "prediction_threshold": 0.7,
    "confidence_threshold": 0.8,
    "trade_enabled": False
}

agent_id = await registry.create_agent("predictive", agent_config)
```

### Getting Predictions

```python
# Get agent
agent = await registry.get_agent(agent_id)

# Get predictions
predictions = await agent.execute_command("get_predictions")

# Print predictions
for symbol, prediction in predictions.items():
    print(f"Symbol: {symbol}")
    print(f"Prediction: {prediction['value']}")
    print(f"Confidence: {prediction['confidence']}")
    print(f"Target: {prediction['target']}")
    print(f"Horizon: {prediction['horizon']}")
    print("---")
```

### Setting a Model

```python
# Set model
await agent.execute_command("set_model", {"model_id": "trend_prediction_model_v2"})
```

### Enabling Trading

```python
# Enable trading
await agent.execute_command("enable_trading", {"value": True})

# Set position size
await agent.execute_command("set_position_size", {"value": 2.5})

# Set prediction threshold
await agent.execute_command("set_prediction_threshold", {"value": 0.75})
```

## Implementation Details

### Prediction Process

The Predictive Analytics Agent works as follows:

1. Fetch market data for each monitored symbol
2. Use the prediction service to make predictions using the specified model
3. Filter predictions based on prediction value and confidence thresholds
4. Execute trades based on filtered predictions
5. Manage positions with stop loss and take profit levels

### Trading Logic

The trading logic depends on the prediction target:

- **Price Direction**: Buy when prediction is 1 (up), sell when prediction is 0 (down)
- **Price Change**: Buy when predicted change is positive and above threshold, sell when negative and below negative threshold
- **Trend**: Buy when predicted trend is 1 (up), sell when predicted trend is -1 (down)

### Risk Management

The agent includes several risk management features:

- **Trading Disabled by Default**: Trading must be explicitly enabled
- **Position Sizing**: Configurable position size as percentage of available balance
- **Maximum Positions**: Limit on the number of concurrent positions
- **Stop Loss**: Automatic stop loss to limit downside risk
- **Take Profit**: Automatic take profit to secure gains
- **Confidence Threshold**: Only execute trades with high prediction confidence

## Model Integration

The Predictive Analytics Agent can use any model that has been trained and saved using the ML framework. Models should be saved in the `models` directory and can be loaded by their ID.

### Supported Model Types

The agent supports models with the following prediction targets:

- **Price Direction**: Binary classification (up/down)
- **Price Change**: Regression (percentage change)
- **Trend**: Multi-class classification (up/down/sideways)

### Model Training

Models can be trained using the ML framework's training tools. See the [Machine Learning Integration](machine_learning_integration.md) documentation for details on training models.

## Performance Considerations

- The agent's performance depends on the quality of the underlying models
- More complex models may require more computational resources
- The cycle interval should be set based on the prediction horizon and model complexity
- Caching is used to avoid redundant predictions for the same market data
