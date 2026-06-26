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
  private reconnectTimeout: number = 3000;
  private isAuthenticated: boolean = false;

  setAuthenticated(value: boolean) {
    this.isAuthenticated = value;
    if (value) {
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

  private connectNotifications() {
    if (this.notificationWs) return;
    try {
      this.notificationWs = this.connectWebSocket(`${WS_BASE_URL}/ws/notifications/`);
      this.notificationWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notificationHandlers.forEach((h) => h(data));
        } catch {}
      };
      this.notificationWs.onclose = () => {
        this.notificationWs = null;
        if (this.isAuthenticated) {
          setTimeout(() => this.connectNotifications(), this.reconnectTimeout);
        }
      };
      this.notificationWs.onerror = () => {
        this.notificationWs?.close();
      };
    } catch {}
  }

  private connectTransactions() {
    if (this.transactionWs) return;
    try {
      this.transactionWs = this.connectWebSocket(`${WS_BASE_URL}/ws/transactions/`);
      this.transactionWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.transactionHandlers.forEach((h) => h(data));
        } catch {}
      };
      this.transactionWs.onclose = () => {
        this.transactionWs = null;
        if (this.isAuthenticated) {
          setTimeout(() => this.connectTransactions(), this.reconnectTimeout);
        }
      };
      this.transactionWs.onerror = () => {
        this.transactionWs?.close();
      };
    } catch {}
  }

  private connectSmsFeed() {
    if (this.smsFeedWs) return;
    try {
      this.smsFeedWs = this.connectWebSocket(`${WS_BASE_URL}/ws/sms-feed/`);
      this.smsFeedWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.smsFeedHandlers.forEach((h) => h(data));
        } catch {}
      };
      this.smsFeedWs.onclose = () => {
        this.smsFeedWs = null;
        if (this.isAuthenticated) {
          setTimeout(() => this.connectSmsFeed(), this.reconnectTimeout);
        }
      };
      this.smsFeedWs.onerror = () => {
        this.smsFeedWs?.close();
      };
    } catch {}
  }

  disconnectAll() {
    this.notificationWs?.close();
    this.notificationWs = null;
    this.transactionWs?.close();
    this.transactionWs = null;
    this.smsFeedWs?.close();
    this.smsFeedWs = null;
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
