"""
Test application for the new components.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Create FastAPI app
app = FastAPI(
    title="Trading Agent Service Test",
    description="Test API for new components",
    version="0.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """
    Root endpoint.
    """
    return {
        "message": "Trading Agent Service Test API",
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
        "service": "trading-agent-service-test"
    }

@app.get("/ml/models")
async def get_ml_models():
    """
    Get available machine learning models.
    """
    return {
        "models": [
            {
                "model_id": "price_direction_model_v1",
                "type": "classification",
                "target": "price_direction",
                "horizon": "1h",
                "created_at": "2023-06-15T12:34:56Z"
            },
            {
                "model_id": "price_change_model_v1",
                "type": "regression",
                "target": "price_change",
                "horizon": "4h",
                "created_at": "2023-06-20T10:11:12Z"
            },
            {
                "model_id": "rl_agent_20230701_123456",
                "type": "reinforcement",
                "created_at": "2023-07-01T12:34:56Z"
            }
        ]
    }

@app.get("/exchanges")
async def get_exchanges():
    """
    Get available exchanges.
    """
    return {
        "exchanges": [
            {
                "id": "binance",
                "name": "Binance",
                "url": "https://www.binance.com",
                "status": "active"
            },
            {
                "id": "kraken",
                "name": "Kraken",
                "url": "https://www.kraken.com",
                "status": "active"
            }
        ]
    }

@app.get("/data-providers")
async def get_data_providers():
    """
    Get available data providers.
    """
    return {
        "data_providers": [
            {
                "id": "onchain",
                "name": "On-Chain Data Provider",
                "sources": ["glassnode", "cryptoquant", "intotheblock"],
                "status": "active"
            }
        ]
    }

@app.get("/mobile/features")
async def get_mobile_features():
    """
    Get mobile app features.
    """
    return {
        "features": [
            {
                "id": "dashboard",
                "name": "Dashboard",
                "description": "Overview of account balance, active agents, and recent trades",
                "status": "active"
            },
            {
                "id": "agents",
                "name": "Agents",
                "description": "List of agents with status and metrics",
                "status": "active"
            },
            {
                "id": "markets",
                "name": "Markets",
                "description": "List of markets with price and volume information",
                "status": "active"
            },
            {
                "id": "orders",
                "name": "Orders",
                "description": "List of open and closed orders",
                "status": "active"
            },
            {
                "id": "positions",
                "name": "Positions",
                "description": "List of open positions with profit/loss information",
                "status": "active"
            },
            {
                "id": "notifications",
                "name": "Notifications",
                "description": "List of notifications from the platform",
                "status": "active"
            }
        ]
    }

if __name__ == "__main__":
    uvicorn.run(
        "test_app:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
