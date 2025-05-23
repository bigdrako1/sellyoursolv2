"""
End-to-end integration tests.

This module contains end-to-end integration tests for the trading platform.
"""
import os
import sys
import unittest
import asyncio
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Import the FastAPI app
from trading_agents.api.app import create_app
from trading_agents.ml.predictive.model_factory import ModelFactory
from trading_agents.ml.predictive.prediction_service import PredictionService
from trading_agents.ml.reinforcement.agent import DQNAgent
from trading_agents.ml.reinforcement.environment import TradingEnvironment
from exchanges.exchange_factory import ExchangeFactory
from data_providers.data_provider_factory import DataProviderFactory

class TestEndToEnd(unittest.TestCase):
    """End-to-end integration tests."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test class."""
        # Create event loop for async tests
        cls.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(cls.loop)
        
        # Create test client
        cls.app = create_app(testing=True)
        cls.client = TestClient(cls.app)
        
        # Set up test exchanges
        cls.exchanges = cls.loop.run_until_complete(cls.setup_test_exchanges())
        
        # Set up test data providers
        cls.data_providers = cls.loop.run_until_complete(cls.setup_test_data_providers())
        
        # Set up test ML models
        cls.ml_models = cls.loop.run_until_complete(cls.setup_test_ml_models())
        
        # Create test data
        cls.create_test_data()
        
        # Create test user
        cls.test_user = {
            "username": "testuser",
            "password": "testpassword",
            "email": "test@example.com"
        }
        
        # Create test token
        cls.test_token = "test_token"
        
        # Mock authentication
        @cls.app.post("/token")
        async def mock_token():
            return {
                "access_token": cls.test_token,
                "token_type": "bearer",
                "user_id": "test_user_id",
                "username": cls.test_user["username"]
            }
    
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
        
        # Clean up test models
        import shutil
        if os.path.exists("test_models"):
            shutil.rmtree("test_models")
    
    @classmethod
    async def setup_test_exchanges(cls):
        """Set up test exchanges."""
        # Create exchange factory
        exchange_factory = ExchangeFactory()
        
        # Configure test exchanges
        test_exchanges = {
            "binance": {
                "api_key": "test_api_key",
                "api_secret": "test_api_secret",
                "testnet": True
            },
            "kraken": {
                "api_key": "test_api_key",
                "api_secret": "test_api_secret",
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
                "glassnode_api_key": "test_api_key",
                "cryptoquant_api_key": "test_api_key",
                "intotheblock_api_key": "test_api_key",
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
    
    @classmethod
    async def setup_test_ml_models(cls):
        """Set up test ML models."""
        # Create test directory for models
        os.makedirs("test_models", exist_ok=True)
        
        # Configure test prediction service
        prediction_service_config = {
            "model_dir": "test_models",
            "cache_ttl": 60  # Short TTL for testing
        }
        prediction_service = PredictionService(prediction_service_config)
        
        # Create and save test classification model
        classification_config = {
            "model_id": "test_classification_model",
            "model_type": "classification",
            "model_name": "random_forest",
            "target": "price_direction",
            "horizon": "1h",
            "feature_pipeline": {
                "fill_na": True,
                "na_strategy": "mean",
                "scaling": "standard",
                "feature_selection": "mutual_information",
                "n_features": 10
            },
            "model_parameters": {
                "n_estimators": 10,  # Small model for testing
                "max_depth": 3,
                "min_samples_split": 2,
                "min_samples_leaf": 1,
                "class_weight": "balanced"
            }
        }
        classification_model = ModelFactory.create_model(classification_config)
        
        # Create and save test regression model
        regression_config = {
            "model_id": "test_regression_model",
            "model_type": "regression",
            "model_name": "random_forest",
            "target": "price_change",
            "horizon": "1h",
            "feature_pipeline": {
                "fill_na": True,
                "na_strategy": "mean",
                "scaling": "standard",
                "feature_selection": "mutual_information",
                "n_features": 10
            },
            "model_parameters": {
                "n_estimators": 10,  # Small model for testing
                "max_depth": 3,
                "min_samples_split": 2,
                "min_samples_leaf": 1
            }
        }
        regression_model = ModelFactory.create_model(regression_config)
        
        # Create test RL environment and agent
        env_config = {
            "window_size": 10,
            "initial_balance": 10000.0,
            "transaction_fee": 0.001,
            "reward_scaling": 1.0,
            "max_position": 1.0
        }
        env = TradingEnvironment(env_config)
        
        agent_config = {
            "state_size": (10, 10),  # Small state size for testing
            "action_size": 3,
            "gamma": 0.95,
            "epsilon": 0.1,
            "epsilon_min": 0.01,
            "epsilon_decay": 0.995,
            "learning_rate": 0.001,
            "batch_size": 32,
            "memory_size": 1000,
            "model_dir": "test_models"
        }
        rl_agent = DQNAgent(agent_config)
        
        # Save test models
        os.makedirs("test_models/test_rl_agent", exist_ok=True)
        rl_agent.save("test_rl_agent")
        
        return {
            "prediction_service": prediction_service,
            "classification_model": classification_model,
            "regression_model": regression_model,
            "rl_agent": rl_agent,
            "env": env
        }
    
    @classmethod
    def create_test_data(cls):
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
        cls.market_data = pd.DataFrame({
            'open': open_price,
            'high': high,
            'low': low,
            'close': close,
            'volume': volume
        }, index=dates)
    
    def test_e2e_predictive_trading_strategy(self):
        """Test end-to-end predictive trading strategy."""
        # Create test agent
        agent_data = {
            "name": "Test Predictive Agent",
            "type": "predictive",
            "config": {
                "exchange_id": "binance",
                "symbols": ["BTC/USDT"],
                "model_id": "test_classification_model",
                "trade_enabled": False,
                "risk_management": {
                    "max_position_size": 0.1,
                    "stop_loss_pct": 0.02,
                    "take_profit_pct": 0.05
                }
            }
        }
        
        # Create agent
        response = self.client.post(
            "/api/agents",
            json=agent_data,
            headers={"Authorization": f"Bearer {self.test_token}"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Agent creation should return 200")
        agent = response.json()
        self.assertEqual(agent["name"], agent_data["name"], "Agent name should match")
        self.assertEqual(agent["type"], agent_data["type"], "Agent type should match")
        self.assertEqual(agent["status"], "stopped", "Agent status should be stopped")
        
        # Start agent
        response = self.client.post(
            f"/api/agents/{agent['id']}/start",
            headers={"Authorization": f"Bearer {self.test_token}"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Agent start should return 200")
        updated_agent = response.json()
        self.assertEqual(updated_agent["status"], "running", "Agent status should be running")
        
        # Get agent details
        response = self.client.get(
            f"/api/agents/{agent['id']}",
            headers={"Authorization": f"Bearer {self.test_token}"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Agent details should return 200")
        agent_details = response.json()
        self.assertEqual(agent_details["id"], agent["id"], "Agent ID should match")
        self.assertEqual(agent_details["status"], "running", "Agent status should be running")
        
        # Stop agent
        response = self.client.post(
            f"/api/agents/{agent['id']}/stop",
            headers={"Authorization": f"Bearer {self.test_token}"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Agent stop should return 200")
        updated_agent = response.json()
        self.assertEqual(updated_agent["status"], "stopped", "Agent status should be stopped")
    
    def test_e2e_reinforcement_learning_strategy(self):
        """Test end-to-end reinforcement learning strategy."""
        # Create test agent
        agent_data = {
            "name": "Test RL Agent",
            "type": "reinforcement",
            "config": {
                "exchange_id": "binance",
                "symbols": ["ETH/USDT"],
                "model_id": "test_rl_agent",
                "trade_enabled": False,
                "risk_management": {
                    "max_position_size": 0.1,
                    "stop_loss_pct": 0.02,
                    "take_profit_pct": 0.05
                }
            }
        }
        
        # Create agent
        response = self.client.post(
            "/api/agents",
            json=agent_data,
            headers={"Authorization": f"Bearer {self.test_token}"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Agent creation should return 200")
        agent = response.json()
        self.assertEqual(agent["name"], agent_data["name"], "Agent name should match")
        self.assertEqual(agent["type"], agent_data["type"], "Agent type should match")
        self.assertEqual(agent["status"], "stopped", "Agent status should be stopped")
        
        # Start agent
        response = self.client.post(
            f"/api/agents/{agent['id']}/start",
            headers={"Authorization": f"Bearer {self.test_token}"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Agent start should return 200")
        updated_agent = response.json()
        self.assertEqual(updated_agent["status"], "running", "Agent status should be running")
        
        # Get agent details
        response = self.client.get(
            f"/api/agents/{agent['id']}",
            headers={"Authorization": f"Bearer {self.test_token}"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Agent details should return 200")
        agent_details = response.json()
        self.assertEqual(agent_details["id"], agent["id"], "Agent ID should match")
        self.assertEqual(agent_details["status"], "running", "Agent status should be running")
        
        # Stop agent
        response = self.client.post(
            f"/api/agents/{agent['id']}/stop",
            headers={"Authorization": f"Bearer {self.test_token}"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Agent stop should return 200")
        updated_agent = response.json()
        self.assertEqual(updated_agent["status"], "stopped", "Agent status should be stopped")
    
    def test_e2e_strategy_with_onchain_data(self):
        """Test end-to-end strategy with on-chain data."""
        # Create test agent
        agent_data = {
            "name": "Test On-Chain Agent",
            "type": "hybrid",
            "config": {
                "exchange_id": "binance",
                "symbols": ["BTC/USDT"],
                "model_id": "test_classification_model",
                "trade_enabled": False,
                "data_providers": ["onchain"],
                "metrics": ["sopr", "nvt_ratio"],
                "risk_management": {
                    "max_position_size": 0.1,
                    "stop_loss_pct": 0.02,
                    "take_profit_pct": 0.05
                }
            }
        }
        
        # Create agent
        response = self.client.post(
            "/api/agents",
            json=agent_data,
            headers={"Authorization": f"Bearer {self.test_token}"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Agent creation should return 200")
        agent = response.json()
        self.assertEqual(agent["name"], agent_data["name"], "Agent name should match")
        self.assertEqual(agent["type"], agent_data["type"], "Agent type should match")
        self.assertEqual(agent["status"], "stopped", "Agent status should be stopped")
        
        # Start agent
        response = self.client.post(
            f"/api/agents/{agent['id']}/start",
            headers={"Authorization": f"Bearer {self.test_token}"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Agent start should return 200")
        updated_agent = response.json()
        self.assertEqual(updated_agent["status"], "running", "Agent status should be running")
        
        # Get agent details
        response = self.client.get(
            f"/api/agents/{agent['id']}",
            headers={"Authorization": f"Bearer {self.test_token}"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Agent details should return 200")
        agent_details = response.json()
        self.assertEqual(agent_details["id"], agent["id"], "Agent ID should match")
        self.assertEqual(agent_details["status"], "running", "Agent status should be running")
        
        # Stop agent
        response = self.client.post(
            f"/api/agents/{agent['id']}/stop",
            headers={"Authorization": f"Bearer {self.test_token}"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Agent stop should return 200")
        updated_agent = response.json()
        self.assertEqual(updated_agent["status"], "stopped", "Agent status should be stopped")
    
    def test_e2e_mobile_monitoring(self):
        """Test end-to-end mobile monitoring."""
        # Create test agent
        agent_data = {
            "name": "Test Mobile Agent",
            "type": "predictive",
            "config": {
                "exchange_id": "binance",
                "symbols": ["BTC/USDT"],
                "model_id": "test_classification_model",
                "trade_enabled": False
            }
        }
        
        # Create agent
        response = self.client.post(
            "/api/mobile/agents",
            json=agent_data,
            headers={"Authorization": f"Bearer {self.test_token}"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Agent creation should return 200")
        agent = response.json()
        
        # Get agents
        response = self.client.get(
            "/api/mobile/agents",
            headers={"Authorization": f"Bearer {self.test_token}"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Agents endpoint should return 200")
        agents = response.json()
        self.assertIsInstance(agents, list, "Response should be a list")
        self.assertGreater(len(agents), 0, "There should be at least one agent")
        
        # Get markets
        response = self.client.get(
            "/api/mobile/markets?exchange=binance",
            headers={"Authorization": f"Bearer {self.test_token}"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Markets endpoint should return 200")
        markets = response.json()
        self.assertIsInstance(markets, list, "Response should be a list")
        
        # Get notifications
        response = self.client.get(
            "/api/mobile/notifications",
            headers={"Authorization": f"Bearer {self.test_token}"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Notifications endpoint should return 200")
        notifications = response.json()
        self.assertIsInstance(notifications, list, "Response should be a list")

if __name__ == "__main__":
    unittest.main()
