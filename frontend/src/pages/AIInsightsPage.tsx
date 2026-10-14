import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Info,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  User,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { api } from '../services/api';
import { CustomerInsights, RetentionOpportunity } from '../types/crm';

export const AIInsightsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Load Customers for explorer
  const { data: customersData } = useQuery({
    queryKey: ['customersDropdown'],
    queryFn: () => api.customers.list({ limit: 50 }),
  });

  // Load Retention Agent Scan Results
  const {
    data: retentionScan,
    isLoading: isScanLoading,
    refetch: refetchScan,
    isRefetching: isScanRefetching,
  } = useQuery({
    queryKey: ['aiRetentionScan'],
    queryFn: () => api.ai.runRetentionScan(),
  });

  // Single Customer Insights Query
  const {
    data: customerInsights,
    isLoading: isInsightsLoading,
  } = useQuery<CustomerInsights | null>({
    queryKey: ['customerInsightsQuery', selectedCustomerId],
    queryFn: () => (selectedCustomerId ? api.ai.getInsights(selectedCustomerId) : null),
    enabled: Boolean(selectedCustomerId),
  });

  // One-click queue recovery message mutation
  const queueRecoveryMutation = useMutation({
    mutationFn: (opp: RetentionOpportunity) =>
      api.communications.create({
        customerId: opp.customerId,
        purpose: 'customer_reengagement',
        subject: opp.draftSubject,
        message: opp.draftMessage,
        status: 'approved', // Operator triggered 1-click approval
        generatedByAi: true,
      }),
    onSuccess: (_, opp) => {
      queryClient.invalidateQueries({ queryKey: ['communicationsList'] });
      setActionSuccessMessage(
        `Retention draft for ${opp.customerName} approved and queued in Communications Hub!`
      );
      setTimeout(() => setActionSuccessMessage(null), 5000);
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
              FlowAI Intelligence Hub
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" /> Gemini Flash 3.8
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Grounded customer diagnostics, personalized win-back drafting, and churn intervention.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchScan()}
          isLoading={isScanRefetching}
          className="text-xs h-9 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isScanRefetching ? 'animate-spin' : ''}`} />
          Run Retention Scan
        </Button>
      </div>

      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <Link to="/communications">
            <Button size="sm" variant="outline" className="text-xs h-7 border-emerald-300 dark:border-emerald-700">
              View Communications
            </Button>
          </Link>
        </div>
      )}

      {/* Safety & Grounding Principles Banner for Beginners */}
      <Card className="bg-muted/30 border-border/70">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">100% Grounded in Fact</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  AI generates insights solely from real WooCommerce orders, frequency, and spend metrics.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Users className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Human Approval First</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  No emails are ever sent automatically. You review and approve every message before delivery.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Typed Zod Schema Contracts</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  Every response is validated for reliable JSON structures and fallbacks.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 1: Autonomous Retention Opportunities */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              Customer Retention Opportunities
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Identified customers with high value who have exceeded normal re-purchase intervals.
            </p>
          </div>
          <Badge variant="purple">{retentionScan?.opportunitiesFound ?? 0} Detected</Badge>
        </div>

        {isScanLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : !retentionScan || retentionScan.opportunities.length === 0 ? (
          <Card className="p-8 text-center text-xs text-muted-foreground">
            No churn risk opportunities detected in current customer base. All active customers have purchased recently.
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {retentionScan.opportunities.map((opp) => (
              <Card key={opp.customerId} className="hover:border-primary/40 transition-colors shadow-xs">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link
                        to={`/customers/${opp.customerId}`}
                        className="font-bold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        {opp.customerName}
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </Link>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{opp.customerEmail}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          opp.churnRisk === 'high'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}
                      >
                        {opp.churnRisk} Churn Risk
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {opp.daysInactive} days inactive
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-3 text-xs">
                  <div>
                    <span className="text-muted-foreground font-medium">Diagnostic:</span>
                    <p className="text-foreground mt-0.5 leading-relaxed">{opp.diagnosis}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/50">
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold block text-[11px]">
                      Suggested Retention Offer:
                    </span>
                    <p className="text-foreground font-medium mt-0.5">{opp.suggestedOffer}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                    <span className="text-muted-foreground font-semibold block text-[10px] uppercase">
                      Draft Message Preview:
                    </span>
                    <p className="font-semibold text-foreground text-[11px] mt-1">{opp.draftSubject}</p>
                    <p className="text-muted-foreground text-[11px] mt-1 line-clamp-2 leading-relaxed">{opp.draftMessage}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-border/60">
                    <Link to={`/communications?customerId=${opp.customerId}`} className="w-full sm:w-auto">
                      <Button variant="ghost" size="sm" className="text-xs h-8 w-full sm:w-auto">
                        Edit in Composer
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => queueRecoveryMutation.mutate(opp)}
                      isLoading={queueRecoveryMutation.isPending}
                      className="text-xs h-8 w-full sm:w-auto"
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />
                      Approve & Queue Draft
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Customer Intelligence Explorer */}
      <div className="space-y-4 pt-4 border-t border-border/80">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Customer Intelligence Explorer
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select any registered customer to generate grounded behavioral summaries and purchase diagnostics.
          </p>
        </div>

        <Card>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="w-full md:w-96">
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Select Customer to Inspect
              </label>
              <select
                className="w-full p-2.5 rounded-lg border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Choose a customer...</option>
                {customersData?.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} — {c.email} (${c.total_spent.toFixed(2)}, {c.total_orders} orders)
                  </option>
                ))}
              </select>
            </div>

            {isInsightsLoading ? (
              <div className="space-y-2 py-4">
                <Skeleton className="h-6 w-1/3 rounded-md" />
                <Skeleton className="h-16 w-full rounded-md" />
              </div>
            ) : customerInsights ? (
              <div className="space-y-4 pt-2 text-xs">
                <div className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 space-y-1.5">
                  <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-indigo-600" />
                    Behavioral Profile
                  </span>
                  <p className="text-foreground leading-relaxed font-medium">
                    "{customerInsights.summary}"
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-card border border-border/80">
                    <span className="text-muted-foreground font-medium text-[11px]">Lifetime Spend</span>
                    <p className="text-base font-bold text-foreground mt-0.5">
                      ${customerInsights.keyMetrics.totalSpent.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border/80">
                    <span className="text-muted-foreground font-medium text-[11px]">Total Orders</span>
                    <p className="text-base font-bold text-foreground mt-0.5">
                      {customerInsights.keyMetrics.totalOrders}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border/80">
                    <span className="text-muted-foreground font-medium text-[11px]">Average Order</span>
                    <p className="text-base font-bold text-foreground mt-0.5">
                      ${customerInsights.keyMetrics.averageOrderValue.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border/80">
                    <span className="text-muted-foreground font-medium text-[11px]">Days Inactive</span>
                    <p className="text-base font-bold text-foreground mt-0.5">
                      {customerInsights.keyMetrics.daysSinceLastOrder ?? 'Never'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-card border border-border/80">
                    <span className="text-muted-foreground font-medium">Churn Probability:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`font-bold uppercase text-xs ${
                          customerInsights.churnRisk === 'high'
                            ? 'text-rose-600'
                            : customerInsights.churnRisk === 'medium'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {customerInsights.churnRisk}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-[11px]">{customerInsights.churnReason}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border/80">
                    <span className="text-muted-foreground font-medium">Recommended Operator Action:</span>
                    <p className="text-foreground font-semibold mt-1">{customerInsights.recommendedAction}</p>
                    <Link
                      to={`/communications?customerId=${selectedCustomerId}`}
                      className="mt-3 inline-block"
                    >
                      <Button size="sm" variant="outline" className="text-xs h-8">
                        Open Composer for this Customer <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
