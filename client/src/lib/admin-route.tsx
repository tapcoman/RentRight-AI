import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from 'wouter';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation('/admin/login');
    return null;
  }

  // Check if user is admin (adjust this logic based on your requirements)
  const isAdmin = user.username === 'admin' || user.username.includes('admin');

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access the admin dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}