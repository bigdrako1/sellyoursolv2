"""
Simple test script to verify our implementation.
"""
import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Create test market data
def create_test_data():
    """Create test market data."""
    # Create date range
    start_date = datetime.now() - timedelta(days=100)
    end_date = datetime.now()
    dates = pd.date_range(start=start_date, end=end_date, freq='1h')
    
    # Create OHLCV data
    np.random.seed(42)  # For reproducibility
    
    # Generate random walk for close prices
    close = 10000 + np.cumsum(np.random.normal(0, 100, size=len(dates)))
    
    # Generate other OHLCV data
    high = close * (1 + np.random.uniform(0, 0.03, size=len(dates)))
    low = close * (1 - np.random.uniform(0, 0.03, size=len(dates)))
    open_price = low + np.random.uniform(0, 1, size=len(dates)) * (high - low)
    volume = np.random.uniform(10, 100, size=len(dates)) * 10
    
    # Create DataFrame
    market_data = pd.DataFrame({
        'open': open_price,
        'high': high,
        'low': low,
        'close': close,
        'volume': volume
    }, index=dates)
    
    return market_data

# Test feature extraction
def test_feature_extraction():
    """Test feature extraction."""
    # Create test data
    market_data = create_test_data()
    
    # Print data shape
    print(f"Market data shape: {market_data.shape}")
    print(f"Market data columns: {market_data.columns.tolist()}")
    print(f"Market data index: {market_data.index[0]} to {market_data.index[-1]}")
    
    # Print sample data
    print("\nSample market data:")
    print(market_data.head())
    
    # Create price features
    price_features = pd.DataFrame(index=market_data.index)
    
    # Simple moving averages
    price_features["price_sma_5"] = market_data["close"].rolling(5).mean()
    price_features["price_sma_10"] = market_data["close"].rolling(10).mean()
    price_features["price_sma_20"] = market_data["close"].rolling(20).mean()
    
    # Print sample features
    print("\nSample price features:")
    print(price_features.head())
    
    # Print feature statistics
    print("\nPrice feature statistics:")
    print(price_features.describe())
    
    # Check for NaN values
    print("\nNaN values in price features:")
    print(price_features.isna().sum())
    
    # Create target variable (price direction)
    target = (market_data["close"].shift(-1) > market_data["close"]).astype(int)
    target.name = "price_direction"
    
    # Print sample target
    print("\nSample target:")
    print(target.head())
    
    # Print target statistics
    print("\nTarget statistics:")
    print(target.value_counts())
    
    # Check for NaN values
    print("\nNaN values in target:")
    print(target.isna().sum())
    
    # Create dataset
    dataset = pd.concat([price_features, target], axis=1)
    dataset = dataset.dropna()
    
    # Print dataset shape
    print(f"\nDataset shape: {dataset.shape}")
    
    # Split data
    train_size = int(len(dataset) * 0.6)
    val_size = int(len(dataset) * 0.2)
    
    train_data = dataset.iloc[:train_size]
    val_data = dataset.iloc[train_size:train_size+val_size]
    test_data = dataset.iloc[train_size+val_size:]
    
    # Print split sizes
    print(f"\nTrain size: {len(train_data)}")
    print(f"Validation size: {len(val_data)}")
    print(f"Test size: {len(test_data)}")
    
    # Print split ratios
    total_size = len(train_data) + len(val_data) + len(test_data)
    print(f"\nTrain ratio: {len(train_data) / total_size:.2f}")
    print(f"Validation ratio: {len(val_data) / total_size:.2f}")
    print(f"Test ratio: {len(test_data) / total_size:.2f}")
    
    print("\nTest completed successfully!")

if __name__ == "__main__":
    test_feature_extraction()
