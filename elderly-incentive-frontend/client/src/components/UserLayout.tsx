import React, { useState, useEffect } from 'react';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  User,
  History,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  FilePlus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface UserLayoutProps {
  children: React.ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const { logout, user } = useUserAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { section: 'Main', items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/user/dashboard' },
      { label: 'Profile', icon: User, href: '/user/profile' },
    ]},
    { section: 'Applications', items: [
      { label: 'My Applications', icon: History, href: '/user/applications' },
    ]},
  ];


  useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth < 768) {
      //  Always expanded on mobile
      setSidebarOpen(true);
    }
  };

  handleResize(); // run on mount

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  const isActive = (href: string) => location === href;

  // Derive display values from user object
  const displayName = user
    ? [user.firstname, user.surname].filter(Boolean).join(' ') || user.username
    : 'User';
  const initials = user
    ? ((user.firstname?.[0] ?? '') + (user.surname?.[0] ?? '')).toUpperCase() ||
      user.username?.[0]?.toUpperCase() ||
      'U'
    : 'U';
  const email = user?.email ?? '';
  const username = user?.username ?? '';

  // Current page label for breadcrumb
  const currentPage =
    menuItems.flatMap((s) => s.items).find((i) => isActive(i.href))?.label ?? 'Portal';

  return (
    <div className="flex h-screen bg-slate-50">
      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'fixed md:relative z-40 h-screen bg-slate-900 text-white transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-60' : 'w-[72px]',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center justify-between px-4 border-b border-white/[0.06] flex-shrink-0">
          <div className={cn('flex items-center gap-2.5 overflow-hidden', !sidebarOpen && 'md:hidden')}>
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-600 rounded-lg flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
              SI
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-100 leading-tight truncate">Smart Incentive</p>
              <p className="text-[10px] text-slate-500 leading-tight">User Portal</p>
            </div>
          </div>
          {/* Collapsed logo icon */}
          {!sidebarOpen && (
            <div className="hidden md:hidden md:flex w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-600 rounded-lg items-center justify-center font-bold text-white text-xs mx-auto">
              SI
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex p-1.5 hover:bg-white/[0.06] rounded-md transition-colors text-slate-400 hover:text-white flex-shrink-0"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 hover:bg-white/[0.06] rounded-md text-slate-400"
          >
            <X size={16} />
          </button>
        </div>


        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          {menuItems.map((section) => (
            <div key={section.section}>
              {sidebarOpen && (
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-2.5 pt-3 pb-1.5">
                  {section.section}
                </p>
              )}
              {!sidebarOpen && <div className="h-3" />}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => { setLocation(item.href); setMobileMenuOpen(false); }}
                    title={!sidebarOpen ? item.label : undefined}
                    className={cn(
                      'w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg transition-all duration-150 text-left',
                      active
                        ? 'bg-gradient-to-r from-cyan-500/20 to-teal-600/20 text-cyan-400 font-medium'
                        : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200',
                      !sidebarOpen && 'md:justify-center'
                    )}
                  >
                    <Icon size={17} className="flex-shrink-0" />
                    {sidebarOpen && <span className="text-sm truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

       
        {/* User info block */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] flex-shrink-0',
          !sidebarOpen && 'md:justify-center md:px-2'
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
            {initials}
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate leading-tight">{displayName}</p>
              <p className="text-[11px] text-slate-500 truncate leading-tight">{email}</p>
            </div>
          )}
        </div>
           {/* Logout */}
        <div className="p-2.5 border-t border-white/[0.06] flex-shrink-0">
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 text-sm',
              !sidebarOpen && 'md:justify-center'
            )}
          >
            <LogOut size={17} className="flex-shrink-0" />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={20} className="text-slate-600" />
            </button>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-slate-400">Portal</span>
              <span className="text-slate-300">/</span>
              <span className="font-medium text-slate-800">{currentPage}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <Bell size={16} className="text-slate-500" />
            </button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                  <div className="w-7 h-7 bg-gradient-to-br from-cyan-400 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-medium text-slate-800 leading-tight">@{username}</p>
                  </div>
                  <ChevronDown size={13} className="text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-800 truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{email}</p>
                </div>
                <DropdownMenuItem onClick={() => setLocation('/user/profile')}>
                  <User size={14} className="mr-2" />
                  My profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut size={14} className="mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default UserLayout;