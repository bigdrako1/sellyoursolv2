"""
Execution Engine for optimized agent scheduling and resource management.

This module provides a centralized execution engine that efficiently schedules
agent execution cycles, manages shared resources, and prioritizes tasks based
on market conditions and agent configurations.
"""
import asyncio
import logging
import time
from typing import Dict, Any, List, Callable, Tuple, Optional, Set
import heapq
from datetime import datetime, timedelta
from enum import Enum

from core.base_agent import BaseAgent
from core.agent_status import AgentStatus
from core.resource_pool import ResourcePool
from core.adaptive_scheduler import AdaptiveScheduler

logger = logging.getLogger(__name__)

class TaskPriority(Enum):
    """Priority levels for agent tasks."""
    CRITICAL = 0  # Highest priority (e.g., stop loss checks)
    HIGH = 1      # High priority (e.g., time-sensitive trades)
    NORMAL = 2    # Normal priority (regular agent cycles)
    LOW = 3       # Low priority (background tasks)
    IDLE = 4      # Lowest priority (maintenance tasks)

class AgentTask:
    """
    Represents a scheduled task for an agent.
    
    Attributes:
        agent_id: ID of the agent
        task_type: Type of task (e.g., 'cycle', 'maintenance')
        coroutine: The coroutine to execute
        priority: Task priority level
        scheduled_time: When the task is scheduled to run
        timeout: Maximum execution time in seconds
    """
    
    def __init__(
        self,
        agent_id: str,
        task_type: str,
        coroutine: Callable,
        priority: TaskPriority = TaskPriority.NORMAL,
        scheduled_time: Optional[datetime] = None,
        timeout: float = 60.0
    ):
        self.agent_id = agent_id
        self.task_type = task_type
        self.coroutine = coroutine
        self.priority = priority
        self.scheduled_time = scheduled_time or datetime.now()
        self.timeout = timeout
        self.created_at = datetime.now()
        
    def __lt__(self, other):
        """
        Compare tasks for priority queue ordering.
        
        Tasks are ordered by:
        1. Priority level (CRITICAL is highest)
        2. Scheduled time (earlier is higher priority)
        3. Creation time (earlier is higher priority)
        """
        if self.priority.value != other.priority.value:
            return self.priority.value < other.priority.value
            
        if self.scheduled_time != other.scheduled_time:
            return self.scheduled_time < other.scheduled_time
            
        return self.created_at < other.created_at

