# Portfolio Risk Management System

The Portfolio Risk Management System provides a centralized risk management solution that monitors and manages risk across multiple trading agents and positions. It calculates various risk metrics, generates risk reports, and recommends risk mitigation actions.

## Features

- **Multi-Agent Risk Monitoring**: Monitors risk across all trading agents and positions
- **Comprehensive Risk Metrics**: Calculates exposure, correlation, volatility, drawdown, and liquidity risk
- **Risk Limit Checking**: Checks if risk levels exceed warning or critical thresholds
- **Risk Mitigation Recommendations**: Suggests actions to reduce portfolio risk
- **Automated Risk Mitigation**: Can execute risk mitigation actions automatically
- **Risk Reporting**: Generates detailed risk reports

## Risk Metrics

The system calculates the following risk metrics:

| Metric | Description | Weight |
|--------|-------------|--------|
| Exposure | Measures portfolio exposure to specific assets | 1.5 |
| Correlation | Measures correlation between portfolio assets | 1.0 |
| Volatility | Measures portfolio volatility | 1.2 |
| Drawdown | Measures portfolio drawdown | 1.3 |
| Liquidity | Measures liquidity risk of portfolio assets | 1.1 |

## Risk Levels

Risk levels are categorized as follows:

| Level | Range |
|-------|-------|
| Low | 0-25 |
| Medium | 25-50 |
| High | 50-75 |
| Critical | 75-100 |

## Configuration

The Portfolio Risk Management System can be configured with the following parameters:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `warning_threshold` | Number | Risk threshold for warnings | 60.0 |
| `critical_threshold` | Number | Risk threshold for critical alerts | 80.0 |
| `max_position_size_pct` | Number | Maximum position size as percentage of portfolio | 20.0 |
| `max_asset_correlation` | Number | Maximum acceptable correlation between assets | 0.7 |
| `max_portfolio_volatility` | Number | Maximum acceptable portfolio volatility | 0.05 |
| `max_drawdown_pct` | Number | Maximum acceptable drawdown percentage | 15.0 |
| `min_daily_volume` | Number | Minimum acceptable daily volume in USD | 1000000.0 |
| `exchanges` | Array | Exchanges to use for market data | ["binance", "coinbase", "kraken"] |
| `update_interval` | Number | Interval between risk updates (seconds) | 300 |

## Risk Mitigation Actions

The system can recommend and execute the following risk mitigation actions:

| Action | Description |
|--------|-------------|
| `reduce_position` | Reduce position size for assets with high exposure |
| `diversify_portfolio` | Diversify portfolio to reduce correlation risk |
| `reduce_volatility` | Reduce portfolio volatility by adjusting positions |
| `reduce_illiquid_position` | Reduce positions with low liquidity |

## Usage Examples

### Initializing the Risk Manager

```python
from trading_agents.risk.portfolio_risk_manager import PortfolioRiskManager
import json

# Load configuration
with open("config/risk_manager_config.json", "r") as f:
    config = json.load(f)

# Create risk manager
risk_manager = PortfolioRiskManager(config)

# Initialize risk manager
await risk_manager.initialize()
```

### Calculating Portfolio Risk

```python
# Calculate risk
risk_score = await risk_manager.calculate_risk()

print(f"Overall risk score: {risk_score:.2f}")
print(f"Risk level: {risk_manager.risk_level}")
```

### Getting a Risk Report

```python
# Get risk report
report = await risk_manager.get_risk_report()

print(f"Overall risk: {report['overall_risk']:.2f}")
print(f"Risk level: {report['risk_level']}")

# Print risk breakdown
for metric, data in report["risk_breakdown"].items():
    print(f"{metric}: {data['value']:.2f} ({data['level']})")
```

### Checking Risk Limits

```python
# Check risk limits
result = await risk_manager.check_risk_limits()

if result["overall_breach"]:
    print("CRITICAL RISK LEVEL BREACHED!")
    
# Print breached metrics
for breach in result["breached_metrics"]:
    print(f"{breach['metric']}: {breach['value']:.2f} ({breach['level']})")
```

### Getting Risk Mitigation Actions

```python
# Get risk mitigation actions
actions = await risk_manager.get_risk_mitigation_actions()

for action in actions:
    print(f"Action: {action['type']}")
    print(f"Reason: {action['reason']}")
    print("---")
```

### Executing Risk Mitigation

```python
# Execute risk mitigation actions
result = await risk_manager.execute_risk_mitigation(actions)

print(f"Actions executed: {result['actions_executed']}")

# Print results
for action_result in result["results"]:
    print(f"Action: {action_result['action']}")
    print(f"Symbol: {action_result['symbol']}")
    print(f"Success: {action_result['success']}")
    print(f"Message: {action_result['message']}")
    print("---")
```

## Implementation Details

### Risk Calculation

The system calculates risk as follows:

1. Collect position data from all trading agents
2. Update market data and price history
3. Calculate risk for each metric
4. Calculate weighted average of all risk metrics
5. Determine overall risk level

### Risk Mitigation

The risk mitigation process works as follows:

1. Identify risk factors that exceed thresholds
2. Generate appropriate mitigation actions
3. Execute actions through the relevant trading agents
4. Update portfolio data and recalculate risk

## Integration with Trading Agents

Trading agents should implement the following methods to fully integrate with the risk management system:

- `reduce_position(symbol, reduce_pct)`: Reduce position size for a specific symbol
- `get_positions()`: Return current positions

## Performance Considerations

- The risk calculation process involves API calls to exchanges, which can be rate-limited
- The system caches market data and price history to minimize API calls
- Risk calculations are performed asynchronously to avoid blocking the main thread
- The update interval should be set based on the number of positions and exchanges to avoid API rate limits
