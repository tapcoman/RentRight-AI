# RentRight-AI

A comprehensive AI-powered tenant rights analysis application that helps tenants understand their lease agreements and know their rights. Built with modern web technologies and production-ready features for secure, scalable deployment.

## Features

### Core Functionality
- **AI-Powered Document Analysis**: Upload lease agreements and get comprehensive analysis using OpenAI
- **Tenant Rights Information**: Detailed explanations of UK tenancy laws and tenant rights
- **Document Processing**: Support for PDF, DOC, DOCX, and TXT file formats
- **Secure File Handling**: End-to-end encryption for uploaded documents
- **Payment Integration**: Stripe-powered payment processing for premium features
- **Email Reports**: Automated email delivery of analysis results

### Production-Ready Improvements

#### 1. Database Performance Enhancements
- **Optimized Indexes**: 17 critical database indexes for improved query performance
- **Foreign Key Optimization**: Indexes on all foreign key relationships
- **Composite Indexes**: Strategic multi-column indexes for complex queries
- **Time-based Queries**: Optimized indexes for date-range operations
- **Migration Scripts**: Professional database migration tools and processes

#### 2. Configuration Management
- **Environment Variables**: All hardcoded values moved to configurable environment variables
- **Configuration Validation**: Comprehensive validation system with startup checks
- **Production Configuration**: Secure configuration management for deployment
- **Rate Limiting**: Configurable rate limiting for different endpoints
- **Security Settings**: Configurable encryption, API keys, and security headers

#### 3. Error Monitoring & Observability
- **Sentry Integration**: Comprehensive error tracking for both frontend and backend
- **Privacy Protection**: Automatic filtering of sensitive data from error reports
- **Error Boundaries**: React error boundaries with user-friendly fallbacks
- **Performance Monitoring**: Request tracing and performance metrics
- **Session Replay**: User session recording with privacy masking

#### 4. Health Monitoring
- **Comprehensive Health Endpoint**: `/api/health` with detailed system status
- **Dependency Monitoring**: Real-time checks for database, APIs, and services
- **Performance Metrics**: Response times, memory usage, and uptime tracking
- **Railway Compatibility**: Health checks optimized for Railway deployment
- **Load Balancer Ready**: Suitable for production load balancer health checks

#### 5. Admin Dashboard
- **Real-time Analytics**: Comprehensive dashboard with key metrics and charts
- **User Management**: Complete user administration interface
- **Document Oversight**: Monitor document processing and status
- **Payment Tracking**: Revenue analytics and transaction monitoring
- **System Health**: Monitor application performance and errors
- **Secure Authentication**: Role-based access control for admin features

#### 6. Railway Deployment Readiness
- **Optimized Configuration**: Production-ready settings for Railway platform
- **Environment Setup**: Complete environment variable configuration
- **Health Check Integration**: Native Railway health monitoring support
- **Performance Optimized**: Efficient resource usage for cloud deployment
- **Security Hardened**: Production security headers and configurations

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **shadcn/ui** component library
- **TanStack Query** for data fetching
- **Wouter** for routing
- **Stripe Elements** for payment processing

### Backend
- **Node.js** with Express and TypeScript
- **Drizzle ORM** with PostgreSQL
- **OpenAI API** for document analysis
- **Stripe API** for payment processing
- **SendGrid** for email services
- **Passport.js** for authentication
- **Express Rate Limiting** for security

### Infrastructure & Monitoring
- **PostgreSQL** database with optimized indexes
- **Sentry** for error monitoring
- **Railway** deployment platform
- **File encryption** for document security
- **Health monitoring** with comprehensive checks

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key
- Stripe API keys

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RentRight-AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration values
   ```

4. **Set up the database**
   ```bash
   # Push schema to database
   npm run db:push
   
   # Apply performance indexes
   npm run db:apply-indexes
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Visit the application**
   Open http://localhost:5000 in your browser

