"""
Setup script for integration testing environment.

This script sets up the testing environment for integration tests.
"""
import os
import sys
import logging
import asyncio
import json
import argparse
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(f"integration_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
    ]
)

logger = logging.getLogger(__name__)

# Import project modules
from trading_agents.api.app import create_app
from trading_agents.ml.predictive.model_factory import ModelFactory
from trading_agents.ml.predictive.prediction_service import PredictionService
from trading_agents.ml.reinforcement.agent import DQNAgent
from trading_agents.ml.reinforcement.environment import TradingEnvironment
from data_providers.data_provider_factory import DataProviderFactory
from exchanges.exchange_factory import ExchangeFactory

async def setup_test_database():
    """Set up test database."""
    logger.info("Setting up test database...")
    # In a real implementation, this would:
    # 1. Create test database
    # 2. Apply migrations
    # 3. Seed with test data
    logger.info("Test database setup complete.")
    return True

async def setup_test_cache():
    """Set up test cache."""
    logger.info("Setting up test cache...")
    # In a real implementation, this would:
    # 1. Configure Redis for testing
    # 2. Clear existing cache
    # 3. Warm cache with test data
    logger.info("Test cache setup complete.")
    return True

async def setup_test_exchanges():
    """Set up test exchanges."""
    logger.info("Setting up test exchanges...")
    
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
            logger.info(f"Initialized test exchange: {exchange_id}")
        except Exception as e:
            logger.error(f"Failed to initialize test exchange {exchange_id}: {str(e)}")
    
    logger.info("Test exchanges setup complete.")
    return initialized_exchanges

async def setup_test_data_providers():
    """Set up test data providers."""
    logger.info("Setting up test data providers...")
    
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
            logger.info(f"Initialized test data provider: {provider_id}")
        except Exception as e:
            logger.error(f"Failed to initialize test data provider {provider_id}: {str(e)}")
    
    logger.info("Test data providers setup complete.")
    return initialized_providers

async def setup_test_ml_models():
    """Set up test ML models."""
    logger.info("Setting up test ML models...")
    
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
    
    logger.info("Test ML models setup complete.")
    return {
        "prediction_service": prediction_service,
        "classification_model": classification_model,
        "regression_model": regression_model,
        "rl_agent": rl_agent,
        "env": env
    }

async def setup_test_api():
    """Set up test API."""
    logger.info("Setting up test API...")
    
    # Create test API app
    app = create_app(testing=True)
    
    logger.info("Test API setup complete.")
    return app

async def main():
    """Main setup function."""
    parser = argparse.ArgumentParser(description='Setup integration testing environment')
    parser.add_argument('--database', action='store_true', help='Setup test database')
    parser.add_argument('--cache', action='store_true', help='Setup test cache')
    parser.add_argument('--exchanges', action='store_true', help='Setup test exchanges')
    parser.add_argument('--data-providers', action='store_true', help='Setup test data providers')
    parser.add_argument('--ml-models', action='store_true', help='Setup test ML models')
    parser.add_argument('--api', action='store_true', help='Setup test API')
    parser.add_argument('--all', action='store_true', help='Setup all components')
    
    args = parser.parse_args()
    
    # If no arguments provided, setup all components
    if not any(vars(args).values()):
        args.all = True
    
    # Setup components
    results = {}
    
    if args.all or args.database:
        results['database'] = await setup_test_database()
    
    if args.all or args.cache:
        results['cache'] = await setup_test_cache()
    
    if args.all or args.exchanges:
        results['exchanges'] = await setup_test_exchanges()
    
    if args.all or args.data_providers:
        results['data_providers'] = await setup_test_data_providers()
    
    if args.all or args.ml_models:
        results['ml_models'] = await setup_test_ml_models()
    
    if args.all or args.api:
        results['api'] = await setup_test_api()
    
    # Save test environment configuration
    with open('test_env_config.json', 'w') as f:
        # Convert non-serializable objects to strings
        serializable_results = {}
        for key, value in results.items():
            if isinstance(value, dict):
                serializable_results[key] = {k: str(v) for k, v in value.items()}
            else:
                serializable_results[key] = str(value)
        
        json.dump(serializable_results, f, indent=2)
    
    logger.info("Test environment setup complete.")
    return results

if __name__ == "__main__":
    asyncio.run(main())
