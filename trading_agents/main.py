"""
Main entry point for the trading agent service.
"""
import asyncio
import logging
import os
import signal
import sys
from typing import Dict, Any

from api.app import start_app
from core.agent_registry import AgentRegistry

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("trading_agents.log")
    ]
)
logger = logging.getLogger(__name__)

# Global registry
registry = None  # Will be initialized in main()

async def shutdown(signal, loop):
    """
    Shutdown the application gracefully.
    """
    logger.info(f"Received exit signal {signal.name}...")

    # Stop the registry (which will stop all agents and the execution engine)
    if registry:
        logger.info("Stopping agent registry...")
        await registry.stop()

    tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]

    logger.info(f"Cancelling {len(tasks)} outstanding tasks...")
    for task in tasks:
        task.cancel()

    await asyncio.gather(*tasks, return_exceptions=True)
    loop.stop()
    logger.info("Shutdown complete.")

def main():
    """
    Main entry point.
    """
    global registry

    # Create event loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    # Set up signal handlers
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, lambda s=sig: asyncio.create_task(shutdown(s, loop)))

    # Create agent registry (will be initialized in app startup)
    registry = AgentRegistry.get_instance()

    # Start the API server
    start_app()

if __name__ == "__main__":
    main()
