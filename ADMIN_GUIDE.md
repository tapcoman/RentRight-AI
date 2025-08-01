# RentRight-AI Admin Guide

This comprehensive guide covers all aspects of using the RentRight-AI admin dashboard, including setup, navigation, monitoring, and management tasks.

## Overview

The RentRight-AI admin dashboard provides complete oversight and management capabilities for the application, including real-time analytics, user management, document processing oversight, payment tracking, and system health monitoring.

## Getting Started

### Prerequisites

1. **Admin Account**: You need a user account with admin privileges
2. **Admin API Key**: Configured in environment variables
3. **Database Access**: Admin functions require database connectivity

### Creating an Admin User

1. **Register a regular user** with "admin" in the username:
   ```bash
   # Example admin usernames
   admin
   administrator
   admin-john
   site-admin
   ```

2. **Verify admin privileges** by attempting to access `/admin/login`

### Admin Login Process

1. **Navigate to Admin Login**
   - Visit `https://your-app.up.railway.app/admin/login`
   - Or click "Admin" link if available in the main navigation

2. **Enter Credentials**
   - Username: Your admin username
   - Password: Your admin password

3. **Access Dashboard**
   - Upon successful login, you'll be redirected to the admin dashboard
   - The dashboard loads with real-time metrics and analytics

## Dashboard Overview

### Main Dashboard (`/admin`)

The main dashboard provides a comprehensive overview of your application's performance and status.

#### Key Metrics Cards

**User Statistics**
- **Total Users**: Complete count of registered users
- **New Users Today**: Users registered in the last 24 hours
- **New Users This Week**: Weekly registration count
- **Active Users**: Users with recent activity

**Document Statistics**
- **Total Documents**: Complete count of uploaded documents
- **Processed Documents**: Successfully analyzed documents
- **Failed Documents**: Documents that failed processing
- **Documents Today**: Documents uploaded in the last 24 hours
- **Processing Rate**: Success rate percentage

**Payment Statistics**
- **Total Revenue**: Cumulative revenue in GBP
- **Revenue Today**: Today's revenue
- **Revenue This Week**: Weekly revenue
- **Total Transactions**: Complete payment count
- **Success Rate**: Payment success percentage
- **Average Transaction**: Mean transaction value

**System Health**
- **Uptime**: Application uptime in seconds
- **Memory Usage**: Current memory consumption
- **Response Time**: Average API response time
- **Error Rate**: Current error percentage
- **Active Connections**: Current database connections

#### Analytics Charts

**Daily Activity Chart**
- Line chart showing user activity over time
- Data points include registrations, document uploads, payments
- Configurable time ranges: 24h, 7d, 30d, 90d

**Payment Trends Chart**
- Bar chart displaying revenue trends
- Daily, weekly, or monthly view options
- Shows successful vs failed payment ratios

**Document Types Distribution**
- Pie chart showing document type breakdown
- Categories: lease agreements, tenancy agreements, general documents
- Processing success rates by type

**Recent Activity Feed**
- Real-time stream of application activity
- User registrations, document uploads, payments
- Clickable items for detailed views

### Time Range Filtering

Use the time range selector to filter data:
- **24h**: Last 24 hours
- **7d**: Last 7 days (default)
- **30d**: Last 30 days
- **90d**: Last 90 days

## User Management (`/admin/users`)

### User List View

The user management interface provides comprehensive user oversight:

#### User Table Columns
- **ID**: Unique user identifier
- **Username**: User's chosen username
- **Email**: User's email address
- **Registration Date**: Account creation timestamp
- **Last Login**: Most recent login timestamp
- **Documents**: Count of uploaded documents
- **Total Spent**: Cumulative payment amount
- **Status**: Account status indicator

#### Search and Filtering

**Search Users**
- Search by username or email
- Real-time search results
- Case-insensitive matching

**Sort Options**
- Sort by: Registration Date, Username, Email, Last Login
- Sort order: Ascending or Descending
- Persistent sort preferences

**Pagination**
- Configurable results per page (10, 20, 50, 100)
- Navigation controls for large user bases
- Jump to specific page functionality

### User Details View

Click on any user to view detailed information:

#### User Profile
- Complete user information
- Registration details and metadata
- Account status and permissions

#### Activity Statistics
- Document upload history
- Payment transaction history
- Login frequency and patterns
- Usage analytics and trends

#### Recent Activity Timeline
- Chronological activity feed
- Document uploads with status
- Payment transactions
- Login events and sessions

## Document Management (`/admin/documents`)

### Document Overview

Monitor all document processing activity:

