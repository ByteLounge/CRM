import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bot,
  Calendar,
  CheckCircle2,
  DollarSign,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Plus,
  Send,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CommunicationStatusBadge,
  OrderStatusBadge,
  SegmentBadge,
} from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { api } from '../services/api';

type ActiveTab = 'orders' | 'ai' | 'notes' | 'communications';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>('orders');
  const [newNote, setNewNote] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['customerDetail', id],
    queryFn: () => api.customers.getById(id!),
    enabled: Boolean(id),
  });

  const { data: aiInsights, isLoading: isAiLoading, refetch: refetchAi } = useQuery({
    queryKey: ['customerAiInsights', id],
    queryFn: () => api.ai.getInsights(id!),
    enabled: Boolean(id),
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => api.customers.addNote(id!, content),
    onSuccess: () => {
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['customerDetail', id] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => api.customers.deleteNote(id!, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerDetail', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-96 lg:col-span-2 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 p-6 text-center">
        <h3 className="text-base font-semibold text-destructive">Customer not found</h3>
        <p className="text-xs text-muted-foreground mt-1">The requested customer could not be located in this organization.</p>
        <Link to="/customers" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Back to Customer Directory</Button>
        </Link>
      </Card>
    );
  }

  const { customer, orders, notes, communications } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back button and profile header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/customers">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Back to Customers">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {customer.first_name} {customer.last_name}
              </h2>
              <SegmentBadge segment={customer.segment} />
              {customer.is_guest && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                  Guest Checkout
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {customer.external_customer_id
                ? `WooCommerce ID #${customer.external_customer_id}`
                : 'Local CRM Guest Profile'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/communications?customerId=${customer.id}`}>
            <Button size="sm" className="text-xs font-semibold">
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Compose Message
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid: Left side details, Right side Tabbed Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal info & summary */}
        <div className="space-y-6">
          {/* Quick Stats Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Purchasing Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/60 text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Lifetime Spend
                </span>
                <span className="font-bold text-foreground text-sm">${customer.total_spent.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/60 text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-indigo-500" /> Total Orders
                </span>
                <span className="font-semibold text-foreground">{customer.total_orders}</span>
              </div>
              <div className="flex items-center justify-between py-2 text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" /> Last Order
                </span>
                <span className="text-foreground">
                  {customer.last_order_at
                    ? new Date(customer.last_order_at).toLocaleDateString()
                    : 'None recorded'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-foreground truncate">{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground">{customer.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Addresses Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Address Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <p className="font-semibold text-foreground mb-1">Billing</p>
                {customer.billing_address?.address_1 ? (
                  <p className="text-muted-foreground leading-relaxed">
                    {customer.billing_address.address_1}
                    {customer.billing_address.address_2 && `, ${customer.billing_address.address_2}`}
                    <br />
                    {customer.billing_address.city}, {customer.billing_address.state}{' '}
                    {customer.billing_address.postcode}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">No billing address recorded</p>
                )}
              </div>

              <div className="pt-3 border-t border-border/60">
                <p className="font-semibold text-foreground mb-1">Shipping</p>
                {customer.shipping_address?.address_1 ? (
                  <p className="text-muted-foreground leading-relaxed">
                    {customer.shipping_address.address_1}
                    <br />
                    {customer.shipping_address.city}, {customer.shipping_address.state}{' '}
                    {customer.shipping_address.postcode}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">Same as billing</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Clean Tabbed Navigation for Beginners */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs bar */}
          <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Order History ({orders.length})
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'ai'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-indigo-500" />
              FlowAI Insights
              <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'notes'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Team Notes ({notes.length})
            </button>

            <button
              onClick={() => setActiveTab('communications')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'communications'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Communications ({communications.length})
            </button>
          </div>

          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <Card className="animate-in fade-in duration-200">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Store Purchases</span>
                  <span className="text-xs font-normal text-muted-foreground">Source: WooCommerce</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {orders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No orders recorded for this customer yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border/60 text-xs">
                    {orders.map((order) => (
                      <div key={order.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">#{order.order_number}</span>
                            <OrderStatusBadge status={order.status} />
                          </div>
                          <p className="text-muted-foreground text-[11px] mt-0.5">
                            Placed on {new Date(order.placed_at).toLocaleDateString()} • {order.payment_method}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-foreground text-sm">${order.total_amount.toFixed(2)}</span>
                          <p className="text-[10px] text-muted-foreground uppercase">{order.currency}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB 2: FLOWAI INSIGHTS */}
          {activeTab === 'ai' && (
            <Card className="border-indigo-200/60 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/30 dark:from-indigo-950/20 to-card animate-in fade-in duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-foreground flex items-center gap-1.5">
                      FlowAI Behavioral Intelligence
                    </CardTitle>
                    <CardDescription className="text-xs">Grounded strictly against real WooCommerce purchases</CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchAi()} className="text-xs h-8">
                  Refresh Analysis
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                {isAiLoading ? (
                  <div className="space-y-3 py-4">
                    <Skeleton className="h-6 w-1/2 rounded-md" />
                    <Skeleton className="h-16 w-full rounded-md" />
                  </div>
                ) : aiInsights ? (
                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-xl bg-card border border-border/70 space-y-1.5">
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                        Customer Narrative
                      </span>
                      <p className="text-foreground leading-relaxed font-medium">
                        "{aiInsights.summary}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-card border border-border/70">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-medium">Churn Probability:</span>
                          <span
                            className={`font-bold uppercase text-xs ${
                              aiInsights.churnRisk === 'high'
                                ? 'text-rose-600 dark:text-rose-400'
                                : aiInsights.churnRisk === 'medium'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {aiInsights.churnRisk}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-1 text-[11px]">{aiInsights.churnReason}</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-card border border-border/70">
                        <span className="text-muted-foreground font-medium block">Recommended Action:</span>
                        <p className="text-foreground font-semibold mt-1 text-[11px]">
                          {aiInsights.recommendedAction}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* TAB 3: NOTES */}
          {activeTab === 'notes' && (
            <Card className="animate-in fade-in duration-200">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Internal Team Notes
                </CardTitle>
                <CardDescription className="text-xs">Private notes visible only to store operators</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Note input */}
                <div className="space-y-2">
                  <textarea
                    className="w-full text-xs p-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={2}
                    placeholder="Add an internal observation, VIP request, or customer call note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (newNote.trim()) addNoteMutation.mutate(newNote.trim());
                      }}
                      isLoading={addNoteMutation.isPending}
                      disabled={!newNote.trim()}
                      className="text-xs h-8"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Save Note
                    </Button>
                  </div>
                </div>

                {/* Notes list */}
                <div className="space-y-2.5 pt-1">
                  {notes.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4">
                      No team notes added yet. Record internal notes above.
                    </p>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs flex items-start justify-between gap-3"
                      >
                        <div>
                          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{note.content}</p>
                          <p className="text-[10px] text-muted-foreground mt-2">
                            Recorded by <span className="font-medium text-foreground">{note.author_id}</span> •{' '}
                            {new Date(note.created_at).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: COMMUNICATIONS */}
          {activeTab === 'communications' && (
            <Card className="animate-in fade-in duration-200">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Communications Log ({communications.length})</span>
                  <Link to={`/communications?customerId=${customer.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      Open in Communications Hub
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {communications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No communications recorded for this customer yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border/60 text-xs">
                    {communications.map((comm) => (
                      <div key={comm.id} className="p-4 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground text-sm">{comm.subject}</span>
                          <CommunicationStatusBadge status={comm.status} />
                        </div>
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{comm.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          <span>Purpose: {comm.purpose.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{new Date(comm.created_at).toLocaleString()}</span>
                          {comm.generated_by_ai && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-500 font-semibold flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> FlowAI Drafted
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
