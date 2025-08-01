# RentRight-AI API Documentation

This document provides comprehensive API documentation for the RentRight-AI application, including all endpoints, request/response formats, authentication requirements, and usage examples.

## Base URL

- **Development**: `http://localhost:5000`
- **Production**: `https://your-app.up.railway.app`

## Authentication

The API uses session-based authentication with Passport.js. Users must be authenticated to access protected endpoints.

### Authentication Headers

```http
Content-Type: application/json
Cookie: connect.sid=session-cookie-value
```

### Admin Authentication

Admin endpoints require an additional API key header:

```http
x-admin-key: your-admin-api-key
```

## Core API Endpoints

### Authentication Endpoints

#### Register User

Create a new user account.

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 123,
    "username": "testuser",
    "email": "test@example.com",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation error (username/email already exists)
- `500` - Internal server error

#### Login User

Authenticate a user and create a session.

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 123,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `429` - Too many login attempts (rate limited)

#### Logout User

End user session.

```http
POST /api/auth/logout
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Get Current User

Get current authenticated user information.

```http
GET /api/auth/me
```

**Response (200):**
```json
{
  "user": {
    "id": 123,
    "username": "testuser",
    "email": "test@example.com",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Not authenticated

### Document Management Endpoints

#### Upload Document

Upload a document for analysis.

```http
POST /api/documents/upload
```

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: Document file (PDF, DOC, DOCX, TXT)
- `analysisType`: "lease" | "tenancy_agreement" | "general"

**Response (200):**
```json
{
  "success": true,
  "documentId": "doc_123456",
  "message": "Document uploaded successfully",
  "analysisInProgress": true
}
```

**Error Responses:**
- `400` - Invalid file type or size
- `401` - Not authenticated
- `413` - File too large
- `429` - Upload rate limit exceeded

#### Get Document Analysis

Retrieve analysis results for a document.

```http
GET /api/documents/:documentId
```

**Path Parameters:**
- `documentId`: The document ID returned from upload

**Response (200):**
```json
{
  "document": {
    "id": "doc_123456",
    "filename": "lease_agreement.pdf",
    "uploadedAt": "2024-01-15T10:00:00.000Z",
    "status": "processed",
    "analysisType": "lease"
  },
  "analysis": {
    "id": "analysis_789",
    "summary": "Comprehensive lease analysis summary...",
    "keyFindings": [
      {
        "category": "rent_increases",
        "severity": "medium",
        "description": "Rent increase clause may be unfavorable",
        "recommendation": "Review with legal advisor"
      }
    ],
    "riskScore": 65,
    "completedAt": "2024-01-15T10:05:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - Not authorized to view this document
- `404` - Document not found

#### Get User Documents

List all documents for the authenticated user.

```http
GET /api/documents
```

**Query Parameters:**
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Pagination offset (default: 0)
- `status`: Filter by status ("pending", "processed", "failed")

**Response (200):**
```json
{
  "documents": [
    {
      "id": "doc_123456",
      "filename": "lease_agreement.pdf",
      "uploadedAt": "2024-01-15T10:00:00.000Z",
      "status": "processed",
      "analysisType": "lease"
    }
  ],
  "total": 1,
  "hasMore": false
}
```

#### Delete Document

Delete a document and its analysis.

```http
DELETE /api/documents/:documentId
```

**Response (200):**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - Not authorized to delete this document
- `404` - Document not found

### Payment Endpoints

#### Create Payment Intent

Create a Stripe payment intent for premium features.

```http
POST /api/payments/create-payment-intent
```

**Request Body:**
```json
{
  "documentId": "doc_123456",
  "serviceType": "detailed_analysis" | "legal_review" | "lease_rewrite",
  "amount": 1500,
  "currency": "gbp"
}
```

**Response (200):**
```json
{
  "clientSecret": "pi_xxxxx_secret_xxxxx",
  "paymentIntentId": "pi_xxxxx",
  "amount": 1500,
  "currency": "gbp"
}
```

**Error Responses:**
- `400` - Invalid request parameters
- `401` - Not authenticated
- `404` - Document not found

#### Confirm Payment

Confirm a successful payment.

```http
POST /api/payments/confirm
```

**Request Body:**
```json
{
  "paymentIntentId": "pi_xxxxx",
  "documentId": "doc_123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment confirmed",
  "serviceUnlocked": true
}
```

### Email & Communication Endpoints

#### Send Document Report

Email a document analysis report.

```http
POST /api/documents/:documentId/email
```

**Request Body:**
```json
{
  "recipientEmail": "user@example.com",
  "includeRecommendations": true,
  "format": "pdf" | "html"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Report sent successfully",
  "emailId": "email_123456"
}
```

### CAPTCHA & Security Endpoints

#### Generate CAPTCHA

Generate a CAPTCHA challenge for security verification.

```http
GET /api/captcha
```

**Response (200):**
```json
{
  "captchaId": "captcha_123456",
  "captchaImage": "data:image/svg+xml;base64,..."
}
```

#### Verify CAPTCHA

Verify a CAPTCHA response.

```http
POST /api/captcha/verify
```

**Request Body:**
```json
{
  "captchaId": "captcha_123456",
  "captchaResponse": "ABC123"
}
```

**Response (200):**
```json
{
  "success": true,
  "verified": true
}
```

## Admin API Endpoints

Admin endpoints require authentication and admin privileges (username contains "admin").

### Admin Dashboard

#### Get Dashboard Metrics

Retrieve comprehensive dashboard metrics.

```http
GET /api/admin/dashboard
```

**Headers:**
```http
x-admin-key: your-admin-api-key
```

**Query Parameters:**
- `timeRange`: "24h" | "7d" | "30d" | "90d" (default: "7d")

**Response (200):**
```json
{
  "userStats": {
    "totalUsers": 1250,
    "newUsersToday": 15,
    "newUsersThisWeek": 89,
    "activeUsers": 340
  },
  "documentStats": {
    "totalDocuments": 3450,
    "processedDocuments": 3380,
    "failedDocuments": 45,
    "documentsToday": 25,
    "processingRate": 98.7
  },
  "paymentStats": {
    "totalRevenue": 45750.00,
    "revenueToday": 340.00,
    "revenueThisWeek": 2150.00,
    "totalTransactions": 892,
    "successfulPayments": 867,
    "failedPayments": 25,
    "averageTransactionValue": 51.29
  },
  "systemHealth": {
    "uptime": 2580000,
    "memoryUsage": 245.7,
    "responseTime": 89,
    "errorRate": 0.15,
    "activeConnections": 12
  },
  "chartData": {
    "dailyActivity": [...],
    "paymentTrends": [...],
    "documentTypes": [...]
  }
}
```

### User Management

#### Get Users List

Retrieve paginated list of users.

```http
GET /api/admin/users
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)
- `search`: Search by username or email
- `sortBy`: "createdAt" | "username" | "email" (default: "createdAt")
- `sortOrder`: "asc" | "desc" (default: "desc")

**Response (200):**
```json
{
  "users": [
    {
      "id": 123,
      "username": "testuser",
      "email": "test@example.com",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "lastLoginAt": "2024-01-15T15:30:00.000Z",
      "documentCount": 5,
      "totalSpent": 75.00
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 25,
    "totalUsers": 1250,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get User Details

Get detailed information about a specific user.

```http
GET /api/admin/users/:userId
```

**Response (200):**
```json
{
  "user": {
    "id": 123,
    "username": "testuser",
    "email": "test@example.com",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "lastLoginAt": "2024-01-15T15:30:00.000Z"
  },
  "statistics": {
    "documentCount": 5,
    "totalSpent": 75.00,
    "averageAnalysisTime": 120,
    "successfulPayments": 3,
    "failedPayments": 0
  },
  "recentActivity": [
    {
      "type": "document_upload",
      "timestamp": "2024-01-15T14:00:00.000Z",
      "details": "Uploaded lease_agreement.pdf"
    }
  ]
}
```

### Document Management (Admin)

#### Get All Documents

Retrieve all documents with admin view.

```http
GET /api/admin/documents
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `status`: Filter by status
- `userId`: Filter by user ID
- `dateFrom`: Start date filter (ISO 8601)
- `dateTo`: End date filter (ISO 8601)

**Response (200):**
```json
{
  "documents": [
    {
      "id": "doc_123456",
      "filename": "lease_agreement.pdf",
      "uploadedAt": "2024-01-15T10:00:00.000Z",
      "status": "processed",
      "analysisType": "lease",
      "user": {
        "id": 123,
        "username": "testuser"
      },
      "processingTime": 120,
      "fileSize": 2048576
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 173,
    "totalDocuments": 3450
  }
}
```

### Payment Management (Admin)

#### Get All Payments

Retrieve all payment transactions.

```http
GET /api/admin/payments
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `status`: Filter by payment status
- `dateFrom`: Start date filter
- `dateTo`: End date filter

**Response (200):**
```json
{
  "payments": [
    {
      "id": "payment_123",
      "paymentIntentId": "pi_xxxxx",
      "amount": 1500,
      "currency": "gbp",
      "status": "succeeded",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "serviceType": "detailed_analysis",
      "user": {
        "id": 123,
        "username": "testuser",
        "email": "test@example.com"
      },
      "document": {
        "id": "doc_123456",
        "filename": "lease_agreement.pdf"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 45,
    "totalPayments": 892
  },
  "summary": {
    "totalRevenue": 45750.00,
    "averageTransaction": 51.29,
    "successRate": 97.2
  }
}
```

## Health & Monitoring Endpoints

### Health Check

Comprehensive health check endpoint for monitoring and load balancers.

```http
GET /api/health
GET /health
```

**Response (200) - Healthy:**
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

**Response (503) - Unhealthy:**
```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "responseTime": 145,
  "dependencies": {
    "database": {
      "status": "unhealthy",
      "message": "Connection failed",
      "responseTime": 5000
    }
  }
}
```

## Response Codes

### Standard HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 413 | Payload Too Large | File size exceeds limit |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Response Format

All error responses follow this format:

```json
{
  "error": true,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

### Rate Limit Headers

All responses include rate limit headers:

```http
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 199
X-RateLimit-Reset: 1642248000
```

### Rate Limits by Endpoint Type

| Endpoint Type | Window | Limit |
|---------------|--------|-------|
| General API | 15 minutes | 200 requests |
| Authentication | 1 hour | 30 requests |
| Document Upload | 1 hour | 10 requests |
| CAPTCHA | 5 minutes | 20 requests |

### Rate Limit Exceeded Response

```json
{
  "error": true,
  "message": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

## File Upload Specifications

### Supported File Types
- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Plain text (.txt)

### File Size Limits
- Maximum file size: 10MB
- Minimum file size: 1KB

### Upload Security
- All files are encrypted at rest
- Virus scanning (if configured)
- File type validation
- Content security scanning

## Development & Testing

### Testing Endpoints

Development-only endpoints for testing (not available in production):

#### Test Sentry Error

```http
POST /api/test-sentry
```

**Request Body:**
```json
{
  "type": "error" | "async" | "message"
}
```

### Example API Calls

#### Upload and Analyze Document

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password"}' \
  -c cookies.txt

# 2. Upload document
curl -X POST http://localhost:5000/api/documents/upload \
  -b cookies.txt \
  -F "file=@lease_agreement.pdf" \
  -F "analysisType=lease"

# 3. Get analysis results
curl -X GET http://localhost:5000/api/documents/doc_123456 \
  -b cookies.txt
```

#### Admin Dashboard Access

```bash
# 1. Admin login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin_password"}' \
  -c admin_cookies.txt

# 2. Get dashboard metrics
curl -X GET http://localhost:5000/api/admin/dashboard \
  -H "x-admin-key: your-admin-api-key" \
  -b admin_cookies.txt
```

## SDK & Libraries

### JavaScript/TypeScript SDK

The application includes TypeScript type definitions for all API responses:

```typescript
// Example type usage
interface DocumentAnalysis {
  document: {
    id: string;
    filename: string;
    status: 'pending' | 'processed' | 'failed';
  };
  analysis: {
    summary: string;
    keyFindings: Finding[];
    riskScore: number;
  };
}
```

### API Client Configuration

```typescript
// Example API client setup
const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL || 'http://localhost:5000',
  timeout: 30000,
  withCredentials: true, // Required for session cookies
});
```

## Changelog

### Version 1.0.0
- Initial API release
- Authentication endpoints
- Document upload and analysis
- Payment processing
- Admin dashboard API
- Health monitoring endpoints
- Comprehensive error handling
- Rate limiting implementation

For support and additional information, refer to the main README.md and other documentation files.