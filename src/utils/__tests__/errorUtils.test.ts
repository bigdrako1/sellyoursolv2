import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  ApiError, 
  AuthError, 
  WalletError, 
  ErrorCategory,
  errorHandler,
  toApiError,
  handleApiError
} from '../errorUtils';

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

// Import toast after mocking
import { toast } from '@/hooks/use-toast';

describe('Error Utils', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
  });
  
  it('should create ApiError with correct properties', () => {
    const message = 'API error message';
    const statusCode = 429;
    const context = 'test-context';
    const isRateLimit = true;
    const isTimeout = false;
    
    const error = new ApiError(message, statusCode, context, isRateLimit, isTimeout);
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe('ApiError');
    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(statusCode);
    expect(error.context).toBe(context);
    expect(error.isRateLimit).toBe(isRateLimit);
    expect(error.isTimeout).toBe(isTimeout);
  });
  
  it('should create AuthError with correct properties', () => {
    const message = 'Auth error message';
    const code = 'auth/invalid-credentials';
    
    const error = new AuthError(message, code);
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AuthError);
    expect(error.name).toBe('AuthError');
    expect(error.message).toBe(message);
    expect(error.code).toBe(code);
  });
  
  it('should create WalletError with correct properties', () => {
    const message = 'Wallet error message';
    const code = 'wallet/connection-failed';
    
    const error = new WalletError(message, code);
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(WalletError);
    expect(error.name).toBe('WalletError');
    expect(error.message).toBe(message);
    expect(error.code).toBe(code);
  });
  
  it('should handle errors and show toast notification', () => {
    // Spy on console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Create an error
    const error = new ApiError('API error message', 429, 'test-context', true, false);
    
    // Handle error
    errorHandler.handleError(error, 'test-context');
    
    // Verify console.error was called
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Verify toast was called
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'API Rate Limit Exceeded',
      variant: 'destructive'
    }));
  });
  
  it('should convert any error to ApiError', () => {
    // Test with regular Error
    const regularError = new Error('Regular error message');
    const apiError1 = toApiError(regularError, 'test-context');
    
    expect(apiError1).toBeInstanceOf(ApiError);
    expect(apiError1.message).toBe('Regular error message');
    expect(apiError1.context).toBe('test-context');
    
    // Test with object containing response
    const responseError = {
      response: { status: 429 },
      message: 'Rate limit exceeded'
    };
    const apiError2 = toApiError(responseError, 'test-context');
    
    expect(apiError2).toBeInstanceOf(ApiError);
    expect(apiError2.message).toBe('Rate limit exceeded');
    expect(apiError2.statusCode).toBe(429);
    expect(apiError2.isRateLimit).toBe(true);
    
    // Test with timeout error
    const timeoutError = {
      name: 'AbortError',
      message: 'Request timed out'
    };
    const apiError3 = toApiError(timeoutError, 'test-context');
    
    expect(apiError3).toBeInstanceOf(ApiError);
    expect(apiError3.message).toBe('Request timed out');
    expect(apiError3.isTimeout).toBe(true);
    
    // Test with null
    const apiError4 = toApiError(null, 'test-context');
    
    expect(apiError4).toBeInstanceOf(ApiError);
    expect(apiError4.message).toBe('Unknown API error');
  });
  
  it('should handle API errors', () => {
    // Spy on errorHandler.handleError
    const handleErrorSpy = vi.spyOn(errorHandler, 'handleError').mockImplementation(() => {});
    
    // Spy on errorHandler.reportError
    const reportErrorSpy = vi.spyOn(errorHandler, 'reportError').mockImplementation(() => {});
    
    // Create an error
    const error = new Error('API error message');
    
    // Handle API error
    handleApiError(error, 'test-context');
    
    // Verify errorHandler.handleError was called
    expect(handleErrorSpy).toHaveBeenCalled();
    
    // Verify errorHandler.reportError was called
    expect(reportErrorSpy).toHaveBeenCalled();
  });
});
