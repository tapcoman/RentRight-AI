import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./index.css";

// Initialize Sentry for React
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE || 'production',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Filter out sensitive data from error reports
      if (event.request) {
        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        
        // Remove sensitive query parameters
        if (event.request.query_string && typeof event.request.query_string === 'string') {
          event.request.query_string = event.request.query_string
            .replace(/([?&])(password|token|key|secret)=[^&]*/gi, '$1$2=***');
        }
      }
      
      // Remove sensitive form data
      if (event.extra && typeof event.extra === 'object') {
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'email'];
        for (const field of sensitiveFields) {
          if (event.extra[field]) {
            event.extra[field] = '***';
          }
        }
      }
      
      return event;
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
