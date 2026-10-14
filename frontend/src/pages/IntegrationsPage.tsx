import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  CheckCircle2,
  Copy,
  Layers,
  Link as LinkIcon,
  RefreshCw,
  Server,
  Shield,
  Store,
  Webhook,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { api } from '../services/api';

export const IntegrationsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['wcStatus'],
    queryFn: () => api.woocommerce.getStatus(),
  });

  // Settings form state
  const [storeUrl, setStoreUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [isMock, setIsMock] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status) {
      setStoreUrl(status.storeUrl || '');
      setIsMock(status.isMock);
    }
  }, [status]);

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: () => api.woocommerce.testConnection(),
    onSuccess: (data) => {
      if (data.success) {
        setFeedback({
          type: 'success',
          text: `Connection verified successfully! Store: ${data.storeName}`,
        });
      } else {
        setFeedback({
          type: 'error',
          text: `Connection failed: ${data.error}`,
        });
      }
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', text: `Test connection error: ${err.message}` });
    },
  });

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: () =>
      api.woocommerce.updateSettings({
        storeUrl,
        consumerKey: consumerKey.trim() || undefined,
        consumerSecret: consumerSecret.trim() || undefined,
        isMock,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wcStatus'] });
      setFeedback({ type: 'success', text: 'WooCommerce settings updated successfully.' });
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', text: `Update failed: ${err.message}` });
    },
  });

  // Full Sync Mutation
  const syncMutation = useMutation({
    mutationFn: () => api.woocommerce.triggerSync(),
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      setFeedback({
        type: 'success',
        text: `Full synchronisation completed! Processed ${data.customersSynced} customers & ${data.ordersSynced} orders.`,
      });
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', text: `Sync failed: ${err.message}` });
    },
  });

  const webhookEndpoint = `${window.location.origin}/api/v1/integrations/woocommerce/webhook`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookEndpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          WooCommerce Integration Hub
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Connect your WooCommerce store via REST API v3 or operate seamlessly with the high-fidelity mock adapter.
        </p>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Connection Status Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Store className="w-5 h-5 text-indigo-600" />
              <div>
                <CardTitle className="text-sm">Store Connection Status</CardTitle>
                <CardDescription>WooCommerce REST API v3 link</CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {status?.isMock ? (
                <Badge variant="amber">DEMO MODE (Simulated Store)</Badge>
              ) : status?.connectionStatus === 'connected' ? (
                <Badge variant="success">Active Live Connection</Badge>
              ) : (
                <Badge variant="outline">Disconnected</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-muted-foreground font-medium">Configured Store URL</span>
              <p className="font-semibold text-foreground mt-0.5 truncate">{status?.storeUrl}</p>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-muted-foreground font-medium">Adapter Driver</span>
              <p className="font-semibold text-foreground mt-0.5">
                {status?.isMock ? 'WooCommerceMockAdapter (Deterministic)' : 'WooCommerceRestAdapter (HTTPS v3)'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-muted-foreground font-medium">Last Synchronisation</span>
              <p className="font-semibold text-foreground mt-0.5">
                {status?.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testMutation.mutate()}
              isLoading={testMutation.isPending}
            >
              <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
              Test API Connection
            </Button>

            <Button
              size="sm"
              onClick={() => syncMutation.mutate()}
              isLoading={syncMutation.isPending}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Run Full Ingestion Sync
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Store Configuration & Mode Switcher</CardTitle>
          <CardDescription>
            Seamlessly toggle between live WooCommerce credentials and the offline demo adapter.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {/* Mode Switcher */}
          <div className="p-4 rounded-lg bg-muted/40 border border-border/60 space-y-2">
            <label className="font-semibold text-foreground block">Operating Integration Mode</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="adapterMode"
                  checked={isMock}
                  onChange={() => setIsMock(true)}
                />
                <span className="font-medium text-foreground">
                  DEMO MODE (Rich Simulated E-Commerce Store)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="adapterMode"
                  checked={!isMock}
                  onChange={() => setIsMock(false)}
                />
                <span className="font-medium text-foreground">
                  LIVE MODE (Connect Real WooCommerce Store)
                </span>
              </label>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Demo mode requires zero external credentials and allows instant evaluation of customer segmentation, order reconciliation, and FlowAI features.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">WooCommerce Store URL</label>
              <Input
                placeholder="https://yourstore.com"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Consumer Key</label>
                <Input
                  type="password"
                  placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={consumerKey}
                  onChange={(e) => setConsumerKey(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Consumer Secret</label>
                <Input
                  type="password"
                  placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={consumerSecret}
                  onChange={(e) => setConsumerSecret(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => saveMutation.mutate()}
              isLoading={saveMutation.isPending}
              size="sm"
            >
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Configuration Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Webhook className="w-4 h-4 text-primary" />
            WooCommerce Real-time Webhooks
          </CardTitle>
          <CardDescription>
            Receive automatic real-time order and customer events directly from WooCommerce.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <p className="text-muted-foreground leading-relaxed">
            In your WooCommerce WordPress Admin (under <strong>WooCommerce → Settings → Advanced → Webhooks</strong>), register webhooks pointing to your FlowCRM endpoint:
          </p>

          <div className="p-3 rounded-lg bg-muted/50 border border-border/80 flex items-center justify-between font-mono text-[11px]">
            <span className="truncate">{webhookEndpoint}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyWebhookUrl}
              className="text-xs shrink-0 ml-2"
            >
              {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? 'Copied' : 'Copy URL'}
            </Button>
          </div>

          <div className="space-y-1.5 pt-1 text-muted-foreground">
            <p>Supported Topics: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">order.created</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">order.updated</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">customer.created</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">customer.updated</code></p>
            <p>Verification: All incoming payloads are cryptographically validated against your HMAC-SHA256 secret.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
