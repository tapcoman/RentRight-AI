import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  FileText, 
  CreditCard, 
  AlertTriangle, 
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface DashboardMetrics {
  userStats: {
    totalUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    activeUsers: number;
  };
  documentStats: {
    totalDocuments: number;
    processedDocuments: number;
    failedDocuments: number;
    documentsToday: number;
    processingRate: number;
  };
  paymentStats: {
    totalRevenue: number;
    revenueToday: number;
    revenueThisWeek: number;
    totalTransactions: number;
    successfulPayments: number;
    failedPayments: number;
    averageTransactionValue: number;
  };
  systemHealth: {
    uptime: number;
    errorRate: number;
    avgResponseTime: number;
    totalErrors: number;
    criticalErrors: number;
  };
  recentActivity: Array<{
    id: number;
    type: 'user_registration' | 'document_upload' | 'payment' | 'error';
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
  }>;
  chartData: {
    dailyUsers: Array<{ date: string; users: number; documents: number }>;
    paymentTrends: Array<{ date: string; revenue: number; transactions: number }>;
    documentTypes: Array<{ type: string; count: number; percentage: number }>;
  };
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

function MetricCard({ title, value, change, icon: Icon, trend }: {
  title: string;
  value: string | number;
  change?: { value: number; period: string };
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1 text-green-500" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1 text-red-500" />}
            <span className={
              trend === 'up' ? 'text-green-500' : 
              trend === 'down' ? 'text-red-500' : 
              'text-muted-foreground'
            }>
              {change.value > 0 ? '+' : ''}{change.value}% {change.period}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityFeed({ activities }: { activities: DashboardMetrics['recentActivity'] }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration': return <Users className="h-4 w-4" />;
      case 'document_upload': return <FileText className="h-4 w-4" />;
      case 'payment': return <CreditCard className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'warning': return 'text-slate-500';
      case 'error': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3">
          <div className={`p-1 rounded-full ${getStatusColor(activity.status)}`}>
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">{activity.description}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(activity.timestamp).toLocaleString()}
            </p>
          </div>
          <Badge variant={activity.status === 'error' ? 'destructive' : 'default'}>
            {activity.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  const { data: metrics, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: ['/api/admin/dashboard', selectedTimeRange],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/dashboard?timeRange=${selectedTimeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (error) {
    return (
      <AdminLayout>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please try again later.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  if (isLoading || !metrics) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-24 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { userStats, documentStats, paymentStats, systemHealth, recentActivity, chartData } = metrics;

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your RentRight-AI application performance and analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={userStats.totalUsers.toLocaleString()}
          change={{ value: ((userStats.newUsersThisWeek / userStats.totalUsers) * 100) || 0, period: 'this week' }}
          trend={userStats.newUsersThisWeek > 0 ? 'up' : 'neutral'}
          icon={Users}
        />
        <MetricCard
          title="Documents Processed"
          value={documentStats.processedDocuments.toLocaleString()}
          change={{ value: documentStats.processingRate, period: 'success rate' }}
          trend={documentStats.processingRate > 90 ? 'up' : documentStats.processingRate > 70 ? 'neutral' : 'down'}
          icon={FileText}
        />
        <MetricCard
          title="Total Revenue"
          value={`£${(paymentStats.totalRevenue / 100).toLocaleString()}`}
          change={{ value: ((paymentStats.revenueThisWeek / paymentStats.totalRevenue) * 100) || 0, period: 'this week' }}
          trend={paymentStats.revenueThisWeek > 0 ? 'up' : 'neutral'}
          icon={DollarSign}
        />
        <MetricCard
          title="System Health"
          value={`${(100 - systemHealth.errorRate).toFixed(1)}%`}
          change={{ value: -systemHealth.errorRate, period: 'error rate' }}
          trend={systemHealth.errorRate < 1 ? 'up' : systemHealth.errorRate < 5 ? 'neutral' : 'down'}
          icon={Activity}
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Activity</CardTitle>
                <CardDescription>User registrations and document uploads</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ users: { label: 'Users', color: '#3b82f6' }, documents: { label: 'Documents', color: '#10b981' } }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.dailyUsers}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="users" fill="#3b82f6" />
                      <Bar dataKey="documents" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events</CardDescription>
              </CardHeader>
              <CardContent className="max-h-80 overflow-y-auto">
                <ActivityFeed activities={recentActivity} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>User Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Users</span>
                  <span className="font-semibold">{userStats.totalUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span>New Today</span>
                  <span className="font-semibold text-green-600">{userStats.newUsersToday}</span>
                </div>
                <div className="flex justify-between">
                  <span>New This Week</span>
                  <span className="font-semibold text-blue-600">{userStats.newUsersThisWeek}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Users</span>
                  <span className="font-semibold text-purple-600">{userStats.activeUsers}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ users: { label: 'Users', color: '#3b82f6' } }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData.dailyUsers}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Document Processing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Documents</span>
                  <span className="font-semibold">{documentStats.totalDocuments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Successfully Processed</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-green-600">{documentStats.processedDocuments}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Failed Processing</span>
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="font-semibold text-red-600">{documentStats.failedDocuments}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Success Rate</span>
                  <Badge variant={documentStats.processingRate > 90 ? 'default' : 'secondary'}>
                    {documentStats.processingRate.toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartData.documentTypes}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ type, percentage }) => `${type} (${percentage}%)`}
                      >
                        {chartData.documentTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Revenue</span>
                  <span className="font-semibold">£{(paymentStats.totalRevenue / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Revenue Today</span>
                  <span className="font-semibold text-green-600">£{(paymentStats.revenueToday / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Successful Payments</span>
                  <span className="font-semibold text-green-600">{paymentStats.successfulPayments}</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed Payments</span>
                  <span className="font-semibold text-red-600">{paymentStats.failedPayments}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Transaction</span>
                  <span className="font-semibold">£{(paymentStats.averageTransactionValue / 100).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ revenue: { label: 'Revenue', color: '#10b981' } }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData.paymentTrends}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Uptime</span>
                  <Badge variant="default">{systemHealth.uptime.toFixed(2)}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Error Rate</span>
                  <Badge variant={systemHealth.errorRate < 1 ? 'default' : 'destructive'}>
                    {systemHealth.errorRate.toFixed(2)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Avg Response Time</span>
                  <span className="font-semibold">{systemHealth.avgResponseTime}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Errors</span>
                  <span className="font-semibold text-red-600">{systemHealth.totalErrors}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Critical Errors</span>
                  <Badge variant="destructive">{systemHealth.criticalErrors}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemHealth.errorRate > 5 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        High error rate detected: {systemHealth.errorRate.toFixed(2)}%
                      </AlertDescription>
                    </Alert>
                  )}
                  {systemHealth.avgResponseTime > 1000 && (
                    <Alert variant="destructive">
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        High response time: {systemHealth.avgResponseTime}ms
                      </AlertDescription>
                    </Alert>
                  )}
                  {systemHealth.criticalErrors > 0 && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        {systemHealth.criticalErrors} critical error(s) detected
                      </AlertDescription>
                    </Alert>
                  )}
                  {systemHealth.errorRate < 1 && systemHealth.avgResponseTime < 500 && systemHealth.criticalErrors === 0 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        All systems operating normally
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </AdminLayout>
  );
}