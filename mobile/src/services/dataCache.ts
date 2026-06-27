import { api } from './api';
import { simStore } from './simStore';
import { Subscription, Transaction, Service, WatchRelation, Payment, SimCard } from '../types';

interface DataCache {
  transactions: Transaction[];
  subscriptions: Subscription[];
  services: Service[];
  devices: any[];
  watchRelations: WatchRelation[];
  notifications: any[];
  payments: Payment[];
  loaded: boolean;
}

const cache: DataCache = {
  transactions: [],
  subscriptions: [],
  services: [],
  devices: [],
  watchRelations: [],
  notifications: [],
  payments: [],
  loaded: true,
};

function formatTransaction(t: any): Transaction {
  return {
    id: String(t.id),
    operator: t.operator,
    type: t.type,
    amount: t.amount ? Number(t.amount) : undefined,
    currency: t.currency,
    volume: t.volume ? Number(t.volume) : undefined,
    volumeUnit: t.volume_unit,
    fee: t.fee ? Number(t.fee) : undefined,
    commission: t.commission ? Number(t.commission) : undefined,
    newBalance: t.new_balance ? Number(t.new_balance) : undefined,
    rawSms: t.raw_sms,
    timestamp: t.transaction_date,
    syncStatus: 1,
  };
}

function fetchWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export const dataCache = {
  get transactions() { return cache.transactions; },
  get subscriptions() { return cache.subscriptions; },
  get services() { return cache.services; },
  get devices() { return cache.devices; },
  get watchRelations() { return cache.watchRelations; },
  get notifications() { return cache.notifications; },
  get payments() { return cache.payments; },
  get loaded() { return cache.loaded; },

  async preloadAll() {
    cache.loaded = false;
    const timeoutMs = 15000;
    try {
      const [txData, subs, svcs, devs, rels, notes, pays] = await Promise.all([
        fetchWithTimeout(api.getTransactionsFromServer().catch(() => []), timeoutMs).catch(() => []),
        fetchWithTimeout(api.getSubscriptions().catch(() => [] as Subscription[]), timeoutMs).catch(() => [] as Subscription[]),
        fetchWithTimeout(api.getServices().catch(() => [] as Service[]), timeoutMs).catch(() => [] as Service[]),
        fetchWithTimeout(api.getDevices().catch(() => []), timeoutMs).catch(() => []),
        fetchWithTimeout(api.getWatchRelations().catch(() => [] as WatchRelation[]), timeoutMs).catch(() => [] as WatchRelation[]),
        fetchWithTimeout(api.getNotifications().catch(() => []), timeoutMs).catch(() => []),
        fetchWithTimeout(api.getPayments().catch(() => [] as Payment[]), timeoutMs).catch(() => [] as Payment[]),
      ]);
      cache.transactions = txData.map(formatTransaction);
      cache.subscriptions = subs;
      cache.services = svcs;
      cache.devices = devs;
      cache.watchRelations = rels;
      cache.notifications = notes;
      cache.payments = pays;
    } catch {}
    cache.loaded = true;
  },

  refreshAll() {
    api.getTransactionsFromServer().then((d) => cache.transactions = d.map(formatTransaction)).catch(() => {});
    api.getSubscriptions().then((d) => cache.subscriptions = d).catch(() => {});
    api.getWatchRelations().then((d) => cache.watchRelations = d).catch(() => {});
    api.getNotifications().then((d) => cache.notifications = d).catch(() => {});
  },
};
