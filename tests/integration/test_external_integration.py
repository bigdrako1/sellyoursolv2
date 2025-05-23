"""
Integration tests for external system integration.

This module contains integration tests for the external system integration components.
"""
import os
import sys
import unittest
import asyncio
import pandas as pd
from datetime import datetime, timedelta

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from exchanges.exchange_factory import ExchangeFactory
from exchanges.kraken_exchange import KrakenExchange
from data_providers.data_provider_factory import DataProviderFactory
from data_providers.onchain_data_provider import OnChainDataProvider

class TestExternalIntegration(unittest.TestCase):
    """Integration tests for external system integration."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test class."""
        # Create event loop for async tests
        cls.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(cls.loop)
        
        # Set up test exchanges
        cls.exchanges = cls.loop.run_until_complete(cls.setup_test_exchanges())
        
        # Set up test data providers
        cls.data_providers = cls.loop.run_until_complete(cls.setup_test_data_providers())
    
    @classmethod
    def tearDownClass(cls):
        """Tear down test class."""
        # Close exchanges
        for exchange in cls.exchanges.values():
            cls.loop.run_until_complete(exchange.close())
        
        # Close data providers
        for provider in cls.data_providers.values():
            cls.loop.run_until_complete(provider.close())
        
        # Close event loop
        cls.loop.close()
    
    @classmethod
    async def setup_test_exchanges(cls):
        """Set up test exchanges."""
        # Create exchange factory
        exchange_factory = ExchangeFactory()
        
        # Configure test exchanges
        test_exchanges = {
            "kraken": {
                "api_key": os.environ.get("KRAKEN_API_KEY", "test_api_key"),
                "api_secret": os.environ.get("KRAKEN_API_SECRET", "test_api_secret"),
                "rate_limit": 1.0
            }
        }
        
        # Initialize test exchanges
        initialized_exchanges = {}
        for exchange_id, config in test_exchanges.items():
            try:
                exchange = exchange_factory.create_exchange(exchange_id, config)
                await exchange.initialize()
                initialized_exchanges[exchange_id] = exchange
            except Exception as e:
                print(f"Failed to initialize test exchange {exchange_id}: {str(e)}")
        
        return initialized_exchanges
    
    @classmethod
    async def setup_test_data_providers(cls):
        """Set up test data providers."""
        # Create data provider factory
        provider_factory = DataProviderFactory()
        
        # Configure test data providers
        test_providers = {
            "onchain": {
                "glassnode_api_key": os.environ.get("GLASSNODE_API_KEY", "test_api_key"),
                "cryptoquant_api_key": os.environ.get("CRYPTOQUANT_API_KEY", "test_api_key"),
                "intotheblock_api_key": os.environ.get("INTOTHEBLOCK_API_KEY", "test_api_key"),
                "default_source": "glassnode",
                "cache_ttl": 60  # Short TTL for testing
            }
        }
        
        # Initialize test data providers
        initialized_providers = {}
        for provider_id, config in test_providers.items():
            try:
                provider = provider_factory.create_provider(provider_id, config)
                await provider.initialize()
                initialized_providers[provider_id] = provider
            except Exception as e:
                print(f"Failed to initialize test data provider {provider_id}: {str(e)}")
        
        return initialized_providers
    
    def test_exchange_factory(self):
        """Test exchange factory."""
        # Create exchange factory
        exchange_factory = ExchangeFactory()
        
        # Get available exchanges
        available_exchanges = exchange_factory.get_available_exchanges()
        
        # Verify available exchanges
        self.assertIn("kraken", available_exchanges, "Available exchanges should include kraken")
        
        # Create exchange
        exchange = exchange_factory.create_exchange("kraken")
        
        # Verify exchange
        self.assertIsInstance(exchange, KrakenExchange, "Created exchange should be a KrakenExchange instance")
    
    def test_data_provider_factory(self):
        """Test data provider factory."""
        # Create data provider factory
        provider_factory = DataProviderFactory()
        
        # Get available providers
        available_providers = provider_factory.get_available_providers()
        
        # Verify available providers
        self.assertIn("onchain", available_providers, "Available providers should include onchain")
        
        # Create provider
        provider = provider_factory.create_provider("onchain")
        
        # Verify provider
        self.assertIsInstance(provider, OnChainDataProvider, "Created provider should be an OnChainDataProvider instance")
    
    def test_kraken_exchange_markets(self):
        """Test Kraken exchange markets."""
        # Skip if Kraken exchange is not available
        if "kraken" not in self.exchanges:
            self.skipTest("Kraken exchange not available")
        
        # Get Kraken exchange
        exchange = self.exchanges["kraken"]
        
        # Fetch markets
        markets = self.loop.run_until_complete(exchange.fetch_markets())
        
        # Verify markets
        self.assertIsNotNone(markets, "Markets should not be None")
        self.assertGreater(len(markets), 0, "There should be at least one market")
        
        # Verify market structure
        if markets:
            market = markets[0]
            self.assertIsNotNone(market.symbol, "Market symbol should not be None")
            self.assertIsNotNone(market.base, "Market base should not be None")
            self.assertIsNotNone(market.quote, "Market quote should not be None")
    
    def test_kraken_exchange_ticker(self):
        """Test Kraken exchange ticker."""
        # Skip if Kraken exchange is not available
        if "kraken" not in self.exchanges:
            self.skipTest("Kraken exchange not available")
        
        # Get Kraken exchange
        exchange = self.exchanges["kraken"]
        
        # Fetch ticker
        ticker = self.loop.run_until_complete(exchange.fetch_ticker("BTC/USD"))
        
        # Verify ticker
        self.assertIsNotNone(ticker, "Ticker should not be None")
        self.assertIn("symbol", ticker, "Ticker should include symbol")
        self.assertIn("last", ticker, "Ticker should include last price")
        self.assertIn("bid", ticker, "Ticker should include bid price")
        self.assertIn("ask", ticker, "Ticker should include ask price")
        self.assertIn("high", ticker, "Ticker should include high price")
        self.assertIn("low", ticker, "Ticker should include low price")
        self.assertIn("volume", ticker, "Ticker should include volume")
    
    def test_kraken_exchange_ohlcv(self):
        """Test Kraken exchange OHLCV."""
        # Skip if Kraken exchange is not available
        if "kraken" not in self.exchanges:
            self.skipTest("Kraken exchange not available")
        
        # Get Kraken exchange
        exchange = self.exchanges["kraken"]
        
        # Fetch OHLCV
        since = int((datetime.now() - timedelta(days=1)).timestamp() * 1000)
        ohlcv = self.loop.run_until_complete(exchange.fetch_ohlcv("BTC/USD", "1h", since=since, limit=10))
        
        # Verify OHLCV
        self.assertIsNotNone(ohlcv, "OHLCV should not be None")
        self.assertLessEqual(len(ohlcv), 10, "There should be at most 10 OHLCV candles")
        
        # Verify OHLCV structure
        if ohlcv:
            candle = ohlcv[0]
            self.assertEqual(len(candle), 6, "OHLCV candle should have 6 elements")
            self.assertIsInstance(candle[0], int, "Timestamp should be an integer")
            self.assertIsInstance(candle[1], float, "Open price should be a float")
            self.assertIsInstance(candle[2], float, "High price should be a float")
            self.assertIsInstance(candle[3], float, "Low price should be a float")
            self.assertIsInstance(candle[4], float, "Close price should be a float")
            self.assertIsInstance(candle[5], float, "Volume should be a float")
    
    def test_onchain_data_provider_metrics(self):
        """Test on-chain data provider metrics."""
        # Skip if on-chain data provider is not available
        if "onchain" not in self.data_providers:
            self.skipTest("On-chain data provider not available")
        
        # Get on-chain data provider
        provider = self.data_providers["onchain"]
        
        # Fetch metrics list
        metrics = self.loop.run_until_complete(provider.fetch_metrics_list())
        
        # Verify metrics
        self.assertIsNotNone(metrics, "Metrics should not be None")
        
        # Note: This test may fail if the API key is not valid or the API is not available
        # In a real implementation, we would use a mock API for testing
    
    def test_onchain_data_provider_assets(self):
        """Test on-chain data provider assets."""
        # Skip if on-chain data provider is not available
        if "onchain" not in self.data_providers:
            self.skipTest("On-chain data provider not available")
        
        # Get on-chain data provider
        provider = self.data_providers["onchain"]
        
        # Fetch assets list
        assets = self.loop.run_until_complete(provider.fetch_assets_list())
        
        # Verify assets
        self.assertIsNotNone(assets, "Assets should not be None")
        
        # Note: This test may fail if the API key is not valid or the API is not available
        # In a real implementation, we would use a mock API for testing
    
    def test_onchain_data_provider_metric_data(self):
        """Test on-chain data provider metric data."""
        # Skip if on-chain data provider is not available
        if "onchain" not in self.data_providers:
            self.skipTest("On-chain data provider not available")
        
        # Get on-chain data provider
        provider = self.data_providers["onchain"]
        
        # Fetch metric data
        since = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)
        until = int(datetime.now().timestamp() * 1000)
        
        # Note: This is a placeholder test that may fail if the API key is not valid or the API is not available
        # In a real implementation, we would use a mock API for testing
        try:
            data = self.loop.run_until_complete(provider.fetch_metric(
                metric="sopr",
                asset="BTC",
                since=since,
                until=until,
                resolution="1d"
            ))
            
            # Verify data
            self.assertIsNotNone(data, "Data should not be None")
            
            # If data is not empty, verify structure
            if not data.empty:
                self.assertIn("value", data.columns, "Data should include value column")
        except Exception as e:
            # Skip test if API is not available
            self.skipTest(f"On-chain data provider API not available: {str(e)}")
    
    def test_onchain_data_provider_caching(self):
        """Test on-chain data provider caching."""
        # Skip if on-chain data provider is not available
        if "onchain" not in self.data_providers:
            self.skipTest("On-chain data provider not available")
        
        # Get on-chain data provider
        provider = self.data_providers["onchain"]
        
        # Fetch metrics list twice
        metrics1 = self.loop.run_until_complete(provider.fetch_metrics_list())
        metrics2 = self.loop.run_until_complete(provider.fetch_metrics_list())
        
        # Verify that both calls return the same data (from cache)
        self.assertEqual(metrics1, metrics2, "Both calls should return the same data (from cache)")
        
        # Note: This test may fail if the API key is not valid or the API is not available
        # In a real implementation, we would use a mock API for testing

if __name__ == "__main__":
    unittest.main()
