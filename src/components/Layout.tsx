import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  Truck,
  ClipboardList,
  BarChart3,
  Settings,
  Menu,
  X,
  Gem,
  ChevronDown,
  LogOut,
  Wrench,
  Grid3X3,
  Receipt,
  Coins,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useTheme } from '../contexts/ThemeContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { name: string; href: string }[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { 
    name: 'Sales', 
    href: '/invoices', 
    icon: Receipt,
    children: [
      { name: 'All Invoices', href: '/invoices' },
      { name: 'New Invoice', href: '/invoices/create' },
      { name: 'New Sales Invoice', href: '/invoices/create-sales' },
    ]
  },
  { 
    name: 'Pawning', 
    href: '/pawning', 
    icon: Coins,
    children: [
      { name: 'All Tickets', href: '/pawning' },
      { name: 'New Pawn Ticket', href: '/pawning/create' },
    ]
  },
  { 
    name: 'Repairs', 
    href: '/repairs', 
    icon: Wrench,
    children: [
      { name: 'All Jobs', href: '/repairs' },
      { name: 'New Repair Job', href: '/repairs/create' },
    ]
  },
  { name: 'GRN', href: '/grn', icon: ClipboardList },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Suppliers', href: '/suppliers', icon: Truck },
  { name: 'Categories', href: '/categories', icon: Grid3X3 },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  const getThemeIcon = () => {
    if (theme === 'system') return <Monitor className="w-5 h-5" />;
    if (resolvedTheme === 'light') return <Sun className="w-5 h-5" />;
    return <Moon className="w-5 h-5" />;
  };

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600">
            <Gem className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800 dark:text-slate-100">Royal Gems</h1>
            <p className="text-xs text-slate-500">Jewellery System</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={cn(
                      'flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 ml-auto transition-transform',
                        expandedItems.includes(item.name) && 'rotate-180'
                      )}
                    />
                  </button>
                  {expandedItems.includes(item.name) && (
                    <div className="mt-1 ml-8 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'block px-3 py-2 rounded-lg text-sm transition-colors',
                            location.pathname === child.href
                              ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                          )}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-600 dark:text-amber-400 border-l-2 border-amber-500'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white font-semibold text-sm">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">Admin</p>
              <p className="text-xs text-slate-500 truncate">admin@royalgems.lk</p>
            </div>
            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4 px-4 py-3 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex-1" />
            
            {/* Gold rate indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-xs text-slate-400">Gold Rate:</span>
              <span className="text-sm font-semibold text-amber-400">Rs. 18,500/g</span>
            </div>
            
            {/* Theme toggle */}
            <button
              onClick={cycleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              title={`Theme: ${theme}`}
            >
              {getThemeIcon()}
            </button>

            {/* Current date */}
            <div className="text-sm text-slate-400 dark:text-slate-400">
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
