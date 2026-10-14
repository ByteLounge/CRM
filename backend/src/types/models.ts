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

export interface Organisation {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface OrganisationMember {
  id: string;
  organisation_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export interface Integration {
  id: string;
  organisation_id: string;
  provider: string;
  store_url: string;
  encrypted_credentials: {
    consumer_key?: string;
    consumer_secret?: string;
    webhook_secret?: string;
    is_mock?: boolean;
  };
  connection_status: 'connected' | 'disconnected' | 'error' | 'demo';
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  organisation_id: string;
  actor_id: string;
  entity_type: 'customer' | 'order' | 'communication' | 'sync' | 'integration';
  entity_id: string;
  action: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SyncLog {
  id: string;
  organisation_id: string;
  integration_id: string | null;
  sync_type: 'full' | 'customers' | 'orders' | 'webhook';
  status: 'in_progress' | 'completed' | 'failed';
  records_processed: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}
