import { WS_BASE_URL } from '../config';
import { api } from './api';

type MessageHandler = (data: any) => void;

class WebSocketManager {
  private notificationWs: WebSocket | null = null;
  private transactionWs: WebSocket | null = null;
  private smsFeedWs: WebSocket | null = null;
  private notificationHandlers: Set<MessageHandler> = new Set();
  private transactionHandlers: Set<MessageHandler> = new Set();
  private smsFeedHandlers: Set<MessageHandler> = new Set();
  private notificationRetries: number = 0;
  private transactionRetries: number = 0;
  private smsFeedRetries: number = 0;
  private notificationTimer: ReturnType<typeof setTimeout> | null = null;
  private transactionTimer: ReturnType<typeof setTimeout> | null = null;
  private smsFeedTimer: ReturnType<typeof setTimeout> | null = null;
  private isAuthenticated: boolean = false;
  private readonly MAX_RETRIES = 10;
  private readonly BASE_DELAY = 1000;
  private readonly MAX_DELAY = 30000;

  private getBackoffDelay(retries: number): number {
    const delay = Math.min(this.BASE_DELAY * Math.pow(2, retries), this.MAX_DELAY);
    const jitter = Math.random() * 1000;
    return delay + jitter;
  }

  setAuthenticated(value: boolean) {
    this.isAuthenticated = value;
    if (value) {
      this.notificationRetries = 0;
      this.transactionRetries = 0;
      this.smsFeedRetries = 0;
      this.connectAll();
    } else {
      this.disconnectAll();
    }
  }

  private getAuthToken(): string | null {
    return (api as any).token || null;
  }

  private connectWebSocket(url: string): WebSocket {
    const token = this.getAuthToken();
    const wsUrl = token ? `${url}?token=${token}` : url;
    return new WebSocket(wsUrl);
  }

  connectAll() {
    if (!this.isAuthenticated) return;
    this.connectNotifications();
    this.connectTransactions();
    this.connectSmsFeed();
  }

  private scheduleReconnect(type: 'notification' | 'transaction' | 'smsFeed') {
    if (!this.isAuthenticated) return;
    let retries: number;
    let timer: { current: ReturnType<typeof setTimeout> | null };
    let connectFn: () => void;

    switch (type) {
      case 'notification':
        retries = this.notificationRetries;
        timer = { current: this.notificationTimer };
        connectFn = () => this.connectNotifications();
        break;
      case 'transaction':
        retries = this.transactionRetries;
        timer = { current: this.transactionTimer };
        connectFn = () => this.connectTransactions();
        break;
      case 'smsFeed':
        retries = this.smsFeedRetries;
        timer = { current: this.smsFeedTimer };
        connectFn = () => this.connectSmsFeed();
        break;
    }

    if (retries >= this.MAX_RETRIES) return;

    const delay = this.getBackoffDelay(retries);

    const newTimer = setTimeout(() => {
      switch (type) {
        case 'notification': this.notificationTimer = null; this.notificationRetries++; break;
        case 'transaction': this.transactionTimer = null; this.transactionRetries++; break;
        case 'smsFeed': this.smsFeedTimer = null; this.smsFeedRetries++; break;
      }
      connectFn();
    }, delay);

    switch (type) {
      case 'notification': this.notificationTimer = newTimer; break;
      case 'transaction': this.transactionTimer = newTimer; break;
      case 'smsFeed': this.smsFeedTimer = newTimer; break;
    }
  }

  private connectNotifications() {
    if (this.notificationWs) return;
    this.notificationWs = this.connectWebSocket(`${WS_BASE_URL}/ws/notifications/`);
    this.notificationWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notificationHandlers.forEach((h) => h(data));
      } catch {}
    };
    this.notificationWs.onclose = () => {
      this.notificationWs = null;
      this.scheduleReconnect('notification');
    };
    this.notificationWs.onerror = () => {
      this.notificationWs?.close();
    };
  }

  private connectTransactions() {
    if (this.transactionWs) return;
    this.transactionWs = this.connectWebSocket(`${WS_BASE_URL}/ws/transactions/`);
    this.transactionWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.transactionHandlers.forEach((h) => h(data));
      } catch {}
    };
    this.transactionWs.onclose = () => {
      this.transactionWs = null;
      this.scheduleReconnect('transaction');
    };
    this.transactionWs.onerror = () => {
      this.transactionWs?.close();
    };
  }

  private connectSmsFeed() {
    if (this.smsFeedWs) return;
    this.smsFeedWs = this.connectWebSocket(`${WS_BASE_URL}/ws/sms-feed/`);
    this.smsFeedWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.smsFeedHandlers.forEach((h) => h(data));
      } catch {}
    };
    this.smsFeedWs.onclose = () => {
      this.smsFeedWs = null;
      this.scheduleReconnect('smsFeed');
    };
    this.smsFeedWs.onerror = () => {
      this.smsFeedWs?.close();
    };
  }

  disconnectAll() {
    if (this.notificationTimer) { clearTimeout(this.notificationTimer); this.notificationTimer = null; }
    if (this.transactionTimer) { clearTimeout(this.transactionTimer); this.transactionTimer = null; }
    if (this.smsFeedTimer) { clearTimeout(this.smsFeedTimer); this.smsFeedTimer = null; }
    this.notificationWs?.close();
    this.notificationWs = null;
    this.transactionWs?.close();
    this.transactionWs = null;
    this.smsFeedWs?.close();
    this.smsFeedWs = null;
    this.notificationRetries = 0;
    this.transactionRetries = 0;
    this.smsFeedRetries = 0;
  }

  onNotification(handler: MessageHandler): () => void {
    this.notificationHandlers.add(handler);
    return () => { this.notificationHandlers.delete(handler); };
  }

  onTransaction(handler: MessageHandler): () => void {
    this.transactionHandlers.add(handler);
    return () => { this.transactionHandlers.delete(handler); };
  }

  onSmsFeed(handler: MessageHandler): () => void {
    this.smsFeedHandlers.add(handler);
    return () => { this.smsFeedHandlers.delete(handler); };
  }
}

export const wsManager = new WebSocketManager();
