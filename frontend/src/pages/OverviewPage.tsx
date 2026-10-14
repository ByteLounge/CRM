import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Bot,
  CircleDollarSign,
  Package,
  ShoppingBag,
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
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { OrderStatusBadge, SegmentBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { api } from '../services/api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const OverviewPage: React.FC = () => {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 p-6 text-center">
        <h3 className="text-base font-semibold text-destructive">Failed to load CRM analytics</h3>
        <p className="text-xs text-muted-foreground mt-1">Please ensure the backend is connected and synchronised.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Welcome & Retention Alert */}
      {retentionData && retentionData.opportunitiesFound > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-200/50 dark:border-indigo-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                FlowAI Retention Alert: {retentionData.opportunitiesFound} Churn Risk Customers Detected
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Valuable repeat customers have entered the inactive zone (>45 days). Review targeted retention offers.
              </p>
            </div>
          </div>
          <Link to="/ai-insights">
            <Button size="sm" className="whitespace-nowrap">
              Review FlowAI Opportunities
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Customers</p>
                <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                  {analytics.totalCustomers.toLocaleString()}
                </h3>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> Synchronised
              </span>
              from WooCommerce
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Orders</p>
                <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                  {analytics.totalOrders.toLocaleString()}
                </h3>
              </div>
              <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">All store checkout transactions</p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Revenue</p>
                <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                  ${analytics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <CircleDollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">Excludes cancelled & failed orders</p>
          </CardContent>
        </Card>

        {/* Average Order Value (AOV) */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Average Order Value</p>
                <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                  ${analytics.aov.toFixed(2)}
                </h3>
              </div>
              <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">Revenue / Completed Orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Activity</CardTitle>
            <CardDescription>Daily store revenue trajectory from recent orders</CardDescription>
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
                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }}
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
            <CardTitle>Customer Segments</CardTitle>
            <CardDescription>Deterministic segmentation distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.segmentDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis
                    dataKey="segment"
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => v.replace('_', ' ')}
                  />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: number) => [val, 'Customers']}
                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Customers Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest transactions from WooCommerce</CardDescription>
            </div>
            <Link to="/orders">
              <Button variant="ghost" size="sm" className="text-xs">
                View all orders
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60">
              {analytics.recentOrders.map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">#{order.order_number}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.customer
                        ? `${order.customer.first_name} ${order.customer.last_name}`
                        : 'Guest Checkout'}{' '}
                      • {new Date(order.placed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-foreground">
                      ${order.total_amount.toFixed(2)}
                    </span>
                    <p className="text-[10px] text-muted-foreground uppercase">{order.payment_method}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Recent Customers</CardTitle>
              <CardDescription>Recently active or registered buyers</CardDescription>
            </div>
            <Link to="/customers">
              <Button variant="ghost" size="sm" className="text-xs">
                View all customers
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60">
              {analytics.recentCustomers.map((cust) => (
                <div key={cust.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-secondary-foreground">
                      {cust.first_name ? cust.first_name[0] : 'C'}
                    </div>
                    <div>
                      <Link
                        to={`/customers/${cust.id}`}
                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {cust.first_name} {cust.last_name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{cust.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <SegmentBadge segment={cust.segment} />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {cust.total_orders} orders • ${cust.total_spent.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
