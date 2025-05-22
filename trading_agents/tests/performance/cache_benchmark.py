"""
Cache benchmarking tool for the trading agents system.

This module provides tools for benchmarking the cache system performance
under various configurations and workloads.
"""
import asyncio
import logging
import time
import random
import statistics
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
import json
import argparse
import os
from pathlib import Path

# Add parent directory to path to allow imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from core.cache_manager import CacheManager, CacheLevel, InvalidationStrategy

logger = logging.getLogger(__name__)

class CacheBenchmark:
    """
    Benchmark tool for the cache system.

    This class provides methods to benchmark different cache configurations
    and operations to identify optimal settings for various workloads.

    Attributes:
        cache_managers: Dictionary of cache managers with different configurations
        results: Benchmark results
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the benchmark tool.

        Args:
            config: Benchmark configuration
        """
        config = config or {}

        # Benchmark configuration
        self.iterations = config.get("iterations", 1000)
        self.key_count = config.get("key_count", 10000)
        self.value_size = config.get("value_size", 1024)  # bytes
        self.read_write_ratio = config.get("read_write_ratio", 0.8)  # 80% reads, 20% writes
        self.run_memory_only = config.get("run_memory_only", True)
        self.run_disk_only = config.get("run_disk_only", True)
        self.run_tiered = config.get("run_tiered", True)

        # Create cache managers with different configurations
        self.cache_managers = {}

        if self.run_memory_only:
            memory_config = {
                "memory_max_size": 100000,
                "disk_cache_enabled": False,
                "invalidation_strategy": InvalidationStrategy.LRU.value
            }
            self.cache_managers["memory_only"] = CacheManager(memory_config)

        if self.run_disk_only:
            disk_config = {
                "memory_max_size": 1,  # Minimal memory cache
                "disk_max_size": 100 * 1024 * 1024,  # 100 MB
                "disk_cache_enabled": True,
                "disk_cache_dir": "benchmark_cache_disk",
                "invalidation_strategy": InvalidationStrategy.LRU.value
            }
            self.cache_managers["disk_only"] = CacheManager(disk_config)

        if self.run_tiered:
            tiered_config = {
                "memory_max_size": 50000,
                "disk_max_size": 100 * 1024 * 1024,  # 100 MB
                "disk_cache_enabled": True,
                "disk_cache_dir": "benchmark_cache_tiered",
                "invalidation_strategy": InvalidationStrategy.LRU.value
            }
            self.cache_managers["tiered"] = CacheManager(tiered_config)

        # Results
        self.results = {
            "start_time": None,
            "end_time": None,
            "configurations": {},
            "operations": {
                "get": {},
                "set": {},
                "delete": {},
                "invalidate_pattern": {},
                "invalidate_tag": {}
            },
            "workloads": {}
        }

        # Generate test data
        self.test_keys = [f"benchmark:key:{i}" for i in range(self.key_count)]
        self.test_values = self._generate_test_values(self.key_count, self.value_size)
        self.test_tags = [f"tag:{i}" for i in range(10)]

        logger.info(f"Cache benchmark initialized with {len(self.cache_managers)} configurations")

    async def run_benchmark(self):
        """
        Run the cache benchmark.

        This method runs benchmarks for different cache configurations and operations.
        """
        logger.info(f"Starting cache benchmark with {self.iterations} iterations")

        # Record start time
        self.results["start_time"] = datetime.now().isoformat()

        # Benchmark individual operations
        await self._benchmark_operations()

        # Benchmark realistic workloads
        await self._benchmark_workloads()

        # Record end time
        self.results["end_time"] = datetime.now().isoformat()

        # Add configuration details
        for name, cache_manager in self.cache_managers.items():
            stats = await cache_manager.get_stats()
            self.results["configurations"][name] = stats

        logger.info("Cache benchmark completed")

        return self.results

    async def _benchmark_operations(self):
        """Benchmark individual cache operations."""
        logger.info("Benchmarking individual operations")

        # Benchmark get operation
        await self._benchmark_get()

        # Benchmark set operation
        await self._benchmark_set()

        # Benchmark delete operation
        await self._benchmark_delete()

        # Benchmark invalidate by pattern
        await self._benchmark_invalidate_pattern()

        # Benchmark invalidate by tag
        await self._benchmark_invalidate_tag()

    async def _benchmark_get(self):
        """Benchmark get operation."""
        logger.info("Benchmarking get operation")

        for name, cache_manager in self.cache_managers.items():
            # Prepare cache with test data
            for i in range(min(self.iterations, self.key_count)):
                key = self.test_keys[i]
                value = self.test_values[i]
                await cache_manager.set(key, value, 3600)

            # Benchmark get operation
            times = []
            hits = 0
            misses = 0

            for i in range(self.iterations):
                # 80% existing keys, 20% non-existent keys
                if random.random() < 0.8:
                    key = self.test_keys[random.randint(0, min(self.iterations, self.key_count) - 1)]
                    expect_hit = True
                else:
                    key = f"benchmark:nonexistent:{random.randint(0, 1000)}"
                    expect_hit = False

                start_time = time.time()
                value = await cache_manager.get(key)
                elapsed = (time.time() - start_time) * 1000  # ms

                times.append(elapsed)

                if value is not None:
                    hits += 1
                else:
                    misses += 1

                # Verify hit/miss expectation
                if (value is not None) != expect_hit:
                    logger.warning(f"Unexpected cache result for {key}: expected hit={expect_hit}, got hit={value is not None}")

            # Calculate statistics
            self.results["operations"]["get"][name] = {
                "min": min(times),
                "max": max(times),
                "avg": statistics.mean(times),
                "median": statistics.median(times),
                "p95": sorted(times)[int(len(times) * 0.95)],
                "hit_rate": hits / (hits + misses) if (hits + misses) > 0 else 0,
                "operations_per_second": 1000 / statistics.mean(times)
            }

            logger.info(f"Get benchmark for {name}: {self.results['operations']['get'][name]['avg']:.2f}ms avg, {self.results['operations']['get'][name]['hit_rate']:.2%} hit rate")

    async def _benchmark_set(self):
        """Benchmark set operation."""
        logger.info("Benchmarking set operation")

        for name, cache_manager in self.cache_managers.items():
            # Benchmark set operation
            times = []

            for i in range(self.iterations):
                key = f"benchmark:set:{random.randint(0, self.key_count - 1)}"
                value = self.test_values[random.randint(0, self.key_count - 1)]
                tags = random.sample(self.test_tags, random.randint(0, 3))

                start_time = time.time()
                await cache_manager.set(key, value, 3600, tags=tags)
                elapsed = (time.time() - start_time) * 1000  # ms

                times.append(elapsed)

            # Calculate statistics
            self.results["operations"]["set"][name] = {
                "min": min(times),
                "max": max(times),
                "avg": statistics.mean(times),
                "median": statistics.median(times),
                "p95": sorted(times)[int(len(times) * 0.95)],
                "operations_per_second": 1000 / statistics.mean(times)
            }

            logger.info(f"Set benchmark for {name}: {self.results['operations']['set'][name]['avg']:.2f}ms avg")

    async def _benchmark_delete(self):
        """Benchmark delete operation."""
        logger.info("Benchmarking delete operation")

        for name, cache_manager in self.cache_managers.items():
            # Prepare cache with test data
            for i in range(min(self.iterations, self.key_count)):
                key = f"benchmark:delete:{i}"
                value = self.test_values[i]
                await cache_manager.set(key, value, 3600)

            # Benchmark delete operation
            times = []

            for i in range(self.iterations):
                # 80% existing keys, 20% non-existent keys
                if random.random() < 0.8:
                    key = f"benchmark:delete:{random.randint(0, min(self.iterations, self.key_count) - 1)}"
                else:
                    key = f"benchmark:nonexistent:{random.randint(0, 1000)}"

                start_time = time.time()
                await cache_manager.delete(key)
                elapsed = (time.time() - start_time) * 1000  # ms

                times.append(elapsed)

            # Calculate statistics
            self.results["operations"]["delete"][name] = {
                "min": min(times),
                "max": max(times),
                "avg": statistics.mean(times),
                "median": statistics.median(times),
                "p95": sorted(times)[int(len(times) * 0.95)],
                "operations_per_second": 1000 / statistics.mean(times)
            }

            logger.info(f"Delete benchmark for {name}: {self.results['operations']['delete'][name]['avg']:.2f}ms avg")

    async def _benchmark_invalidate_pattern(self):
        """Benchmark invalidate by pattern operation."""
        logger.info("Benchmarking invalidate by pattern operation")

        for name, cache_manager in self.cache_managers.items():
            # Prepare cache with test data
            for i in range(min(self.iterations, self.key_count)):
                key = f"benchmark:pattern:{i % 10}:{i}"
                value = self.test_values[i]
                await cache_manager.set(key, value, 3600)

            # Benchmark invalidate by pattern operation
            times = []

            for i in range(min(100, self.iterations)):  # Limit to 100 iterations for this operation
                pattern = f"benchmark:pattern:{random.randint(0, 9)}:.*"

                start_time = time.time()
                count = await cache_manager.invalidate_by_pattern(pattern)
                elapsed = (time.time() - start_time) * 1000  # ms

                times.append(elapsed)

                # Repopulate cache for next iteration
                for j in range(min(self.iterations // 10, self.key_count // 10)):
                    key = f"benchmark:pattern:{i % 10}:{j}"
                    value = self.test_values[j]
                    await cache_manager.set(key, value, 3600)

            # Calculate statistics
            self.results["operations"]["invalidate_pattern"][name] = {
                "min": min(times),
                "max": max(times),
                "avg": statistics.mean(times),
                "median": statistics.median(times),
                "p95": sorted(times)[int(len(times) * 0.95)],
                "operations_per_second": 1000 / statistics.mean(times)
            }

            logger.info(f"Invalidate pattern benchmark for {name}: {self.results['operations']['invalidate_pattern'][name]['avg']:.2f}ms avg")

    async def _benchmark_invalidate_tag(self):
        """Benchmark invalidate by tag operation."""
        logger.info("Benchmarking invalidate by tag operation")

        for name, cache_manager in self.cache_managers.items():
            # Prepare cache with test data
            for i in range(min(self.iterations, self.key_count)):
                key = f"benchmark:tag:{i}"
                value = self.test_values[i]
                tags = [self.test_tags[i % len(self.test_tags)]]
                await cache_manager.set(key, value, 3600, tags=tags)

            # Benchmark invalidate by tag operation
            times = []

            for i in range(min(100, self.iterations)):  # Limit to 100 iterations for this operation
                tag = self.test_tags[random.randint(0, len(self.test_tags) - 1)]

                start_time = time.time()
                count = await cache_manager.invalidate_by_tag(tag)
                elapsed = (time.time() - start_time) * 1000  # ms

                times.append(elapsed)

                # Repopulate cache for next iteration
                for j in range(min(self.iterations // 10, self.key_count // 10)):
                    key = f"benchmark:tag:{j}"
                    value = self.test_values[j]
                    tags = [self.test_tags[j % len(self.test_tags)]]
                    await cache_manager.set(key, value, 3600, tags=tags)

            # Calculate statistics
            self.results["operations"]["invalidate_tag"][name] = {
                "min": min(times),
                "max": max(times),
                "avg": statistics.mean(times),
                "median": statistics.median(times),
                "p95": sorted(times)[int(len(times) * 0.95)],
                "operations_per_second": 1000 / statistics.mean(times)
            }

            logger.info(f"Invalidate tag benchmark for {name}: {self.results['operations']['invalidate_tag'][name]['avg']:.2f}ms avg")

    async def _benchmark_workloads(self):
        """Benchmark realistic workloads."""
        logger.info("Benchmarking realistic workloads")

        # Define workloads
        workloads = {
            "read_heavy": {
                "get": 0.9,
                "set": 0.1,
                "delete": 0.0,
                "invalidate": 0.0
            },
            "write_heavy": {
                "get": 0.3,
                "set": 0.6,
                "delete": 0.1,
                "invalidate": 0.0
            },
            "balanced": {
                "get": 0.6,
                "set": 0.3,
                "delete": 0.05,
                "invalidate": 0.05
            }
        }

        for workload_name, workload in workloads.items():
            logger.info(f"Benchmarking {workload_name} workload")

            for cache_name, cache_manager in self.cache_managers.items():
                # Prepare cache with test data
                for i in range(min(self.iterations, self.key_count)):
                    key = f"benchmark:workload:{i}"
                    value = self.test_values[i]
                    tags = [self.test_tags[i % len(self.test_tags)]]
                    await cache_manager.set(key, value, 3600, tags=tags)

                # Benchmark workload
                times = []
                operations = {
                    "get": 0,
                    "set": 0,
                    "delete": 0,
                    "invalidate": 0
                }

                for i in range(self.iterations):
                    # Select operation based on workload
                    rand = random.random()
                    cumulative = 0
                    operation = None

                    for op, weight in workload.items():
                        cumulative += weight
                        if rand <= cumulative:
                            operation = op
                            break

                    # Execute operation
                    start_time = time.time()

                    if operation == "get":
                        key = f"benchmark:workload:{random.randint(0, min(self.iterations, self.key_count) - 1)}"
                        await cache_manager.get(key)
                        operations["get"] += 1
                    elif operation == "set":
                        key = f"benchmark:workload:{random.randint(0, min(self.iterations, self.key_count) - 1)}"
                        value = self.test_values[random.randint(0, self.key_count - 1)]
                        tags = [self.test_tags[random.randint(0, len(self.test_tags) - 1)]]
                        await cache_manager.set(key, value, 3600, tags=tags)
                        operations["set"] += 1
                    elif operation == "delete":
                        key = f"benchmark:workload:{random.randint(0, min(self.iterations, self.key_count) - 1)}"
                        await cache_manager.delete(key)
                        operations["delete"] += 1
                    elif operation == "invalidate":
                        if random.random() < 0.5:  # 50% pattern, 50% tag
                            pattern = f"benchmark:workload:{random.randint(0, 9)}.*"
                            await cache_manager.invalidate_by_pattern(pattern)
                        else:
                            tag = self.test_tags[random.randint(0, len(self.test_tags) - 1)]
                            await cache_manager.invalidate_by_tag(tag)
                        operations["invalidate"] += 1

                    elapsed = (time.time() - start_time) * 1000  # ms
                    times.append(elapsed)

                # Calculate statistics
                if not times:
                    continue

                if not workload_name in self.results["workloads"]:
                    self.results["workloads"][workload_name] = {}

                self.results["workloads"][workload_name][cache_name] = {
                    "min": min(times),
                    "max": max(times),
                    "avg": statistics.mean(times),
                    "median": statistics.median(times),
                    "p95": sorted(times)[int(len(times) * 0.95)],
                    "operations_per_second": 1000 / statistics.mean(times),
                    "operation_counts": operations
                }

                logger.info(f"{workload_name} workload for {cache_name}: {self.results['workloads'][workload_name][cache_name]['avg']:.2f}ms avg")

    def _generate_test_values(self, count: int, size: int) -> List[Dict[str, Any]]:
        """
        Generate test values for benchmarking.

        Args:
            count: Number of values to generate
            size: Approximate size of each value in bytes

        Returns:
            List of test values
        """
        values = []

        # Calculate how many items to include to reach the target size
        items_per_value = max(1, size // 100)  # Each item is roughly 100 bytes

        for i in range(count):
            value = {
                "id": i,
                "name": f"Test Value {i}",
                "timestamp": datetime.now().isoformat(),
                "data": []
            }

            # Add data items to reach the target size
            for j in range(items_per_value):
                item = {
                    "item_id": j,
                    "value": random.random() * 1000,
                    "metadata": {
                        "source": "benchmark",
                        "complexity": random.randint(1, 5),
                        "tags": [f"tag_{random.randint(1, 10)}" for _ in range(random.randint(1, 3))]
                    }
                }
                value["data"].append(item)

            values.append(value)

        return values

    def save_results(self, filename: str = None):
        """
        Save benchmark results to a file.

        Args:
            filename: Output filename (default: cache_benchmark_results_{timestamp}.json)
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"cache_benchmark_results_{timestamp}.json"

        with open(filename, "w") as f:
            json.dump(self.results, f, indent=2)

        logger.info(f"Results saved to {filename}")

async def run_benchmark(config: Dict[str, Any] = None):
    """
    Run a cache benchmark with the specified configuration.

    Args:
        config: Benchmark configuration

    Returns:
        Benchmark results
    """
    # Create and run the benchmark
    benchmark = CacheBenchmark(config=config)
    results = await benchmark.run_benchmark()

    # Save results
    benchmark.save_results()

    return results

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Cache benchmarking for trading agents system")

    parser.add_argument("--iterations", type=int, default=1000,
                        help="Number of iterations for each test")
    parser.add_argument("--key-count", type=int, default=10000,
                        help="Number of keys to use in tests")
    parser.add_argument("--value-size", type=int, default=1024,
                        help="Approximate size of values in bytes")
    parser.add_argument("--output", type=str, default=None,
                        help="Output file for results")
    parser.add_argument("--memory-only", action="store_true", default=True,
                        help="Run memory-only cache tests")
    parser.add_argument("--disk-only", action="store_true", default=True,
                        help="Run disk-only cache tests")
    parser.add_argument("--tiered", action="store_true", default=True,
                        help="Run tiered cache tests")
    parser.add_argument("--log-level", type=str, default="INFO",
                        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
                        help="Logging level")

    return parser.parse_args()

async def main():
    """Main entry point."""
    # Parse command line arguments
    args = parse_args()

    # Configure logging
    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    # Create benchmark configuration
    config = {
        "iterations": args.iterations,
        "key_count": args.key_count,
        "value_size": args.value_size,
        "run_memory_only": args.memory_only,
        "run_disk_only": args.disk_only,
        "run_tiered": args.tiered
    }

    # Run the benchmark
    results = await run_benchmark(config)

    # Save results to specified file if provided
    if args.output:
        with open(args.output, "w") as f:
            json.dump(results, f, indent=2)

    return results

if __name__ == "__main__":
    # Run the main function
    asyncio.run(main())
