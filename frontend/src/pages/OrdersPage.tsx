import { useQuery } from '@tanstack/react-query';
import { Eye, Package, Search } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { OrderStatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { api } from '../services/api';
import { OrderStatus } from '../types/crm';
import { OrderDetailModal } from './OrderDetailModal';

export const OrdersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, isLoading, error } = useQuery({
    queryKey: ['ordersList', search, statusFilter, page],
    queryFn: () =>
      api.orders.list({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
  });

  const statuses: Array<{ label: string; value: OrderStatus | '' }> = [
    { label: 'All Orders', value: '' },
    { label: 'Completed', value: 'completed' },
    { label: 'Processing', value: 'processing' },
    { label: 'On Hold', value: 'on-hold' },
    { label: 'Refunded', value: 'refunded' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Order Tracking</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time order statuses, payment channels, line items, and customer cross-references.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="w-full md:w-80">
              <Input
                placeholder="Search by order # or customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                icon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {statuses.map((st) => (
                <button
                  key={st.label}
                  onClick={() => {
                    setStatusFilter(st.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    statusFilter === st.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Orders ({data?.total ?? 0})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error || !data || data.orders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h4 className="text-sm font-semibold text-foreground">No orders found</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {search || statusFilter
                  ? 'Try modifying your search or filter options.'
                  : 'Sync orders from your WooCommerce store to see order history.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60">
                  <tr>
                    <th className="px-6 py-3">Order Number</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Placed Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Payment Method</th>
                    <th className="px-6 py-3 text-right">Total Amount</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data.orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-foreground">
                        #{order.order_number}
                      </td>

                      <td className="px-6 py-4">
                        {order.customer ? (
                          <div>
                            <Link
                              to={`/customers/${order.customer.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-medium text-foreground hover:text-primary transition-colors"
                            >
                              {order.customer.first_name} {order.customer.last_name}
                            </Link>
                            <p className="text-[11px] text-muted-foreground">{order.customer.email}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Guest Checkout</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(order.placed_at).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4">
                        <OrderStatusBadge status={order.status} />
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {order.payment_method}
                      </td>

                      <td className="px-6 py-4 text-right font-bold text-foreground">
                        ${order.total_amount.toFixed(2)}
                        <span className="text-[10px] text-muted-foreground ml-1 uppercase">{order.currency}</span>
                      </td>

                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrderId(order.id)}
                          className="h-8 w-8 p-0"
                          title="View order details"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
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

      {/* Order Details Modal */}
      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
};
