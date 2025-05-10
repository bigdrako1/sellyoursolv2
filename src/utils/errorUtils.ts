/**
 * Error handling utilities
 * Provides centralized error handling for the application
 */

import { toast } from '@/hooks/use-toast';

// Custom error classes
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public context?: string,
    public isRateLimit?: boolean,
    public isTimeout?: boolean
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class WalletError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'WalletError';
  }
}

// Error categories for analytics
export enum ErrorCategory {
  API = 'api',
  AUTH = 'auth',
  WALLET = 'wallet',
  NETWORK = 'network',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

// Error handler interface
interface ErrorHandler {
  handleError: (error: Error, context?: string) => void;
  reportError: (error: Error, context?: string) => void;
}

// Error handler implementation
class ErrorHandlerImpl implements ErrorHandler {
  // Handle error and show appropriate UI feedback
  handleError(error: Error, context?: string): void {
    console.error(`Error in ${context || 'unknown context'}:`, error);
    
    // Determine error category
    const category = this.categorizeError(error);
    
    // Log error for analytics
    this.logErrorForAnalytics(error, category, context);
    
    // Show appropriate toast notification
    this.showErrorNotification(error, category, context);
  }
  
  // Report error to error tracking service (e.g., Sentry)
  reportError(error: Error, context?: string): void {
    // In a real app, this would send the error to a service like Sentry
    console.error(`Reporting error in ${context || 'unknown context'}:`, error);
    
    // Example of how this would work with Sentry
    // Sentry.captureException(error, {
    //   tags: {
    //     context: context || 'unknown'
    //   }
    // });
  }
  
  // Categorize error for better handling
  private categorizeError(error: Error): ErrorCategory {
    if (error instanceof ApiError) {
      return ErrorCategory.API;
    }
    
    if (error instanceof AuthError) {
      return ErrorCategory.AUTH;
    }
    
    if (error instanceof WalletError) {
      return ErrorCategory.WALLET;
    }
    
    if (error.message.includes('network') || error.message.includes('connection')) {
      return ErrorCategory.NETWORK;
    }
    
    if (error.message.includes('valid') || error.message.includes('required')) {
      return ErrorCategory.VALIDATION;
    }
    
    return ErrorCategory.UNKNOWN;
  }
  
  // Log error for analytics
  private logErrorForAnalytics(error: Error, category: ErrorCategory, context?: string): void {
    // In a real app, this would send error data to analytics
    const errorData = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      category,
      context: context || 'unknown',
      timestamp: new Date().toISOString()
    };
    
    console.debug('Error analytics data:', errorData);
  }
  
  // Show appropriate toast notification
  private showErrorNotification(error: Error, category: ErrorCategory, context?: string): void {
    let title = 'Error';
    let description = error.message;
    let variant: 'default' | 'destructive' = 'destructive';
    
    // Customize notification based on error category
    switch (category) {
      case ErrorCategory.API:
        const apiError = error as ApiError;
        title = apiError.isRateLimit ? 'API Rate Limit Exceeded' : 'API Error';
        description = apiError.isRateLimit
          ? `Rate limit reached for ${apiError.context || context || 'API'}. Please try again later.`
          : `Error in ${apiError.context || context || 'API'}: ${apiError.message}`;
        break;
        
      case ErrorCategory.AUTH:
        title = 'Authentication Error';
        description = `Authentication failed: ${error.message}`;
        break;
        
      case ErrorCategory.WALLET:
        title = 'Wallet Error';
        description = `Wallet operation failed: ${error.message}`;
        break;
        
      case ErrorCategory.NETWORK:
        title = 'Network Error';
        description = `Network connection issue: ${error.message}`;
        break;
        
      case ErrorCategory.VALIDATION:
        title = 'Validation Error';
        variant = 'default'; // Less severe
        break;
        
      default:
        title = 'Unexpected Error';
        description = `An unexpected error occurred: ${error.message}`;
    }
    
    // Show toast notification
    toast({
      title,
      description,
      variant
    });
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandlerImpl();

// Utility function to convert any error to ApiError
export const toApiError = (error: any, context?: string): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }
  
  const isRateLimit = error?.response?.status === 429 || 
                      error?.message?.includes('rate limit') ||
                      error?.message?.includes('too many requests');
                      
  const isTimeout = error?.name === 'AbortError' || 
                    error?.message?.includes('timeout') ||
                    error?.message?.includes('aborted');
                    
  return new ApiError(
    error?.message || 'Unknown API error',
    error?.response?.status,
    context,
    isRateLimit,
    isTimeout
  );
};

// Utility function to handle API errors
export const handleApiError = (error: any, context: string): void => {
  const apiError = toApiError(error, context);
  errorHandler.handleError(apiError, context);
  errorHandler.reportError(apiError, context);
};
