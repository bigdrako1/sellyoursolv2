"""
Agent registry for managing agent instances.
"""
from typing import Dict, Any, List, Type, Optional
import logging
from datetime import datetime

from .base_agent import BaseAgent
from .agent_status import AgentStatus
from .agent_factory import AgentFactory
from .execution_engine import ExecutionEngine, TaskPriority
from .resource_pool import ResourcePool
from .adaptive_scheduler import AdaptiveScheduler
from database import get_agent_repository, get_position_repository, get_market_repository

logger = logging.getLogger(__name__)

class AgentRegistry:
    """
    Registry for managing agent instances.
    Provides methods for registering, unregistering, and retrieving agents.
    """

    _instance = None
    _execution_engine = None

    @classmethod
    def get_instance(cls):
        """
        Get or create the singleton instance.

        Returns:
            AgentRegistry: The singleton instance
        """
        if cls._instance is None:
            cls._instance = AgentRegistry()
        return cls._instance

    @classmethod
    def get_execution_engine(cls):
        """
        Get the execution engine.

        Returns:
            ExecutionEngine: The execution engine or None if not initialized
        """
        if cls._instance is None:
            return None
        return cls._instance._execution_engine

    def __init__(self):
        """
        Initialize the agent registry.
        """
        self.agents: Dict[str, BaseAgent] = {}
        self._execution_engine = ExecutionEngine()

    async def start(self):
        """
        Start the registry and execution engine.
        """
        logger.info("Starting agent registry and execution engine")
        await self._execution_engine.start()
        logger.info("Agent registry and execution engine started")

    async def stop(self):
        """
        Stop the registry and execution engine.
        """
        logger.info("Stopping agent registry and execution engine")

        # Stop all agents first
        await self.stop_all_agents()

        # Then stop the execution engine
        await self._execution_engine.stop()

        logger.info("Agent registry and execution engine stopped")

    async def register_agent(self, agent_type: str, agent_id: str, config: Dict[str, Any]) -> BaseAgent:
        """
        Register a new agent.

        Args:
            agent_type: Type of agent to register
            agent_id: Unique identifier for the agent
            config: Agent configuration

        Returns:
            The registered agent instance

        Raises:
            ValueError: If agent_id already exists or agent_type is not recognized
        """
        # Check if agent_id already exists
        if agent_id in self.agents:
            raise ValueError(f"Agent with ID {agent_id} already exists")

        try:
            # Get agent repository
            agent_repo = get_agent_repository()

            # Create agent in database
            agent_data = await agent_repo.create_agent(
                agent_id=agent_id,
                agent_type=agent_type,
                name=config.get("name", f"{agent_type.capitalize()} Agent"),
                config=config
            )

            # Get agent class
            agent_class = self._get_agent_class(agent_type)

            # Create agent instance
            agent = agent_class(agent_id, config)

            # Store agent
            self.agents[agent_id] = agent

            logger.info(f"Registered agent {agent_id} of type {agent_type}")

            return agent

        except Exception as e:
            logger.error(f"Error registering agent {agent_id}: {str(e)}")
            raise

    async def unregister_agent(self, agent_id: str) -> None:
        """
        Unregister an agent.

        Args:
            agent_id: ID of the agent to unregister

        Raises:
            ValueError: If agent_id does not exist
        """
        # Check if agent_id exists
        if agent_id not in self.agents:
            raise ValueError(f"Agent with ID {agent_id} does not exist")

        agent = self.agents[agent_id]

        try:
            # Stop agent if it's running
            if agent.status == AgentStatus.RUNNING:
                await agent.stop()

            # Get agent repository
            agent_repo = get_agent_repository()

            # Delete agent from database
            deleted = await agent_repo.delete_agent(agent_id)

            if not deleted:
                logger.warning(f"Agent {agent_id} not found in database")

            # Remove agent from registry
            del self.agents[agent_id]

            logger.info(f"Unregistered agent {agent_id}")

        except Exception as e:
            logger.error(f"Error unregistering agent {agent_id}: {str(e)}")
            raise

    async def get_agent(self, agent_id: str) -> Optional[BaseAgent]:
        """
        Get an agent by ID.

        Args:
            agent_id: ID of the agent to retrieve

        Returns:
            The agent instance, or None if not found
        """
        return self.agents.get(agent_id)

    async def get_all_agents(self) -> List[BaseAgent]:
        """
        Get all registered agents.

        Returns:
            List of all agent instances
        """
        return list(self.agents.values())

    async def get_agents(
        self,
        agent_type: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Get all registered agents, optionally filtered by type and status.

        Args:
            agent_type: Optional type to filter by
            status: Optional status to filter by
            limit: Maximum number of agents to return
            offset: Offset for pagination

        Returns:
            Dictionary with agents list and total count
        """
        try:
            # Get agent repository
            agent_repo = get_agent_repository()

            # Get agents from database
            agents_data, total = await agent_repo.get_agents(
                agent_type=agent_type,
                status=status,
                limit=limit,
                offset=offset
            )

            # Return database results directly
            return {
                "agents": agents_data,
                "total": total,
                "limit": limit,
                "offset": offset
            }

        except Exception as e:
            logger.error(f"Error getting agents from database: {str(e)}")

            # Fall back to in-memory registry if database fails
            agents = []

            # Filter agents
            for agent in self.agents.values():
                if agent_type and agent.__class__.__name__.lower() != f"{agent_type.lower()}agent":
                    continue

                if status and agent.status.value != status:
                    continue

                # Get agent status
                try:
                    status_data = await agent.get_status()
                    agents.append({
                        "agent_id": agent.agent_id,
                        "agent_type": agent.__class__.__name__.replace("Agent", "").lower(),
                        "status": status_data["status"],
                        "config": status_data["config"],
                        "metrics": status_data.get("metrics", {})
                    })
                except Exception as status_error:
                    logger.error(f"Error getting agent status: {str(status_error)}")

            # Apply pagination
            paginated_agents = agents[offset:offset+limit]

            return {
                "agents": paginated_agents,
                "total": len(agents),
                "limit": limit,
                "offset": offset
            }

    def _get_agent_class(self, agent_type: str) -> Type[BaseAgent]:
        """
        Get agent class by type.

        Args:
            agent_type: Type of agent

        Returns:
            Agent class

        Raises:
            ValueError: If agent_type is not recognized
        """
        # Check if agent class is already loaded
        if agent_type in self.agent_classes:
            return self.agent_classes[agent_type]

        # Use AgentFactory to get the agent class
        try:
            agent_class = AgentFactory.get_agent_class(agent_type)
            self.agent_classes[agent_type] = agent_class
            return agent_class
        except ValueError as e:
            raise ValueError(f"Agent type {agent_type} not recognized: {str(e)}")

    async def start_all_agents(self) -> Dict[str, Any]:
        """
        Start all registered agents.

        Returns:
            Dictionary mapping agent IDs to success/failure status
        """
        results = {}

        for agent_id, agent in self.agents.items():
            try:
                # Start the agent
                await agent.start()

                # Schedule the first cycle if the agent is running
                if agent.status == AgentStatus.RUNNING:
                    await self._execution_engine.schedule_agent_cycle(agent)
                    logger.info(f"Scheduled first cycle for agent {agent_id}")

                results[agent_id] = {"success": True, "status": agent.status.value}
            except Exception as e:
                logger.error(f"Error starting agent {agent_id}: {str(e)}")
                results[agent_id] = {"success": False, "error": str(e), "status": agent.status.value if agent else AgentStatus.ERROR.value}

        return results

    async def stop_all_agents(self) -> Dict[str, Any]:
        """
        Stop all registered agents.

        Returns:
            Dictionary mapping agent IDs to success/failure status
        """
        results = {}

        for agent_id, agent in self.agents.items():
            try:
                # Stop the agent
                await agent.stop()

                # No need to cancel scheduled tasks - they will be skipped by the execution engine
                # when it sees that the agent is not running

                results[agent_id] = {"success": True, "status": agent.status.value}
            except Exception as e:
                logger.error(f"Error stopping agent {agent_id}: {str(e)}")
                results[agent_id] = {"success": False, "error": str(e), "status": agent.status.value if agent else AgentStatus.ERROR.value}

        return results

    async def start_agent(self, agent_id: str) -> Dict[str, Any]:
        """
        Start an agent.

        Args:
            agent_id: ID of the agent to start

        Returns:
            Result of the start operation

        Raises:
            ValueError: If agent_id does not exist
        """
        # Check if agent_id exists
        if agent_id not in self.agents:
            raise ValueError(f"Agent with ID {agent_id} does not exist")

        agent = self.agents[agent_id]

        try:
            # Start the agent
            await agent.start()

            # Update agent status in database
            agent_repo = get_agent_repository()
            await agent_repo.update_agent_status(agent_id, agent.status.value)

            # Add log entry
            await agent_repo.add_agent_log(
                agent_id=agent_id,
                level="info",
                message=f"Agent started with status {agent.status.value}"
            )

            # Schedule the first cycle if the agent is running
            if agent.status == AgentStatus.RUNNING:
                await self._execution_engine.schedule_agent_cycle(agent)
                logger.info(f"Scheduled first cycle for agent {agent_id}")

            return {"success": True, "status": agent.status.value}
        except Exception as e:
            logger.error(f"Error starting agent {agent_id}: {str(e)}")

            # Add error log entry
            try:
                agent_repo = get_agent_repository()
                await agent_repo.add_agent_log(
                    agent_id=agent_id,
                    level="error",
                    message=f"Error starting agent: {str(e)}"
                )
            except Exception as log_error:
                logger.error(f"Error logging agent start failure: {str(log_error)}")

            return {"success": False, "error": str(e), "status": agent.status.value}

    async def stop_agent(self, agent_id: str) -> Dict[str, Any]:
        """
        Stop an agent.

        Args:
            agent_id: ID of the agent to stop

        Returns:
            Result of the stop operation

        Raises:
            ValueError: If agent_id does not exist
        """
        # Check if agent_id exists
        if agent_id not in self.agents:
            raise ValueError(f"Agent with ID {agent_id} does not exist")

        agent = self.agents[agent_id]

        try:
            # Stop the agent
            await agent.stop()

            # Update agent status in database
            agent_repo = get_agent_repository()
            await agent_repo.update_agent_status(agent_id, agent.status.value)

            # Add log entry
            await agent_repo.add_agent_log(
                agent_id=agent_id,
                level="info",
                message=f"Agent stopped with status {agent.status.value}"
            )

            # No need to cancel scheduled tasks - they will be skipped by the execution engine
            # when it sees that the agent is not running

            return {"success": True, "status": agent.status.value}
        except Exception as e:
            logger.error(f"Error stopping agent {agent_id}: {str(e)}")

            # Add error log entry
            try:
                agent_repo = get_agent_repository()
                await agent_repo.add_agent_log(
                    agent_id=agent_id,
                    level="error",
                    message=f"Error stopping agent: {str(e)}"
                )
            except Exception as log_error:
                logger.error(f"Error logging agent stop failure: {str(log_error)}")

            return {"success": False, "error": str(e), "status": agent.status.value}