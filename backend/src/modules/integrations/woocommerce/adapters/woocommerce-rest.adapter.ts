import https from 'https';
import axios, { AxiosInstance } from 'axios';
import { WCExternalCustomer, WCExternalOrder } from '../../../../types/woocommerce';
import { logger } from '../../../../utils/logger';
import { IWooCommerceAdapter } from './woocommerce.interface';

export interface WCRestConfig {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  timeoutMs?: number;
}

export class WooCommerceRestAdapter implements IWooCommerceAdapter {
  public readonly isMock = false;
  private client: AxiosInstance;
  private storeUrl: string;

  constructor(config: WCRestConfig) {
    this.storeUrl = config.storeUrl.replace(/\/+$/, '');
    const authHeader = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');

    this.client = axios.create({
      baseURL: `${this.storeUrl}/wp-json/wc/v3`,
      timeout: config.timeoutMs || 15000,
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
        'User-Agent': 'FlowCRM/1.0',
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      }),
    });

    // Request/Response logging & retry on 429
    this.client.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        if (error.response?.status === 429) {
          logger.warn('WooCommerce API rate limit encountered. Retrying in 2 seconds...');
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return this.client.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  async testConnection(): Promise<{ success: boolean; storeName?: string; error?: string }> {
    try {
      const response = await this.client.get('/system_status', { timeout: 8000 });
      const storeName = response.data?.environment?.site_title || this.storeUrl;
      return { success: true, storeName };
    } catch (err: any) {
      // Try fallback to root /wp-json/wc/v3 or simple orders check if system_status requires elevated permissions
      try {
        await this.client.get('/orders', { params: { per_page: 1 }, timeout: 8000 });
        return { success: true, storeName: this.storeUrl };
      } catch (innerErr: any) {
        const errorMsg =
          innerErr.response?.data?.message ||
          innerErr.message ||
          'Failed to connect to WooCommerce store. Verify store URL, Consumer Key, and Secret.';
        logger.error(`WooCommerce test connection error: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    }
  }

  async fetchCustomers(page = 1, perPage = 20): Promise<{ customers: WCExternalCustomer[]; total: number }> {
    try {
      const response = await this.client.get<WCExternalCustomer[]>('/customers', {
        params: { page, per_page: perPage },
      });
      const totalHeader = response.headers['x-wp-total'];
      const total = totalHeader ? parseInt(totalHeader, 10) : response.data.length;
      return {
        customers: response.data,
        total,
      };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      logger.error(`WooCommerce fetchCustomers failed: ${msg}`);
      throw new Error(`WooCommerce customers fetch failed: ${msg}`);
    }
  }

  async fetchOrders(page = 1, perPage = 20): Promise<{ orders: WCExternalOrder[]; total: number }> {
    try {
      const response = await this.client.get<WCExternalOrder[]>('/orders', {
        params: { page, per_page: perPage },
      });
      const totalHeader = response.headers['x-wp-total'];
      const total = totalHeader ? parseInt(totalHeader, 10) : response.data.length;
      return {
        orders: response.data,
        total,
      };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      logger.error(`WooCommerce fetchOrders failed: ${msg}`);
      throw new Error(`WooCommerce orders fetch failed: ${msg}`);
    }
  }

  async fetchOrderById(id: number | string): Promise<WCExternalOrder> {
    try {
      const response = await this.client.get<WCExternalOrder>(`/orders/${id}`);
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      logger.error(`WooCommerce fetchOrderById(${id}) failed: ${msg}`);
      throw new Error(`WooCommerce order fetch failed: ${msg}`);
    }
  }
}
