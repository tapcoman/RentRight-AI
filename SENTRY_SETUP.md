# Sentry Error Monitoring Setup

This document explains how to configure Sentry error monitoring for the RentRight-AI application.

## Environment Variables

Add the following environment variables to your production environment:

### Backend (Server)
```bash
SENTRY_DSN=your_sentry_backend_dsn_here
```

### Frontend (Client)
```bash
VITE_SENTRY_DSN=your_sentry_frontend_dsn_here
```

## Getting Started with Sentry

1. Create a free account at [sentry.io](https://sentry.io)
2. Create a new project for your application
3. Choose "React" for the frontend project and "Node.js" for the backend project
4. Copy the DSN from each project's settings
5. Add the DSN values to your environment variables

## Features Implemented

### Backend Error Monitoring
- ✅ Automatic error capture for unhandled exceptions
- ✅ Request tracing and performance monitoring
- ✅ Sensitive data filtering (passwords, tokens, keys, emails)
- ✅ Environment-based configuration (production only)
- ✅ Custom error context and tags

### Frontend Error Monitoring
- ✅ React Error Boundary with custom fallback UI
- ✅ Session replay for debugging (masked sensitive content)
- ✅ Performance monitoring and tracing
- ✅ Sensitive data filtering
- ✅ Environment-based configuration (production only)

### Security Features
- ✅ Automatic filtering of sensitive information from error reports
- ✅ Masked headers: authorization, cookie, x-api-key
- ✅ Masked form fields: password, token, secret, key, email
- ✅ Masked query parameters containing sensitive keywords
- ✅ Session replay masking for privacy protection

## Testing

### Development Testing
In development mode, you'll see a test panel in the top-right corner that allows you to:
- Trigger React component errors
- Send async errors to Sentry
- Send test messages
- Send custom exceptions with context

### API Testing
The application includes a test endpoint for server-side error testing (development only):

```bash
# Test server error
curl -X POST http://localhost:5000/api/test-sentry \
  -H "Content-Type: application/json" \
  -d '{"type": "error"}'

# Test async error
curl -X POST http://localhost:5000/api/test-sentry \
  -H "Content-Type: application/json" \
  -d '{"type": "async"}'
```

## Configuration Details

### Backend Configuration
- **Sample Rate**: 10% of transactions are traced
- **Environment**: Automatically set from NODE_ENV
- **Error Filtering**: Sensitive data automatically removed before sending

### Frontend Configuration
- **Sample Rate**: 10% of transactions traced
- **Session Replay**: 1% of normal sessions, 100% of error sessions
- **Content Masking**: All text and media masked in replays
- **Error Filtering**: Comprehensive sensitive data removal

## Production Deployment

1. Set environment variables on your hosting platform
2. Sentry will only initialize in production environment
3. Test components are automatically hidden in production
4. All sensitive data is filtered before being sent to Sentry

## Monitoring and Alerts

Once configured, Sentry will:
- Send email notifications for new errors
- Track error trends and release health
- Provide detailed stack traces and context
- Monitor application performance
- Record user sessions (with privacy protection)

## Privacy and Security

The implementation includes comprehensive privacy protection:
- Sensitive form data is never sent to Sentry
- Authentication tokens and API keys are filtered out
- Email addresses and personal information are masked
- Session replays have all text and media content masked
- Only error context and stack traces are transmitted

## Support

For Sentry-specific issues, consult the [Sentry Documentation](https://docs.sentry.io/).
For RentRight-AI specific integration issues, check the implementation in:
- `/server/index.ts` - Backend configuration
- `/client/src/main.tsx` - Frontend configuration
- `/client/src/components/SentryErrorBoundary.tsx` - Error boundary component