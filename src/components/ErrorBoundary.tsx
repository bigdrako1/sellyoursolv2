import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { errorHandler } from '@/utils/errorUtils';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle errors in the UI
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <ComponentThatMightError />
 * </ErrorBoundary>
 * ```
 * 
 * With custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorComponent />}>
 *   <ComponentThatMightError />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our error handling service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Report error to our error handler
    errorHandler.handleError(error, 'ErrorBoundary');
    errorHandler.reportError(error, 'ErrorBoundary');
  }

  handleReset = (): void => {
    // Reset the error boundary state
    this.setState({
      hasError: false,
      error: null
    });
    
    // Call the onReset prop if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Otherwise, use the default fallback UI
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-trading-darkAccent border border-trading-highlight/20 rounded-lg">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-4 text-center max-w-md">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button 
            onClick={this.handleReset}
            className="bg-trading-highlight hover:bg-trading-highlight/80"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Try again
          </Button>
        </div>
      );
    }

    // If there's no error, render the children
    return this.props.children;
  }
}

/**
 * Higher-order component to wrap a component with an ErrorBoundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onReset?: () => void
): React.FC<P> => {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary fallback={fallback} onReset={onReset}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithErrorBoundary.displayName = `WithErrorBoundary(${displayName})`;
  
  return WithErrorBoundary;
};

export default ErrorBoundary;
