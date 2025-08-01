# RentRight-AI Deployment Guide

This guide covers deploying RentRight-AI to Railway and other production environments with all the security, monitoring, and performance improvements.

## Railway Deployment (Recommended)

Railway provides an excellent platform for deploying Node.js applications with PostgreSQL databases.

### Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **API Keys**: Gather all required API keys (see Environment Variables section)

### Deployment Steps

#### 1. Create Railway Project

1. Visit [railway.app](https://railway.app) and create a new project
2. Connect your GitHub repository
3. Railway will automatically detect the Node.js application

#### 2. Add PostgreSQL Database

1. In your Railway project, click "Add Service"
2. Select "PostgreSQL" from the database options
3. Railway will create a PostgreSQL instance and provide connection details

#### 3. Configure Environment Variables

In your Railway project settings, add the following environment variables:

### Required Environment Variables

#### Core Application
```bash
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
APP_URL=https://your-railway-app.up.railway.app
```

#### Database
```bash
# Railway will auto-generate this for PostgreSQL service
DATABASE_URL=postgresql://username:password@host:port/database
```

#### Security & Encryption
```bash
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your-64-character-hex-encryption-key-here

# For key rotation (comma-separated previous keys)
ENCRYPTION_KEY_PREVIOUS=previous-key-1,previous-key-2

# Generate a strong admin API key
ADMIN_API_KEY=your-secure-admin-api-key-here
```

#### OpenAI Integration
```bash
OPENAI_API_KEY=sk-your-production-openai-api-key-here
```

#### Stripe Payment Processing
```bash
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key-here
VITE_STRIPE_PUBLIC_KEY=pk_live_your-stripe-public-key-here
```

#### Email Services (SendGrid Recommended)
```bash
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

#### Error Monitoring (Sentry)
```bash
SENTRY_DSN=https://your-backend-sentry-dsn@sentry.io/project-id
VITE_SENTRY_DSN=https://your-frontend-sentry-dsn@sentry.io/project-id
```

#### Optional Integrations
```bash
# Google reCAPTCHA
RECAPTCHA_SITE_KEY=your-recaptcha-site-key-here
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key-here

# Google Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Rate Limiting Configuration (Optional)

Fine-tune rate limiting for your expected traffic:

```bash
# General API rate limiting (15 minutes window)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200

# Authentication rate limiting (1 hour window)
AUTH_RATE_LIMIT_WINDOW_MS=3600000
AUTH_RATE_LIMIT_MAX_REQUESTS=30

# Document upload rate limiting (1 hour window)
UPLOAD_RATE_LIMIT_WINDOW_MS=3600000
UPLOAD_RATE_LIMIT_MAX_REQUESTS=10

# CAPTCHA rate limiting (5 minutes window)
CAPTCHA_RATE_LIMIT_WINDOW_MS=300000
CAPTCHA_RATE_LIMIT_MAX_REQUESTS=20

# Speed limiting (gradual slowdown)
SPEED_LIMIT_WINDOW_MS=300000
SPEED_LIMIT_DELAY_AFTER=50
```

#### 4. Configure Health Checks

Create a `railway.toml` file in your project root:

```toml
[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[env]
NODE_ENV = "production"
```

#### 5. Database Setup

After deployment, set up the database:

1. **Push Database Schema**:
   ```bash
   # Connect to your Railway deployment terminal or run locally with production DATABASE_URL
   npm run db:push
   ```

2. **Apply Performance Indexes**:
   ```bash
   npm run db:apply-indexes
   ```

3. **Verify Database Setup**:
   Visit `https://your-app.up.railway.app/api/health` to verify database connectivity.

#### 6. Post-Deployment Verification

1. **Health Check**: Verify `https://your-app.up.railway.app/api/health` returns healthy status
2. **Admin Access**: Create an admin user and test admin dashboard access
3. **Document Upload**: Test document upload and analysis functionality
4. **Payment Flow**: Test Stripe payment integration
5. **Error Monitoring**: Verify Sentry is receiving error reports
6. **Email Delivery**: Test email functionality

## Alternative Deployment Options

### Docker Deployment

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   # Copy package files
   COPY package*.json ./
   RUN npm ci --only=production
   
   # Copy application code
   COPY . .
   
   # Build application
   RUN npm run build
   
   # Health check
   HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
     CMD curl -f http://localhost:5000/api/health || exit 1
   
   EXPOSE 5000
   
   CMD ["npm", "start"]
   ```

2. **Docker Compose** (with PostgreSQL):
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "5000:5000"
       environment:
         - NODE_ENV=production
         - DATABASE_URL=postgresql://postgres:password@db:5432/rentright
       depends_on:
         - db
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
         interval: 30s
         timeout: 10s
         retries: 3
   
     db:
       image: postgres:15
       environment:
         - POSTGRES_DB=rentright
         - POSTGRES_USER=postgres
         - POSTGRES_PASSWORD=password
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

### Heroku Deployment

1. **Create Heroku App**:
   ```bash
   heroku create your-app-name
   ```

2. **Add PostgreSQL**:
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

3. **Set Environment Variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set ENCRYPTION_KEY=your-encryption-key
   # ... add all other environment variables
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

## Environment Variables Reference

### Security Considerations

1. **Encryption Key Management**:
   - Generate unique encryption keys for each environment
   - Store keys securely outside of version control
   - Implement key rotation for long-term security

2. **API Key Security**:
   - Use production API keys for production deployment
   - Regularly rotate API keys
   - Monitor API key usage for security breaches

3. **Database Security**:
   - Use strong database passwords
   - Enable SSL connections for database
   - Regularly backup database

### Performance Tuning

1. **Memory Limits**:
   - Railway: Default 512MB, upgrade as needed
   - Monitor memory usage via health endpoint
   - Optimize for expected concurrent users

2. **Database Performance**:
   - Ensure all performance indexes are applied
   - Monitor database query performance
   - Consider read replicas for high traffic

3. **Rate Limiting**:
   - Adjust rate limits based on expected traffic
   - Monitor rate limit effectiveness
   - Implement progressive rate limiting

## Monitoring & Maintenance

### Health Monitoring

The application provides comprehensive health monitoring at `/api/health`:

```bash
# Check application health
curl https://your-app.up.railway.app/api/health

# Example healthy response
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "responseTime": 45,
  "dependencies": {
    "database": {"status": "healthy", "responseTime": 12},
    "openai": {"status": "healthy", "responseTime": 5},
    "stripe": {"status": "healthy", "responseTime": 3},
    "memory": {"status": "healthy", "message": "128MB used"}
  }
}
```

### Error Monitoring

1. **Sentry Setup**:
   - Create Sentry projects for frontend and backend
   - Configure alerts for critical errors
   - Set up performance monitoring

2. **Log Monitoring**:
   - Railway automatically collects application logs
   - Monitor for configuration validation errors
   - Watch for rate limiting and security events

### Database Maintenance

1. **Regular Backups**:
   - Railway provides automatic PostgreSQL backups
   - Implement additional backup strategy if needed
   - Test backup restoration procedures

2. **Performance Monitoring**:
   - Monitor database query performance
   - Watch for slow queries and optimize
   - Monitor database connection pool usage

### Security Maintenance

1. **Key Rotation**:
   - Regularly rotate encryption keys
   - Update API keys as recommended by providers
   - Monitor for security vulnerabilities

2. **Access Control**:
   - Regularly review admin access
   - Monitor admin dashboard usage
   - Implement IP restrictions if needed

## Troubleshooting

### Common Issues

1. **Configuration Validation Errors**:
   - Check application logs for validation errors
   - Verify all required environment variables are set
   - Ensure API keys are valid and have proper permissions

2. **Database Connection Issues**:
   - Verify DATABASE_URL is correct
   - Check database service is running
   - Verify network connectivity

3. **File Upload Issues**:
   - Check file upload directory permissions
   - Verify ENCRYPTION_KEY is set correctly
   - Monitor file storage space

4. **Payment Processing Issues**:
   - Verify Stripe keys are correct
   - Check Stripe dashboard for error details
   - Monitor Stripe webhook delivery

### Health Check Troubleshooting

```bash
# Test health endpoint
curl -v https://your-app.up.railway.app/api/health

# Check specific dependency status
curl -s https://your-app.up.railway.app/api/health | jq '.dependencies'

# Monitor response times
curl -w "@curl-format.txt" -s https://your-app.up.railway.app/api/health
```

### Performance Troubleshooting

1. **High Memory Usage**:
   - Check memory usage in health endpoint
   - Monitor for memory leaks
   - Consider upgrading Railway plan

2. **Slow Response Times**:
   - Check database query performance
   - Monitor API response times
   - Review rate limiting configuration

3. **Database Performance**:
   - Verify indexes are applied
   - Monitor database query logs
   - Consider database optimization

## Support

For deployment support:

1. **Railway Issues**: Check Railway documentation and community
2. **Application Issues**: Review application logs and health endpoint
3. **Database Issues**: Check PostgreSQL logs and connection status
4. **Security Issues**: Review Sentry error reports and application logs

## Checklist

Pre-deployment checklist:

- [ ] All required environment variables configured
- [ ] Database schema and indexes applied
- [ ] Health check endpoint responding correctly
- [ ] Admin user created and tested
- [ ] Payment integration tested
- [ ] Error monitoring configured
- [ ] Security headers verified
- [ ] Performance benchmarks established
- [ ] Backup procedures verified
- [ ] Monitoring and alerting configured