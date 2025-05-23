# Sentiment Analysis Agent

The Sentiment Analysis Agent analyzes social media sentiment to inform trading decisions. It monitors multiple sources like Twitter, Reddit, and news sites to gauge market sentiment for various cryptocurrencies.

## Features

- **Multi-Source Sentiment Analysis**: Aggregates sentiment data from Twitter, Reddit, and news sources
- **Weighted Sentiment Scoring**: Calculates sentiment scores with configurable weights for different sources
- **Signal Generation**: Generates trading signals based on sentiment analysis
- **Automated Trading**: Optional automated trading based on sentiment signals
- **Risk Management**: Configurable position sizing, stop loss, and take profit levels
- **Multi-Symbol Support**: Monitors multiple trading symbols simultaneously
- **Historical Analysis**: Maintains history of sentiment data and signals for analysis

## Configuration

The Sentiment Analysis Agent can be configured with the following parameters:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `exchange_id` | String | Exchange to use | `"binance"` |
| `symbols` | Array | Symbols to monitor | `["BTC/USDT", "ETH/USDT"]` |
| `sources` | Object | Sentiment sources configuration | See below |
| `lookback_hours` | Integer | Hours to look back for sentiment data | `24` |
| `signal_threshold` | Number | Minimum sentiment score threshold for generating signals | `0.2` |
| `sentiment_window` | Integer | Window size for sentiment analysis (hours) | `6` |
| `trade_enabled` | Boolean | Enable/disable trade execution | `false` |
| `position_size_pct` | Number | Position size as percentage of available balance | `5.0` |
| `max_positions` | Integer | Maximum number of concurrent positions | `3` |
| `stop_loss_pct` | Number | Stop loss percentage | `5.0` |
| `take_profit_pct` | Number | Take profit percentage | `10.0` |
| `max_signals` | Integer | Maximum number of signals to store in history | `100` |
| `cycle_interval` | Number | Interval between agent cycles (seconds) | `300` |

### Sentiment Sources Configuration

The `sources` parameter is an object with the following structure:

```json
{
  "twitter": {
    "enabled": true,
    "weight": 1.0,
    "api_key": "",
    "api_secret": "",
    "bearer_token": ""
  },
  "reddit": {
    "enabled": true,
    "weight": 0.8,
    "client_id": "",
    "client_secret": "",
    "user_agent": "SentimentAgent/1.0",
    "subreddits": ["CryptoCurrency", "Bitcoin", "Ethereum"]
  },
  "news": {
    "enabled": true,
    "weight": 1.2,
    "api_key": "",
    "sources": ["cryptopanic", "coindesk", "cointelegraph"]
  }
}
```

## Metrics

The Sentiment Analysis Agent tracks the following metrics:

| Metric | Type | Description |
|--------|------|-------------|
| `symbols_monitored` | Gauge | Number of symbols being monitored |
| `signals_generated` | Counter | Number of trading signals generated |
| `trades_executed` | Counter | Number of trades executed |
| `active_positions` | Gauge | Number of active positions |
| `total_profit` | Gauge | Total profit from executed trades |
| `last_signal_time` | Timestamp | Timestamp of the last signal generated |

## Commands

The Sentiment Analysis Agent supports the following commands:

| Command | Description | Parameters |
|---------|-------------|------------|
| `get_sentiment_history` | Get sentiment history | `symbol`: Symbol to get history for (optional) |
| `get_signals` | Get signal history | `limit`: Maximum number of signals to return (optional) |
| `get_positions` | Get active positions | None |
| `add_symbol` | Add a symbol to monitor | `symbol`: Symbol to add |
| `remove_symbol` | Remove a symbol from monitoring | `symbol`: Symbol to remove |
| `enable_trading` | Enable/disable trade execution | `value`: Enable/disable trade execution |
| `set_position_size` | Set position size percentage | `value`: Position size as percentage of available balance |
| `set_signal_threshold` | Set signal threshold | `value`: Minimum sentiment score threshold for generating signals |

## Usage Examples

### Creating a Sentiment Analysis Agent

```python
from core.agent_registry import AgentRegistry

# Get agent registry
registry = AgentRegistry.get_instance()

# Create sentiment agent
agent_config = {
    "exchange_id": "binance",
    "symbols": ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
    "sources": {
        "twitter": {"enabled": True, "weight": 1.0},
        "reddit": {"enabled": True, "weight": 0.8},
        "news": {"enabled": True, "weight": 1.2}
    },
    "signal_threshold": 0.3,
    "trade_enabled": False
}

agent_id = await registry.create_agent("sentiment", agent_config)
```

### Getting Sentiment History

```python
# Get agent
agent = await registry.get_agent(agent_id)

# Get sentiment history for BTC/USDT
history = await agent.execute_command("get_sentiment_history", {"symbol": "BTC/USDT"})

# Print sentiment scores
for data_point in history["BTC/USDT"]:
    timestamp = data_point["timestamp"]
    for source, source_data in data_point["sources"].items():
        if "sentiment_score" in source_data:
            print(f"{timestamp} - {source}: {source_data['sentiment_score']}")
```

### Getting Trading Signals

```python
# Get signals
signals = await agent.execute_command("get_signals", {"limit": 10})

# Print signals
for signal in signals:
    print(f"Symbol: {signal['symbol']}")
    print(f"Direction: {signal['direction']}")
    print(f"Sentiment Score: {signal['sentiment_score']}")
    print(f"Signal Strength: {signal['signal_strength']}")
    print(f"Timestamp: {signal['timestamp']}")
    print("---")
```

### Enabling Trading

```python
# Enable trading
await agent.execute_command("enable_trading", {"value": True})

# Set position size
await agent.execute_command("set_position_size", {"value": 2.5})
```

## Implementation Details

The Sentiment Analysis Agent works by:

1. Fetching sentiment data from multiple sources (Twitter, Reddit, news)
2. Calculating weighted sentiment scores for each symbol
3. Generating trading signals when sentiment exceeds the threshold
4. Executing trades based on signals (if trading is enabled)
5. Managing positions with stop loss and take profit levels

### Sentiment Calculation

The agent calculates sentiment scores as follows:

1. Fetch raw sentiment data from each source
2. Calculate volume-weighted average sentiment for each source
3. Calculate weighted average across sources using configured weights
4. Generate signals when the weighted average exceeds the threshold

### Trading Logic

When trading is enabled, the agent:

1. Executes trades based on sentiment signals
2. Opens long positions for positive sentiment, short positions for negative sentiment
3. Sets stop loss and take profit levels based on configuration
4. Monitors positions and closes them when stop loss or take profit is triggered
5. Limits the number of concurrent positions to the configured maximum

## Risk Management

The Sentiment Analysis Agent includes several risk management features:

- **Trading Disabled by Default**: Trading must be explicitly enabled
- **Position Sizing**: Configurable position size as percentage of available balance
- **Maximum Positions**: Limit on the number of concurrent positions
- **Stop Loss**: Automatic stop loss to limit downside risk
- **Take Profit**: Automatic take profit to secure gains

## Performance Considerations

- The agent's performance depends on the number of symbols and sources being monitored
- More symbols and sources increase resource usage and API calls
- The cycle interval should be set based on the number of symbols and sources to avoid API rate limits
- API credentials must be provided for each source to get real sentiment data
