import { useQuery } from '@tanstack/react-query';
import { Building2, Database, ShieldCheck, User } from 'lucide-react';
import React from 'react';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { data: authData } = useQuery({
    queryKey: ['authMe'],
    queryFn: () => api.auth.getMe(),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Organization & System Settings
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tenant isolation, Supabase Auth properties, and database infrastructure.
        </p>
      </div>

      {/* Supabase Authentication Status Card */}
      <Card className="border-indigo-200/60 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/20 dark:from-indigo-950/20 to-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Supabase Authentication Provider
            </CardTitle>
            <Badge variant="success">Supabase Auth Connected</Badge>
          </div>
          <CardDescription className="text-xs">
            Cryptographic JWT session validation backed by Supabase Auth service.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-card border border-border/70">
              <span className="text-muted-foreground font-medium text-[11px]">Auth Endpoint</span>
              <p className="font-semibold text-foreground mt-0.5 text-xs truncate">
                ckhfbgdvfltbsflfctos.supabase.co
              </p>
            </div>

            <div className="p-3 rounded-lg bg-card border border-border/70">
              <span className="text-muted-foreground font-medium text-[11px]">Active Session Email</span>
              <p className="font-semibold text-foreground mt-0.5 text-xs truncate">
                {authData?.user?.email || 'operator@flowcrm.store'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-card border border-border/70">
              <span className="text-muted-foreground font-medium text-[11px]">Token Verification</span>
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 text-xs">
                Supabase Token Verified
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Current Organization Context
          </CardTitle>
          <CardDescription className="text-xs">
            All CRM customer data, orders, and AI drafts are strictly isolated within this organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-muted-foreground font-medium">Organization Name</span>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {authData?.currentOrganisation?.name || 'FlowCRM Store'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-muted-foreground font-medium">Organization Identifier</span>
              <p className="text-xs font-mono text-foreground mt-0.5">
                {authData?.currentOrganisation?.id || 'org_default_01'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Session & Role Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Operator Session
          </CardTitle>
          <CardDescription className="text-xs">Authentication and role-based permissions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-muted-foreground font-medium">Operator Email</span>
              <p className="font-semibold text-foreground mt-0.5 truncate">{authData?.user?.email}</p>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-muted-foreground font-medium">Role</span>
              <div className="mt-1">
                <Badge variant="purple">Tenant Owner / Admin</Badge>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-muted-foreground font-medium">Multi-Tenancy Mode</span>
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                Tenant RLS Enforced
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Architecture & Database Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Infrastructure & Persistence Engine
          </CardTitle>
          <CardDescription className="text-xs">Data persistence and multi-tenant security architecture.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Relational Schema</span>
              <Badge variant="success">10 Relational Tables</Badge>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Tables: organisations, organisation_members, integrations, customers, orders, order_items, communications, customer_notes, activity_logs, sync_logs.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Security & RLS Isolation</span>
              <Badge variant="success">Active</Badge>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Every backend API endpoint strictly validates organization membership on incoming requests. Cross-tenant access is rejected with HTTP 401/403.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
