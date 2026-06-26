import { api } from './api';
import { getPendingSyncTransactions, markTransactionSynced, getFailedParses } from './storage';
import { deviceStore } from './deviceStore';

let intervalId: ReturnType<typeof setInterval> | null = null;
let heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;

async function syncOnce(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;
  try {
    const pending = await getPendingSyncTransactions();
    if (pending.length > 0) {
      await api.syncTransactions(pending);
      for (const tx of pending) {
        await markTransactionSynced(tx.id);
      }
    }
    const failedParses = await getFailedParses();
    if (failedParses.length > 0) {
      await api.syncFailedParses(failedParses);
    }
  } catch {
  } finally {
    isSyncing = false;
  }
}

async function sendHeartbeat(): Promise<void> {
  try {
    const secret = await deviceStore.getDeviceSecret();
    if (secret) {
      await api.sendHeartbeat({});
    }
  } catch {
    // Silently fail - heartbeat is non-critical
  }
}

export const syncService = {
  start(intervalMs: number = 15000): void {
    if (intervalId) return;
    syncOnce();
    intervalId = setInterval(syncOnce, intervalMs);
    // Start heartbeat every 60 seconds
    sendHeartbeat();
    heartbeatIntervalId = setInterval(sendHeartbeat, 60000);
  },

  stop(): void {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (heartbeatIntervalId) {
      clearInterval(heartbeatIntervalId);
      heartbeatIntervalId = null;
    }
  },

  syncNow(): Promise<void> {
    return syncOnce();
  },
};
