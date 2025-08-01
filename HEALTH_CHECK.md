# Health Check Endpoint

The RentRight-AI application includes a comprehensive health check endpoint at `/api/health` designed for Railway deployment monitoring and load balancer health checks.

## Endpoint Details

- **URL**: `/api/health` or `/health`
- **Method**: GET
- **Content-Type**: `application/json`

## Response Format

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "responseTime": 45,
  "dependencies": {
    "database": {
      "status": "healthy",
      "message": "Connected successfully",
      "responseTime": 12
    },
    "openai": {
      "status": "healthy", 
      "message": "API key configured",
      "responseTime": 5
    },
    "stripe": {
      "status": "healthy",
      "message": "API key configured", 
      "responseTime": 3
    },
    "memory": {
      "status": "healthy",
      "message": "128MB used",
      "responseTime": 1
    }
  },
  "environment": {
    "node_version": "v18.17.0",
    "platform": "linux",
    "arch": "x64",
    "pid": 1234
  }
}
```

## Status Values

### Overall Status
- `healthy`: All systems operational
- `degraded`: Some non-critical issues detected
- `unhealthy`: Critical systems failing

### Dependency Status
- `healthy`: System functioning normally
- `warning`: System functioning but with concerns (e.g., high memory usage)
- `unhealthy`: System failing or misconfigured

## HTTP Status Codes

- **200 OK**: Service is healthy and all dependencies are functioning
- **503 Service Unavailable**: Service is degraded or critical dependencies are failing

## Monitored Dependencies

### Database (PostgreSQL)
- Tests actual database connectivity with a simple query
- Critical for application functionality
- Failure results in 503 status code

### OpenAI API
- Validates API key configuration
- Lightweight check (no actual API calls to avoid costs)
- Degraded status if misconfigured

### Stripe API  
- Validates API key configuration
- Lightweight check (no actual API calls)
- Degraded status if misconfigured

### Memory Usage
- Monitors application memory consumption
- Warning threshold at 90% of configured limit (default: 512MB)
- Helps detect memory leaks or resource issues

## Usage Examples

### Basic Health Check
```bash
curl http://localhost:5000/api/health
```

### Health Check with Status Code Verification
```bash
curl -f http://localhost:5000/api/health || echo "Service unhealthy"
```

### Test Script
Use the included test script:
```bash
node test-health-endpoint.js [port]
```

## Railway Deployment Integration

For Railway deployments, configure health checks in your `railway.toml`:

```toml
[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 30
```

## Load Balancer Configuration

### Nginx
```nginx
location /health {
    access_log off;
    proxy_pass http://backend/api/health;
    proxy_set_header Host $host;
}
```

### Docker Health Check
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1
```

## Monitoring and Alerting

The health endpoint provides rich data for monitoring systems:

- **Response Time**: Track API performance
- **Memory Usage**: Monitor resource consumption  
- **Dependency Status**: Alert on external service issues
- **Uptime**: Track service availability

### Example Monitoring Queries

Monitor average response time:
```
avg(health_check_response_time_ms)
```

Alert on database connectivity:
```
health_check_database_status != "healthy"
```

Track memory usage trend:
```
health_check_memory_usage_mb
```

## Performance Considerations

- Health checks are lightweight and typically complete in < 100ms
- Database check performs minimal query (`SELECT 1`)
- External API checks validate configuration only (no actual API calls)
- Memory checks use built-in Node.js process metrics
- Designed for frequent polling (every 30 seconds or more)