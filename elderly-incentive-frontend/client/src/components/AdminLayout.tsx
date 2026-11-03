import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Settings,
  Brain,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
  BarChart3, 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    { label: 'User Management', icon: Users, href: '/admin/users' },
    { label: 'Applications', icon: FileText, href: '/admin/applications' },
    { label: 'Payments', icon: CreditCard, href: '/admin/payments' },
    { label: 'Banks', icon: Building2, href: '/admin/banks' },
     { label: 'Reports', icon: BarChart3, href: '/admin/reports' },
    // { label: 'ML Insights', icon: Brain, href: '/admin/ml-insights' },
    { label: 'Settings', icon: Settings, href: '/admin/settings' },
  ];

  const handleLogout = async () => {
    await logout();
    setLocation('/admin/login');
  };

  const isActive = (href: string) => location === href;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:relative z-40 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-20',
          'md:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className={cn('flex items-center gap-3', !sidebarOpen && 'md:hidden')}>
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-600 rounded-lg flex items-center justify-center font-bold text-white">
              SI
            </div>
            {sidebarOpen && <span className="font-bold text-lg">Smart Incentive</span>}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:block p-1 hover:bg-slate-700 rounded transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => {
                  setLocation(item.href);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  active
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                )}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-700">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className={cn(
              'w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700',
              !sidebarOpen && 'md:justify-center'
            )}
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    A
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">Admin</span>
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut size={16} className="mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="p-6">{children}</div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
