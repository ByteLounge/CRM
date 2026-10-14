import { WCExternalCustomer, WCExternalOrder } from '../../../../types/woocommerce';

export interface IWooCommerceAdapter {
  isMock: boolean;
  testConnection(): Promise<{ success: boolean; storeName?: string; error?: string }>;
  fetchCustomers(page?: number, perPage?: number): Promise<{ customers: WCExternalCustomer[]; total: number }>;
  fetchOrders(page?: number, perPage?: number): Promise<{ orders: WCExternalOrder[]; total: number }>;
  fetchOrderById(id: number | string): Promise<WCExternalOrder>;
}
