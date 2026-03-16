'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon, PlusCircleIcon, ClipboardDocumentListIcon,
  ClockIcon, Cog6ToothIcon, Bars3Icon, XMarkIcon,
  WrenchScrewdriverIcon, ArrowRightOnRectangleIcon, SunIcon, MoonIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { href: '/', label: 'Dashboard', icon: HomeIcon },
  { href: '/problems/new', label: 'Log Issue', icon: PlusCircleIcon },
  { href: '/issues', label: 'Active Issues', icon: ClipboardDocumentListIcon },
  { href: '/history', label: 'History', icon: ClockIcon },
  { href: '/settings', label: 'Settings', icon: Cog6ToothIcon },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true';
    setDarkMode(saved);
    if (saved) document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
    document.documentElement.classList.toggle('dark', next);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <WrenchScrewdriverIcon className="w-12 h-12 text-blue-600 mx-auto mb-3 animate-spin" />
          <p className="text-gray-600 font-medium">Loading LeanShop RCA...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const roleColor: Record<string, string> = {
    MANAGER: 'bg-purple-100 text-purple-800',
    ENGINEER: 'bg-blue-100 text-blue-800',
    MAINTENANCE: 'bg-orange-100 text-orange-800',
    OPERATOR: 'bg-green-100 text-green-800',
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark' : ''}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-30 transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <WrenchScrewdriverIcon className="w-7 h-7 text-blue-400" />
            <div>
              <div className="font-bold text-sm">LeanShop RCA</div>
              <div className="text-xs text-gray-400">Manufacturing RCA</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-gray-700">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <span className={`text-xs px-1.5 py-0.5 rounded ${roleColor[user.role] || 'bg-gray-100 text-gray-700'}`}>
                {user.role}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleDark}
              className="flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs transition-colors"
            >
              {darkMode ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
              {darkMode ? 'Light' : 'Dark'}
            </button>
            <button
              onClick={() => { logout(); router.push('/login'); }}
              className="flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-red-700 hover:bg-red-600 text-xs transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-950">
        {/* Top bar (mobile) */}
        <header className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <WrenchScrewdriverIcon className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-sm">LeanShop RCA</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
