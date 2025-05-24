"""
User management module for authentication and authorization.

This module provides user management functionality for the trading agents system,
including authentication, authorization, and user profile management.
"""
import asyncio
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Set, Tuple, Union
import jwt
import bcrypt
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# User model
class User(BaseModel):
    """User model for authentication and authorization."""
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    disabled: bool = False
    roles: List[str] = []
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()

class UserManager:
    """
    User management for authentication and authorization.

    This class provides methods for user authentication, authorization,
    and profile management.

    Attributes:
        users: Dictionary of users
        tokens: Dictionary of active tokens
        jwt_secret: Secret for JWT token signing
        token_expiry: Token expiry time in seconds
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the user manager.

        Args:
            config: User manager configuration
        """
        config = config or {}

        # JWT configuration
        self.jwt_secret = config.get("jwt_secret", os.environ.get("JWT_SECRET", "dev_jwt_secret"))
        self.token_expiry = config.get("token_expiry", 86400)  # 24 hours

        # User storage
        self.users: Dict[str, Dict[str, Any]] = {}
        self.tokens: Dict[str, Dict[str, Any]] = {}

        # Lock for thread safety
        self._lock = asyncio.Lock()

        # Mock user for development
        self._create_mock_users()

        logger.info("User manager initialized")

    def _create_mock_users(self):
        """Create mock users for development."""
        # Admin user
        self.users["admin"] = {
            "id": "user1",
            "username": "admin",
            "email": "admin@example.com",
            "full_name": "Admin User",
            "password_hash": self._hash_password("admin123"),
            "disabled": False,
            "roles": ["admin", "user"],
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }

        # Regular user
        self.users["user"] = {
            "id": "user2",
            "username": "user",
            "email": "user@example.com",
            "full_name": "Regular User",
            "password_hash": self._hash_password("user123"),
            "disabled": False,
            "roles": ["user"],
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }

        # Test user
        self.users["testuser"] = {
            "id": "user3",
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "password_hash": self._hash_password("testpassword"),
            "disabled": False,
            "roles": ["user"],
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }

        logger.info("Created mock users for development")

    def _hash_password(self, password: str) -> str:
        """
        Hash a password.

        Args:
            password: Plain text password

        Returns:
            Hashed password
        """
        # Convert password to bytes
        password_bytes = password.encode('utf-8')

        # Generate salt and hash
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password_bytes, salt)

        # Return hash as string
        return password_hash.decode('utf-8')

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify a password.

        Args:
            plain_password: Plain text password
            hashed_password: Hashed password

        Returns:
            True if password matches, False otherwise
        """
        # Convert passwords to bytes
        plain_password_bytes = plain_password.encode('utf-8')
        hashed_password_bytes = hashed_password.encode('utf-8')

        # Verify password
        return bcrypt.checkpw(plain_password_bytes, hashed_password_bytes)

    async def authenticate(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate a user.

        Args:
            username: Username
            password: Password

        Returns:
            User data if authentication succeeds, None otherwise
        """
        # Check if user exists
        if username not in self.users:
            logger.warning(f"Authentication failed: User {username} not found")
            return None

        # Get user
        user = self.users[username]

        # Check if user is disabled
        if user.get("disabled", False):
            logger.warning(f"Authentication failed: User {username} is disabled")
            return None

        # Verify password
        if not self._verify_password(password, user["password_hash"]):
            logger.warning(f"Authentication failed: Invalid password for user {username}")
            return None

        # Create token
        token_data = {
            "sub": user["id"],
            "username": user["username"],
            "roles": user["roles"],
            "exp": datetime.utcnow() + timedelta(seconds=self.token_expiry)
        }

        # Sign token
        token = jwt.encode(token_data, self.jwt_secret, algorithm="HS256")

        # Store token
        async with self._lock:
            self.tokens[token] = {
                "user_id": user["id"],
                "expires_at": token_data["exp"]
            }

        # Return user data with token
        return {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "full_name": user.get("full_name"),
            "roles": user["roles"],
            "token": token
        }

    async def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validate a token.

        Args:
            token: JWT token

        Returns:
            User data if token is valid, None otherwise
        """
        try:
            # Decode token
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])

            # Get user ID
            user_id = payload["sub"]
            username = payload["username"]

            # Check if user exists
            user = None
            for u in self.users.values():
                if u["id"] == user_id:
                    user = u
                    break

            if not user:
                logger.warning(f"Token validation failed: User {user_id} not found")
                return None

            # Check if user is disabled
            if user.get("disabled", False):
                logger.warning(f"Token validation failed: User {username} is disabled")
                return None

            # Return user data
            return {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "full_name": user.get("full_name"),
                "roles": user["roles"]
            }

        except jwt.ExpiredSignatureError:
            logger.warning("Token validation failed: Token expired")
            return None

        except jwt.InvalidTokenError:
            logger.warning("Token validation failed: Invalid token")
            return None

    async def invalidate_token(self, token: str) -> bool:
        """
        Invalidate a token.

        Args:
            token: JWT token

        Returns:
            True if token was invalidated, False otherwise
        """
        async with self._lock:
            if token in self.tokens:
                del self.tokens[token]
                return True
            return False

    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a user by ID.

        Args:
            user_id: User ID

        Returns:
            User data if found, None otherwise
        """
        for user in self.users.values():
            if user["id"] == user_id:
                return {
                    "id": user["id"],
                    "username": user["username"],
                    "email": user["email"],
                    "full_name": user.get("full_name"),
                    "roles": user["roles"],
                    "created_at": user["created_at"],
                    "updated_at": user["updated_at"]
                }
        return None

    async def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """
        Get a user by username.

        Args:
            username: Username

        Returns:
            User data if found, None otherwise
        """
        if username in self.users:
            user = self.users[username]
            return {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "full_name": user.get("full_name"),
                "roles": user["roles"],
                "created_at": user["created_at"],
                "updated_at": user["updated_at"]
            }
        return None

    async def has_role(self, user_id: str, role: str) -> bool:
        """
        Check if a user has a role.

        Args:
            user_id: User ID
            role: Role to check

        Returns:
            True if user has the role, False otherwise
        """
        user = await self.get_user(user_id)
        if not user:
            return False
        return role in user["roles"]
