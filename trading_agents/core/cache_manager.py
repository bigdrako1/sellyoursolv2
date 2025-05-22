"""
Advanced cache manager for optimized data caching.

This module provides a sophisticated caching system with features like:
- Tiered caching (memory, disk)
- Cache invalidation strategies
- Pattern-based cache key management
- Cache statistics and monitoring
"""
import asyncio
import json
import logging
import os
import pickle
import re
import time
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Pattern, Set, Tuple, Union

logger = logging.getLogger(__name__)

class CacheLevel(Enum):
    """Cache storage levels."""
    MEMORY = "memory"
    DISK = "disk"
    ALL = "all"

class InvalidationStrategy(Enum):
    """Cache invalidation strategies."""
    TTL = "ttl"  # Time-based expiration
    LRU = "lru"  # Least recently used
    LFU = "lfu"  # Least frequently used
    FIFO = "fifo"  # First in, first out

class CacheEntry:
    """
    Represents a cached item with metadata.

    Attributes:
        key: Cache key
        value: Cached value
        expiration: Expiration timestamp
        created_at: Creation timestamp
        last_accessed: Last access timestamp
        access_count: Number of times the entry has been accessed
        level: Cache storage level
        tags: Tags for grouping and invalidation
    """

    def __init__(
        self,
        key: str,
        value: Any,
        ttl: int,
        level: CacheLevel = CacheLevel.MEMORY,
        tags: Optional[List[str]] = None
    ):
        """
        Initialize a cache entry.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            level: Cache storage level
            tags: Tags for grouping and invalidation
        """
        self.key = key
        self.value = value
        self.created_at = datetime.now()
        self.expiration = self.created_at + timedelta(seconds=ttl)
        self.last_accessed = self.created_at
        self.access_count = 0
        self.level = level
        self.tags = set(tags or [])

    def is_expired(self) -> bool:
        """Check if the entry is expired."""
        return datetime.now() > self.expiration

    def access(self) -> None:
        """Record an access to this entry."""
        self.last_accessed = datetime.now()
        self.access_count += 1

    def extend_ttl(self, seconds: int) -> None:
        """Extend the TTL by the specified number of seconds."""
        self.expiration = datetime.now() + timedelta(seconds=seconds)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "key": self.key,
            "value": self.value,
            "created_at": self.created_at.isoformat(),
            "expiration": self.expiration.isoformat(),
            "last_accessed": self.last_accessed.isoformat(),
            "access_count": self.access_count,
            "level": self.level.value,
            "tags": list(self.tags)
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CacheEntry':
        """Create from dictionary after deserialization."""
        entry = cls(
            key=data["key"],
            value=data["value"],
            ttl=0,  # Will be overridden
            level=CacheLevel(data["level"]),
            tags=data.get("tags", [])
        )

        entry.created_at = datetime.fromisoformat(data["created_at"])
        entry.expiration = datetime.fromisoformat(data["expiration"])
        entry.last_accessed = datetime.fromisoformat(data["last_accessed"])
        entry.access_count = data["access_count"]

        return entry

