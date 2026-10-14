import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  Info,
  Mail,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SegmentBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { api } from '../services/api';
import { CustomerSegment } from '../types/crm';

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | ''>('');
  const [showSegmentGuide, setShowSegmentGuide] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, isLoading, error } = useQuery({
    queryKey: ['customersList', search, selectedSegment, page],
    queryFn: () =>
      api.customers.list({
        search: search.trim() || undefined,
        segment: selectedSegment || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
  });

  const segments: Array<{ label: string; value: CustomerSegment | '' }> = [
    { label: 'All', value: '' },
    { label: 'High Value', value: 'high_value' },
    { label: 'Repeat', value: 'repeat' },
    { label: 'New', value: 'new' },
    { label: 'Inactive', value: 'inactive' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Customers
            <span className="text-xs font-normal text-muted-foreground">
              ({data?.total ?? 0} profiles)
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Synchronized buyer profiles with automated segmentation and purchase tracking.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSegmentGuide(!showSegmentGuide)}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-start sm:self-auto font-medium"
        >
          <Info className="w-3.5 h-3.5" />
          {showSegmentGuide ? 'Hide segment guide' : 'How do segments work?'}
        </button>
      </div>

      {/* Beginner Guide Collapsible */}
      {showSegmentGuide && (
        <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 text-xs space-y-2 animate-in fade-in duration-200">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Automatic Customer Segments:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 text-[11px]">
            <div className="p-2.5 rounded-lg bg-card border border-border/60">
              <span className="font-bold text-amber-700 dark:text-amber-400">💎 High Value</span>
              <p className="text-muted-foreground mt-0.5">Spent $500+ lifetime across completed orders.</p>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/60">
              <span className="font-bold text-blue-700 dark:text-blue-400">🔄 Repeat</span>
              <p className="text-muted-foreground mt-0.5">Placed 2 or more separate completed purchases.</p>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/60">
              <span className="font-bold text-emerald-700 dark:text-emerald-400">🌱 New</span>
              <p className="text-muted-foreground mt-0.5">First checkout placed within the last 30 days.</p>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/60">
              <span className="font-bold text-slate-700 dark:text-slate-400">⏳ Inactive</span>
              <p className="text-muted-foreground mt-0.5">No recent orders in the past 45+ days.</p>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar & Filter Pills */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search input */}
            <div className="w-full md:w-80">
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                icon={<Search className="w-4 h-4 text-muted-foreground" />}
              />
            </div>

            {/* Segment pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {segments.map((seg) => (
                <button
                  key={seg.label}
                  onClick={() => {
                    setSelectedSegment(seg.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedSegment === seg.value
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {seg.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Customers List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : error || !data || data.customers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h4 className="text-sm font-semibold text-foreground">No customers found</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {search || selectedSegment
                  ? 'Try modifying your search query or segment filters.'
                  : 'Sync with your WooCommerce store using the button in the header.'}
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW (hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60">
                    <tr>
                      <th className="px-6 py-3.5">Customer</th>
                      <th className="px-6 py-3.5">Segment</th>
                      <th className="px-6 py-3.5">Orders</th>
                      <th className="px-6 py-3.5">Total Spend</th>
                      <th className="px-6 py-3.5">Last Order</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {data.customers.map((cust) => (
                      <tr
                        key={cust.id}
                        onClick={() => navigate(`/customers/${cust.id}`)}
                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {cust.first_name ? cust.first_name[0] : 'C'}
                            </div>
                            <div>
                              <span className="font-semibold text-foreground text-sm hover:text-primary transition-colors">
                                {cust.first_name} {cust.last_name}
                              </span>
                              <div className="text-muted-foreground text-[11px] mt-0.5">
                                {cust.email} {cust.phone && `• ${cust.phone}`}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <SegmentBadge segment={cust.segment} />
                        </td>

                        <td className="px-6 py-4 font-medium text-foreground">
                          {cust.total_orders}
                        </td>

                        <td className="px-6 py-4 font-semibold text-foreground">
                          ${cust.total_spent.toFixed(2)}
                        </td>

                        <td className="px-6 py-4 text-muted-foreground">
                          {cust.last_order_at
                            ? new Date(cust.last_order_at).toLocaleDateString()
                            : 'No purchases'}
                        </td>

                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Link to={`/communications?customerId=${cust.id}`}>
                            <Button variant="outline" size="sm" className="text-xs h-8">
                              <Mail className="w-3.5 h-3.5 mr-1" />
                              Message
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD VIEW (visible on mobile <768px) */}
              <div className="md:hidden divide-y divide-border/60">
                {data.customers.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => navigate(`/customers/${cust.id}`)}
                    className="p-4 hover:bg-muted/20 active:bg-muted/40 transition-colors cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {cust.first_name ? cust.first_name[0] : 'C'}
                        </div>
                        <div className="truncate">
                          <h4 className="font-semibold text-foreground text-sm truncate">
                            {cust.first_name} {cust.last_name}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate">{cust.email}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                      <SegmentBadge segment={cust.segment} />
                      <div className="text-right">
                        <span className="font-bold text-foreground">
                          ${cust.total_spent.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground text-[11px] ml-1.5">
                          ({cust.total_orders} orders)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination controls */}
          {data && data.total > pageSize && (
            <div className="flex items-center justify-between p-4 border-t border-border/60">
              <span className="text-xs text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to{' '}
                {Math.min(page * pageSize, data.total)} of {data.total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page * pageSize >= data.total}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
