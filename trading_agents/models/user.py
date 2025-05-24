"""
User model for authentication and authorization.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

class User(BaseModel):
    """User model for authentication and authorization."""
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    disabled: bool = False
    roles: List[str] = []
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class UserCreate(BaseModel):
    """Model for creating a new user."""
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    roles: List[str] = ["user"]

class UserUpdate(BaseModel):
    """Model for updating a user."""
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None
    roles: Optional[List[str]] = None

class UserInDB(User):
    """User model with password hash for database storage."""
    password_hash: str

class Token(BaseModel):
    """Token model for authentication."""
    access_token: str
    token_type: str
    user_id: str
    username: str

class TokenData(BaseModel):
    """Token data model for JWT payload."""
    sub: str
    username: str
    roles: List[str]
    exp: datetime
