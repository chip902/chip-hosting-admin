'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JarvisErrorState } from '@/types/jarvis';
import { AlertTriangle, AlertCircle, Info, RotateCcw } from 'lucide-react';

interface JarvisErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  allowRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  className?: string;
}

interface JarvisErrorBoundaryState extends JarvisErrorState {
  errorInfo: ErrorInfo | null;
  retryAttempts: number;
}

class JarvisErrorBoundary extends Component<JarvisErrorBoundaryProps, JarvisErrorBoundaryState> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: JarvisErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastRetry: null,
      isRetrying: false,
      retryAttempts: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<JarvisErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('JARVIS Error Boundary caught an error:', error, errorInfo);
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;
    const { retryAttempts } = this.state;

    if (retryAttempts >= maxRetries) {
      return;
    }

    this.setState({
      isRetrying: true,
      retryCount: this.state.retryCount + 1,
      lastRetry: Date.now(),
      retryAttempts: retryAttempts + 1,
    });

    this.retryTimer = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false,
      });
    }, retryDelay);
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastRetry: null,
      isRetrying: false,
      retryAttempts: 0,
    });
  };

  getErrorMessage = (error: Error): string => {
    // Provide user-friendly error messages for common JARVIS errors
    if (error.message.includes('WebSocket')) {
      return 'Connection to JARVIS lost. Please check your internet connection.';
    }
    if (error.message.includes('fetch')) {
      return 'Unable to communicate with JARVIS. The service may be temporarily unavailable.';
    }
    if (error.message.includes('JSON')) {
      return 'Received invalid data from JARVIS. Please try again.';
    }
    if (error.message.includes('timeout')) {
      return 'Request to JARVIS timed out. Please try again.';
    }
    
    return error.message || 'An unexpected error occurred with JARVIS.';
  };

  getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' => {
    if (error.message.includes('WebSocket') || error.message.includes('fetch')) {
      return 'high';
    }
    if (error.message.includes('timeout') || error.message.includes('JSON')) {
      return 'medium';
    }
    return 'low';
  };

  render() {
    const { children, fallback, showDetails = false, allowRetry = true, maxRetries = 3, className } = this.props;
    const { hasError, error, errorInfo, isRetrying, retryAttempts } = this.state;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      const errorMessage = this.getErrorMessage(error);
      const severity = this.getErrorSeverity(error);
      const canRetry = allowRetry && retryAttempts < maxRetries && !isRetrying;

      return (
        <Card className={`p-6 border-red-200 bg-red-50 dark:bg-red-900/20 ${className || ''}`}>
          <div className="space-y-4">
            {/* Error Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  {severity === 'high' ? <AlertCircle className="h-5 w-5 text-red-500" /> : severity === 'medium' ? <AlertTriangle className="h-5 w-5 text-yellow-500" /> : <Info className="h-5 w-5 text-blue-500" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                    JARVIS Error
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                    {errorMessage}
                  </p>
                </div>
              </div>
              <Badge 
                variant="destructive" 
                className="text-xs"
              >
                {severity.toUpperCase()}
              </Badge>
            </div>

            {/* Error Details (Development/Debug) */}
            {showDetails && process.env.NODE_ENV === 'development' && (
              <div className="space-y-2">
                <details className="text-sm">
                  <summary className="cursor-pointer text-red-700 dark:text-red-300 font-medium">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/40 rounded border">
                    <div className="font-mono text-xs space-y-2">
                      <div>
                        <strong>Error:</strong> {error.name}
                      </div>
                      <div>
                        <strong>Message:</strong> {error.message}
                      </div>
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 text-xs overflow-auto max-h-32">
                          {error.stack}
                        </pre>
                      </div>
                      {errorInfo && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="mt-1 text-xs overflow-auto max-h-32">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              </div>
            )}

            {/* Retry Information */}
            {allowRetry && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {retryAttempts > 0 && (
                  <p>
                    Retry attempts: {retryAttempts} / {maxRetries}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/40"
                >
                  {isRetrying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 inline mr-1" />Retry
                    </>
                  )}
                </Button>
              )}
              
              <Button
                onClick={this.handleReset}
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/40"
              >
                <RotateCcw className="h-4 w-4 inline mr-1" />Reset
              </Button>

              <Button
                onClick={() => window.location.reload()}
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/40"
              >
                ↻ Reload Page
              </Button>
            </div>

            {/* Helpful Tips */}
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/40 rounded">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                💡 Troubleshooting Tips
              </h4>
              <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                <li>• Check if the JARVIS backend service is running</li>
                <li>• Verify your internet connection</li>
                <li>• Try refreshing the page</li>
                <li>• Clear your browser cache if the problem persists</li>
                {severity === 'high' && (
                  <li>• Contact support if this issue continues</li>
                )}
              </ul>
            </div>
          </div>
        </Card>
      );
    }

    return children;
  }
}

// HOC wrapper for easier usage
export const withJarvisErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Partial<JarvisErrorBoundaryProps>
) => {
  const WithErrorBoundaryComponent = (props: P) => (
    <JarvisErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </JarvisErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = 
    `withJarvisErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
};

// Functional component wrapper for hooks
export const JarvisErrorBoundaryProvider: React.FC<{
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}> = ({ children, onError, showDetails = false }) => {
  return (
    <JarvisErrorBoundary 
      onError={onError}
      showDetails={showDetails}
      allowRetry={true}
      maxRetries={3}
    >
      {children}
    </JarvisErrorBoundary>
  );
};

// Simple error display component
export const JarvisErrorDisplay: React.FC<{
  error: Error;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}> = ({ error, onRetry, onDismiss, className }) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className || ''}`}>
      <div className="flex items-start gap-3">
        <div className="text-red-500 text-xl"><AlertTriangle className="h-5 w-5" /></div>
        <div className="flex-1">
          <h4 className="text-red-800 font-medium">Error</h4>
          <p className="text-red-600 text-sm mt-1">
            {error.message || 'An unexpected error occurred'}
          </p>
          {(onRetry || onDismiss) && (
            <div className="flex gap-2 mt-3">
              {onRetry && (
                <Button size="sm" onClick={onRetry} variant="outline">
                  Retry
                </Button>
              )}
              {onDismiss && (
                <Button size="sm" onClick={onDismiss} variant="ghost">
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JarvisErrorBoundary;