## Configuration

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `OPENAI_API_KEY` | OpenAI API key for document analysis | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments | Yes |
| `ENCRYPTION_KEY` | 64-character hex string for file encryption | Yes |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe public key for frontend | - |
| `SENDGRID_API_KEY` | SendGrid API key for emails | - |
| `SENTRY_DSN` | Sentry DSN for error monitoring | - |
| `VITE_SENTRY_DSN` | Sentry DSN for frontend monitoring | - |

See `.env.example` for complete configuration options.

## Deployment

### Railway Deployment (Recommended)

1. **Prepare for deployment**
   ```bash
   # Build the application
   npm run build
   ```

2. **Configure environment variables** in Railway dashboard with production values

3. **Deploy** using Railway's automatic deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## API Endpoints

### Core API
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/documents/upload` - Document upload and analysis
- `GET /api/documents/:id` - Retrieve document analysis
- `POST /api/payments/create-payment-intent` - Create Stripe payment

### Admin API
- `GET /api/admin/dashboard` - Dashboard metrics
- `GET /api/admin/users` - User management
- `GET /api/admin/documents` - Document oversight
- `GET /api/admin/payments` - Payment tracking

### Monitoring
- `GET /api/health` - Comprehensive health check
- `GET /health` - Simple health check alias

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference.

## Admin Dashboard

Access the admin dashboard at `/admin` with administrator credentials.

### Features
- Real-time analytics and metrics
- User management and monitoring
- Document processing oversight
- Payment and revenue tracking
- System health monitoring

See [ADMIN_GUIDE.md](ADMIN_GUIDE.md) for detailed admin documentation.

## Database Performance

The application includes optimized database indexes for:
- User lookups by username and email
- Document queries by user and date
- Analysis retrieval by document
- Payment tracking and reporting
- Session management
- Template categorization

Run `npm run db:apply-indexes` to apply all performance optimizations.

## Security Features

- **File Encryption**: All uploaded documents encrypted at rest
- **Input Validation**: Comprehensive input validation and sanitization
- **Rate Limiting**: Configurable rate limiting for all endpoints
- **CSRF Protection**: Cross-site request forgery protection
- **Secure Headers**: Production security headers
- **Authentication**: Secure session-based authentication
- **Privacy Protection**: Sensitive data filtering in error reports

## Monitoring & Observability

### Health Monitoring
- Comprehensive health checks at `/api/health`
- Database connectivity monitoring
- API dependency validation
- Memory usage tracking
- Response time monitoring

### Error Monitoring
- Sentry integration for error tracking
- Automatic error reporting and alerting
- Privacy-protected error context
- Performance monitoring and tracing

## Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push database schema |
| `npm run db:apply-indexes` | Apply performance indexes |

### Development Features
- Hot module replacement with Vite
- TypeScript support throughout
- Comprehensive error boundaries
- Development-only testing components
- Automatic configuration validation

## File Structure

```
RentRight-AI/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── lib/           # Utilities and configurations
│   │   └── hooks/         # Custom React hooks
├── server/                # Backend Express application
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
│   ├── index.ts           # Server entry point
│   └── ...                # Additional server modules
├── shared/                # Shared types and schemas
├── migrations/            # Database migration scripts
└── public/               # Static assets
```

## Production Ready Features

This application is production-ready with:

- ✅ **Performance Optimization**: Database indexes and query optimization
- ✅ **Security**: Encryption, authentication, and secure headers
- ✅ **Monitoring**: Health checks, error tracking, and analytics
- ✅ **Scalability**: Configurable rate limiting and resource management
- ✅ **Observability**: Comprehensive logging and monitoring
- ✅ **Admin Tools**: Complete administrative interface
- ✅ **Deployment**: Railway-optimized configuration

See [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) for detailed production deployment checklist.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Check the documentation files in this repository
- Review the admin dashboard for system monitoring
- Check application health at `/api/health`
- Review Sentry error reports for production issues