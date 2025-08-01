import React from 'react';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SentryTestComponentProps {
  onClose?: () => void;
}

export function SentryTestComponent({ onClose }: SentryTestComponentProps) {
  const triggerError = () => {
    throw new Error('Test error for Sentry integration - this is intentional for testing purposes');
  };

  const triggerAsyncError = async () => {
    try {
      throw new Error('Test async error for Sentry integration');
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  const triggerMessageCapture = () => {
    Sentry.captureMessage('Test message capture from RentRight-AI frontend', 'info');
    alert('Test message sent to Sentry (check your Sentry dashboard)');
  };

  const triggerCustomException = () => {
    Sentry.withScope((scope) => {
      scope.setTag('test', 'custom-exception');
      scope.setContext('testData', {
        component: 'SentryTestComponent',
        action: 'manual-test',
        timestamp: new Date().toISOString(),
      });
      Sentry.captureException(new Error('Custom exception with additional context'));
    });
    alert('Custom exception sent to Sentry with additional context');
  };

  // Only show in development environment
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <Card className="fixed top-4 right-4 w-80 z-50 bg-slate-50 border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-slate-800">Sentry Test Panel</CardTitle>
        <CardDescription className="text-xs text-slate-600">
          Development only - Test error reporting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={triggerError}
          className="w-full text-xs"
        >
          Trigger React Error
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={triggerAsyncError}
          className="w-full text-xs"
        >
          Trigger Async Error
        </Button>
        
        <Button
          size="sm"
          variant="secondary"
          onClick={triggerMessageCapture}
          className="w-full text-xs"
        >
          Send Test Message
        </Button>
        
        <Button
          size="sm"
          variant="default"
          onClick={triggerCustomException}
          className="w-full text-xs"
        >
          Custom Exception
        </Button>
        
        {onClose && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="w-full text-xs"
          >
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default SentryTestComponent;