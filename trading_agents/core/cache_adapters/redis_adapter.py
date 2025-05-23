"""
Redis cache adapter for distributed caching.

This module provides a Redis-based cache adapter for distributed caching
across multiple nodes in the trading agents system.
"""
import asyncio
import json
import logging
import time
from typing import Any, Dict, List, Optional, Set, Tuple, Union
import aioredis
from datetime import datetime

logger = logging.getLogger(__name__)

class RedisAdapter:
    """
    Redis cache adapter for distributed caching.

    This class provides methods to interact with a Redis server for distributed
    caching across multiple nodes in the trading agents system.

    Attributes:
        redis: Redis client
        prefix: Key prefix for namespacing
        serializer: Function to serialize values
        deserializer: Function to deserialize values
    """

    def __init__(
        self,
        host: str = "localhost",
        port: int = 6379,
        db: int = 0,
        password: Optional[str] = None,
        prefix: str = "trading_agents:",
        connection_pool: Optional[aioredis.ConnectionPool] = None,
        **kwargs
    ):
        """
        Initialize the Redis adapter.

        Args:
            host: Redis server host
            port: Redis server port
            db: Redis database number
            password: Redis password
            prefix: Key prefix for namespacing
            connection_pool: Existing connection pool (optional)
            **kwargs: Additional Redis connection parameters
        """
        self.prefix = prefix

        # Connection parameters
        self.connection_params = {
            "host": host,
            "port": port,
            "db": db,
            "password": password,
            **kwargs
        }

        # Connection pool
        self.connection_pool = connection_pool

        # Redis client
        self.redis = None

        # Serialization functions
        self.serializer = self._serialize
        self.deserializer = self._deserialize

        logger.info(f"Redis adapter initialized with host={host}, port={port}, db={db}")

    async def connect(self):
        """Connect to Redis server."""
        if self.redis is not None:
            return

        try:
            if self.connection_pool:
                self.redis = aioredis.Redis.from_pool(self.connection_pool)
            else:
                self.redis = aioredis.Redis(**self.connection_params)

            # Test connection
            await self.redis.ping()
            logger.info("Connected to Redis server")

        except Exception as e:
            logger.error(f"Failed to connect to Redis: {str(e)}")
            raise

    async def disconnect(self):
        """Disconnect from Redis server."""
        if self.redis is None:
            return

        try:
            await self.redis.close()
            self.redis = None
            logger.info("Disconnected from Redis server")

        except Exception as e:
            logger.error(f"Error disconnecting from Redis: {str(e)}")

    async def get(self, key: str) -> Any:
        """
        Get a value from the cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found
        """
        if self.redis is None:
            await self.connect()

        prefixed_key = f"{self.prefix}{key}"

        try:
            value = await self.redis.get(prefixed_key)

            if value is None:
                return None

            return self.deserializer(value)

        except Exception as e:
            logger.error(f"Error getting key {key} from Redis: {str(e)}")
            return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        tags: Optional[List[str]] = None
    ) -> bool:
        """
        Set a value in the cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            tags: List of tags for the key

        Returns:
            True if successful, False otherwise
        """
        if self.redis is None:
            await self.connect()

        prefixed_key = f"{self.prefix}{key}"

        try:
            # Serialize value
            serialized_value = self.serializer(value)

            # Set value with TTL
            if ttl is not None:
                await self.redis.setex(prefixed_key, ttl, serialized_value)
            else:
                await self.redis.set(prefixed_key, serialized_value)

            # Store tags if provided
            if tags and len(tags) > 0:
                # Store key in tag sets
                for tag in tags:
                    tag_key = f"{self.prefix}tag:{tag}"
                    await self.redis.sadd(tag_key, key)

                # Store tags for key
                tags_key = f"{self.prefix}key_tags:{key}"
                await self.redis.delete(tags_key)
                await self.redis.sadd(tags_key, *tags)

                # Set TTL for tag keys if TTL is provided
                if ttl is not None:
                    for tag in tags:
                        tag_key = f"{self.prefix}tag:{tag}"
                        await self.redis.expire(tag_key, ttl)
                    await self.redis.expire(tags_key, ttl)

            return True

        except Exception as e:
            logger.error(f"Error setting key {key} in Redis: {str(e)}")
            return False

    async def delete(self, key: str) -> bool:
        """
        Delete a value from the cache.

        Args:
            key: Cache key

        Returns:
            True if successful, False otherwise
        """
        if self.redis is None:
            await self.connect()

        prefixed_key = f"{self.prefix}{key}"

        try:
            # Get tags for key
            tags_key = f"{self.prefix}key_tags:{key}"
            tags = await self.redis.smembers(tags_key)

            # Remove key from tag sets
            for tag in tags:
                tag_key = f"{self.prefix}tag:{tag.decode('utf-8')}"
                await self.redis.srem(tag_key, key)

            # Delete tags for key
            await self.redis.delete(tags_key)

            # Delete key
            await self.redis.delete(prefixed_key)

            return True

        except Exception as e:
            logger.error(f"Error deleting key {key} from Redis: {str(e)}")
            return False

    async def invalidate_by_pattern(self, pattern: str) -> int:
        """
        Invalidate keys matching a pattern.

        Args:
            pattern: Key pattern to match

        Returns:
            Number of keys invalidated
        """
        if self.redis is None:
            await self.connect()

        prefixed_pattern = f"{self.prefix}{pattern}"

        try:
            # Find keys matching pattern
            keys = []
            cursor = 0
            while True:
                cursor, partial_keys = await self.redis.scan(cursor, match=prefixed_pattern, count=100)
                keys.extend(partial_keys)
                if cursor == 0:
                    break

            # Delete keys
            count = 0
            for prefixed_key in keys:
                key = prefixed_key.decode('utf-8').replace(self.prefix, '', 1)
                if await self.delete(key):
                    count += 1

            return count

        except Exception as e:
            logger.error(f"Error invalidating keys by pattern {pattern} in Redis: {str(e)}")
            return 0

    async def invalidate_by_tag(self, tag: str) -> int:
        """
        Invalidate keys with a specific tag.

        Args:
            tag: Tag to match

        Returns:
            Number of keys invalidated
        """
        if self.redis is None:
            await self.connect()

        tag_key = f"{self.prefix}tag:{tag}"

        try:
            # Get keys with tag
            keys = await self.redis.smembers(tag_key)

            # Delete keys
            count = 0
            for key_bytes in keys:
                key = key_bytes.decode('utf-8')
                if await self.delete(key):
                    count += 1

            # Delete tag set
            await self.redis.delete(tag_key)

            return count

        except Exception as e:
            logger.error(f"Error invalidating keys by tag {tag} in Redis: {str(e)}")
            return 0

    async def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Dictionary of cache statistics
        """
        if self.redis is None:
            await self.connect()

        try:
            # Get Redis info
            info = await self.redis.info()

            # Extract relevant statistics
            stats = {
                "used_memory": info.get("used_memory", 0),
                "used_memory_peak": info.get("used_memory_peak", 0),
                "used_memory_human": info.get("used_memory_human", "0B"),
                "used_memory_peak_human": info.get("used_memory_peak_human", "0B"),
                "connected_clients": info.get("connected_clients", 0),
                "total_commands_processed": info.get("total_commands_processed", 0),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
                "evicted_keys": info.get("evicted_keys", 0),
                "expired_keys": info.get("expired_keys", 0)
            }

            # Calculate hit rate
            hits = info.get("keyspace_hits", 0)
            misses = info.get("keyspace_misses", 0)
            total = hits + misses

            if total > 0:
                stats["hit_rate"] = hits / total
            else:
                stats["hit_rate"] = 0

            # Get key count
            db_stats = info.get(f"db{self.connection_params['db']}", "")
            if db_stats:
                # Parse db stats string (format: "keys=123,expires=45,avg_ttl=67890")
                parts = db_stats.split(",")
                for part in parts:
                    if part.startswith("keys="):
                        stats["key_count"] = int(part.split("=")[1])
                        break

            return stats

        except Exception as e:
            logger.error(f"Error getting Redis stats: {str(e)}")
            return {}

    async def clear(self) -> bool:
        """
        Clear all keys with the prefix.

        Returns:
            True if successful, False otherwise
        """
        if self.redis is None:
            await self.connect()

        try:
            # Find keys with prefix
            keys = []
            cursor = 0
            while True:
                cursor, partial_keys = await self.redis.scan(cursor, match=f"{self.prefix}*", count=100)
                keys.extend(partial_keys)
                if cursor == 0:
                    break

            # Delete keys
            if keys:
                await self.redis.delete(*keys)

            return True

        except Exception as e:
            logger.error(f"Error clearing Redis cache: {str(e)}")
            return False

    async def get_keys(self, pattern: str = "*") -> List[str]:
        """
        Get keys matching a pattern.

        Args:
            pattern: Key pattern to match

        Returns:
            List of matching keys
        """
        if self.redis is None:
            await self.connect()

        prefixed_pattern = f"{self.prefix}{pattern}"

        try:
            # Find keys matching pattern
            keys = []
            cursor = 0
            while True:
                cursor, partial_keys = await self.redis.scan(cursor, match=prefixed_pattern, count=100)
                keys.extend(partial_keys)
                if cursor == 0:
                    break

            # Remove prefix from keys
            return [key.decode('utf-8').replace(self.prefix, '', 1) for key in keys]

        except Exception as e:
            logger.error(f"Error getting keys by pattern {pattern} from Redis: {str(e)}")
            return []

    async def get_tags(self) -> List[str]:
        """
        Get all tags.

        Returns:
            List of tags
        """
        if self.redis is None:
            await self.connect()

        try:
            # Find tag keys
            tag_keys = []
            cursor = 0
            while True:
                cursor, partial_keys = await self.redis.scan(cursor, match=f"{self.prefix}tag:*", count=100)
                tag_keys.extend(partial_keys)
                if cursor == 0:
                    break

            # Extract tag names
            return [key.decode('utf-8').replace(f"{self.prefix}tag:", '', 1) for key in tag_keys]

        except Exception as e:
            logger.error(f"Error getting tags from Redis: {str(e)}")
            return []

    async def get_keys_by_tag(self, tag: str) -> List[str]:
        """
        Get keys with a specific tag.

        Args:
            tag: Tag to match

        Returns:
            List of keys with the tag
        """
        if self.redis is None:
            await self.connect()

        tag_key = f"{self.prefix}tag:{tag}"

        try:
            # Get keys with tag
            keys = await self.redis.smembers(tag_key)

            # Decode keys
            return [key.decode('utf-8') for key in keys]

        except Exception as e:
            logger.error(f"Error getting keys by tag {tag} from Redis: {str(e)}")
            return []

    async def get_tags_for_key(self, key: str) -> List[str]:
        """
        Get tags for a specific key.

        Args:
            key: Cache key

        Returns:
            List of tags for the key
        """
        if self.redis is None:
            await self.connect()

        tags_key = f"{self.prefix}key_tags:{key}"

        try:
            # Get tags for key
            tags = await self.redis.smembers(tags_key)

            # Decode tags
            return [tag.decode('utf-8') for tag in tags]

        except Exception as e:
            logger.error(f"Error getting tags for key {key} from Redis: {str(e)}")
            return []

    async def add_tags(self, key: str, tags: List[str]) -> bool:
        """
        Add tags to a key.

        Args:
            key: Cache key
            tags: Tags to add

        Returns:
            True if successful, False otherwise
        """
        if self.redis is None:
            await self.connect()

        if not tags:
            return True

        try:
            # Get TTL for key
            prefixed_key = f"{self.prefix}{key}"
            ttl = await self.redis.ttl(prefixed_key)

            # If key doesn't exist, return False
            if ttl == -2:  # -2 means key doesn't exist
                return False

            # Add key to tag sets
            for tag in tags:
                tag_key = f"{self.prefix}tag:{tag}"
                await self.redis.sadd(tag_key, key)

                # Set TTL for tag key if key has TTL
                if ttl > 0:
                    await self.redis.expire(tag_key, ttl)

            # Add tags to key's tag set
            tags_key = f"{self.prefix}key_tags:{key}"
            await self.redis.sadd(tags_key, *tags)

            # Set TTL for tags key if key has TTL
            if ttl > 0:
                await self.redis.expire(tags_key, ttl)

            return True

        except Exception as e:
            logger.error(f"Error adding tags to key {key} in Redis: {str(e)}")
            return False

    async def remove_tags(self, key: str, tags: List[str]) -> bool:
        """
        Remove tags from a key.

        Args:
            key: Cache key
            tags: Tags to remove

        Returns:
            True if successful, False otherwise
        """
        if self.redis is None:
            await self.connect()

        if not tags:
            return True

        try:
            # Remove key from tag sets
            for tag in tags:
                tag_key = f"{self.prefix}tag:{tag}"
                await self.redis.srem(tag_key, key)

            # Remove tags from key's tag set
            tags_key = f"{self.prefix}key_tags:{key}"
            await self.redis.srem(tags_key, *tags)

            return True

        except Exception as e:
            logger.error(f"Error removing tags from key {key} in Redis: {str(e)}")
            return False

    def _serialize(self, value: Any) -> bytes:
        """
        Serialize a value for storage in Redis.

        Args:
            value: Value to serialize

        Returns:
            Serialized value as bytes
        """
        try:
            return json.dumps(value).encode('utf-8')
        except Exception as e:
            logger.error(f"Error serializing value: {str(e)}")
            return json.dumps(str(value)).encode('utf-8')

    def _deserialize(self, value: bytes) -> Any:
        """
        Deserialize a value from Redis.

        Args:
            value: Serialized value as bytes

        Returns:
            Deserialized value
        """
        try:
            return json.loads(value.decode('utf-8'))
        except Exception as e:
            logger.error(f"Error deserializing value: {str(e)}")
            return value.decode('utf-8')