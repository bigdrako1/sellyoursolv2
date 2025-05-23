"""
Batch prediction optimization for machine learning components.

This module provides batch prediction functionality to reduce prediction latency for multiple symbols.
"""
import logging
import time
import asyncio
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
import numpy as np
from concurrent.futures import ThreadPoolExecutor

from trading_agents.ml.common.data_types import PredictionResult

logger = logging.getLogger(__name__)

class BatchPredictor:
    """Batch predictor for machine learning models."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the batch predictor.
        
        Args:
            config: Batch predictor configuration
        """
        self.config = config
        
        # Maximum batch size
        self.max_batch_size = config.get("max_batch_size", 32)
        
        # Number of worker threads
        self.num_workers = config.get("num_workers", 4)
        
        # Thread pool executor
        self.executor = ThreadPoolExecutor(max_workers=self.num_workers)
        
        # Prediction statistics
        self.stats = {
            "batch_predictions": 0,
            "total_samples": 0,
            "total_time": 0.0
        }
        
        logger.info(f"Initialized batch predictor with max batch size {self.max_batch_size} and {self.num_workers} workers")
    
    def predict_batch(self, model, data_batch: List[pd.DataFrame]) -> List[np.ndarray]:
        """
        Predict batch of samples.
        
        Args:
            model: Machine learning model
            data_batch: Batch of data samples
            
        Returns:
            Batch of predictions
        """
        # Concatenate data samples
        if isinstance(data_batch[0], pd.DataFrame):
            # For pandas DataFrames
            concatenated_data = pd.concat(data_batch, axis=0)
            
            # Make prediction
            start_time = time.time()
            predictions = model.predict(concatenated_data)
            prediction_time = time.time() - start_time
            
            # Split predictions
            batch_size = len(data_batch)
            samples_per_batch = len(concatenated_data) // batch_size
            prediction_batches = [predictions[i*samples_per_batch:(i+1)*samples_per_batch] for i in range(batch_size)]
            
        else:
            # For numpy arrays
            concatenated_data = np.vstack(data_batch)
            
            # Make prediction
            start_time = time.time()
            predictions = model.predict(concatenated_data)
            prediction_time = time.time() - start_time
            
            # Split predictions
            batch_size = len(data_batch)
            samples_per_batch = len(concatenated_data) // batch_size
            prediction_batches = [predictions[i*samples_per_batch:(i+1)*samples_per_batch] for i in range(batch_size)]
        
        # Update statistics
        self.stats["batch_predictions"] += 1
        self.stats["total_samples"] += len(concatenated_data)
        self.stats["total_time"] += prediction_time
        
        logger.debug(f"Predicted batch of {batch_size} samples in {prediction_time:.2f}s")
        
        return prediction_batches
    
    def predict_multiple(self, model, data_dict: Dict[str, pd.DataFrame]) -> Dict[str, np.ndarray]:
        """
        Predict multiple data samples.
        
        Args:
            model: Machine learning model
            data_dict: Dictionary of data samples
            
        Returns:
            Dictionary of predictions
        """
        # Get data samples and keys
        keys = list(data_dict.keys())
        data_samples = [data_dict[key] for key in keys]
        
        # Split into batches
        num_samples = len(data_samples)
        num_batches = (num_samples + self.max_batch_size - 1) // self.max_batch_size
        batches = []
        batch_keys = []
        
        for i in range(num_batches):
            start_idx = i * self.max_batch_size
            end_idx = min((i + 1) * self.max_batch_size, num_samples)
            batches.append(data_samples[start_idx:end_idx])
            batch_keys.append(keys[start_idx:end_idx])
        
        # Predict batches
        all_predictions = {}
        
        for batch, batch_key in zip(batches, batch_keys):
            predictions = self.predict_batch(model, batch)
            all_predictions.update(dict(zip(batch_key, predictions)))
        
        return all_predictions
    
    async def predict_multiple_async(self, model, data_dict: Dict[str, pd.DataFrame]) -> Dict[str, np.ndarray]:
        """
        Predict multiple data samples asynchronously.
        
        Args:
            model: Machine learning model
            data_dict: Dictionary of data samples
            
        Returns:
            Dictionary of predictions
        """
        # Get data samples and keys
        keys = list(data_dict.keys())
        data_samples = [data_dict[key] for key in keys]
        
        # Split into batches
        num_samples = len(data_samples)
        num_batches = (num_samples + self.max_batch_size - 1) // self.max_batch_size
        batches = []
        batch_keys = []
        
        for i in range(num_batches):
            start_idx = i * self.max_batch_size
            end_idx = min((i + 1) * self.max_batch_size, num_samples)
            batches.append(data_samples[start_idx:end_idx])
            batch_keys.append(keys[start_idx:end_idx])
        
        # Predict batches asynchronously
        loop = asyncio.get_event_loop()
        tasks = []
        
        for batch in batches:
            task = loop.run_in_executor(self.executor, self.predict_batch, model, batch)
            tasks.append(task)
        
        # Wait for all tasks to complete
        batch_predictions = await asyncio.gather(*tasks)
        
        # Combine results
        all_predictions = {}
        
        for batch_key, predictions in zip(batch_keys, batch_predictions):
            all_predictions.update(dict(zip(batch_key, predictions)))
        
        return all_predictions
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get batch predictor statistics.
        
        Returns:
            Batch predictor statistics
        """
        avg_time_per_batch = self.stats["total_time"] / self.stats["batch_predictions"] if self.stats["batch_predictions"] > 0 else 0
        avg_time_per_sample = self.stats["total_time"] / self.stats["total_samples"] if self.stats["total_samples"] > 0 else 0
        
        return {
            "batch_predictions": self.stats["batch_predictions"],
            "total_samples": self.stats["total_samples"],
            "total_time": self.stats["total_time"],
            "avg_time_per_batch": avg_time_per_batch,
            "avg_time_per_sample": avg_time_per_sample
        }
    
    def shutdown(self):
        """Shutdown the batch predictor."""
        self.executor.shutdown()
        logger.info("Batch predictor shutdown")
