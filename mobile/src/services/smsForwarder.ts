import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { parseSms } from './smsParser';
import { saveTransaction, saveFailedParse } from './storage';
import { saveGeneralMessage } from './generalMessages';
import { smsQueue, QueuedSms } from './smsQueue';
import { Operator, FailedParse, SyncStatus } from '../types';

const { SmsModule } = NativeModules;

type SmsEvent = {
  sender: string;
  message: string;
  timestamp: number;
};

type SmsHandler = (sms: SmsEvent) => void;

let emitter: NativeEventEmitter | null = null;
let subscription: any = null;
let isRunning = false;
let pollingInterval: ReturnType<typeof setInterval> | null = null;
const handlers: Set<SmsHandler> = new Set();

function processSms(sms: SmsEvent) {
  const operator = detectOperatorFromSender(sms.sender);
  saveGeneralMessage({
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sender: sms.sender,
    message: sms.message,
    operator,
    timestamp: new Date(sms.timestamp).toISOString(),
  });
  const parsed = parseSms(sms.message, sms.sender);
  if (parsed) {
    saveTransaction(parsed);
    smsQueue.enqueue({
      sender: sms.sender,
      message: sms.message,
      timestamp: new Date(sms.timestamp).toISOString(),
    });
  } else {
    const failed: FailedParse = {
      id: `fail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      rawSms: sms.message,
      operator: operator || Operator.AIRTEL,
      error: 'Failed to parse SMS content',
      timestamp: new Date(sms.timestamp).toISOString(),
      syncStatus: SyncStatus.PENDING,
    };
    saveFailedParse(failed);
  }
  handlers.forEach((h) => h(sms));
}

function detectOperatorFromSender(sender: string): Operator | null {
  const upper = sender.toUpperCase();
  if (upper.includes('AIRTEL')) return Operator.AIRTEL;
  if (upper.includes('ORANGE')) return Operator.ORANGE;
  if (upper.includes('VODACOM') || upper.includes('MPESA')) return Operator.VODACOM;
  if (upper.includes('AFRICELL')) return Operator.AFRICELL;
  return null;
}

async function pollPendingSms() {
  if (!SmsModule) return;
  try {
    const pending = await SmsModule.getPendingSms();
    if (pending && Array.isArray(pending)) {
      for (const sms of pending) {
        processSms(sms as SmsEvent);
      }
    }
  } catch (e) {
    /* silent */
  }
}

export const smsForwarder = {
  async start(): Promise<void> {
    if (isRunning) return;
    isRunning = true;

    if (Platform.OS === 'android' && SmsModule) {
      try {
        emitter = new NativeEventEmitter(SmsModule);
        subscription = emitter.addListener('SmsReceived', (sms: SmsEvent) => {
          processSms(sms);
        });
        const pending = await SmsModule.getPendingSms();
        if (pending && Array.isArray(pending)) {
          for (const sms of pending) {
            processSms(sms as SmsEvent);
          }
        }
      } catch {
        pollingInterval = setInterval(pollPendingSms, 5000);
      }
    } else {
      pollingInterval = setInterval(pollPendingSms, 5000);
    }
  },

  stop(): void {
    isRunning = false;
    if (subscription) {
      subscription.remove();
      subscription = null;
    }
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    emitter = null;
  },

  async flushQueue(): Promise<void> {
    const queue = await smsQueue.drain();
    for (const item of queue) {
      processSms({
        sender: item.sender,
        message: item.message,
        timestamp: new Date(item.timestamp).getTime(),
      });
    }
  },

  onSms(handler: SmsHandler): () => void {
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    };
  },

  get isRunning(): boolean {
    return isRunning;
  },
};
