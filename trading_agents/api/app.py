"""
FastAPI application for the trading agent service.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from typing import Dict, Any
import asyncio

from api.routes import agent_routes, agent_types_routes, monitoring, notifications
from core.agent_registry import AgentRegistry
from core.cache_manager import CacheManager, CacheLevel, InvalidationStrategy
from database import initialize_database, close_database

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Trading Agent Service",
    description="API for managing trading agents",
    version="0.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agent_routes.router)
app.include_router(agent_types_routes.router)
app.include_router(monitoring.router)
app.include_router(notifications.router)
# Include other routers as needed

# Mount dashboard static files
monitoring.mount_dashboard(app)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """
    Initialize services on startup.
    """
    logger.info("Initializing services...")

    try:
        # Initialize database
        await initialize_database()
        logger.info("Database initialized")

        # Initialize and start agent registry
        registry = AgentRegistry.get_instance()
        await registry.start()
        logger.info("Agent registry started")

        # Configure execution engine
        execution_engine = registry.get_execution_engine()
        execution_engine.max_concurrent_tasks = 20
        execution_engine.task_timeout_multiplier = 1.5

        # Configure resource pool
        resource_pool = execution_engine.resource_pool
        resource_pool.http_pool_size = 30
        resource_pool.cache_ttl = 300  # 5 minutes default

        # Configure advanced cache
        cache_config = {
            "memory_max_size": 10000,
            "disk_max_size": 100 * 1024 * 1024,  # 100 MB
            "disk_cache_enabled": True,
            "disk_cache_dir": "cache",
            "invalidation_strategy": "lru"
        }
        resource_pool.cache_manager = CacheManager(cache_config)

        # Start cache preloader
        await resource_pool.start_cache_preloader()

        # Register common preload tasks
        resource_pool.register_preload_task(
            name="market_data_btc",
            loader_func=resource_pool.cache_preloader.preload_market_data,
            interval=60,  # Every minute
            args=["BTC", "1m", "binance", "https://api.binance.com/api/v3/klines"],
            kwargs={"params": {"symbol": "BTCUSDT", "interval": "1m", "limit": 100}},
            cache_key="market_data:BTC:1m",
            cache_ttl=120,  # 2 minutes
            tags=["market_data", "BTC"],
            enabled=True
        )

        resource_pool.register_preload_task(
            name="market_data_eth",
            loader_func=resource_pool.cache_preloader.preload_market_data,
            interval=60,  # Every minute
            args=["ETH", "1m", "binance", "https://api.binance.com/api/v3/klines"],
            kwargs={"params": {"symbol": "ETHUSDT", "interval": "1m", "limit": 100}},
            cache_key="market_data:ETH:1m",
            cache_ttl=120,  # 2 minutes
            tags=["market_data", "ETH"],
            enabled=True
        )

        # Configure adaptive scheduler
        scheduler = execution_engine.scheduler
        scheduler.market_weight = 0.5
        scheduler.performance_weight = 0.3
        scheduler.system_weight = 0.2

        # Initialize performance monitoring
        monitoring_config = {
            "metrics_interval": 60,  # Collect metrics every 60 seconds
            "metrics_history_size": 100,  # Keep 100 data points
            "alert_levels": {
                "cpu_usage": 80,  # Alert if CPU usage > 80%
                "memory_usage": 80,  # Alert if memory usage > 80%
                "disk_usage": 80,  # Alert if disk usage > 80%
                "cache_hit_rate": 50,  # Alert if cache hit rate < 50%
                "http_error_rate": 10  # Alert if HTTP error rate > 10%
            }
        }
        monitoring.initialize_monitoring(
            resource_pool=resource_pool,
            execution_engine=execution_engine,
            config=monitoring_config
        )
        await monitoring.start_monitoring()
        logger.info("Performance monitoring started")

        logger.info("Services initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing services: {str(e)}")
        # Don't re-raise the exception to allow the application to start
        # even if initialization fails

@app.on_event("shutdown")
async def shutdown_event():
    """
    Clean up resources on shutdown.
    """
    logger.info("Shutting down services...")

    try:
        # Get registry and resource pool
        registry = AgentRegistry.get_instance()
        execution_engine = registry.get_execution_engine()
        resource_pool = execution_engine.resource_pool

        # Stop cache preloader
        try:
            await resource_pool.stop_cache_preloader()
            logger.info("Cache preloader stopped")
        except Exception as e:
            logger.error(f"Error stopping cache preloader: {str(e)}")

        # Stop performance monitoring
        try:
            await monitoring.stop_monitoring()
            logger.info("Performance monitoring stopped")
        except Exception as e:
            logger.error(f"Error stopping performance monitoring: {str(e)}")

        # Stop agent registry
        await registry.stop()
        logger.info("Agent registry stopped")

        # Close database connections
        await close_database()
        logger.info("Database connections closed")

        logger.info("Services shut down successfully")
    except Exception as e:
        logger.error(f"Error shutting down services: {str(e)}")
        # Don't re-raise the exception to allow the application to shut down
        # even if cleanup fails

@app.get("/")
async def root():
    """
    Root endpoint.
    """
    return {
        "message": "Trading Agent Service API",
        "version": "0.1.0",
        "docs_url": "/docs"
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "ok",
        "service": "trading-agent-service"
    }

def start_app():
    """
    Start the FastAPI application.
    """
    import uvicorn

    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 8000))

    # Start server
    uvicorn.run(
        "api.app:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )

if __name__ == "__main__":
    start_app()
