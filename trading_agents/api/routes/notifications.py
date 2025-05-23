"""
Notification API routes for the trading agents system.

This module provides API endpoints for managing notifications and notification preferences.
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, BackgroundTasks, Request, Body
from pydantic import BaseModel, Field
from enum import Enum
import logging
import json
import os
from datetime import datetime

from services.notification_service import NotificationService

# Create router
router = APIRouter(prefix="/notifications", tags=["notifications"])

# Logger
logger = logging.getLogger(__name__)

# Notification service instance
_notification_service: Optional[NotificationService] = None

def get_notification_service() -> NotificationService:
    """
    Get the notification service instance.
    
    Returns:
        Notification service instance
    """
    global _notification_service
    
    if _notification_service is None:
        # Load configuration
        config_path = os.environ.get("NOTIFICATION_CONFIG", "config/notification.json")
        
        try:
            if os.path.exists(config_path):
                with open(config_path, "r") as f:
                    config = json.load(f)
            else:
                logger.warning(f"Notification config file not found: {config_path}")
                config = {}
                
            _notification_service = NotificationService(config)
            
        except Exception as e:
            logger.error(f"Error initializing notification service: {str(e)}")
            # Use empty config as fallback
            _notification_service = NotificationService({})
            
    return _notification_service

# Models
class NotificationLevel(str, Enum):
    """Notification level."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class NotificationRequest(BaseModel):
    """Notification request model."""
    message: str = Field(..., description="Notification message")
    subject: Optional[str] = Field(None, description="Notification subject")
    level: NotificationLevel = Field(NotificationLevel.INFO, description="Notification level")
    channels: Optional[List[str]] = Field(None, description="Channels to use (None for all enabled)")

class NotificationResponse(BaseModel):
    """Notification response model."""
    success: bool = Field(..., description="Overall success status")
    results: Dict[str, bool] = Field(..., description="Results by channel")
    timestamp: str = Field(..., description="Timestamp")

class NotificationHistoryResponse(BaseModel):
    """Notification history response model."""
    notifications: List[Dict[str, Any]] = Field(..., description="Notification history")
    count: int = Field(..., description="Number of notifications")
    timestamp: str = Field(..., description="Timestamp")

class ChannelStatusResponse(BaseModel):
    """Channel status response model."""
    channels: Dict[str, Dict[str, Any]] = Field(..., description="Channel status")
    count: int = Field(..., description="Number of channels")
    timestamp: str = Field(..., description="Timestamp")

# Routes
@router.post("", response_model=NotificationResponse)
async def send_notification(
    request: NotificationRequest,
    background_tasks: BackgroundTasks,
    service: NotificationService = Depends(get_notification_service)
):
    """
    Send a notification.
    
    Args:
        request: Notification request
        background_tasks: Background tasks
        service: Notification service
        
    Returns:
        Notification response
    """
    # Send notification
    results = await service.send(
        message=request.message,
        subject=request.subject,
        channels=request.channels,
        level=request.level
    )
    
    return {
        "success": any(results.values()),
        "results": results,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/history", response_model=NotificationHistoryResponse)
async def get_notification_history(
    limit: Optional[int] = Query(100, description="Maximum number of notifications to return"),
    service: NotificationService = Depends(get_notification_service)
):
    """
    Get notification history.
    
    Args:
        limit: Maximum number of notifications to return
        service: Notification service
        
    Returns:
        Notification history
    """
    notifications = service.get_history(limit)
    
    return {
        "notifications": notifications,
        "count": len(notifications),
        "timestamp": datetime.now().isoformat()
    }

@router.delete("/history", response_model=Dict[str, Any])
async def clear_notification_history(
    service: NotificationService = Depends(get_notification_service)
):
    """
    Clear notification history.
    
    Args:
        service: Notification service
        
    Returns:
        Success message
    """
    service.clear_history()
    
    return {
        "message": "Notification history cleared",
        "timestamp": datetime.now().isoformat()
    }

@router.get("/channels", response_model=ChannelStatusResponse)
async def get_channel_status(
    service: NotificationService = Depends(get_notification_service)
):
    """
    Get status of all notification channels.
    
    Args:
        service: Notification service
        
    Returns:
        Channel status
    """
    channels = service.get_channel_status()
    
    return {
        "channels": channels,
        "count": len(channels),
        "timestamp": datetime.now().isoformat()
    }

@router.post("/test", response_model=NotificationResponse)
async def test_notification(
    channels: Optional[List[str]] = Query(None, description="Channels to test (None for all enabled)"),
    service: NotificationService = Depends(get_notification_service)
):
    """
    Send a test notification.
    
    Args:
        channels: Channels to test
        service: Notification service
        
    Returns:
        Notification response
    """
    # Send test notification
    results = await service.send(
        message="This is a test notification from the Trading Agents system.",
        subject="Test Notification",
        channels=channels,
        level=NotificationLevel.INFO
    )
    
    return {
        "success": any(results.values()),
        "results": results,
        "timestamp": datetime.now().isoformat()
    }
