import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  CircleDollarSign,
  Package,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { OrderStatusBadge, SegmentBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const OverviewPage: React.FC = () => {
  const { user } = useAuth();

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: () => api.analytics.getOverview(),
  });

  const { data: retentionData } = useQuery({
    queryKey: ['retentionOpportunities'],
    queryFn: () => api.ai.runRetentionScan(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 p-6 text-center">
        <h3 className="text-base font-semibold text-destructive">Failed to load CRM analytics</h3>
        <p className="text-xs text-muted-foreground mt-1">Please ensure the backend is running and connected.</p>
      </Card>
    );
  }

  const userDisplayName = user?.email ? user.email.split('@')[0] : 'Store Operator';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Friendly Welcome Banner for Beginners */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                Store Dashboard
              </span>
              <span className="text-xs text-indigo-100 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> FlowAI Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight capitalize">
              Welcome back, {userDisplayName} 👋
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-xl">
              Here is what's happening in your WooCommerce store today. Track your customer segments, orders, and automated retention opportunities at a glance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/ai-insights">
              <Button size="sm" className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-sm text-xs">
                <Bot className="w-4 h-4 mr-1.5 text-indigo-600" />
                AI Retention Scan
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Top Retention Alert if Churn Risks exist */}
      {retentionData && retentionData.opportunitiesFound > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500 text-white shadow-sm shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Action Required: {retentionData.opportunitiesFound} Customers at Risk of Churning
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Repeat customers who haven't ordered in &gt;45 days. FlowAI prepared personalized win-back messages for your review.
              </p>
            </div>
          </div>
          <Link to="/ai-insights" className="shrink-0">
            <Button size="sm" variant="outline" className="text-xs border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10">
              Review Opportunities
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* 4 Clean KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Customers</p>
                <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                  {analytics.totalCustomers.toLocaleString()}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> Synced
              </span>
              from WooCommerce
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Orders</p>
                <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                  {analytics.totalOrders.toLocaleString()}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">All store checkouts</p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Revenue</p>
                <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                  ${analytics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <CircleDollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">Completed store sales</p>
          </CardContent>
        </Card>

        {/* Average Order Value (AOV) */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Average Order Value</p>
                <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                  ${analytics.aov.toFixed(2)}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">Revenue per completed order</p>
          </CardContent>
        </Card>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Revenue Activity</CardTitle>
            <CardDescription className="text-xs">Daily store sales trajectory from recent orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.revenueTrends}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(val: number) => [`$${val.toFixed(2)}`, 'Revenue']}
                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Customer Segmentation Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Customer Segments</CardTitle>
            <CardDescription className="text-xs">Deterministic segmentation breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.segmentDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis
                    dataKey="segment"
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v.replace('_', ' ')}
                  />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: number) => [val, 'Customers']}
                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Customers Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
            <div>
              <CardTitle className="text-sm font-semibold">Recent Orders</CardTitle>
              <CardDescription className="text-xs">Latest transactions from WooCommerce</CardDescription>
            </div>
            <Link to="/orders">
              <Button variant="ghost" size="sm" className="text-xs h-8">
                View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {analytics.recentOrders.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">No orders yet.</p>
              ) : (
                analytics.recentOrders.map((order) => (
                  <div key={order.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-foreground">#{order.order_number}</span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {order.customer
                          ? `${order.customer.first_name} ${order.customer.last_name}`
                          : 'Guest Checkout'}{' '}
                        • {new Date(order.placed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs sm:text-sm text-foreground">
                        ${order.total_amount.toFixed(2)}
                      </span>
                      <p className="text-[10px] text-muted-foreground uppercase">{order.payment_method}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
            <div>
              <CardTitle className="text-sm font-semibold">Recent Customers</CardTitle>
              <CardDescription className="text-xs">Recently active buyer profiles</CardDescription>
            </div>
            <Link to="/customers">
              <Button variant="ghost" size="sm" className="text-xs h-8">
                View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {analytics.recentCustomers.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">No customers yet.</p>
              ) : (
                analytics.recentCustomers.map((cust) => (
                  <div key={cust.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                        {cust.first_name ? cust.first_name[0] : 'C'}
                      </div>
                      <div className="truncate">
                        <Link
                          to={`/customers/${cust.id}`}
                          className="text-xs sm:text-sm font-semibold text-foreground hover:text-primary transition-colors truncate block"
                        >
                          {cust.first_name} {cust.last_name}
                        </Link>
                        <p className="text-[11px] text-muted-foreground truncate">{cust.email}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <SegmentBadge segment={cust.segment} />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {cust.total_orders} orders • ${cust.total_spent.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
