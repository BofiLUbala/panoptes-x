import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  Transaction, FailedParse, ServiceProfile, Service,
  PaymentItemRequest, CreatePaymentResponse, Subscription, Payment,
  WatchRelation, ForwardedSms,
} from '../types';
import { API_BASE_URL } from '../config';

const TOKEN_KEY = '@panoptes_auth_token';
const REFRESH_TOKEN_KEY = '@panoptes_refresh_token';

class AgentTrackApi {
  private client: AxiosInstance;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            originalRequest.headers['Authorization'] = `Bearer ${this.token}`;
            return this.client(originalRequest);
          }
        }
        if (!error.response) {
          console.warn('Network error - no response received');
        }
        return Promise.reject(error);
      }
    );
  }

  async restoreToken(): Promise<boolean> {
    try {
      const saved = await AsyncStorage.getItem(TOKEN_KEY);
      const savedRefresh = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (saved) {
        this.token = saved;
        this.client.defaults.headers.common['Authorization'] = `Bearer ${saved}`;
        if (savedRefresh) this.refreshToken = savedRefresh;
        return true;
      }
    } catch {}
    return false;
  }

  private async persistToken(token: string): Promise<void> {
    try { await AsyncStorage.setItem(TOKEN_KEY, token); } catch {}
  }

  private async persistRefreshToken(token: string): Promise<void> {
    try { await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token); } catch {}
  }

  private async removeTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
    } catch {}
  }

  private logoutListeners: (() => void)[] = [];

  onLogout(listener: () => void) {
    this.logoutListeners.push(listener);
    return () => {
      this.logoutListeners = this.logoutListeners.filter((l) => l !== listener);
    };
  }

  async logout() {
    try {
      if (this.refreshToken) {
        await this.client.post('/auth/logout/', { refresh: this.refreshToken });
      }
    } catch {}
    await this.clearToken();
    this.logoutListeners.forEach((l) => l());
  }

  setToken(token: string): void {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    this.persistToken(token);
  }

  setRefreshToken(token: string): void {
    this.refreshToken = token;
    this.persistRefreshToken(token);
  }

  async clearToken(): Promise<void> {
    this.token = null;
    this.refreshToken = null;
    delete this.client.defaults.headers.common['Authorization'];
    await this.removeTokens();
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      if (!this.refreshToken) return false;
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: this.refreshToken,
        });
        if (response.data.access) {
          this.setToken(response.data.access);
          if (response.data.refresh) {
            this.setRefreshToken(response.data.refresh);
          }
          return true;
        }
      } catch (error) {
        console.warn('Token refresh failed:', error);
        await this.clearToken();
        this.logoutListeners.forEach((l) => l());
      }
      return false;
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  async register(data: {
    auth_method: 'email' | 'phone' | 'whatsapp';
    service_profile: ServiceProfile;
    email?: string;
    phone?: string;
    whatsapp_number?: string;
    username: string;
    password: string;
    confirm_password: string;
    pin?: string;
  }): Promise<any> {
    const response: AxiosResponse = await this.client.post('/auth/register/', data);
    return response.data;
  }

  async login(identifier: string, password: string): Promise<{ access: string; refresh: string }> {
    const response: AxiosResponse = await this.client.post('/auth/login/', {
      identifier, password,
    });
    const { access, refresh } = response.data;
    this.setToken(access);
    if (refresh) this.setRefreshToken(refresh);
    return { access, refresh };
  }

  async getProfile(): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    const response: AxiosResponse = await this.client.get('/auth/profile/');
    return response.data;
  }

  async verifyOtp(whatsapp_number: string, otp_code: string): Promise<any> {
    const response: AxiosResponse = await this.client.post('/auth/verify-otp/', { whatsapp_number, otp_code });
    const data = response.data;
    if (data.access) {
      this.setToken(data.access);
      if (data.refresh) this.setRefreshToken(data.refresh);
    }
    return data;
  }

  async syncTransactions(transactions: Transaction[]): Promise<void> {
    if (!this.token) throw new Error('Not authenticated');
    await this.client.post('/transactions/sync/', { transactions });
  }

  async syncFailedParses(failedParses: FailedParse[]): Promise<void> {
    if (!this.token) throw new Error('Not authenticated');
    await this.client.post('/transactions/failed-parses/', { failed_parses: failedParses });
  }

  async getDashboardData(): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    const response: AxiosResponse = await this.client.get('/dashboard/');
    return response.data;
  }

  async getServices(): Promise<Service[]> {
    const response: AxiosResponse = await this.client.get('/services/');
    return response.data;
  }

  async createPayment(network: string, items: PaymentItemRequest[]): Promise<CreatePaymentResponse> {
    const response: AxiosResponse = await this.client.post('/payments/create/', { network, items });
    return response.data;
  }

  async confirmPayment(paymentId: number, transactionReference: string): Promise<any> {
    const response: AxiosResponse = await this.client.post('/payments/confirm/', {
      payment_id: paymentId, transaction_reference: transactionReference,
    });
    return response.data;
  }

  async getSubscriptions(): Promise<Subscription[]> {
    if (!this.token) throw new Error('Not authenticated');
    const response: AxiosResponse = await this.client.get('/subscriptions/');
    return response.data;
  }

  async getPayments(): Promise<Payment[]> {
    if (!this.token) throw new Error('Not authenticated');
    const response: AxiosResponse = await this.client.get('/payments/');
    return response.data;
  }

  async getDevices(): Promise<any[]> {
    if (!this.token) throw new Error('Not authenticated');
    const response: AxiosResponse = await this.client.get('/monitoring/devices/');
    return response.data;
  }

  async registerDevice(phoneNumber: string, deviceInfo?: {
    device_name?: string; device_model?: string; os_version?: string;
    app_version?: string; fingerprint?: string; fcm_token?: string;
  }): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    const response: AxiosResponse = await this.client.post('/monitoring/register-device/', {
      phone_number: phoneNumber,
      ...deviceInfo,
    });
    return response.data;
  }

  async sendHeartbeat(data?: { battery_level?: number; network_type?: string; signal_strength?: number }): Promise<any> {
    const response: AxiosResponse = await this.client.post('/monitoring/heartbeat/', data || {}, {
      headers: { 'X-Device-Secret': await AsyncStorage.getItem('@panoptes_device_secret') || '' },
    });
    return response.data;
  }

  async blockDevice(deviceId: number): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    const response: AxiosResponse = await this.client.post(`/monitoring/devices/${deviceId}/block/`);
    return response.data;
  }

  async unblockDevice(deviceId: number): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    const response: AxiosResponse = await this.client.post(`/monitoring/devices/${deviceId}/unblock/`);
    return response.data;
  }

  async getReconciliationDetail(runId: number): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    const response: AxiosResponse = await this.client.get(`/reconciliation/runs/${runId}/`);
    return response.data;
  }

  async getAuditLogDetail(logId: number): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    const response: AxiosResponse = await this.client.get(`/audit/logs/${logId}/`);
    return response.data;
  }

  async getWatchRelations(): Promise<WatchRelation[]> {
    if (!this.token) throw new Error('Not authenticated');
    const response: AxiosResponse = await this.client.get('/monitoring/watch-relations/', {
      params: { role: 'watcher' },
    });
    return response.data;
  }

  async getForwardedSms(targetPhone: string, page: number = 1): Promise<{ results: ForwardedSms[]; count: number }> {
    if (!this.token) throw new Error('Not authenticated');
    const response: AxiosResponse = await this.client.get('/monitoring/get-sms/', {
      params: { target_phone: targetPhone, page, page_size: 50 },
    });
    return response.data;
  }

  async getTransactionsFromServer(): Promise<Transaction[]> {
    if (!this.token) throw new Error('Not authenticated');
    const response: AxiosResponse = await this.client.get('/transactions/sync/');
    return response.data;
  }

  // --- New API methods ---

  async getSimBalances(): Promise<any[]> {
    if (!this.token) throw new Error('Not authenticated');
    const response = await this.client.get('/ledger/balances/');
    return response.data;
  }

  async getLedgerEntries(): Promise<any[]> {
    if (!this.token) throw new Error('Not authenticated');
    const response = await this.client.get('/ledger/entries/');
    return response.data;
  }

  async getNotifications(limit: number = 50): Promise<any[]> {
    if (!this.token) throw new Error('Not authenticated');
    const response = await this.client.get(`/notifications/?limit=${limit}`);
    return response.data;
  }

  async markNotificationRead(notificationId: number): Promise<void> {
    await this.client.post(`/notifications/${notificationId}/read/`);
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.client.post('/notifications/mark-all-read/');
  }

  async registerPushDevice(fcmToken: string, platform: string = 'android'): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    const response = await this.client.post('/notifications/push/register/', {
      fcm_token: fcmToken, platform,
    });
    return response.data;
  }

  async getAnalyticsDashboard(days: number = 30): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    const response = await this.client.get(`/analytics/dashboard/?days=${days}`);
    return response.data;
  }

  async getRevenueAnalytics(months: number = 6): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    const response = await this.client.get(`/analytics/revenue/?months=${months}`);
    return response.data;
  }

  async getSimAnalytics(): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    const response = await this.client.get('/analytics/sims/');
    return response.data;
  }

  async getAuditLogs(limit: number = 100): Promise<any[]> {
    if (!this.token) throw new Error('Not authenticated');
    const response = await this.client.get(`/audit/logs/?limit=${limit}`);
    return response.data;
  }

  async startReconciliation(periodStart: string, periodEnd: string): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    const response = await this.client.post('/reconciliation/start/', {
      period_start: periodStart, period_end: periodEnd,
    });
    return response.data;
  }

  async getReconciliations(): Promise<any[]> {
    if (!this.token) throw new Error('Not authenticated');
    const response = await this.client.get('/reconciliation/runs/');
    return response.data;
  }
}

export const api = new AgentTrackApi();
