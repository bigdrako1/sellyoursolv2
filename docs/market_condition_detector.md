# Market Condition Detection System

The Market Condition Detection System provides a framework for detecting and classifying market conditions to inform trading decisions and risk management. It analyzes price action, volatility, and other technical indicators to determine the current market regime.

## Features

- **Multi-Timeframe Analysis**: Analyzes market conditions across multiple timeframes
- **Multi-Symbol Support**: Monitors multiple trading symbols simultaneously
- **Market Regime Classification**: Classifies markets into different regimes (bullish, bearish, ranging, etc.)
- **Trading Recommendations**: Provides trading recommendations based on market conditions
- **Real-Time Updates**: Continuously updates market conditions as new data becomes available

## Market Regimes

The system classifies markets into the following regimes:

| Regime | Description |
|--------|-------------|
| Bullish | Strong uptrend with positive momentum |
| Bearish | Strong downtrend with negative momentum |
| Ranging | Price moving sideways in a range |
| Volatile | High volatility with large price swings |
| Trending | Strong trend in either direction |
| Reversal | Potential trend reversal |
| Breakout | Price breaking out of a range |
| Unknown | Unable to classify market condition |

## Configuration

The Market Condition Detection System can be configured with the following parameters:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `exchange_id` | String | Exchange to use for market data | `"binance"` |
| `timeframes` | Array | Timeframes to analyze | `["1h", "4h", "1d"]` |
| `symbols` | Array | Symbols to monitor | `["BTC/USDT", "ETH/USDT"]` |
| `short_period` | Integer | Short-term period for indicators | `14` |
| `medium_period` | Integer | Medium-term period for indicators | `50` |
| `long_period` | Integer | Long-term period for indicators | `200` |
| `low_volatility_threshold` | Number | Threshold for low volatility (ATR %) | `0.5` |
| `high_volatility_threshold` | Number | Threshold for high volatility (ATR %) | `2.0` |
| `trend_strength_threshold` | Number | Threshold for trend strength (ADX) | `25` |
| `breakout_threshold` | Number | Threshold for breakout detection (%) | `2.0` |
| `update_interval` | Number | Interval between updates (seconds) | `300` |

## Technical Indicators

The system uses the following technical indicators for market condition detection:

| Indicator | Description | Usage |
|-----------|-------------|-------|
| Moving Averages | SMA/EMA for different periods | Trend direction and strength |
| ATR | Average True Range | Volatility measurement |
| RSI | Relative Strength Index | Momentum and potential reversals |
| ADX | Average Directional Index | Trend strength |
| MACD | Moving Average Convergence Divergence | Momentum and trend changes |
| Bollinger Bands | Price volatility bands | Support/resistance and volatility |
| OBV | On-Balance Volume | Volume confirmation of price moves |

## Trading Recommendations

Based on the detected market regime, the system provides the following trading recommendations:

| Recommendation | Description |
|----------------|-------------|
| Bias | Overall market bias (bullish, bearish, neutral) |
| Position Sizing | Recommended position size (normal, reduced, minimum) |
| Stop Loss | Stop loss strategy (tight, normal, wide, trailing) |
| Take Profit | Take profit strategy (tight, normal, extended) |
| Strategy | Recommended trading strategy |
| Risk Level | Overall risk level (low, medium, high) |

## Usage Examples

### Initializing the Market Condition Detector

```python
from trading_agents.risk.market_condition_detector import MarketConditionDetector
import json

# Load configuration
with open("config/market_detector_config.json", "r") as f:
    config = json.load(f)

# Create detector
detector = MarketConditionDetector(config)

# Initialize detector
await detector.initialize()
```

### Getting Market Conditions

```python
# Get market conditions
conditions = await detector.get_market_conditions()

print(f"Global market condition: {conditions['global_condition']}")

# Print conditions for each symbol and timeframe
for symbol, timeframes in conditions["conditions"].items():
    print(f"\n{symbol}:")
    for timeframe, condition in timeframes.items():
        print(f"  {timeframe}: {condition['regime']}")
```

### Getting Condition for a Specific Symbol

```python
# Get condition for BTC/USDT on 1h timeframe
condition = await detector.get_symbol_condition("BTC/USDT", "1h")

print(f"Symbol: {condition['symbol']}")
print(f"Timeframe: {condition['timeframe']}")
print(f"Regime: {condition['regime']}")

# Print indicators
for indicator, value in condition["indicators"].items():
    print(f"{indicator}: {value}")
```

### Getting Trading Recommendations

```python
# Get trading recommendations
recommendations = await detector.get_trading_recommendations()

# Print global recommendation
global_rec = recommendations["global"]
print(f"Global recommendation:")
print(f"  Bias: {global_rec['bias']}")
print(f"  Position Sizing: {global_rec['position_sizing']}")
print(f"  Stop Loss: {global_rec['stop_loss']}")
print(f"  Take Profit: {global_rec['take_profit']}")
print(f"  Strategy: {global_rec['strategy']}")
print(f"  Risk Level: {global_rec['risk_level']}")

# Print recommendations for a specific symbol
symbol = "BTC/USDT"
if symbol in recommendations["symbols"]:
    print(f"\n{symbol} recommendations:")
    for timeframe, rec in recommendations["symbols"][symbol].items():
        print(f"  {timeframe}:")
        print(f"    Bias: {rec['bias']}")
        print(f"    Strategy: {rec['strategy']}")
        print(f"    Risk Level: {rec['risk_level']}")
```

## Implementation Details

### Market Regime Detection

The system detects market regimes as follows:

1. Fetch OHLCV data for each symbol and timeframe
2. Calculate technical indicators (moving averages, ATR, RSI, ADX, etc.)
3. Apply classification rules to determine the market regime
4. Determine the global market condition by weighting individual conditions

### Global Condition Determination

The global market condition is determined by:

1. Counting the occurrences of each regime across all symbols and timeframes
2. Applying weights based on timeframe (higher weight for longer timeframes)
3. Applying weights based on symbol importance (higher weight for primary symbols like BTC)
4. Selecting the regime with the highest weighted count

## Integration with Trading Agents

Trading agents can use the Market Condition Detector to:

1. Adjust trading strategies based on market conditions
2. Modify position sizing based on market volatility
3. Adjust stop loss and take profit levels based on market regime
4. Filter trading signals based on market bias

## Performance Considerations

- The detector caches market data to minimize API calls
- Analysis is performed asynchronously to avoid blocking the main thread
- The update interval should be set based on the number of symbols and timeframes to avoid API rate limits
- Longer timeframes (1h, 4h, 1d) provide more reliable market condition detection than shorter timeframes
