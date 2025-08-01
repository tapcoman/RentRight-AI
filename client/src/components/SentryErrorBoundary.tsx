import React from 'react';
import * as Sentry from '@sentry/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorFallbackProps {
  error: unknown;
  componentStack: string;
  eventId: string;
  resetError: () => void;
}

function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  const errorStack = error instanceof Error ? error.stack : undefined;
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Something went wrong</AlertTitle>
          <AlertDescription className="text-red-700 mt-2">
            We're sorry, but something unexpected happened. Our team has been notified and is working to fix the issue.
          </AlertDescription>
        </Alert>
        
        <div className="mt-4 space-y-3">
          <Button 
            onClick={resetError}
            className="w-full"
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          <Button 
            onClick={() => window.location.href = '/'}
            className="w-full"
            variant="default"
          >
            Go to Homepage
          </Button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-3 bg-gray-100 rounded-md">
            <summary className="cursor-pointer font-medium text-sm text-gray-700">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
              {errorMessage}
              {errorStack && '\n' + errorStack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// Create Sentry Error Boundary with custom fallback
export const SentryErrorBoundary = Sentry.withErrorBoundary(
  ({ children }: { children: React.ReactNode }) => <>{children}</>,
  {
    fallback: ErrorFallback,
    beforeCapture: (scope, error, errorInfo) => {
      // Add additional context to Sentry reports
      scope.setTag('errorBoundary', true);
      scope.setContext('errorInfo', {
        componentStack: errorInfo,
      });
      
      // Filter out sensitive information from error context
      if (typeof errorInfo === 'string') {
        // Remove any potential sensitive data from component stack
        const sanitizedStack = errorInfo
          .replace(/password=[^&\s]*/gi, 'password=***')
          .replace(/token=[^&\s]*/gi, 'token=***')
          .replace(/key=[^&\s]*/gi, 'key=***');
        
        scope.setContext('errorInfo', {
          componentStack: sanitizedStack,
        });
      }
    },
  }
);

export default SentryErrorBoundary;