"""
Agent status enum.
"""
from enum import Enum, auto

class AgentStatus(Enum):
    """
    Enum representing the possible states of an agent.
    """
    INITIALIZED = "INITIALIZED"  # Agent has been initialized but not started
    STARTING = "STARTING"        # Agent is in the process of starting
    RUNNING = "RUNNING"          # Agent is running normally
    STOPPING = "STOPPING"        # Agent is in the process of stopping
    STOPPED = "STOPPED"          # Agent has been stopped
    ERROR = "ERROR"              # Agent has encountered an error
