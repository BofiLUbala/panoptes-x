import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Transaction, FailedParse, ServiceProfile } from '../types';
import { API_BASE_URL } from '../config';

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
}

export const api = new AgentTrackApi();

