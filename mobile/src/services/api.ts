import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  Transaction,
  FailedParse,
  ServiceProfile,
  WatchRelation,
  ForwardedSms,
  RegisteredDevice,
} from '../types';
import { API_BASE_URL } from '../config';
import { deviceStore } from './deviceStore';

class AgentTrackApi {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('PANOPTES-X API:', API_BASE_URL);
  }

  private logoutListeners: (() => void)[] = [];

  onLogout(listener: () => void) {
    this.logoutListeners.push(listener);
    return () => {
      this.logoutListeners = this.logoutListeners.filter((l) => l !== listener);
    };
  }

  logout() {
    this.clearToken();
    this.logoutListeners.forEach((l) => l());
  }

  setToken(token: string): void {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearToken(): void {
    this.token = null;
    delete this.client.defaults.headers.common['Authorization'];
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

  async login(identifier: string, password: string): Promise<string> {
    const response: AxiosResponse = await this.client.post('/auth/login/', {
      identifier,
      password,
    });
    const token: string = response.data.access;
    this.setToken(token);
    return token;
  }

  async getProfile(): Promise<any> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }
    const response: AxiosResponse = await this.client.get('/auth/profile/');
    return response.data;
  }

  async verifyOtp(whatsapp_number: string, otp_code: string): Promise<any> {
    const response: AxiosResponse = await this.client.post('/auth/verify-otp/', { whatsapp_number, otp_code });
    const data = response.data;
    if (data.access) {
      this.setToken(data.access);
    }
    return data;
  }

  async syncTransactions(transactions: Transaction[]): Promise<void> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }
    await this.client.post('/transactions/sync/', { transactions });
  }

  async syncFailedParses(failedParses: FailedParse[]): Promise<void> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }
    await this.client.post('/transactions/failed-parses/', { failed_parses: failedParses });
  }

  async getDashboardData(): Promise<any> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }
    const response: AxiosResponse = await this.client.get('/dashboard/');
    return response.data;
  }

  private async deviceHeaders(): Promise<Record<string, string>> {
    const secret = await deviceStore.getDeviceSecret();
    return secret ? { 'X-Device-Secret': secret } : {};
  }

  async registerDevice(phoneNumber: string, fcmToken?: string): Promise<RegisteredDevice> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }
    const response: AxiosResponse = await this.client.post('/monitoring/register-device/', {
      phone_number: phoneNumber,
      fcm_token: fcmToken,
    });
    const data: RegisteredDevice = response.data;
    await deviceStore.saveDevice(data.phone_number, data.device_secret);
    return data;
  }

  async authorizeWatcher(targetPhone: string, watcherPhone?: string): Promise<WatchRelation> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }
    const headers = await this.deviceHeaders();
    const response: AxiosResponse = await this.client.post(
      '/monitoring/authorize-watcher/',
      { target_phone: targetPhone, watcher_phone: watcherPhone },
      { headers },
    );
    return response.data;
  }

  async confirmWatcher(requestId: number, action: 'accept' | 'reject'): Promise<WatchRelation> {
    const headers = await this.deviceHeaders();
    const response: AxiosResponse = await this.client.post(
      '/monitoring/confirm-watcher/',
      { request_id: requestId, action },
      { headers },
    );
    return response.data;
  }

  async revokeWatcher(requestId: number): Promise<WatchRelation> {
    const headers = await this.deviceHeaders();
    const response: AxiosResponse = await this.client.post(
      '/monitoring/revoke-watcher/',
      { request_id: requestId },
      { headers },
    );
    return response.data;
  }

  async getWatchRelations(role?: 'watcher' | 'target'): Promise<WatchRelation[]> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }
    const headers = await this.deviceHeaders();
    const response: AxiosResponse = await this.client.get('/monitoring/watch-relations/', {
      params: role ? { role } : undefined,
      headers,
    });
    return response.data;
  }

  async forwardSms(payload: {
    sender: string;
    message: string;
    timestamp?: string;
  }): Promise<ForwardedSms> {
    const headers = await this.deviceHeaders();
    const response: AxiosResponse = await this.client.post(
      '/monitoring/forward-sms/',
      payload,
      { headers },
    );
    return response.data;
  }

  async getForwardedSms(
    targetPhone: string,
    page = 1,
    pageSize = 50,
  ): Promise<{ results: ForwardedSms[]; count: number }> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }
    const headers = await this.deviceHeaders();
    const response: AxiosResponse = await this.client.get('/monitoring/get-sms/', {
      params: { target_phone: targetPhone, page, page_size: pageSize },
      headers,
    });
    return response.data;
  }

  async hasActiveWatchAsTarget(): Promise<boolean> {
    try {
      const relations = await this.getWatchRelations('target');
      return relations.some((r) => r.status === 'active');
    } catch {
      return false;
    }
  }
}

export const api = new AgentTrackApi();

