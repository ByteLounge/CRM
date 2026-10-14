import {
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  Layers,
  Mail,
  Package,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isMockMode?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMockMode = true }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { label: 'Overview', path: '/', icon: BarChart3 },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Orders', path: '/orders', icon: Package },
    { label: 'Communications', path: '/communications', icon: Mail },
    { label: 'FlowAI Insights', path: '/ai-insights', icon: Bot, isAi: true },
    { label: 'Integrations', path: '/integrations', icon: Layers },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-border bg-card/50 backdrop-blur-md transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border/80">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm font-bold text-sm">
              F
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                FlowCRM
                <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold rounded-md border border-indigo-200 dark:border-indigo-800">
                  B2B
                </span>
              </span>
              <span className="text-[10px] text-muted-foreground">WooCommerce Hub</span>
            </div>
          </Link>
        )}

        {collapsed && (
          <div className="mx-auto w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm font-bold text-sm">
            F
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Integration Mode Badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-border/60 bg-muted/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Store Adapter</span>
            {isMockMode ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                DEMO MODE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">
                LIVE REST v3
              </span>
            )}
          </div>
        </div>
      )}

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${item.isAi ? 'text-indigo-400' : ''}`} />
              {!collapsed && (
                <span className="flex-1 flex items-center justify-between">
                  {item.label}
                  {item.isAi && (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse ml-1" />
                  )}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-4 border-t border-border/80 text-[11px] text-muted-foreground">
          <p className="font-semibold text-foreground">Kilowott Placement Hackathon</p>
          <p className="mt-0.5">FlowCRM — WooCommerce Solution</p>
        </div>
      )}
    </aside>
  );
};
