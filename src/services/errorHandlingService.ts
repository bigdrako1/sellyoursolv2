
import { toast } from "./toastService";

/**
 * Error types for categorizing different API errors
 */
export enum ErrorType {
  NETWORK = "NETWORK",
  AUTHENTICATION = "AUTHENTICATION",
  PERMISSION = "PERMISSION",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION = "VALIDATION",
  SERVER = "SERVER",
  UNKNOWN = "UNKNOWN"
}

/**
 * Structured error object with additional context
 */
export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
}

/**
 * Service for handling API errors consistently across the application
 */
export const errorHandlingService = {
  /**
   * Handles API errors with appropriate user feedback
   * @param error Error to handle
   * @param silent If true, suppress user-facing notifications
   * @returns Structured AppError object
   */
  handleApiError: (error: unknown, silent = false): AppError => {
    console.error("API Error:", error);
    
    let appError: AppError;
    
    if (error instanceof Error) {
      // Categorize known error types
      if (error.message.includes("Failed to fetch") || error.message.includes("Network error")) {
        appError = {
          type: ErrorType.NETWORK,
          message: "Network error. Please check your connection and try again.",
          originalError: error
        };
      } else if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        appError = {
          type: ErrorType.AUTHENTICATION,
          message: "Authentication error. Please sign in again.",
          originalError: error
        };
      } else if (error.message.includes("403") || error.message.includes("Forbidden")) {
        appError = {
          type: ErrorType.PERMISSION,
          message: "You don't have permission to perform this action.",
          originalError: error
        };
      } else if (error.message.includes("404") || error.message.includes("Not Found")) {
        appError = {
          type: ErrorType.NOT_FOUND,
          message: "The requested resource was not found.",
          originalError: error
        };
      } else if (error.message.includes("Invalid param") || error.message.includes("validation")) {
        appError = {
          type: ErrorType.VALIDATION,
          message: "There was a validation error with your request.",
          originalError: error
        };
      } else if (error.message.includes("500") || error.message.includes("Server Error")) {
        appError = {
          type: ErrorType.SERVER,
          message: "Server error. Please try again later.",
          originalError: error
        };
      } else {
        appError = {
          type: ErrorType.UNKNOWN,
          message: "An unexpected error occurred. Please try again.",
          originalError: error
        };
      }
    } else {
      appError = {
        type: ErrorType.UNKNOWN,
        message: "An unexpected error occurred. Please try again.",
        context: { unknownError: error }
      };
    }
    
    // Show user-facing error notification if not silent
    if (!silent) {
      toast.error(appError.message);
    }
    
    return appError;
  }
};
