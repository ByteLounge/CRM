export interface Address {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export type CustomerSegment = 'new' | 'repeat' | 'high_value' | 'inactive';

export interface Customer {
  id: string;
  organisation_id: string;
  external_customer_id: number | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  billing_address: Address;
  shipping_address: Address;
  total_orders: number;
  total_spent: number;
  currency: string;
  segment: CustomerSegment;
  is_guest: boolean;
  last_order_at: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed';

export interface OrderItem {
  id: string;
  order_id: string;
  external_product_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  organisation_id: string;
  external_order_id: number;
  customer_id: string | null;
  order_number: string;
  status: OrderStatus;
  currency: string;
  total_amount: number;
  payment_method: string;
  placed_at: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  customer?: Customer | null;
}

export type CommunicationStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'failed';
export type CommunicationChannel = 'email' | 'sms' | 'note';
export type CommunicationPurpose =
  | 'order_followup'
  | 'thank_you'
  | 'customer_reengagement'
  | 'support_response'
  | 'general';

export interface Communication {
  id: string;
  organisation_id: string;
  customer_id: string;
  order_id: string | null;
  channel: CommunicationChannel;
  purpose: CommunicationPurpose;
  subject: string;
  message: string;
  status: CommunicationStatus;
  generated_by_ai: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface CustomerNote {
  id: string;
  organisation_id: string;
  customer_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardAnalytics {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  aov: number;
  recentOrders: Order[];
  recentCustomers: Customer[];
  statusDistribution: Array<{ status: string; count: number }>;
  segmentDistribution: Array<{ segment: string; count: number }>;
  revenueTrends: Array<{ date: string; revenue: number }>;
}

export interface IntegrationStatus {
  provider: string;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'demo';
  isMock: boolean;
  storeUrl: string;
  lastSyncAt: string | null;
  hasCredentials?: boolean;
}

export interface CustomerInsights {
  summary: string;
  churnRisk: 'low' | 'medium' | 'high';
  churnReason: string;
  recommendedAction: string;
  keyMetrics: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    daysSinceLastOrder: number | null;
    segment: string;
  };
}

export interface RetentionOpportunity {
  customerId: string;
  customerName: string;
  customerEmail: string;
  segment: string;
  totalSpent: number;
  daysInactive: number;
  churnRisk: 'high' | 'medium' | 'low';
  diagnosis: string;
  suggestedOffer: string;
  draftSubject: string;
  draftMessage: string;
}
