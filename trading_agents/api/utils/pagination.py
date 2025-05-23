"""
Pagination utilities for API responses.

This module provides utilities for paginating API responses.
"""
import math
from typing import Dict, List, Any, Optional, TypeVar, Generic, Callable
from fastapi import Query, Depends, HTTPException
from pydantic import BaseModel, Field

T = TypeVar('T')

class PaginationParams:
    """Pagination parameters for API endpoints."""
    
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
        sort_by: Optional[str] = Query(None, description="Field to sort by"),
        sort_order: str = Query("asc", description="Sort order (asc or desc)")
    ):
        """
        Initialize pagination parameters.
        
        Args:
            page: Page number (1-based)
            page_size: Number of items per page
            sort_by: Field to sort by
            sort_order: Sort order (asc or desc)
        """
        self.page = page
        self.page_size = page_size
        self.sort_by = sort_by
        self.sort_order = sort_order.lower()
        
        # Validate sort order
        if self.sort_order not in ["asc", "desc"]:
            raise HTTPException(status_code=400, detail="Sort order must be 'asc' or 'desc'")
    
    @property
    def offset(self) -> int:
        """
        Get offset for database query.
        
        Returns:
            Offset for database query
        """
        return (self.page - 1) * self.page_size
    
    @property
    def limit(self) -> int:
        """
        Get limit for database query.
        
        Returns:
            Limit for database query
        """
        return self.page_size
    
    def get_sort_params(self) -> Dict[str, Any]:
        """
        Get sort parameters for database query.
        
        Returns:
            Sort parameters for database query
        """
        if not self.sort_by:
            return {}
        
        return {
            "sort_by": self.sort_by,
            "sort_order": self.sort_order
        }
    
    def get_query_params(self) -> Dict[str, Any]:
        """
        Get query parameters for database query.
        
        Returns:
            Query parameters for database query
        """
        params = {
            "skip": self.offset,
            "limit": self.limit
        }
        
        if self.sort_by:
            params.update(self.get_sort_params())
        
        return params

class PageInfo(BaseModel):
    """Page information for paginated responses."""
    
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages")
    total_items: int = Field(..., description="Total number of items")
    has_previous: bool = Field(..., description="Whether there is a previous page")
    has_next: bool = Field(..., description="Whether there is a next page")

class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response model."""
    
    items: List[T] = Field(..., description="List of items")
    page_info: PageInfo = Field(..., description="Page information")

def paginate(items: List[T], pagination: PaginationParams, total_items: Optional[int] = None) -> PaginatedResponse[T]:
    """
    Paginate a list of items.
    
    Args:
        items: List of items to paginate
        pagination: Pagination parameters
        total_items: Total number of items (if known)
        
    Returns:
        Paginated response
    """
    # Get total items
    if total_items is None:
        total_items = len(items)
    
    # Calculate total pages
    total_pages = math.ceil(total_items / pagination.page_size)
    
    # Check if page is valid
    if pagination.page > total_pages and total_pages > 0:
        raise HTTPException(status_code=404, detail=f"Page {pagination.page} not found")
    
    # Create page info
    page_info = PageInfo(
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=total_pages,
        total_items=total_items,
        has_previous=pagination.page > 1,
        has_next=pagination.page < total_pages
    )
    
    # Create paginated response
    return PaginatedResponse(
        items=items,
        page_info=page_info
    )

async def paginate_async(
    query_func: Callable,
    count_func: Callable,
    pagination: PaginationParams,
    **kwargs
) -> PaginatedResponse[T]:
    """
    Paginate an async query.
    
    Args:
        query_func: Async function to query items
        count_func: Async function to count total items
        pagination: Pagination parameters
        **kwargs: Additional parameters for query function
        
    Returns:
        Paginated response
    """
    # Get query parameters
    query_params = pagination.get_query_params()
    
    # Get total items
    total_items = await count_func(**kwargs)
    
    # Calculate total pages
    total_pages = math.ceil(total_items / pagination.page_size)
    
    # Check if page is valid
    if pagination.page > total_pages and total_pages > 0:
        raise HTTPException(status_code=404, detail=f"Page {pagination.page} not found")
    
    # Get items
    items = await query_func(**query_params, **kwargs)
    
    # Create page info
    page_info = PageInfo(
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=total_pages,
        total_items=total_items,
        has_previous=pagination.page > 1,
        has_next=pagination.page < total_pages
    )
    
    # Create paginated response
    return PaginatedResponse(
        items=items,
        page_info=page_info
    )

def get_pagination_params(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    sort_by: Optional[str] = Query(None, description="Field to sort by"),
    sort_order: str = Query("asc", description="Sort order (asc or desc)")
) -> PaginationParams:
    """
    Get pagination parameters from request.
    
    Args:
        page: Page number (1-based)
        page_size: Number of items per page
        sort_by: Field to sort by
        sort_order: Sort order (asc or desc)
        
    Returns:
        Pagination parameters
    """
    return PaginationParams(
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order
    )
