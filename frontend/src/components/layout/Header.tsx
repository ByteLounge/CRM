import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, Menu, Moon, RefreshCw, Sun } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { IntegrationStatus } from '../../types/crm';
import { Button } from '../ui/Button';

interface HeaderProps {
  integration?: IntegrationStatus;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ integration, onOpenMobileMenu }) => {
  const queryClient = useQueryClient();
  const { user, organisation, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const syncMutation = useMutation({
    mutationFn: () => api.woocommerce.triggerSync(),
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      setSyncFeedback(`Synced ${data.customersSynced} customers & ${data.ordersSynced} orders!`);
      setTimeout(() => setSyncFeedback(null), 4000);
    },
    onError: (err: any) => {
      setSyncFeedback(`Sync failed: ${err.message}`);
      setTimeout(() => setSyncFeedback(null), 5000);
    },
  });

  const orgDisplayName = organisation?.name || 'FlowCRM Store';
  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'OP';

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-border/80 bg-card/70 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Menu Trigger + Store context */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 -ml-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted focus:outline-none"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="truncate">
          <h1 className="text-sm font-semibold text-foreground flex items-center gap-1.5 truncate">
            <span className="truncate">{orgDisplayName}</span>
            {integration?.isMock ? (
              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                DEMO
              </span>
            ) : (
              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                LIVE
              </span>
            )}
          </h1>
          <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
            {integration?.lastSyncAt
              ? `Last synced: ${new Date(integration.lastSyncAt).toLocaleTimeString()}`
              : 'Not yet synchronised'}
          </p>
        </div>

        {syncFeedback && (
          <div className="hidden lg:flex items-center px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs rounded-full font-medium animate-in fade-in">
            {syncFeedback}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Sync trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncMutation.mutate()}
          isLoading={syncMutation.isPending}
          className="text-xs h-8 sm:h-9 px-2.5 sm:px-3"
          title="Synchronize orders and customers with WooCommerce"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Sync WooCommerce</span>
          <span className="sm:hidden text-xs">Sync</span>
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9"
          onClick={toggleDarkMode}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
        </Button>

        {/* User profile & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-border/80">
          <div
            className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs"
            title={user?.email || 'Store Operator'}
          >
            {userInitials}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground leading-none truncate max-w-[120px]">
              {user?.email || 'Store Operator'}
            </span>
            <span className="text-[10px] text-muted-foreground capitalize">{user?.role || 'Operator'}</span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
            title="Log out of FlowCRM"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
