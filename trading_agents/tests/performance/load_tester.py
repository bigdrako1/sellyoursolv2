"""
Load testing framework for the trading agents system.

This module provides tools for simulating high load on the trading agents
system to identify performance bottlenecks and verify system stability
under various load conditions.
"""
import asyncio
import logging
import time
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Callable, Tuple
import statistics
import argparse
import json
import os
from pathlib import Path

# Add parent directory to path to allow imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from core.resource_pool import ResourcePool
from core.cache_manager import CacheManager, CacheLevel, InvalidationStrategy
from core.execution_engine import ExecutionEngine, TaskPriority

logger = logging.getLogger(__name__)

class LoadTester:
    """
    Load testing framework for the trading agents system.

    This class provides methods to simulate high load on various components
    of the trading agents system, including the cache, resource pool, and
    execution engine.

    Attributes:
        resource_pool: Shared resource pool
        execution_engine: Execution engine
        results: Test results
    """

    def __init__(
        self,
        resource_pool: Optional[ResourcePool] = None,
        execution_engine: Optional[ExecutionEngine] = None,
        config: Dict[str, Any] = None
    ):
        """
        Initialize the load tester.

        Args:
            resource_pool: Shared resource pool (created if not provided)
            execution_engine: Execution engine (created if not provided)
            config: Test configuration
        """
        config = config or {}

        # Initialize components if not provided
        self.resource_pool = resource_pool or ResourcePool(config.get("resource_pool", {}))
        self.execution_engine = execution_engine or ExecutionEngine(
            config=config.get("execution_engine", {}),
            resource_pool=self.resource_pool
        )

        # Test configuration
        self.concurrency = config.get("concurrency", 10)
        self.duration = config.get("duration", 60)  # seconds
        self.ramp_up = config.get("ramp_up", 5)  # seconds
        self.test_cache = config.get("test_cache", True)
        self.test_http = config.get("test_http", True)
        self.test_execution = config.get("test_execution", True)

        # Results
        self.results = {
            "start_time": None,
            "end_time": None,
            "duration": 0,
            "total_operations": 0,
            "operations_per_second": 0,
            "response_times": {
                "min": 0,
                "max": 0,
                "avg": 0,
                "median": 0,
                "p95": 0,
                "p99": 0
            },
            "error_rate": 0,
            "component_results": {}
        }

        # Metrics
        self._response_times = []
        self._error_count = 0
        self._operation_count = 0

        logger.info("Load tester initialized")

    async def run_test(self):
        """
        Run the load test.

        This method runs the configured load tests and collects results.
        """
        logger.info(f"Starting load test with concurrency={self.concurrency}, duration={self.duration}s")

        # Record start time
        self.results["start_time"] = datetime.now().isoformat()
        start_time = time.time()

        # Run component tests
        if self.test_cache:
            await self._test_cache()

        if self.test_http:
            await self._test_http()

        if self.test_execution:
            await self._test_execution()

        # Record end time
        end_time = time.time()
        self.results["end_time"] = datetime.now().isoformat()
        self.results["duration"] = end_time - start_time

        # Calculate results
        self._calculate_results()

        logger.info(f"Load test completed in {self.results['duration']:.2f}s")
        logger.info(f"Operations: {self.results['total_operations']}, Rate: {self.results['operations_per_second']:.2f} ops/s")
        logger.info(f"Response times (ms): avg={self.results['response_times']['avg']:.2f}, p95={self.results['response_times']['p95']:.2f}")
        logger.info(f"Error rate: {self.results['error_rate']:.2%}")

        return self.results

    async def _test_cache(self):
        """Test cache performance under load."""
        logger.info("Testing cache performance")

        # Initialize results
        cache_results = {
            "operations": 0,
            "operations_per_second": 0,
            "response_times": {
                "get": [],
                "set": [],
                "delete": [],
                "invalidate": []
            },
            "hit_rate": 0,
            "error_rate": 0
        }

        # Generate test data
        test_data = self._generate_test_data(1000)

        # Define test operations
        async def cache_get_operation():
            key = f"test:key:{random.randint(1, 1000)}"
            start_time = time.time()
            try:
                value = await self.resource_pool.cache_get(key)
                elapsed = (time.time() - start_time) * 1000  # ms
                cache_results["response_times"]["get"].append(elapsed)
                self._response_times.append(elapsed)
                self._operation_count += 1
                return True
            except Exception as e:
                logger.error(f"Error in cache get: {str(e)}")
                self._error_count += 1
                return False

        async def cache_set_operation():
            key = f"test:key:{random.randint(1, 1000)}"
            value = random.choice(test_data)
            start_time = time.time()
            try:
                await self.resource_pool.cache_set(
                    key=key,
                    value=value,
                    ttl=300,
                    tags=["test", f"group:{random.randint(1, 10)}"]
                )
                elapsed = (time.time() - start_time) * 1000  # ms
                cache_results["response_times"]["set"].append(elapsed)
                self._response_times.append(elapsed)
                self._operation_count += 1
                return True
            except Exception as e:
                logger.error(f"Error in cache set: {str(e)}")
                self._error_count += 1
                return False

        async def cache_delete_operation():
            key = f"test:key:{random.randint(1, 1000)}"
            start_time = time.time()
            try:
                await self.resource_pool.cache_delete(key)
                elapsed = (time.time() - start_time) * 1000  # ms
                cache_results["response_times"]["delete"].append(elapsed)
                self._response_times.append(elapsed)
                self._operation_count += 1
                return True
            except Exception as e:
                logger.error(f"Error in cache delete: {str(e)}")
                self._error_count += 1
                return False

        async def cache_invalidate_operation():
            pattern = f"test:key:{random.randint(1, 10)}.*"
            start_time = time.time()
            try:
                await self.resource_pool.cache_invalidate_by_pattern(pattern)
                elapsed = (time.time() - start_time) * 1000  # ms
                cache_results["response_times"]["invalidate"].append(elapsed)
                self._response_times.append(elapsed)
                self._operation_count += 1
                return True
            except Exception as e:
                logger.error(f"Error in cache invalidate: {str(e)}")
                self._error_count += 1
                return False

        # Create operation mix
        operations = [
            (0.6, cache_get_operation),  # 60% gets
            (0.3, cache_set_operation),  # 30% sets
            (0.05, cache_delete_operation),  # 5% deletes
            (0.05, cache_invalidate_operation)  # 5% invalidates
        ]

        # Run the test
        await self._run_operations(operations, self.duration)

        # Calculate cache-specific results
        cache_stats = await self.resource_pool.get_stats()
        if "advanced_cache" in cache_stats:
            cache_results["hit_rate"] = cache_stats["advanced_cache"].get("memory_hit_rate", 0)

        cache_results["operations"] = self._operation_count
        cache_results["operations_per_second"] = self._operation_count / self.duration if self.duration > 0 else 0
        cache_results["error_rate"] = self._error_count / self._operation_count if self._operation_count > 0 else 0

        # Add to overall results
        self.results["component_results"]["cache"] = cache_results

        logger.info(f"Cache test completed: {cache_results['operations']} operations, {cache_results['error_rate']:.2%} error rate")

    async def _test_http(self):
        """Test HTTP client performance under load."""
        logger.info("Testing HTTP client performance")

        # Initialize results
        http_results = {
            "operations": 0,
            "operations_per_second": 0,
            "response_times": [],
            "status_codes": {},
            "error_rate": 0
        }

        # Define test operations
        async def http_get_operation():
            # Use a public API for testing
            url = "https://httpbin.org/get"
            params = {"test": f"value_{random.randint(1, 1000)}"}

            start_time = time.time()
            try:
                status, data = await self.resource_pool.http_request(
                    method="GET",
                    url=url,
                    api_name="test",
                    params=params
                )

                elapsed = (time.time() - start_time) * 1000  # ms
                http_results["response_times"].append(elapsed)
                self._response_times.append(elapsed)
                self._operation_count += 1

                # Record status code
                status_str = str(status)
                if status_str in http_results["status_codes"]:
                    http_results["status_codes"][status_str] += 1
                else:
                    http_results["status_codes"][status_str] = 1

                return True
            except Exception as e:
                logger.error(f"Error in HTTP get: {str(e)}")
                self._error_count += 1
                return False

        async def http_post_operation():
            # Use a public API for testing
            url = "https://httpbin.org/post"
            data = {"test": f"value_{random.randint(1, 1000)}"}

            start_time = time.time()
            try:
                status, response_data = await self.resource_pool.http_request(
                    method="POST",
                    url=url,
                    api_name="test",
                    json=data
                )

                elapsed = (time.time() - start_time) * 1000  # ms
                http_results["response_times"].append(elapsed)
                self._response_times.append(elapsed)
                self._operation_count += 1

                # Record status code
                status_str = str(status)
                if status_str in http_results["status_codes"]:
                    http_results["status_codes"][status_str] += 1
                else:
                    http_results["status_codes"][status_str] = 1

                return True
            except Exception as e:
                logger.error(f"Error in HTTP post: {str(e)}")
                self._error_count += 1
                return False

        # Create operation mix
        operations = [
            (0.7, http_get_operation),  # 70% gets
            (0.3, http_post_operation)  # 30% posts
        ]

        # Run the test
        await self._run_operations(operations, self.duration)

        # Calculate HTTP-specific results
        http_results["operations"] = self._operation_count
        http_results["operations_per_second"] = self._operation_count / self.duration if self.duration > 0 else 0
        http_results["error_rate"] = self._error_count / self._operation_count if self._operation_count > 0 else 0

        # Add to overall results
        self.results["component_results"]["http"] = http_results

        logger.info(f"HTTP test completed: {http_results['operations']} operations, {http_results['error_rate']:.2%} error rate")

    async def _test_execution(self):
        """Test execution engine performance under load."""
        logger.info("Testing execution engine performance")

        # Initialize results
        execution_results = {
            "operations": 0,
            "operations_per_second": 0,
            "response_times": [],
            "task_priorities": {},
            "error_rate": 0
        }

        # Start the execution engine if not already running
        if not self.execution_engine._running:
            await self.execution_engine.start()

        # Define test operations
        async def schedule_normal_task():
            task_id = f"test_task_{random.randint(1, 1000)}"

            start_time = time.time()
            try:
                await self.execution_engine.schedule_task(
                    agent_id="test_agent",
                    task_type="test",
                    coroutine=self._dummy_task,
                    priority=TaskPriority.NORMAL,
                    delay=0.0,
                    timeout=5.0
                )

                elapsed = (time.time() - start_time) * 1000  # ms
                execution_results["response_times"].append(elapsed)
                self._response_times.append(elapsed)
                self._operation_count += 1

                # Record priority
                priority = "NORMAL"
                if priority in execution_results["task_priorities"]:
                    execution_results["task_priorities"][priority] += 1
                else:
                    execution_results["task_priorities"][priority] = 1

                return True
            except Exception as e:
                logger.error(f"Error scheduling normal task: {str(e)}")
                self._error_count += 1
                return False

        async def schedule_high_priority_task():
            task_id = f"test_task_{random.randint(1, 1000)}"

            start_time = time.time()
            try:
                await self.execution_engine.schedule_task(
                    agent_id="test_agent",
                    task_type="test_high",
                    coroutine=self._dummy_task,
                    priority=TaskPriority.HIGH,
                    delay=0.0,
                    timeout=5.0
                )

                elapsed = (time.time() - start_time) * 1000  # ms
                execution_results["response_times"].append(elapsed)
                self._response_times.append(elapsed)
                self._operation_count += 1

                # Record priority
                priority = "HIGH"
                if priority in execution_results["task_priorities"]:
                    execution_results["task_priorities"][priority] += 1
                else:
                    execution_results["task_priorities"][priority] = 1

                return True
            except Exception as e:
                logger.error(f"Error scheduling high priority task: {str(e)}")
                self._error_count += 1
                return False

        async def schedule_low_priority_task():
            task_id = f"test_task_{random.randint(1, 1000)}"

            start_time = time.time()
            try:
                await self.execution_engine.schedule_task(
                    agent_id="test_agent",
                    task_type="test_low",
                    coroutine=self._dummy_task,
                    priority=TaskPriority.LOW,
                    delay=0.0,
                    timeout=5.0
                )

                elapsed = (time.time() - start_time) * 1000  # ms
                execution_results["response_times"].append(elapsed)
                self._response_times.append(elapsed)
                self._operation_count += 1

                # Record priority
                priority = "LOW"
                if priority in execution_results["task_priorities"]:
                    execution_results["task_priorities"][priority] += 1
                else:
                    execution_results["task_priorities"][priority] = 1

                return True
            except Exception as e:
                logger.error(f"Error scheduling low priority task: {str(e)}")
                self._error_count += 1
                return False

        # Create operation mix
        operations = [
            (0.6, schedule_normal_task),  # 60% normal priority
            (0.3, schedule_high_priority_task),  # 30% high priority
            (0.1, schedule_low_priority_task)  # 10% low priority
        ]

        # Run the test
        await self._run_operations(operations, self.duration)

        # Calculate execution-specific results
        execution_results["operations"] = self._operation_count
        execution_results["operations_per_second"] = self._operation_count / self.duration if self.duration > 0 else 0
        execution_results["error_rate"] = self._error_count / self._operation_count if self._operation_count > 0 else 0

        # Add to overall results
        self.results["component_results"]["execution"] = execution_results

        logger.info(f"Execution engine test completed: {execution_results['operations']} operations, {execution_results['error_rate']:.2%} error rate")

        # Stop the execution engine if we started it
        if self.execution_engine._running:
            await self.execution_engine.stop()

    async def _run_operations(self, operations: List[Tuple[float, Callable]], duration: float):
        """
        Run a mix of operations for the specified duration.

        Args:
            operations: List of (weight, operation_func) tuples
            duration: Duration in seconds
        """
        # Normalize weights
        total_weight = sum(weight for weight, _ in operations)
        normalized_ops = [(weight / total_weight, op) for weight, op in operations]

        # Calculate tasks per worker based on concurrency
        tasks_per_worker = max(10, int(duration))

        # Create workers
        workers = []
        for _ in range(self.concurrency):
            worker = asyncio.create_task(self._worker(normalized_ops, tasks_per_worker))
            workers.append(worker)

        # Wait for the specified duration
        await asyncio.sleep(duration)

        # Cancel workers
        for worker in workers:
            worker.cancel()

        # Wait for workers to complete
        try:
            await asyncio.gather(*workers, return_exceptions=True)
        except asyncio.CancelledError:
            pass

    async def _worker(self, operations: List[Tuple[float, Callable]], tasks_count: int):
        """
        Worker that executes operations.

        Args:
            operations: List of (normalized_weight, operation_func) tuples
            tasks_count: Number of tasks to execute
        """
        for _ in range(tasks_count):
            # Select an operation based on weights
            rand = random.random()
            cumulative = 0
            selected_op = None

            for weight, op in operations:
                cumulative += weight
                if rand <= cumulative:
                    selected_op = op
                    break

            if selected_op:
                # Execute the operation
                await selected_op()

            # Small delay to prevent CPU hogging
            await asyncio.sleep(0.01)

    async def _dummy_task(self, resource_pool: ResourcePool) -> Dict[str, Any]:
        """
        Dummy task for execution engine testing.

        Args:
            resource_pool: Shared resource pool

        Returns:
            Task result
        """
        # Simulate some work
        await asyncio.sleep(random.uniform(0.05, 0.2))

        # Simulate API call
        if random.random() < 0.3:  # 30% chance to make an API call
            try:
                await resource_pool.http_request(
                    method="GET",
                    url="https://httpbin.org/get",
                    api_name="test"
                )
            except Exception:
                pass

        return {"status": "success"}

    def _generate_test_data(self, count: int) -> List[Dict[str, Any]]:
        """
        Generate test data for cache testing.

        Args:
            count: Number of items to generate

        Returns:
            List of test data items
        """
        data = []
        for i in range(count):
            item = {
                "id": i,
                "name": f"Test Item {i}",
                "value": random.random() * 1000,
                "tags": [f"tag_{random.randint(1, 10)}" for _ in range(random.randint(1, 5))],
                "timestamp": datetime.now().isoformat(),
                "metadata": {
                    "source": "load_test",
                    "version": "1.0",
                    "complexity": random.randint(1, 5)
                }
            }
            data.append(item)

        return data

    def _calculate_results(self):
        """Calculate overall test results."""
        # Calculate total operations
        self.results["total_operations"] = self._operation_count

        # Calculate operations per second
        if self.results["duration"] > 0:
            self.results["operations_per_second"] = self.results["total_operations"] / self.results["duration"]

        # Calculate error rate
        if self._operation_count > 0:
            self.results["error_rate"] = self._error_count / self._operation_count

        # Calculate response time statistics
        if self._response_times:
            self.results["response_times"]["min"] = min(self._response_times)
            self.results["response_times"]["max"] = max(self._response_times)
            self.results["response_times"]["avg"] = statistics.mean(self._response_times)
            self.results["response_times"]["median"] = statistics.median(self._response_times)

            # Calculate percentiles
            sorted_times = sorted(self._response_times)
            p95_index = int(len(sorted_times) * 0.95)
            p99_index = int(len(sorted_times) * 0.99)

            self.results["response_times"]["p95"] = sorted_times[p95_index]
            self.results["response_times"]["p99"] = sorted_times[p99_index]

    def save_results(self, filename: str = None):
        """
        Save test results to a file.

        Args:
            filename: Output filename (default: load_test_results_{timestamp}.json)
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"load_test_results_{timestamp}.json"

        with open(filename, "w") as f:
            json.dump(self.results, f, indent=2)

        logger.info(f"Results saved to {filename}")

async def run_load_test(config: Dict[str, Any] = None):
    """
    Run a load test with the specified configuration.

    Args:
        config: Test configuration

    Returns:
        Test results
    """
    # Create and run the load tester
    tester = LoadTester(config=config)
    results = await tester.run_test()

    # Save results
    tester.save_results()

    return results

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Load testing for trading agents system")

    parser.add_argument("--concurrency", type=int, default=10,
                        help="Number of concurrent workers")
    parser.add_argument("--duration", type=int, default=60,
                        help="Test duration in seconds")
    parser.add_argument("--ramp-up", type=int, default=5,
                        help="Ramp-up time in seconds")
    parser.add_argument("--output", type=str, default=None,
                        help="Output file for results")
    parser.add_argument("--test-cache", action="store_true", default=True,
                        help="Test cache performance")
    parser.add_argument("--test-http", action="store_true", default=True,
                        help="Test HTTP client performance")
    parser.add_argument("--test-execution", action="store_true", default=True,
                        help="Test execution engine performance")
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

    # Create test configuration
    config = {
        "concurrency": args.concurrency,
        "duration": args.duration,
        "ramp_up": args.ramp_up,
        "test_cache": args.test_cache,
        "test_http": args.test_http,
        "test_execution": args.test_execution
    }

    # Run the load test
    results = await run_load_test(config)

    # Save results to specified file if provided
    if args.output:
        with open(args.output, "w") as f:
            json.dump(results, f, indent=2)

    return results

if __name__ == "__main__":
    # Run the main function
    asyncio.run(main())
