"""
Base agent abstract class.
All trading agents should inherit from this class.
"""
import asyncio
import time
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import traceback
from datetime import datetime, timedelta

from .agent_status import AgentStatus
from .logger import Logger
from .metrics import MetricsCollector
from .resource_pool import ResourcePool

class BaseAgent(ABC):
    """
    Abstract base class for all trading agents.
    Provides lifecycle management, configuration handling, and common functionality.
    """

    def __init__(self, agent_id: str, config: Dict[str, Any]):
        """
        Initialize the agent.

        Args:
            agent_id: Unique identifier for the agent
            config: Agent configuration
        """
        self.agent_id = agent_id
        self.config = config
        self.status = AgentStatus.INITIALIZED
        self.logger = Logger(agent_id)
        self.metrics = MetricsCollector(agent_id)

    async def start(self):
        """
        Start the agent.
        Sets the agent status to RUNNING if initialization is successful.
        """
        self.logger.info(f"Starting agent {self.agent_id}")
        self.status = AgentStatus.STARTING

        try:
            await self._initialize()
            self.status = AgentStatus.RUNNING
            self.logger.info(f"Agent {self.agent_id} started successfully")
        except Exception as e:
            self.status = AgentStatus.ERROR
            self.logger.error(f"Failed to start agent {self.agent_id}: {str(e)}")
            self.logger.error(traceback.format_exc())
            self.metrics.increment("errors")
            raise

    async def stop(self):
        """
        Stop the agent.
        Sets the agent status to STOPPED if cleanup is successful.
        """
        self.logger.info(f"Stopping agent {self.agent_id}")
        self.status = AgentStatus.STOPPING

        try:
            await self._cleanup()
            self.status = AgentStatus.STOPPED
            self.logger.info(f"Agent {self.agent_id} stopped successfully")
        except Exception as e:
            self.status = AgentStatus.ERROR
            self.logger.error(f"Failed to stop agent {self.agent_id}: {str(e)}")
            self.logger.error(traceback.format_exc())
            self.metrics.increment("errors")
            raise

    async def update_config(self, config: Dict[str, Any]):
        """
        Update agent configuration.

        Args:
            config: New configuration
        """
        self.logger.info(f"Updating configuration for agent {self.agent_id}")
        old_config = self.config.copy()

        try:
            # Update configuration
            self.config = config

            # Notify agent of configuration update
            await self._on_config_update(old_config, config)

            self.logger.info(f"Configuration updated successfully for agent {self.agent_id}")
        except Exception as e:
            # Revert to old configuration on error
            self.config = old_config
            self.logger.error(f"Failed to update configuration for agent {self.agent_id}: {str(e)}")
            self.logger.error(traceback.format_exc())
            self.metrics.increment("errors")
            raise

    async def get_status(self) -> Dict[str, Any]:
        """
        Get agent status and metrics.

        Returns:
            Dictionary containing agent status and metrics
        """
        return {
            "agent_id": self.agent_id,
            "status": self.status.value,
            "metrics": self.metrics.get_metrics(),
            "config": self.config
        }

    async def execute_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a specific action on the agent.

        Args:
            action: Action to execute

        Returns:
            Result of the action
        """
        action_type = action.get("type")
        self.logger.info(f"Executing action {action_type} on agent {self.agent_id}")

        try:
            # Default implementation - can be overridden by subclasses
            return {"success": False, "message": "Action not supported"}
        except Exception as e:
            self.logger.error(f"Failed to execute action {action_type} on agent {self.agent_id}: {str(e)}")
            self.logger.error(traceback.format_exc())
            self.metrics.increment("errors")
            return {"success": False, "message": str(e)}

    async def run_cycle(self, resource_pool: ResourcePool) -> Dict[str, Any]:
        """
        Run a single agent execution cycle.

        This method is called by the execution engine to run a single cycle
        of the agent's main logic. It handles timing, error handling, and
        metrics collection.

        Args:
            resource_pool: Shared resource pool

        Returns:
            Cycle results
        """
        if self.status != AgentStatus.RUNNING:
            self.logger.warning(f"Cannot run cycle for agent {self.agent_id}: agent not running")
            return {
                "success": False,
                "message": f"Agent not running (status: {self.status.value})"
            }

        self.logger.info(f"Running cycle for agent {self.agent_id}")
        cycle_start = time.time()

        try:
            # Run the agent cycle
            results = await self._run_cycle(resource_pool)

            # Calculate cycle duration
            cycle_duration = time.time() - cycle_start

            # Update metrics
            self.metrics.set("last_cycle_time", cycle_duration)
            self.metrics.set("last_cycle_completed", datetime.now().isoformat())
            self.metrics.increment("cycles_completed")

            self.logger.info(f"Cycle completed for agent {self.agent_id} in {cycle_duration:.2f}s")

            return {
                "success": True,
                "duration": cycle_duration,
                "results": results
            }

        except Exception as e:
            # Calculate cycle duration
            cycle_duration = time.time() - cycle_start

            # Update metrics
            self.metrics.set("last_cycle_time", cycle_duration)
            self.metrics.set("last_cycle_error", str(e))
            self.metrics.increment("cycles_failed")
            self.metrics.increment("errors")

            self.logger.error(f"Error in cycle for agent {self.agent_id}: {str(e)}")
            self.logger.error(traceback.format_exc())

            return {
                "success": False,
                "duration": cycle_duration,
                "error": str(e)
            }

    @abstractmethod
    async def _run_cycle(self, resource_pool: ResourcePool) -> Dict[str, Any]:
        """
        Run a single agent execution cycle.
        Must be implemented by subclasses.

        Args:
            resource_pool: Shared resource pool

        Returns:
            Cycle results
        """
        pass

    @abstractmethod
    async def _initialize(self):
        """
        Initialize agent resources.
        Must be implemented by subclasses.
        """
        pass

    @abstractmethod
    async def _cleanup(self):
        """
        Clean up agent resources.
        Must be implemented by subclasses.
        """
        pass

    @abstractmethod
    async def _on_config_update(self, old_config: Dict[str, Any], new_config: Dict[str, Any]):
        """
        Handle configuration updates.
        Must be implemented by subclasses.

        Args:
            old_config: Previous configuration
            new_config: New configuration
        """
        pass