class ExecutionEngine:
    """
    Centralized execution engine for agent tasks.
    
    This class manages the scheduling and execution of agent tasks,
    optimizing resource usage and prioritizing critical operations.
    
    Attributes:
        resource_pool: Shared resources for agents
        scheduler: Adaptive scheduler for dynamic scheduling
        max_concurrent_tasks: Maximum number of tasks to run concurrently
        task_timeout_multiplier: Multiplier for task timeout values
    """
    
    def __init__(
        self,
        config: Dict[str, Any] = None,
        resource_pool: Optional[ResourcePool] = None,
        scheduler: Optional[AdaptiveScheduler] = None
    ):
        """
        Initialize the execution engine.
        
        Args:
            config: Engine configuration
            resource_pool: Shared resource pool (created if not provided)
            scheduler: Adaptive scheduler (created if not provided)
        """
        config = config or {}
        
        # Initialize components
        self.resource_pool = resource_pool or ResourcePool(config.get("resource_pool", {}))
        self.scheduler = scheduler or AdaptiveScheduler(config.get("scheduler", {}))
        
        # Configuration
        self.max_concurrent_tasks = config.get("max_concurrent_tasks", 10)
        self.task_timeout_multiplier = config.get("task_timeout_multiplier", 1.2)
        self.health_check_interval = config.get("health_check_interval", 60)  # seconds
        
        # State
        self._task_queue: List[AgentTask] = []  # Priority queue (heapq)
        self._running_tasks: Set[str] = set()  # Set of running task IDs
        self._agent_last_run: Dict[str, datetime] = {}  # Last run time by agent ID
        self._agent_next_run: Dict[str, datetime] = {}  # Next scheduled run by agent ID
        self._running = False
        self._stop_event = asyncio.Event()
        self._main_task = None
        self._health_check_task = None
        
        logger.info("Execution engine initialized")
        
    async def start(self):
        """Start the execution engine."""
        if self._running:
            logger.warning("Execution engine already running")
            return
            
        logger.info("Starting execution engine")
        self._running = True
        self._stop_event.clear()
        
        # Start the main execution loop
        self._main_task = asyncio.create_task(self._execution_loop())
        
        # Start the health check loop
        self._health_check_task = asyncio.create_task(self._health_check_loop())
        
    async def stop(self):
        """Stop the execution engine."""
        if not self._running:
            logger.warning("Execution engine not running")
            return
            
        logger.info("Stopping execution engine")
        self._running = False
        self._stop_event.set()
        
        # Wait for the main task to complete
        if self._main_task:
            try:
                await asyncio.wait_for(self._main_task, timeout=10.0)
            except asyncio.TimeoutError:
                logger.warning("Execution loop did not stop gracefully, cancelling")
                self._main_task.cancel()
                
        # Wait for the health check task to complete
        if self._health_check_task:
            try:
                await asyncio.wait_for(self._health_check_task, timeout=5.0)
            except asyncio.TimeoutError:
                logger.warning("Health check loop did not stop gracefully, cancelling")
                self._health_check_task.cancel()
                
        logger.info("Execution engine stopped")
        
    async def schedule_agent_cycle(
        self,
        agent: BaseAgent,
        priority: TaskPriority = TaskPriority.NORMAL,
        delay: float = 0.0
    ):
        """
        Schedule an agent cycle.
        
        Args:
            agent: The agent to schedule
            priority: Task priority level
            delay: Delay in seconds before execution
        """
        if not self._running:
            logger.warning(f"Cannot schedule agent cycle for {agent.agent_id}: engine not running")
            return
            
        # Calculate scheduled time
        scheduled_time = datetime.now() + timedelta(seconds=delay)
        
        # Create the task
        task = AgentTask(
            agent_id=agent.agent_id,
            task_type="cycle",
            coroutine=agent.run_cycle,
            priority=priority,
            scheduled_time=scheduled_time,
            timeout=agent.config.get("cycle_timeout", 60.0)
        )
        
        # Add to the priority queue
        await self._add_task(task)
        
        # Update next run time
        self._agent_next_run[agent.agent_id] = scheduled_time
        
        logger.debug(f"Scheduled cycle for agent {agent.agent_id} with priority {priority.name}")
        
    async def schedule_task(
        self,
        agent_id: str,
        task_type: str,
        coroutine: Callable,
        priority: TaskPriority = TaskPriority.NORMAL,
        delay: float = 0.0,
        timeout: float = 60.0
    ):
        """
        Schedule a custom task.
        
        Args:
            agent_id: ID of the agent
            task_type: Type of task
            coroutine: The coroutine to execute
            priority: Task priority level
            delay: Delay in seconds before execution
            timeout: Maximum execution time in seconds
        """
        if not self._running:
            logger.warning(f"Cannot schedule task for {agent_id}: engine not running")
            return
            
        # Calculate scheduled time
        scheduled_time = datetime.now() + timedelta(seconds=delay)
        
        # Create the task
        task = AgentTask(
            agent_id=agent_id,
            task_type=task_type,
            coroutine=coroutine,
            priority=priority,
            scheduled_time=scheduled_time,
            timeout=timeout
        )
        
        # Add to the priority queue
        await self._add_task(task)
        
        logger.debug(f"Scheduled {task_type} task for agent {agent_id} with priority {priority.name}")
        
    async def _add_task(self, task: AgentTask):
        """
        Add a task to the priority queue.
        
        Args:
            task: The task to add
        """
        # Add to the priority queue
        heapq.heappush(self._task_queue, task)
        
    async def _execution_loop(self):
        """Main execution loop for processing tasks."""
        logger.info("Execution loop started")
        
        try:
            while self._running:
                # Check if we should stop
                if self._stop_event.is_set():
                    break
                    
                # Check if we can run more tasks
                if len(self._running_tasks) >= self.max_concurrent_tasks:
                    # Wait for a task to complete
                    await asyncio.sleep(0.1)
                    continue
                    
                # Check if there are tasks to run
                if not self._task_queue:
                    # No tasks, wait a bit
                    await asyncio.sleep(0.1)
                    continue
                    
                # Get the next task
                task = self._task_queue[0]  # Peek at the top task
                
                # Check if it's time to run the task
                if task.scheduled_time > datetime.now():
                    # Not time yet, wait a bit
                    await asyncio.sleep(0.1)
                    continue
                    
                # Remove the task from the queue
                task = heapq.heappop(self._task_queue)
                
                # Run the task
                asyncio.create_task(self._run_task(task))
                
        except asyncio.CancelledError:
            logger.info("Execution loop cancelled")
            raise
        except Exception as e:
            logger.error(f"Error in execution loop: {str(e)}", exc_info=True)
            raise
        finally:
            logger.info("Execution loop stopped")
            
    async def _run_task(self, task: AgentTask):
        """
        Run a task with timeout and error handling.
        
        Args:
            task: The task to run
        """
        # Add to running tasks
        task_id = f"{task.agent_id}:{task.task_type}:{id(task)}"
        self._running_tasks.add(task_id)
        
        # Update last run time for agent
        self._agent_last_run[task.agent_id] = datetime.now()
        
        # Calculate timeout with multiplier
        timeout = task.timeout * self.task_timeout_multiplier
        
        start_time = time.time()
        logger.debug(f"Starting task {task_id} (priority: {task.priority.name})")
        
        try:
            # Run the task with timeout
            await asyncio.wait_for(
                task.coroutine(self.resource_pool),
                timeout=timeout
            )
            
            # Calculate execution time
            execution_time = time.time() - start_time
            logger.debug(f"Task {task_id} completed in {execution_time:.2f}s")
            
            # Update scheduler with execution time
            self.scheduler.update_execution_time(
                agent_id=task.agent_id,
                task_type=task.task_type,
                execution_time=execution_time
            )
            
        except asyncio.TimeoutError:
            logger.warning(f"Task {task_id} timed out after {timeout:.2f}s")
            
            # Update scheduler with timeout
            self.scheduler.update_timeout(
                agent_id=task.agent_id,
                task_type=task.task_type
            )
            
        except Exception as e:
            logger.error(f"Error executing task {task_id}: {str(e)}", exc_info=True)
            
            # Update scheduler with error
            self.scheduler.update_error(
                agent_id=task.agent_id,
                task_type=task.task_type,
                error=str(e)
            )
            
        finally:
            # Remove from running tasks
            self._running_tasks.remove(task_id)
            
    async def _health_check_loop(self):
        """Periodic health check loop."""
        logger.info("Health check loop started")
        
        try:
            while self._running:
                # Check if we should stop
                if self._stop_event.is_set():
                    break
                    
                # Perform health check
                await self._perform_health_check()
                
                # Wait for next check
                await asyncio.sleep(self.health_check_interval)
                
        except asyncio.CancelledError:
            logger.info("Health check loop cancelled")
            raise
        except Exception as e:
            logger.error(f"Error in health check loop: {str(e)}", exc_info=True)
            raise
        finally:
            logger.info("Health check loop stopped")
            
    async def _perform_health_check(self):
        """Perform a health check of the execution engine."""
        try:
            # Log current state
            logger.debug(f"Health check: {len(self._task_queue)} tasks queued, {len(self._running_tasks)} tasks running")
            
            # Check for stuck tasks
            current_time = datetime.now()
            for agent_id, last_run in self._agent_last_run.items():
                if agent_id in self._agent_next_run:
                    next_run = self._agent_next_run[agent_id]
                    
                    # Check if the agent is overdue
                    if next_run < current_time - timedelta(minutes=5):
                        logger.warning(f"Agent {agent_id} is overdue for execution (scheduled: {next_run}, current: {current_time})")
                        
            # Check resource pool health
            await self.resource_pool.health_check()
            
        except Exception as e:
            logger.error(f"Error in health check: {str(e)}", exc_info=True)
            
    def get_stats(self) -> Dict[str, Any]:
        """
        Get execution engine statistics.
        
        Returns:
            Dictionary of statistics
        """
        return {
            "running": self._running,
            "queued_tasks": len(self._task_queue),
            "running_tasks": len(self._running_tasks),
            "agents_tracked": len(self._agent_last_run),
            "resource_pool_stats": self.resource_pool.get_stats(),
            "scheduler_stats": self.scheduler.get_stats()
        }
