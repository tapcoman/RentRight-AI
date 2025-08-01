import * as Sentry from "@sentry/node";

// Initialize Sentry first, before any other imports
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.1,
    integrations: [
      Sentry.nodeContextIntegration(),
      Sentry.localVariablesIntegration(),
      Sentry.requestDataIntegration(),
    ],
    beforeSend(event) {
      // Filter out sensitive data from error reports
      if (event.request) {
        // Remove sensitive headers
        if (event.request.headers) {
          const headers = event.request.headers as Record<string, any>;
          delete headers['authorization'];
          delete headers['cookie'];
          delete headers['x-api-key'];
        }
        
        // Remove sensitive query parameters
        if (event.request.query_string) {
          event.request.query_string = (event.request.query_string as string)
            .replace(/([?&])(password|token|key|secret)=[^&]*/gi, '$1$2=***');
        }
      }
      
      // Remove sensitive data from request body
      if (event.request?.data && typeof event.request.data === 'object') {
        const data = event.request.data as Record<string, any>;
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'email'];
        for (const field of sensitiveFields) {
          if (data[field]) {
            data[field] = '***';
          }
        }
      }
      
      return event;
    },
  });
}

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { cleanupSuspiciousIPs } from './rate-limiter';
import { validateConfiguration, logConfigurationStatus } from './config-validator';

// Create Express application with enhanced security
const app = express();


// Basic security headers
app.use((req, res, next) => {
  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');
  // Enable XSS protection in browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Strict CSP for production (can be loosened for development)
  if (app.get('env') === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' https://js.stripe.com; frame-src https://js.stripe.com; img-src 'self' data:; style-src 'self' 'unsafe-inline';"
    );
  }
  next();
});

// JSON body parser with limit
app.use(express.json({ limit: '1mb' }));
// URL-encoded parser with limit
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Validate configuration before starting the server
  const configResult = validateConfiguration();
  if (!configResult.isValid) {
    logConfigurationStatus();
    process.exit(1);
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Capture error with Sentry in production
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(err);
    } else {
      // Log error to console in development
      console.error('Error:', err);
    }

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Server port configuration with fallback to 5000
  // this serves both the API and the client
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: process.env.HOST || "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Set up periodic cleanup of rate limiter and suspicious IP tracking
    setInterval(cleanupSuspiciousIPs, 15 * 60 * 1000); // Run every 15 minutes
    log('Security cleanup scheduled');
    
    // Initialize response templates
    import('./response-templates-seed').then(({ seedResponseTemplates }) => {
      return seedResponseTemplates();
    }).then(() => {
      log('Response templates seeded successfully');
    }).catch(err => {
      log('Failed to seed response templates', 'error');
      console.error(err);
    });
    
    // Schedule database cleanup for records older than 30 days
    import('./db-maintenance').then(dbMaintenance => {
      dbMaintenance.scheduleDataCleanup();
    }).catch(err => {
      log('Failed to initialize database cleanup scheduler', 'error');
      console.error(err);
    });
  });
})();
