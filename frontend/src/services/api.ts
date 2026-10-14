import axios from 'axios';
import {
  Communication,
  Customer,
  CustomerInsights,
  CustomerNote,
  DashboardAnalytics,
  IntegrationStatus,
  Order,
  RetentionOpportunity,
} from '../types/crm';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token and org ID from localStorage if set
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('flowcrm_token');
  const orgId = localStorage.getItem('flowcrm_org_id');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (orgId) {
    config.headers['X-Organisation-ID'] = orgId;
  }
  return config;
});

export const api = {
  // Auth
  auth: {
    getMe: async () => {
      const res = await apiClient.get('/auth/me');
      return res.data;
    },
    login: async (email: string) => {
      const res = await apiClient.post('/auth/login', { email });
      return res.data;
    },
  },

  // Analytics & Overview
  analytics: {
    getOverview: async (): Promise<DashboardAnalytics> => {
      const res = await apiClient.get('/analytics/overview');
      return res.data;
    },
    getActivity: async (limit = 20) => {
      const res = await apiClient.get('/analytics/activity', { params: { limit } });
      return res.data;
    },
  },

  // Customers
  customers: {
    list: async (params: {
      search?: string;
      segment?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    } = {}): Promise<{ customers: Customer[]; total: number }> => {
      const res = await apiClient.get('/customers', { params });
      return res.data;
    },
    getById: async (id: string): Promise<{
      customer: Customer;
      orders: Order[];
      notes: CustomerNote[];
      communications: Communication[];
    }> => {
      const res = await apiClient.get(`/customers/${id}`);
      return res.data;
    },
    addNote: async (customerId: string, content: string): Promise<{ note: CustomerNote }> => {
      const res = await apiClient.post(`/customers/${customerId}/notes`, { content });
      return res.data;
    },
    deleteNote: async (customerId: string, noteId: string): Promise<void> => {
      await apiClient.delete(`/customers/${customerId}/notes/${noteId}`);
    },
  },

  // Orders
  orders: {
    list: async (params: {
      customerId?: string;
      search?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    } = {}): Promise<{ orders: Order[]; total: number }> => {
      const res = await apiClient.get('/orders', { params });
      return res.data;
    },
    getById: async (id: string): Promise<{ order: Order }> => {
      const res = await apiClient.get(`/orders/${id}`);
      return res.data;
    },
  },

  // Communications
  communications: {
    list: async (params: { customerId?: string; status?: string } = {}): Promise<{ communications: Communication[] }> => {
      const res = await apiClient.get('/communications', { params });
      return res.data;
    },
    create: async (data: {
      customerId: string;
      orderId?: string | null;
      channel?: string;
      purpose: string;
      subject: string;
      message: string;
      status?: string;
      generatedByAi?: boolean;
    }): Promise<{ communication: Communication }> => {
      const res = await apiClient.post('/communications', data);
      return res.data;
    },
    updateStatus: async (id: string, status: string): Promise<{ communication: Communication }> => {
      const res = await apiClient.patch(`/communications/${id}/status`, { status });
      return res.data;
    },
  },

  // WooCommerce Integration
  woocommerce: {
    getStatus: async (): Promise<IntegrationStatus> => {
      const res = await apiClient.get('/integrations/woocommerce/status');
      return res.data;
    },
    testConnection: async (): Promise<{ success: boolean; isMock: boolean; storeName?: string; error?: string }> => {
      const res = await apiClient.post('/integrations/woocommerce/test');
      return res.data;
    },
    updateSettings: async (settings: {
      storeUrl?: string;
      consumerKey?: string;
      consumerSecret?: string;
      isMock?: boolean;
    }) => {
      const res = await apiClient.post('/integrations/woocommerce/settings', settings);
      return res.data;
    },
    triggerSync: async (): Promise<{
      success: boolean;
      isMock: boolean;
      customersSynced: number;
      ordersSynced: number;
      lastSyncAt: string;
      error?: string;
    }> => {
      const res = await apiClient.post('/integrations/woocommerce/sync');
      return res.data;
    },
  },

  // FlowAI
  ai: {
    getInsights: async (customerId: string): Promise<CustomerInsights> => {
      const res = await apiClient.post('/ai/insights', { customerId });
      return res.data;
    },
    generateCommunication: async (data: {
      customerId: string;
      orderId?: string | null;
      purpose: string;
      channel?: string;
      tone?: string;
      additionalInstructions?: string;
    }): Promise<{
      subject: string;
      message: string;
      suggestedAction: string;
      confidenceScore: number;
    }> => {
      const res = await apiClient.post('/ai/generate-communication', data);
      return res.data;
    },
    runRetentionScan: async (): Promise<{
      totalScanned: number;
      opportunitiesFound: number;
      opportunities: RetentionOpportunity[];
    }> => {
      const res = await apiClient.post('/ai/retention-scan');
      return res.data;
    },
  },
};
