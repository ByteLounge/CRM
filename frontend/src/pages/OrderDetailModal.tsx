import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Package, User } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { OrderStatusBadge } from '../components/ui/Badge';
import { Dialog } from '../components/ui/Dialog';
import { Skeleton } from '../components/ui/Skeleton';
import { api } from '../services/api';

interface OrderDetailModalProps {
  orderId: string | null;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ orderId, onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['orderDetail', orderId],
    queryFn: () => api.orders.getById(orderId!),
    enabled: Boolean(orderId),
  });

  const order = data?.order;

  return (
    <Dialog
      isOpen={Boolean(orderId)}
      onClose={onClose}
      title={order ? `Order #${order.order_number}` : 'Loading order...'}
      description={order ? `Placed on ${new Date(order.placed_at).toLocaleString()}` : ''}
      maxWidth="lg"
    >
      {isLoading || !order ? (
        <div className="space-y-4 py-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="space-y-6 text-xs">
          {/* Status & Source Notice Banner */}
          <div className="p-3.5 rounded-lg bg-muted/40 border border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">WooCommerce Status:</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <span className="text-[10px] text-muted-foreground italic">
              WooCommerce is the authoritative source of truth
            </span>
          </div>

          {/* Customer info link */}
          <div className="p-4 rounded-lg bg-card border border-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                Associated Customer
              </span>
              {order.customer && (
                <Link
                  to={`/customers/${order.customer.id}`}
                  onClick={onClose}
                  className="text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  View Profile <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
            <p className="text-foreground font-medium">
              {order.customer
                ? `${order.customer.first_name} ${order.customer.last_name}`
                : 'Guest Checkout'}
            </p>
            {order.customer?.email && (
              <p className="text-muted-foreground">{order.customer.email}</p>
            )}
          </div>

          {/* Ordered Line Items Breakdown */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
              <Package className="w-4 h-4 text-primary" />
              Ordered Items ({order.items?.length ?? 0})
            </h4>

            <div className="border border-border/80 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Product Name</th>
                    <th className="px-4 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5 text-right">Unit Price</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium text-foreground">{item.product_name}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          ${item.unit_price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          ${item.total_price.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground italic">
                        No item breakdown available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment & Financial Totals */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground">Payment Method</p>
              <p className="font-semibold text-foreground mt-0.5">{order.payment_method}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Total Order Amount ({order.currency})</p>
              <p className="text-lg font-bold text-foreground mt-0.5">${order.total_amount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
};
