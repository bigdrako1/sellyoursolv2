"""
Integration tests for machine learning components.

This module contains integration tests for the machine learning components.
"""
import os
import sys
import unittest
import asyncio
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from trading_agents.ml.predictive.model_factory import ModelFactory
from trading_agents.ml.predictive.prediction_service import PredictionService
from trading_agents.ml.predictive.data_preparation import DataPreparer
from trading_agents.ml.common.feature_engineering import (
    PriceFeatureExtractor, VolumeFeatureExtractor,
    MomentumFeatureExtractor, VolatilityFeatureExtractor
)
from trading_agents.ml.reinforcement.agent import DQNAgent
from trading_agents.ml.reinforcement.environment import TradingEnvironment
from trading_agents.ml.reinforcement.trainer import RLTrainer

class TestMLIntegration(unittest.TestCase):
    """Integration tests for machine learning components."""

    @classmethod
    def setUpClass(cls):
        """Set up test class."""
        # Create test data
        cls.create_test_data()

        # Create test directory for models
        os.makedirs("test_models", exist_ok=True)

    @classmethod
    def tearDownClass(cls):
        """Tear down test class."""
        # Clean up test models
        import shutil
        if os.path.exists("test_models"):
            shutil.rmtree("test_models")

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

    def test_feature_extraction(self):
        """Test feature extraction from market data."""
        # Create feature extractors
        price_extractor = PriceFeatureExtractor()
        volume_extractor = VolumeFeatureExtractor()
        momentum_extractor = MomentumFeatureExtractor()
        volatility_extractor = VolatilityFeatureExtractor()

        # Extract features
        price_features = price_extractor.extract(self.market_data)
        volume_features = volume_extractor.extract(self.market_data)
        momentum_features = momentum_extractor.extract(self.market_data)
        volatility_features = volatility_extractor.extract(self.market_data)

        # Verify feature extraction
        self.assertFalse(price_features.empty, "Price features should not be empty")
        self.assertFalse(volume_features.empty, "Volume features should not be empty")
        self.assertFalse(momentum_features.empty, "Momentum features should not be empty")
        self.assertFalse(volatility_features.empty, "Volatility features should not be empty")

        # Verify feature names
        self.assertEqual(len(price_extractor.get_feature_names()), len(price_features.columns),
                         "Number of price feature names should match number of columns")
        self.assertEqual(len(volume_extractor.get_feature_names()), len(volume_features.columns),
                         "Number of volume feature names should match number of columns")
        self.assertEqual(len(momentum_extractor.get_feature_names()), len(momentum_features.columns),
                         "Number of momentum feature names should match number of columns")
        self.assertEqual(len(volatility_extractor.get_feature_names()), len(volatility_features.columns),
                         "Number of volatility feature names should match number of columns")

        # Verify feature metadata
        price_metadata = price_extractor.get_feature_metadata()
        volume_metadata = volume_extractor.get_feature_metadata()
        momentum_metadata = momentum_extractor.get_feature_metadata()
        volatility_metadata = volatility_extractor.get_feature_metadata()

        self.assertEqual(len(price_metadata), len(price_features.columns),
                         "Number of price feature metadata should match number of columns")
        self.assertEqual(len(volume_metadata), len(volume_features.columns),
                         "Number of volume feature metadata should match number of columns")
        self.assertEqual(len(momentum_metadata), len(momentum_features.columns),
                         "Number of momentum feature metadata should match number of columns")
        self.assertEqual(len(volatility_metadata), len(volatility_features.columns),
                         "Number of volatility feature metadata should match number of columns")

    def test_data_preparation(self):
        """Test data preparation for model training."""
        # Create data preparer
        config = {
            "target": "price_direction",
            "horizon": "hour_1",
            "test_size": 0.2,
            "validation_size": 0.2,
            "random_state": 42
        }
        data_preparer = DataPreparer(config)

        # Prepare data
        data_splits, metadata = data_preparer.prepare_data(self.market_data)

        # Verify data splits
        self.assertIn("train", data_splits, "Data splits should include train set")
        self.assertIn("validation", data_splits, "Data splits should include validation set")
        self.assertIn("test", data_splits, "Data splits should include test set")
        self.assertIn("features", data_splits, "Data splits should include feature names")
        self.assertIn("target", data_splits, "Data splits should include target name")

        # Verify data split sizes
        train_size = len(data_splits["train"])
        val_size = len(data_splits["validation"])
        test_size = len(data_splits["test"])
        total_size = train_size + val_size + test_size

        self.assertAlmostEqual(test_size / total_size, config["test_size"], delta=0.05,
                              msg="Test set size should be approximately test_size")
        self.assertAlmostEqual(val_size / (train_size + val_size), config["validation_size"], delta=0.05,
                              msg="Validation set size should be approximately validation_size")

        # Verify metadata
        self.assertEqual(metadata.target, config["target"], "Metadata target should match config target")
        self.assertEqual(metadata.symbols[0], "unknown", "Metadata symbol should be 'unknown'")

    def test_classification_model(self):
        """Test classification model training and prediction."""
        # Create model config
        config = {
            "model_id": "test_classification_model",
            "model_type": "classification",
            "model_name": "random_forest",
            "target": "price_direction",
            "horizon": "hour_1",
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

        # Create model
        model = ModelFactory.create_model(config)

        # Prepare data
        data_preparer = DataPreparer(config)
        data_splits, _ = data_preparer.prepare_data(self.market_data)

        # Train model
        X_train = data_splits["train"].drop(columns=[data_splits["target"]])
        y_train = data_splits["train"][data_splits["target"]]

        metrics = model.fit(X_train, y_train)

        # Verify metrics
        self.assertIn("accuracy", metrics, "Metrics should include accuracy")
        self.assertIn("precision", metrics, "Metrics should include precision")
        self.assertIn("recall", metrics, "Metrics should include recall")
        self.assertIn("f1", metrics, "Metrics should include f1")

        # Test prediction
        X_test = data_splits["test"].drop(columns=[data_splits["target"]])
        predictions = model.predict(X_test)

        # Verify predictions
        self.assertEqual(len(predictions), len(X_test), "Number of predictions should match number of test samples")
        self.assertTrue(np.all((predictions == 0) | (predictions == 1)), "Predictions should be binary (0 or 1)")

        # Test probability prediction
        probabilities = model.predict_proba(X_test)

        # Verify probabilities
        self.assertEqual(probabilities.shape[0], len(X_test), "Number of probability predictions should match number of test samples")
        self.assertEqual(probabilities.shape[1], 2, "Probability predictions should have 2 columns (binary classification)")
        self.assertTrue(np.all((probabilities >= 0) & (probabilities <= 1)), "Probabilities should be between 0 and 1")

        # Test model saving and loading
        model_path = model.save()
        loaded_model = ModelFactory.load_model(model_path)

        # Verify loaded model
        self.assertEqual(loaded_model.model_id, model.model_id, "Loaded model ID should match original model ID")
        self.assertEqual(loaded_model.target, model.target, "Loaded model target should match original model target")
        self.assertEqual(loaded_model.horizon, model.horizon, "Loaded model horizon should match original model horizon")

        # Test prediction with loaded model
        loaded_predictions = loaded_model.predict(X_test)
        np.testing.assert_array_equal(loaded_predictions, predictions, "Loaded model predictions should match original model predictions")

    def test_regression_model(self):
        """Test regression model training and prediction."""
        # Create model config
        config = {
            "model_id": "test_regression_model",
            "model_type": "regression",
            "model_name": "random_forest",
            "target": "price_change",
            "horizon": "hour_1",
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

        # Create model
        model = ModelFactory.create_model(config)

        # Prepare data for regression (price change)
        self.market_data['price_change'] = self.market_data['close'].pct_change() * 100
        self.market_data = self.market_data.dropna()

        # Split data manually for regression
        train_size = int(len(self.market_data) * 0.6)
        val_size = int(len(self.market_data) * 0.2)

        train_data = self.market_data.iloc[:train_size]
        val_data = self.market_data.iloc[train_size:train_size+val_size]
        test_data = self.market_data.iloc[train_size+val_size:]

        # Train model
        X_train = train_data.drop(columns=['price_change'])
        y_train = train_data['price_change']

        metrics = model.fit(X_train, y_train)

        # Verify metrics
        self.assertIn("mse", metrics, "Metrics should include mse")
        self.assertIn("rmse", metrics, "Metrics should include rmse")
        self.assertIn("mae", metrics, "Metrics should include mae")
        self.assertIn("r2", metrics, "Metrics should include r2")

        # Test prediction
        X_test = test_data.drop(columns=['price_change'])
        predictions = model.predict(X_test)

        # Verify predictions
        self.assertEqual(len(predictions), len(X_test), "Number of predictions should match number of test samples")

        # Test model saving and loading
        model_path = model.save()
        loaded_model = ModelFactory.load_model(model_path)

        # Verify loaded model
        self.assertEqual(loaded_model.model_id, model.model_id, "Loaded model ID should match original model ID")
        self.assertEqual(loaded_model.target, model.target, "Loaded model target should match original model target")
        self.assertEqual(loaded_model.horizon, model.horizon, "Loaded model horizon should match original model horizon")

        # Test prediction with loaded model
        loaded_predictions = loaded_model.predict(X_test)
        np.testing.assert_array_almost_equal(loaded_predictions, predictions, decimal=5,
                                            err_msg="Loaded model predictions should match original model predictions")

    def test_prediction_service(self):
        """Test prediction service."""
        # Create prediction service
        config = {
            "model_dir": "test_models",
            "cache_ttl": 60  # Short TTL for testing
        }
        prediction_service = PredictionService(config)

        # Create and save test model
        model_config = {
            "model_id": "test_prediction_model",
            "model_type": "classification",
            "model_name": "random_forest",
            "target": "price_direction",
            "horizon": "hour_1",
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
        model = ModelFactory.create_model(model_config)

        # Prepare data
        data_preparer = DataPreparer(model_config)
        data_splits, _ = data_preparer.prepare_data(self.market_data)

        # Train and save model
        X_train = data_splits["train"].drop(columns=[data_splits["target"]])
        y_train = data_splits["train"][data_splits["target"]]
        model.fit(X_train, y_train)
        model_path = model.save()

        # Load model with prediction service
        loaded_model = prediction_service.load_model(model.model_id)

        # Verify loaded model
        self.assertEqual(loaded_model.model_id, model.model_id, "Loaded model ID should match original model ID")

        # Test prediction
        symbol = "BTC/USDT"
        prediction = prediction_service.predict(model.model_id, self.market_data, symbol)

        # Verify prediction
        self.assertEqual(prediction.symbol, symbol, "Prediction symbol should match input symbol")
        self.assertEqual(prediction.target, model.target, "Prediction target should match model target")
        self.assertEqual(prediction.horizon, model.horizon, "Prediction horizon should match model horizon")
        self.assertEqual(prediction.model_id, model.model_id, "Prediction model ID should match model ID")
        self.assertIsNotNone(prediction.value, "Prediction value should not be None")
        self.assertIsNotNone(prediction.confidence, "Prediction confidence should not be None")

        # Test batch prediction
        data_dict = {
            "BTC/USDT": self.market_data,
            "ETH/USDT": self.market_data  # Using same data for testing
        }
        batch_predictions = prediction_service.batch_predict(model.model_id, data_dict)

        # Verify batch predictions
        self.assertEqual(len(batch_predictions), len(data_dict), "Number of batch predictions should match number of symbols")
        self.assertIn("BTC/USDT", batch_predictions, "Batch predictions should include BTC/USDT")
        self.assertIn("ETH/USDT", batch_predictions, "Batch predictions should include ETH/USDT")

        # Test cache
        cached_prediction = prediction_service.predict(model.model_id, self.market_data, symbol)
        self.assertEqual(cached_prediction.value, prediction.value, "Cached prediction value should match original prediction value")
        self.assertEqual(cached_prediction.confidence, prediction.confidence, "Cached prediction confidence should match original prediction confidence")

    def test_reinforcement_learning(self):
        """Test reinforcement learning components."""
        # Create environment
        env_config = {
            "window_size": 10,
            "initial_balance": 10000.0,
            "transaction_fee": 0.001,
            "reward_scaling": 1.0,
            "max_position": 1.0
        }
        env = TradingEnvironment(env_config)

        # Set data
        env.set_data(self.market_data)

        # Verify environment
        self.assertIsNotNone(env.observation_space, "Environment observation space should not be None")
        self.assertIsNotNone(env.action_space, "Environment action space should not be None")

        # Test environment reset
        observation = env.reset()
        self.assertIsNotNone(observation, "Environment reset should return an observation")
        self.assertEqual(observation.shape, env.observation_space.shape, "Observation shape should match observation space shape")

        # Test environment step
        action = env.action_space.sample()
        next_observation, reward, done, info = env.step(action)

        self.assertIsNotNone(next_observation, "Environment step should return an observation")
        self.assertEqual(next_observation.shape, env.observation_space.shape, "Observation shape should match observation space shape")
        self.assertIsInstance(reward, float, "Reward should be a float")
        self.assertIsInstance(done, bool, "Done should be a boolean")
        self.assertIsInstance(info, dict, "Info should be a dictionary")

        # Create agent
        agent_config = {
            "state_size": env.observation_space.shape,
            "action_size": env.action_space.n,
            "gamma": 0.95,
            "epsilon": 0.1,
            "epsilon_min": 0.01,
            "epsilon_decay": 0.995,
            "learning_rate": 0.001,
            "batch_size": 32,
            "memory_size": 1000,
            "model_dir": "test_models"
        }
        agent = DQNAgent(agent_config)

        # Test agent act
        action = agent.act(observation, training=False)
        self.assertIsInstance(action, int, "Action should be an integer")
        self.assertTrue(0 <= action < env.action_space.n, "Action should be within action space")

        # Test agent remember and replay
        agent.remember(observation, action, reward, next_observation, done)
        loss = agent.replay()  # May return 0 if memory is too small

        # Test agent save and load
        model_id = "test_rl_agent"
        model_path = agent.save(model_id)
        loaded_agent = DQNAgent.load(model_id, "test_models")

        # Verify loaded agent
        self.assertEqual(loaded_agent.action_size, agent.action_size, "Loaded agent action size should match original agent action size")
        self.assertEqual(loaded_agent.state_size, agent.state_size, "Loaded agent state size should match original agent state size")

        # Test trainer
        trainer_config = {
            "environment": env_config,
            "agent": agent_config,
            "episodes": 2,  # Small number for testing
            "update_target_every": 1,
            "validation_episodes": 1,
            "output_dir": "test_models"
        }
        trainer = RLTrainer(trainer_config)

        # Load data
        trainer.load_data(self.market_data)

        # Initialize trainer
        trainer.initialize()

        # Train for a very short time (just to test the API)
        results = trainer.train()

        # Verify results
        self.assertIn("train_metrics", results, "Results should include train metrics")
        self.assertIn("rewards", results["train_metrics"], "Train metrics should include rewards")
        self.assertIn("returns", results["train_metrics"], "Train metrics should include returns")
        self.assertIn("losses", results["train_metrics"], "Train metrics should include losses")

if __name__ == "__main__":
    unittest.main()
