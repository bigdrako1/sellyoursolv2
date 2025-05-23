"""
Response compression middleware for FastAPI.

This module provides middleware for compressing API responses.
"""
import logging
import time
import gzip
import brotli
import zlib
from typing import Dict, List, Any, Optional, Callable
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)

class CompressionMiddleware(BaseHTTPMiddleware):
    """Middleware for compressing API responses."""
    
    def __init__(
        self,
        app: ASGIApp,
        minimum_size: int = 500,
        compression_level: int = 6,
        exclude_paths: List[str] = None,
        exclude_content_types: List[str] = None
    ):
        """
        Initialize the compression middleware.
        
        Args:
            app: ASGI application
            minimum_size: Minimum response size for compression
            compression_level: Compression level (1-9)
            exclude_paths: List of paths to exclude from compression
            exclude_content_types: List of content types to exclude from compression
        """
        super().__init__(app)
        self.minimum_size = minimum_size
        self.compression_level = compression_level
        self.exclude_paths = exclude_paths or []
        self.exclude_content_types = exclude_content_types or ["image/", "video/", "audio/"]
        
        # Compression statistics
        self.stats = {
            "total_responses": 0,
            "compressed_responses": 0,
            "original_size": 0,
            "compressed_size": 0,
            "compression_time": 0.0
        }
        
        logger.info(f"Initialized compression middleware with minimum size {minimum_size} bytes")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Dispatch the request and compress the response.
        
        Args:
            request: HTTP request
            call_next: Next middleware or route handler
            
        Returns:
            HTTP response
        """
        # Check if path is excluded
        path = request.url.path
        if any(path.startswith(exclude_path) for exclude_path in self.exclude_paths):
            return await call_next(request)
        
        # Get accepted encodings
        accept_encoding = request.headers.get("accept-encoding", "")
        
        # Check if compression is supported
        if not any(encoding in accept_encoding.lower() for encoding in ["gzip", "br", "deflate"]):
            return await call_next(request)
        
        # Get response
        response = await call_next(request)
        
        # Update statistics
        self.stats["total_responses"] += 1
        
        # Check if response should be compressed
        if self.should_compress(response):
            # Compress response
            compressed_response = await self.compress_response(response, accept_encoding)
            return compressed_response
        
        return response
    
    def should_compress(self, response: Response) -> bool:
        """
        Check if response should be compressed.
        
        Args:
            response: HTTP response
            
        Returns:
            True if response should be compressed, False otherwise
        """
        # Check if response is already compressed
        if "content-encoding" in response.headers:
            return False
        
        # Check content type
        content_type = response.headers.get("content-type", "")
        if any(content_type.startswith(exclude_type) for exclude_type in self.exclude_content_types):
            return False
        
        # Check response size
        content_length = response.headers.get("content-length")
        if content_length and int(content_length) < self.minimum_size:
            return False
        
        return True
    
    async def compress_response(self, response: Response, accept_encoding: str) -> Response:
        """
        Compress response body.
        
        Args:
            response: HTTP response
            accept_encoding: Accepted encodings
            
        Returns:
            Compressed HTTP response
        """
        # Get response body
        body = b""
        async for chunk in response.body_iterator:
            body += chunk
        
        # Check if response is large enough
        if len(body) < self.minimum_size:
            # Create new response with original body
            return Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type
            )
        
        # Update statistics
        self.stats["original_size"] += len(body)
        
        # Compress body
        start_time = time.time()
        
        if "br" in accept_encoding.lower():
            # Use Brotli compression
            compressed_body = brotli.compress(body, quality=self.compression_level)
            encoding = "br"
        elif "gzip" in accept_encoding.lower():
            # Use gzip compression
            compressed_body = gzip.compress(body, compresslevel=self.compression_level)
            encoding = "gzip"
        elif "deflate" in accept_encoding.lower():
            # Use deflate compression
            compressed_body = zlib.compress(body, level=self.compression_level)
            encoding = "deflate"
        else:
            # No supported compression
            return Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type
            )
        
        compression_time = time.time() - start_time
        
        # Update statistics
        self.stats["compressed_responses"] += 1
        self.stats["compressed_size"] += len(compressed_body)
        self.stats["compression_time"] += compression_time
        
        # Create new response with compressed body
        headers = dict(response.headers)
        headers["content-encoding"] = encoding
        headers["content-length"] = str(len(compressed_body))
        headers["vary"] = "accept-encoding"
        
        return Response(
            content=compressed_body,
            status_code=response.status_code,
            headers=headers,
            media_type=response.media_type
        )
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get compression statistics.
        
        Returns:
            Compression statistics
        """
        compression_ratio = self.stats["original_size"] / self.stats["compressed_size"] if self.stats["compressed_size"] > 0 else 0
        avg_compression_time = self.stats["compression_time"] / self.stats["compressed_responses"] if self.stats["compressed_responses"] > 0 else 0
        compression_pct = self.stats["compressed_responses"] / self.stats["total_responses"] * 100 if self.stats["total_responses"] > 0 else 0
        
        return {
            "total_responses": self.stats["total_responses"],
            "compressed_responses": self.stats["compressed_responses"],
            "compression_pct": compression_pct,
            "original_size": self.stats["original_size"],
            "compressed_size": self.stats["compressed_size"],
            "compression_ratio": compression_ratio,
            "compression_time": self.stats["compression_time"],
            "avg_compression_time": avg_compression_time
        }

def add_compression_middleware(app: FastAPI, **kwargs):
    """
    Add compression middleware to FastAPI application.
    
    Args:
        app: FastAPI application
        **kwargs: Middleware configuration
    """
    app.add_middleware(CompressionMiddleware, **kwargs)
