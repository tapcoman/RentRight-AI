import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  Settings,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface AdminLayoutProps {
  children: ReactNode;
}

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Documents',
    href: '/admin/documents',
    icon: FileText,
  },
  {
    title: 'Payments',
    href: '/admin/payments',
    icon: CreditCard,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Site
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h1 className="text-lg font-semibold">Admin Panel</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                Logged in as <span className="font-medium">{user?.username}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          <nav className="p-6">
            <div className="space-y-2">
              {adminNavItems.map((item) => {
                const isActive = location === item.href || 
                  (item.href !== '/admin' && location.startsWith(item.href));
                
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={cn(
                        'w-full justify-start',
                        isActive && 'bg-primary text-primary-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.title}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}