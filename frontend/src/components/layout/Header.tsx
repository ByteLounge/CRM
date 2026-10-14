import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Moon, RefreshCw, Sun } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { IntegrationStatus } from '../../types/crm';
import { Button } from '../ui/Button';

interface HeaderProps {
  integration?: IntegrationStatus;
  orgName?: string;
}

export const Header: React.FC<HeaderProps> = ({ integration, orgName = 'FlowCRM Flagship Store' }) => {
  const queryClient = useQueryClient();
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
      setSyncFeedback(`Synced ${data.customersSynced} customers & ${data.ordersSynced} orders successfully!`);
      setTimeout(() => setSyncFeedback(null), 4000);
    },
    onError: (err: any) => {
      setSyncFeedback(`Sync failed: ${err.message}`);
      setTimeout(() => setSyncFeedback(null), 5000);
    },
  });

  return (
    <header className="h-16 px-6 border-b border-border/80 bg-card/60 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
      {/* Store context */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-sm font-semibold text-foreground flex items-center gap-2">
            {orgName}
            {integration?.isMock && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                DEMO MODE
              </span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground">
            {integration?.lastSyncAt
              ? `Last synced: ${new Date(integration.lastSyncAt).toLocaleTimeString()}`
              : 'Not yet synchronised'}
          </p>
        </div>

        {syncFeedback && (
          <div className="ml-4 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs rounded-full font-medium animate-in fade-in">
            {syncFeedback}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {/* Sync trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncMutation.mutate()}
          isLoading={syncMutation.isPending}
          className="text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          Sync WooCommerce
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
        </Button>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-border/80">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs">
            OP
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground leading-none">Store Operator</span>
            <span className="text-[10px] text-muted-foreground">Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
};
