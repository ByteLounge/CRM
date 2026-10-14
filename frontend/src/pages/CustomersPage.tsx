import { useQuery } from '@tanstack/react-query';
import { Mail, Search, Users } from 'lucide-react';
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
    { label: 'All Customers', value: '' },
    { label: 'High Value', value: 'high_value' },
    { label: 'Repeat', value: 'repeat' },
    { label: 'New', value: 'new' },
    { label: 'Inactive', value: 'inactive' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Customer Directory</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage customer profiles, order metrics, and deterministic segments synchronised with WooCommerce.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search input */}
            <div className="w-full md:w-80">
              <Input
                placeholder="Search by name, email, phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                icon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Segment pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {segments.map((seg) => (
                <button
                  key={seg.label}
                  onClick={() => {
                    setSelectedSegment(seg.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedSegment === seg.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {seg.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Directory ({data?.total ?? 0} customers)
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error || !data || data.customers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h4 className="text-sm font-semibold text-foreground">No customers found</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {search || selectedSegment
                  ? 'Try adjusting your search criteria or segment filters.'
                  : 'Sync with your WooCommerce store to ingest customer records.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60">
                  <tr>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Segment</th>
                    <th className="px-6 py-3">Orders</th>
                    <th className="px-6 py-3">Lifetime Spend</th>
                    <th className="px-6 py-3">Last Order</th>
                    <th className="px-6 py-3 text-right">Actions</th>
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
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-secondary-foreground shrink-0">
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
                          <Button variant="outline" size="sm" className="text-xs">
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
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page * pageSize >= data.total}
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