class CacheManager:
    """
    Advanced cache manager with tiered storage and invalidation strategies.

    Attributes:
        memory_cache: In-memory cache storage
        disk_cache_dir: Directory for disk cache
        memory_max_size: Maximum number of items in memory cache
        disk_max_size: Maximum size of disk cache in bytes
        default_ttl: Default time to live in seconds
        invalidation_strategy: Strategy for cache eviction
        pattern_subscriptions: Patterns for cache invalidation
    """

    def __init__(
        self,
        config: Dict[str, Any] = None
    ):
        """
        Initialize the cache manager.

        Args:
            config: Cache configuration
        """
        config = config or {}

        # Cache configuration
        self.memory_max_size = config.get("memory_max_size", 10000)
        self.disk_max_size = config.get("disk_max_size", 100 * 1024 * 1024)  # 100 MB
        self.default_ttl = config.get("default_ttl", 300)  # 5 minutes
        self.disk_cache_enabled = config.get("disk_cache_enabled", True)
        self.disk_cache_dir = Path(config.get("disk_cache_dir", "cache"))
        self.invalidation_strategy = InvalidationStrategy(
            config.get("invalidation_strategy", InvalidationStrategy.LRU.value)
        )

        # Create cache storage
        self.memory_cache: Dict[str, CacheEntry] = {}

        # Create disk cache directory if enabled
        if self.disk_cache_enabled:
            os.makedirs(self.disk_cache_dir, exist_ok=True)

        # Pattern subscriptions for invalidation
        self.pattern_subscriptions: Dict[str, Pattern] = {}

        # Locks for thread safety
        self._memory_lock = asyncio.Lock()
        self._disk_lock = asyncio.Lock()
        self._pattern_lock = asyncio.Lock()

        # Statistics
        self._memory_hit_count = 0
        self._memory_miss_count = 0
        self._disk_hit_count = 0
        self._disk_miss_count = 0
        self._eviction_count = 0

        logger.info("Cache manager initialized")

    async def get(
        self,
        key: str,
        default: Any = None,
        level: CacheLevel = CacheLevel.ALL
    ) -> Any:
        """
        Get a value from the cache.

        Args:
            key: Cache key
            default: Default value if not found
            level: Cache level to check

        Returns:
            Cached value or default if not found
        """
        # Check memory cache first
        if level in (CacheLevel.MEMORY, CacheLevel.ALL):
            async with self._memory_lock:
                entry = self.memory_cache.get(key)

                if entry:
                    if entry.is_expired():
                        # Remove expired entry
                        del self.memory_cache[key]
                        self._memory_miss_count += 1
                    else:
                        # Record access
                        entry.access()
                        self._memory_hit_count += 1
                        return entry.value
                else:
                    self._memory_miss_count += 1

        # Check disk cache if enabled and not found in memory
        if self.disk_cache_enabled and level in (CacheLevel.DISK, CacheLevel.ALL):
            async with self._disk_lock:
                try:
                    disk_path = self._get_disk_path(key)

                    if disk_path.exists():
                        with open(disk_path, "rb") as f:
                            entry = pickle.load(f)

                        if entry.is_expired():
                            # Remove expired entry
                            os.remove(disk_path)
                            self._disk_miss_count += 1
                        else:
                            # Record access
                            entry.access()

                            # Save updated metadata
                            with open(disk_path, "wb") as f:
                                pickle.dump(entry, f)

                            # Promote to memory cache if ALL level
                            if level == CacheLevel.ALL:
                                async with self._memory_lock:
                                    # Check memory cache size
                                    await self._ensure_memory_capacity()
                                    self.memory_cache[key] = entry

                            self._disk_hit_count += 1
                            return entry.value
                    else:
                        self._disk_miss_count += 1
                except Exception as e:
                    logger.error(f"Error reading from disk cache: {str(e)}")
                    self._disk_miss_count += 1

        return default

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        level: CacheLevel = CacheLevel.ALL,
        tags: Optional[List[str]] = None
    ) -> None:
        """
        Set a value in the cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (None for default)
            level: Cache level to store at
            tags: Tags for grouping and invalidation
        """
        ttl = ttl or self.default_ttl
        entry = CacheEntry(key, value, ttl, level, tags)

        # Store in memory cache
        if level in (CacheLevel.MEMORY, CacheLevel.ALL):
            async with self._memory_lock:
                # Check memory cache size
                await self._ensure_memory_capacity()
                self.memory_cache[key] = entry

        # Store in disk cache if enabled
        if self.disk_cache_enabled and level in (CacheLevel.DISK, CacheLevel.ALL):
            async with self._disk_lock:
                try:
                    # Check disk cache size
                    await self._ensure_disk_capacity()

                    # Save to disk
                    disk_path = self._get_disk_path(key)
                    with open(disk_path, "wb") as f:
                        pickle.dump(entry, f)
                except Exception as e:
                    logger.error(f"Error writing to disk cache: {str(e)}")

    async def delete(self, key: str, level: CacheLevel = CacheLevel.ALL) -> bool:
        """
        Delete a value from the cache.

        Args:
            key: Cache key
            level: Cache level to delete from

        Returns:
            True if the key was found and deleted, False otherwise
        """
        deleted = False

        # Delete from memory cache
        if level in (CacheLevel.MEMORY, CacheLevel.ALL):
            async with self._memory_lock:
                if key in self.memory_cache:
                    del self.memory_cache[key]
                    deleted = True

        # Delete from disk cache if enabled
        if self.disk_cache_enabled and level in (CacheLevel.DISK, CacheLevel.ALL):
            async with self._disk_lock:
                try:
                    disk_path = self._get_disk_path(key)

                    if disk_path.exists():
                        os.remove(disk_path)
                        deleted = True
                except Exception as e:
                    logger.error(f"Error deleting from disk cache: {str(e)}")

        return deleted

    async def clear(self, level: CacheLevel = CacheLevel.ALL) -> None:
        """
        Clear the entire cache.

        Args:
            level: Cache level to clear
        """
        # Clear memory cache
        if level in (CacheLevel.MEMORY, CacheLevel.ALL):
            async with self._memory_lock:
                self.memory_cache.clear()

        # Clear disk cache if enabled
        if self.disk_cache_enabled and level in (CacheLevel.DISK, CacheLevel.ALL):
            async with self._disk_lock:
                try:
                    for file_path in self.disk_cache_dir.glob("*.cache"):
                        os.remove(file_path)
                except Exception as e:
                    logger.error(f"Error clearing disk cache: {str(e)}")

    async def invalidate_by_pattern(self, pattern: str, level: CacheLevel = CacheLevel.ALL) -> int:
        """
        Invalidate cache entries by key pattern.

        Args:
            pattern: Regex pattern to match keys
            level: Cache level to invalidate

        Returns:
            Number of invalidated entries
        """
        count = 0
        regex = re.compile(pattern)

        # Invalidate memory cache
        if level in (CacheLevel.MEMORY, CacheLevel.ALL):
            async with self._memory_lock:
                keys_to_delete = [key for key in self.memory_cache if regex.match(key)]

                for key in keys_to_delete:
                    del self.memory_cache[key]
                    count += 1

        # Invalidate disk cache if enabled
        if self.disk_cache_enabled and level in (CacheLevel.DISK, CacheLevel.ALL):
            async with self._disk_lock:
                try:
                    for file_path in self.disk_cache_dir.glob("*.cache"):
                        key = file_path.stem

                        if regex.match(key):
                            os.remove(file_path)
                            count += 1
                except Exception as e:
                    logger.error(f"Error invalidating disk cache by pattern: {str(e)}")

        return count

    async def invalidate_by_tag(self, tag: str, level: CacheLevel = CacheLevel.ALL) -> int:
        """
        Invalidate cache entries by tag.

        Args:
            tag: Tag to match
            level: Cache level to invalidate

        Returns:
            Number of invalidated entries
        """
        count = 0

        # Invalidate memory cache
        if level in (CacheLevel.MEMORY, CacheLevel.ALL):
            async with self._memory_lock:
                keys_to_delete = [
                    key for key, entry in self.memory_cache.items()
                    if tag in entry.tags
                ]

                for key in keys_to_delete:
                    del self.memory_cache[key]
                    count += 1

        # Invalidate disk cache if enabled
        if self.disk_cache_enabled and level in (CacheLevel.DISK, CacheLevel.ALL):
            async with self._disk_lock:
                try:
                    for file_path in self.disk_cache_dir.glob("*.cache"):
                        try:
                            with open(file_path, "rb") as f:
                                entry = pickle.load(f)

                            if tag in entry.tags:
                                os.remove(file_path)
                                count += 1
                        except Exception as e:
                            logger.error(f"Error checking tags for {file_path}: {str(e)}")
                except Exception as e:
                    logger.error(f"Error invalidating disk cache by tag: {str(e)}")

        return count

    async def subscribe_pattern(self, name: str, pattern: str) -> None:
        """
        Subscribe to a key pattern for invalidation.

        Args:
            name: Subscription name
            pattern: Regex pattern to match keys
        """
        async with self._pattern_lock:
            self.pattern_subscriptions[name] = re.compile(pattern)

    async def unsubscribe_pattern(self, name: str) -> bool:
        """
        Unsubscribe from a key pattern.

        Args:
            name: Subscription name

        Returns:
            True if the subscription was found and removed, False otherwise
        """
        async with self._pattern_lock:
            if name in self.pattern_subscriptions:
                del self.pattern_subscriptions[name]
                return True
            return False

    async def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Dictionary of cache statistics
        """
        memory_size = len(self.memory_cache)
        memory_hit_rate = 0
        if self._memory_hit_count + self._memory_miss_count > 0:
            memory_hit_rate = self._memory_hit_count / (self._memory_hit_count + self._memory_miss_count)

        disk_hit_rate = 0
        if self._disk_hit_count + self._disk_miss_count > 0:
            disk_hit_rate = self._disk_hit_count / (self._disk_hit_count + self._disk_miss_count)

        disk_size = 0
        if self.disk_cache_enabled:
            try:
                disk_size = sum(f.stat().st_size for f in self.disk_cache_dir.glob("*.cache"))
            except Exception as e:
                logger.error(f"Error calculating disk cache size: {str(e)}")

        return {
            "memory_size": memory_size,
            "memory_max_size": self.memory_max_size,
            "memory_usage": memory_size / self.memory_max_size if self.memory_max_size > 0 else 0,
            "memory_hit_count": self._memory_hit_count,
            "memory_miss_count": self._memory_miss_count,
            "memory_hit_rate": memory_hit_rate,
            "disk_enabled": self.disk_cache_enabled,
            "disk_size": disk_size,
            "disk_max_size": self.disk_max_size,
            "disk_usage": disk_size / self.disk_max_size if self.disk_max_size > 0 else 0,
            "disk_hit_count": self._disk_hit_count,
            "disk_miss_count": self._disk_miss_count,
            "disk_hit_rate": disk_hit_rate,
            "eviction_count": self._eviction_count,
            "invalidation_strategy": self.invalidation_strategy.value,
            "pattern_subscriptions": list(self.pattern_subscriptions.keys())
        }

    async def _ensure_memory_capacity(self) -> None:
        """Ensure memory cache has capacity for a new entry."""
        if len(self.memory_cache) >= self.memory_max_size:
            # Evict entries based on strategy
            await self._evict_memory_entries()

    async def _ensure_disk_capacity(self) -> None:
        """Ensure disk cache has capacity for a new entry."""
        if not self.disk_cache_enabled:
            return

        try:
            # Calculate current size
            current_size = sum(f.stat().st_size for f in self.disk_cache_dir.glob("*.cache"))

            # Check if we need to evict
            if current_size >= self.disk_max_size:
                # Evict entries based on strategy
                await self._evict_disk_entries()
        except Exception as e:
            logger.error(f"Error ensuring disk capacity: {str(e)}")

    async def _evict_memory_entries(self) -> None:
        """Evict entries from memory cache based on strategy."""
        if not self.memory_cache:
            return

        # Determine which entries to evict based on strategy
        if self.invalidation_strategy == InvalidationStrategy.LRU:
            # Evict least recently used
            key_to_evict = min(
                self.memory_cache.keys(),
                key=lambda k: self.memory_cache[k].last_accessed
            )
        elif self.invalidation_strategy == InvalidationStrategy.LFU:
            # Evict least frequently used
            key_to_evict = min(
                self.memory_cache.keys(),
                key=lambda k: self.memory_cache[k].access_count
            )
        elif self.invalidation_strategy == InvalidationStrategy.FIFO:
            # Evict oldest entry
            key_to_evict = min(
                self.memory_cache.keys(),
                key=lambda k: self.memory_cache[k].created_at
            )
        else:  # TTL
            # Evict entry closest to expiration
            key_to_evict = min(
                self.memory_cache.keys(),
                key=lambda k: self.memory_cache[k].expiration
            )

        # Evict the entry
        del self.memory_cache[key_to_evict]
        self._eviction_count += 1

    async def _evict_disk_entries(self) -> None:
        """Evict entries from disk cache based on strategy."""
        if not self.disk_cache_enabled:
            return

        try:
            # Get all cache files
            cache_files = list(self.disk_cache_dir.glob("*.cache"))

            if not cache_files:
                return

            # Load entries to determine which to evict
            entries = []
            for file_path in cache_files:
                try:
                    with open(file_path, "rb") as f:
                        entry = pickle.load(f)
                        entries.append((file_path, entry))
                except Exception as e:
                    logger.error(f"Error loading cache entry {file_path}: {str(e)}")

            if not entries:
                return

            # Determine which entry to evict based on strategy
            if self.invalidation_strategy == InvalidationStrategy.LRU:
                # Evict least recently used
                file_to_evict = min(entries, key=lambda e: e[1].last_accessed)[0]
            elif self.invalidation_strategy == InvalidationStrategy.LFU:
                # Evict least frequently used
                file_to_evict = min(entries, key=lambda e: e[1].access_count)[0]
            elif self.invalidation_strategy == InvalidationStrategy.FIFO:
                # Evict oldest entry
                file_to_evict = min(entries, key=lambda e: e[1].created_at)[0]
            else:  # TTL
                # Evict entry closest to expiration
                file_to_evict = min(entries, key=lambda e: e[1].expiration)[0]

            # Evict the entry
            os.remove(file_to_evict)
            self._eviction_count += 1
        except Exception as e:
            logger.error(f"Error evicting disk entries: {str(e)}")

    def _get_disk_path(self, key: str) -> Path:
        """
        Get the disk path for a cache key.

        Args:
            key: Cache key

        Returns:
            Path to the cache file
        """
        # Hash the key to create a valid filename
        hashed_key = key.replace("/", "_").replace(":", "_").replace("?", "_")
        return self.disk_cache_dir / f"{hashed_key}.cache"

    async def prefetch(self, keys: List[str], level: CacheLevel = CacheLevel.ALL) -> Dict[str, Any]:
        """
        Prefetch multiple cache keys at once.

        Args:
            keys: List of cache keys to fetch
            level: Cache level to check

        Returns:
            Dictionary mapping keys to values (None for missing keys)
        """
        result = {}

        for key in keys:
            result[key] = await self.get(key, None, level)

        return result

    async def set_many(
        self,
        items: Dict[str, Any],
        ttl: Optional[int] = None,
        level: CacheLevel = CacheLevel.ALL,
        tags: Optional[List[str]] = None
    ) -> None:
        """
        Set multiple values in the cache at once.

        Args:
            items: Dictionary mapping keys to values
            ttl: Time to live in seconds (None for default)
            level: Cache level to store at
            tags: Tags for grouping and invalidation
        """
        for key, value in items.items():
            await self.set(key, value, ttl, level, tags)

    async def touch(self, key: str, ttl: int) -> bool:
        """
        Extend the TTL of a cache entry.

        Args:
            key: Cache key
            ttl: New TTL in seconds

        Returns:
            True if the key was found and updated, False otherwise
        """
        updated = False

        # Update memory cache
        async with self._memory_lock:
            if key in self.memory_cache:
                self.memory_cache[key].extend_ttl(ttl)
                updated = True

        # Update disk cache if enabled
        if self.disk_cache_enabled:
            async with self._disk_lock:
                try:
                    disk_path = self._get_disk_path(key)

                    if disk_path.exists():
                        with open(disk_path, "rb") as f:
                            entry = pickle.load(f)

                        entry.extend_ttl(ttl)

                        with open(disk_path, "wb") as f:
                            pickle.dump(entry, f)

                        updated = True
                except Exception as e:
                    logger.error(f"Error touching disk cache entry: {str(e)}")

        return updated