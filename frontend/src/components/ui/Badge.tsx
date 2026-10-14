import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'purple' | 'amber';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variantStyles = {
    default: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    destructive: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300',
    outline: 'border-border text-muted-foreground',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const SegmentBadge: React.FC<{ segment: string }> = ({ segment }) => {
  switch (segment) {
    case 'high_value':
      return <Badge variant="purple">★ High Value</Badge>;
    case 'repeat':
      return <Badge variant="success">Repeat Customer</Badge>;
    case 'inactive':
      return <Badge variant="destructive">Inactive</Badge>;
    case 'new':
    default:
      return <Badge variant="default">New Customer</Badge>;
  }
};

export const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'completed':
      return <Badge variant="success">Completed</Badge>;
    case 'processing':
      return <Badge variant="default">Processing</Badge>;
    case 'on-hold':
      return <Badge variant="warning">On Hold</Badge>;
    case 'refunded':
      return <Badge variant="amber">Refunded</Badge>;
    case 'cancelled':
    case 'failed':
      return <Badge variant="destructive">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    case 'pending':
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
};

export const CommunicationStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'approved':
      return <Badge variant="success">Approved</Badge>;
    case 'sent':
      return <Badge variant="purple">Sent</Badge>;
    case 'pending_approval':
      return <Badge variant="warning">Pending Approval</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    case 'draft':
    default:
      return <Badge variant="outline">Draft</Badge>;
  }
};
