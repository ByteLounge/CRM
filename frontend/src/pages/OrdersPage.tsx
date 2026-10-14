import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Eye, Package, Search } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { OrderStatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
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
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Order Tracking
          <span className="text-xs font-normal text-muted-foreground">
            ({data?.total ?? 0} orders)
          </span>
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time order statuses, line items, payment methods, and customer associations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="w-full md:w-80">
              <Input
                placeholder="Search by order # or customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                icon={<Search className="w-4 h-4 text-muted-foreground" />}
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {statuses.map((st) => (
                <button
                  key={st.label}
                  onClick={() => {
                    setStatusFilter(st.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    statusFilter === st.value
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : error || !data || data.orders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h4 className="text-sm font-semibold text-foreground">No orders found</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {search || statusFilter
                  ? 'Try modifying your search or filter options.'
                  : 'Sync orders from your WooCommerce store using the header Sync button.'}
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW (hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60">
                    <tr>
                      <th className="px-6 py-3.5">Order</th>
                      <th className="px-6 py-3.5">Customer</th>
                      <th className="px-6 py-3.5">Placed Date</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Payment</th>
                      <th className="px-6 py-3.5 text-right">Total</th>
                      <th className="px-6 py-3.5 text-right">Details</th>
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
                                className="font-semibold text-foreground hover:text-primary transition-colors"
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

              {/* MOBILE CARD VIEW (visible on mobile <768px) */}
              <div className="md:hidden divide-y divide-border/60">
                {data.orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="p-4 hover:bg-muted/20 active:bg-muted/40 transition-colors cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">
                          #{order.order_number}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {order.customer
                          ? `${order.customer.first_name} ${order.customer.last_name}`
                          : 'Guest Checkout'}
                      </span>
                      <span>{new Date(order.placed_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                      <span className="text-[11px] text-muted-foreground uppercase">{order.payment_method}</span>
                      <span className="font-bold text-foreground text-sm">
                        ${order.total_amount.toFixed(2)} {order.currency}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
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

      {/* Order Details Modal */}
      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
};