#### Document List Features
- **File Information**: Original filename, file size, upload date
- **Processing Status**: Pending, processed, failed status indicators
- **User Association**: Link to document owner
- **Analysis Type**: Lease, tenancy agreement, or general analysis
- **Processing Time**: Time taken for analysis completion
- **Actions**: View, download, or delete document options

#### Status Filtering
- **All Documents**: Complete document list
- **Processed**: Successfully analyzed documents
- **Pending**: Documents awaiting analysis
- **Failed**: Documents with processing errors

#### Document Details
Click on any document to view:
- Complete analysis results
- Processing logs and metadata
- User information and context
- Payment status if applicable
- Error details for failed documents

### Processing Analytics

Monitor document processing performance:
- **Processing Rate**: Overall success percentage
- **Average Processing Time**: Mean analysis duration
- **Error Categories**: Common failure reasons
- **Peak Usage Times**: Busiest upload periods

## Payment Management (`/admin/payments`)

### Payment Overview

Track all financial transactions:

#### Payment Transaction List
- **Transaction ID**: Unique payment identifier
- **Amount**: Transaction value in GBP
- **Status**: Success, failed, pending, refunded
- **Service Type**: Detailed analysis, legal review, lease rewrite
- **Customer**: User information and email
- **Date**: Transaction timestamp
- **Payment Method**: Card details (last 4 digits)

#### Revenue Analytics

**Revenue Metrics**
- Daily, weekly, monthly revenue totals
- Revenue trends and growth analysis
- Average transaction values
- Customer lifetime value

**Payment Success Analysis**
- Success vs failure rates
- Common failure reasons
- Processing time analytics
- Refund and dispute tracking

#### Transaction Details

Click on any payment to view:
- Complete Stripe transaction details
- Customer payment method information
- Service delivery status
- Refund and dispute history
- Related document and user information

### Financial Reports

Generate comprehensive financial reports:
- **Revenue Reports**: Detailed financial summaries
- **Tax Reports**: Transaction data for accounting
- **Refund Reports**: Refund and dispute analysis
- **Customer Reports**: Customer payment patterns

## System Health Monitoring

### Health Dashboard

Monitor application health and performance:

#### System Metrics
- **Uptime**: Application availability
- **Memory Usage**: RAM consumption and trends
- **Response Times**: API performance metrics
- **Error Rates**: Application error frequency
- **Database Performance**: Query times and connection health

#### Dependency Monitoring
- **Database Status**: PostgreSQL connectivity and performance
- **OpenAI API**: Service availability and response times
- **Stripe API**: Payment processing health
- **Email Service**: SendGrid delivery status
- **File Storage**: Disk usage and availability

### Performance Analytics

Track application performance over time:
- **Response Time Trends**: API endpoint performance
- **Memory Usage Patterns**: Resource consumption analysis
- **Error Rate Analysis**: Error frequency and patterns
- **User Load Analysis**: Concurrent user patterns

### Alert Management

Configure and manage system alerts:
- **Error Rate Alerts**: High error frequency notifications
- **Performance Alerts**: Slow response time warnings
- **Resource Alerts**: High memory or disk usage warnings
- **Dependency Alerts**: External service failure notifications

## Configuration Management

### Environment Configuration

Monitor and validate application configuration:

#### Configuration Status
- **Required Variables**: Status of critical environment variables
- **Optional Variables**: Status of recommended configuration
- **Validation Results**: Configuration validation outcomes
- **Security Settings**: Security-related configuration status

#### Configuration Changes
- Track configuration changes over time
- Validate configuration before deployment
- Monitor configuration drift
- Backup configuration settings

### Security Configuration

Monitor security-related settings:
- **Encryption Status**: File encryption configuration
- **API Key Status**: External service API key validation
- **Rate Limiting**: Current rate limiting configuration
- **Security Headers**: HTTP security header status

## Maintenance Tasks

### Regular Maintenance

#### Daily Tasks
- **Review Dashboard Metrics**: Check key performance indicators
- **Monitor Error Rates**: Investigate any unusual error patterns
- **Check System Health**: Verify all dependencies are healthy
- **Review Recent Activity**: Monitor user activity patterns

#### Weekly Tasks
- **User Activity Analysis**: Review user engagement trends
- **Performance Review**: Analyze response times and system performance
- **Financial Review**: Check revenue trends and payment processing
- **Security Review**: Monitor for security issues or anomalies

#### Monthly Tasks
- **Comprehensive Health Check**: Full system health assessment
- **Performance Optimization**: Identify and address performance issues
- **Security Audit**: Review security configurations and logs
- **Capacity Planning**: Assess resource usage and scaling needs

### Troubleshooting

#### Common Issues and Solutions

**High Error Rates**
1. Check system health endpoint (`/api/health`)
2. Review error logs in Sentry dashboard
3. Verify database connectivity and performance
4. Check external API service status

