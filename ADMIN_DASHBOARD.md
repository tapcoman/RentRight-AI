# Admin Dashboard - RentRight-AI

## Overview

The Admin Dashboard provides comprehensive monitoring and management capabilities for the RentRight-AI application. It includes real-time analytics, user management, document processing oversight, payment tracking, and system health monitoring.

## Features

### 1. Dashboard Analytics (`/admin`)
- **Key Metrics**: User counts, document processing stats, revenue, system health
- **Real-time Charts**: Daily activity trends, payment analytics, document type distribution
- **Activity Feed**: Recent user registrations, document uploads, payments
- **System Health**: Uptime monitoring, error rates, performance metrics
- **Time Range Filtering**: 24h, 7d, 30d, 90d views

### 2. User Management (`/admin/users`)
- **User Listing**: Paginated view of all registered users
- **Search Functionality**: Find users by username or email
- **User Details**: Registration dates, last login, account status
- **User Statistics**: Total users, active users, new registrations

### 3. Document Management (`/admin/documents`)
- **Document Overview**: All uploaded documents with processing status
- **Status Filtering**: Processed, pending, paid documents
- **User Association**: Link documents to their uploading users
- **Processing Statistics**: Success rates, failure analysis

### 4. Payment Management (`/admin/payments`)
- **Payment Tracking**: All transactions with detailed status
- **Revenue Analytics**: Daily, weekly, monthly revenue trends
- **Transaction Details**: Payment intents, service types, customer emails
- **Payment Status**: Success/failure rates and analysis

## Authentication & Security

### Admin Access Control
- **Authentication Required**: Only authenticated users can access admin routes
- **Admin Role Check**: Username must be 'admin' or contain 'admin'
- **Protected Routes**: All admin pages are wrapped with `AdminRoute` component
- **Automatic Redirects**: Non-authenticated users redirected to `/admin/login`

### Login Process
1. Visit `/admin/login`
2. Enter admin credentials
3. System validates admin privileges
4. Redirect to dashboard on success

## Technical Implementation

### Frontend Architecture
```
client/src/
├── pages/admin/
│   ├── AdminDashboard.tsx     # Main dashboard with analytics
│   ├── UserManagement.tsx     # User listing and management
│   └── AdminLogin.tsx         # Admin authentication
├── components/admin/
│   └── AdminLayout.tsx        # Shared admin layout with navigation
└── lib/
    └── admin-route.tsx        # Protected route wrapper
```

### Backend API Endpoints
```
server/routes.ts - Admin endpoints:
├── GET /api/admin/dashboard    # Dashboard metrics and analytics
├── GET /api/admin/users        # User management data
├── GET /api/admin/documents    # Document management data
└── GET /api/admin/payments     # Payment tracking data
```

### Database Methods
```
server/storage.ts - Admin methods:
├── getUserStats()              # User registration metrics
├── getDocumentStats()          # Document processing metrics
├── getPaymentStats()           # Revenue and payment metrics
├── getSystemHealth()           # System performance metrics
├── getRecentActivity()         # Activity feed data
├── getDashboardChartData()     # Chart and graph data
├── getUsers()                  # Paginated user listing
├── getDocumentsForAdmin()      # Admin document view
└── getPaymentsForAdmin()       # Admin payment view
```

## UI Components & Styling

### Design System
- **shadcn/ui Components**: Cards, tables, charts, forms, navigation
- **Responsive Design**: Mobile-first approach with proper breakpoints
- **Chart Library**: Recharts for data visualization
- **Icons**: Lucide React for consistent iconography
- **Color Scheme**: Professional admin interface with proper contrast

### Key Components
- **MetricCard**: Reusable KPI display with trend indicators
- **ActivityFeed**: Real-time activity stream
- **ChartContainer**: Wrapper for responsive charts
- **AdminLayout**: Consistent navigation and header
- **DataTables**: Paginated data display with search/filter

## Usage Instructions

### Accessing the Admin Dashboard
1. **Create Admin User**: Ensure you have a user with 'admin' in username
2. **Login**: Visit `/admin/login` and authenticate
3. **Dashboard**: Access comprehensive analytics at `/admin`
4. **Navigation**: Use sidebar to access different management sections

### Monitoring System Health
- **Dashboard Overview**: Check key metrics at a glance
- **Real-time Updates**: Data refreshes every 30 seconds
- **Alerts**: System automatically highlights critical issues
- **Historical Data**: View trends over different time periods

### Managing Users
- **User Search**: Find specific users by username/email
- **Activity Tracking**: Monitor user registration and login patterns
- **Account Status**: View active vs inactive users

### Tracking Performance
- **Document Processing**: Monitor success/failure rates
- **Revenue Analytics**: Track payment trends and performance
- **System Metrics**: Monitor uptime, response times, error rates

## Security Considerations

### Access Control
- Admin routes are protected with authentication middleware
- User role validation prevents unauthorized access
- Session-based authentication with secure cookies

### Data Protection
- Sensitive user data is properly filtered in admin views
- Payment information follows security best practices
- Database queries use parameterized statements

## Customization

### Adding New Metrics
1. Add database method in `storage.ts`
2. Create API endpoint in `routes.ts`
3. Add UI component in dashboard
4. Update TypeScript interfaces

### Extending User Management
1. Add new fields to user interface
2. Update database queries
3. Extend table columns in UI
4. Add search/filter capabilities

### Custom Admin Roles
1. Modify admin check in `admin-route.tsx`
2. Update server-side middleware
3. Add role-based permissions
4. Create role management UI

## Dependencies

### Core Libraries
- React 18+ with TypeScript
- Wouter for routing
- TanStack Query for data fetching
- Recharts for data visualization
- shadcn/ui for components
- Tailwind CSS for styling

### Backend Dependencies
- Express.js with TypeScript
- Drizzle ORM for database operations
- Passport.js for authentication
- PostgreSQL database

## Development & Deployment

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access admin at http://localhost:5000/admin
```

### Production Deployment
- Ensure admin user exists in production database
- Configure proper session secrets
- Set up database indexes for performance
- Monitor system health and alerts

## File Structure Summary

**Key Files Created/Modified:**
- `/client/src/pages/admin/AdminDashboard.tsx` - Main dashboard component
- `/client/src/pages/admin/UserManagement.tsx` - User management interface
- `/client/src/pages/admin/AdminLogin.tsx` - Authentication page
- `/client/src/components/admin/AdminLayout.tsx` - Shared admin layout
- `/client/src/lib/admin-route.tsx` - Protected route component
- `/server/routes.ts` - Admin API endpoints added
- `/server/storage.ts` - Admin database methods added
- `/client/src/App.tsx` - Routes added for admin pages

The admin dashboard is now fully functional with comprehensive analytics, user management, and proper authentication controls.