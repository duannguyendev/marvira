'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Map,
  Users,
  BarChart3,
  HelpCircle,
  BookOpen,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  ShieldAlert,
  MessageSquareText,
  Newspaper,
  Flag,
  Settings,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@marvira/shared-types';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/events', label: 'Events', icon: Map },
  { href: '/dashboard/articles', label: 'Articles', icon: Newspaper },
  { href: '/dashboard/questions', label: 'Questions', icon: HelpCircle },
  { href: '/dashboard/practice', label: 'Practice', icon: BookOpen },
  { href: '/dashboard/answer-reports', label: 'Answer reports', icon: Flag },
  { href: '/dashboard/feedback', label: 'Feedback', icon: MessageSquareText },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  {
    href: '/dashboard/anticheat',
    label: 'Anti-Cheat',
    icon: ShieldAlert,
    adminOnly: true,
  },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const logout = useAuthStore(s => s.logout);
  const user = useAuthStore(s => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === UserRole.ADMIN;

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const visibleNav = navItems.filter(item => !item.adminOnly || isAdmin);

  const NavContent = () => (
    <>
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6A5AE0] to-[#8F7CFF] text-white font-bold">
          B
        </div>
        <span className="font-semibold">Marvira Admin</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visibleNav.map(item => {
          const Icon = item.icon;
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4 space-y-2">
        <p className="truncate px-3 text-xs text-muted-foreground">
          {user?.email}
        </p>
        <p className="truncate px-3 text-xs font-medium text-primary">
          {user?.role}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          Toggle theme
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-destructive"
          onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}>
        <NavContent />
      </aside>
    </>
  );
}