**Slow Performance**
1. Monitor memory usage and optimize if needed
2. Check database query performance
3. Review API response times
4. Analyze user load patterns

**Payment Processing Issues**
1. Verify Stripe API key configuration
2. Check Stripe dashboard for errors
3. Review payment webhook delivery
4. Monitor payment success rates

**Document Processing Failures**
1. Check OpenAI API key and quotas
2. Review file upload permissions
3. Verify encryption key configuration
4. Monitor file storage space

#### Diagnostic Tools

**Health Check Endpoint**
```bash
curl https://your-app.up.railway.app/api/health
```

**Configuration Validation**
- Check application startup logs for configuration errors
- Use the configuration validator in the admin dashboard

**Database Performance**
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

## Security Management

### User Security

#### Account Management
- **User Account Review**: Regular review of user accounts
- **Suspicious Activity Monitoring**: Unusual login patterns
- **Failed Login Attempts**: Monitor brute force attempts
- **Account Lockout Management**: Handle locked accounts

#### Access Control
- **Admin User Management**: Add/remove admin privileges
- **Session Management**: Monitor active user sessions
- **Permission Auditing**: Review user permissions regularly

### Data Security

#### File Security
- **Encryption Status**: Monitor file encryption health
- **Key Rotation**: Manage encryption key rotation
- **Access Logging**: Track file access patterns
- **Backup Security**: Secure backup procedures

#### API Security
- **Rate Limiting**: Monitor and adjust rate limits
- **API Key Management**: Rotate API keys regularly
- **Request Monitoring**: Monitor API usage patterns
- **Security Headers**: Verify security header configuration

## Advanced Features

### Analytics and Reporting

#### Custom Reports
- **User Activity Reports**: Detailed user behavior analysis
- **Financial Reports**: Comprehensive revenue analysis
- **Performance Reports**: System performance summaries
- **Security Reports**: Security incident summaries

#### Data Export
- **CSV Export**: Export data for external analysis
- **API Access**: Programmatic access to admin data
- **Report Scheduling**: Automated report generation
- **Data Visualization**: Custom charts and graphs

### Integration Management

#### External Service Monitoring
- **API Integration Health**: Monitor external service status
- **Webhook Management**: Manage incoming webhooks
- **Service Configuration**: Configure external service settings
- **Error Handling**: Handle external service failures

#### Third-party Services
- **Sentry Integration**: Error monitoring configuration
- **Stripe Integration**: Payment processing management
- **SendGrid Integration**: Email service management
- **Analytics Integration**: Google Analytics configuration

## Mobile and Responsive Design

The admin dashboard is fully responsive and works on:
- **Desktop**: Full-featured dashboard experience
- **Tablet**: Optimized layout for tablet viewing
- **Mobile**: Essential features accessible on mobile devices

### Mobile Optimization
- Touch-friendly interface elements
- Optimized data tables for small screens
- Responsive charts and graphs
- Mobile-friendly navigation

## API Access

### Admin API Endpoints

Access admin data programmatically:

```bash
# Get dashboard metrics
curl -X GET https://your-app.up.railway.app/api/admin/dashboard \
  -H "x-admin-key: your-admin-api-key" \
  -H "Cookie: connect.sid=your-session-cookie"

# Get user list
curl -X GET https://your-app.up.railway.app/api/admin/users \
  -H "x-admin-key: your-admin-api-key" \
  -H "Cookie: connect.sid=your-session-cookie"
```

### Automation Scripts

Create scripts to automate admin tasks:
- **Health Monitoring**: Automated health checks
- **Report Generation**: Scheduled report creation
- **Data Cleanup**: Automated maintenance tasks
- **Alert Management**: Custom alert handling

## Support and Resources

### Getting Help

1. **Health Check Endpoint**: First check system health at `/api/health`
2. **Application Logs**: Review Railway logs for errors
3. **Sentry Dashboard**: Check error monitoring for issues
4. **Admin Dashboard**: Use built-in diagnostic tools

### Best Practices

1. **Regular Monitoring**: Check dashboard daily for issues
2. **Proactive Maintenance**: Address issues before they become critical
3. **Security Vigilance**: Monitor for security incidents regularly
4. **Performance Optimization**: Continuously optimize system performance
5. **Data Backup**: Ensure regular backups of critical data

### Training and Documentation

- **API Documentation**: Complete API reference available
- **Deployment Guide**: Comprehensive deployment instructions
- **Production Guide**: Production readiness checklist
- **Security Guide**: Security best practices and configurations

The admin dashboard provides comprehensive control over your RentRight-AI application, enabling effective monitoring, management, and optimization of all system components.