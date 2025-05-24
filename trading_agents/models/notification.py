"""
Notification model for system notifications.
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class Notification(BaseModel):
    """Notification model for system notifications."""
    id: str
    type: str  # agent_status, order_update, price_alert, etc.
    title: str
    message: str
    read: bool = False
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.now)
    user_id: Optional[str] = None

class NotificationCreate(BaseModel):
    """Model for creating a new notification."""
    type: str
    title: str
    message: str
    metadata: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None

class NotificationUpdate(BaseModel):
    """Model for updating a notification."""
    read: Optional[bool] = None
