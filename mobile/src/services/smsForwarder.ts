import { Platform, PermissionsAndroid, NativeEventEmitter, NativeModules } from 'react-native';
import { api } from './api';
import { smsQueue } from './smsQueue';

type SmsPayload = {
  originatingAddress?: string;
  body?: string;
  timestamp?: number;
};

let listenerStarted = false;
let subscription: { remove: () => void } | null = null;

async function requestSmsPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      PermissionsAndroid.PERMISSIONS.READ_SMS,
    ]);
    return (
      granted[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch {
    return false;
  }
}

async function handleIncomingSms(sms: SmsPayload): Promise<void> {
  const sender = sms.originatingAddress || 'inconnu';
  const message = sms.body || '';
  const timestamp = sms.timestamp
    ? new Date(sms.timestamp).toISOString()
    : new Date().toISOString();

  console.log('[PANOPTES-X] Incoming SMS from:', sender);

  // REMOVED: hasActiveWatchAsTarget() guard — it requires a valid JWT and a network
  // call on every SMS, causing silent drops when the token is expired or the network
  // is momentarily unavailable. The backend already rejects forward-sms with 403
  // (NO_ACTIVE_WATCH) when no active relation exists, so we let the server decide.
  // If forwarding fails, the SMS is queued for retry.

  try {
    await api.forwardSms({ sender, message, timestamp });
    console.log('[PANOPTES-X] SMS forwarded successfully');
  } catch (err: any) {
    const status = err?.response?.status;
    // 403 = NO_ACTIVE_WATCH — no point queuing, the target isn't being watched
    if (status === 403) {
      console.log('[PANOPTES-X] No active watcher — SMS not forwarded (403)');
      return;
    }
    // Any other error (network, 5xx, etc.) → queue for retry
    console.warn('[PANOPTES-X] Forward failed, queuing SMS:', err?.message);
    await smsQueue.enqueue({ sender, message, timestamp });
  }
}

async function flushQueue(): Promise<void> {
  const queued = await smsQueue.drain();
  if (queued.length === 0) return;
  console.log('[PANOPTES-X] Flushing', queued.length, 'queued SMS(s)');
  for (const item of queued) {
    try {
      await api.forwardSms(item);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status !== 403) {
        // Re-enqueue only if it's not a "no watcher" response
        await smsQueue.enqueue(item);
      }
      break;
    }
  }
}

function getNativeSmsModule(): { addListener: (cb: (sms: SmsPayload) => void) => { remove: () => void } } | null {
  const mod = NativeModules.SmsListener || NativeModules.RNSmsListener;
  if (!mod) {
    return null;
  }
  const emitter = new NativeEventEmitter(mod);
  return {
    addListener: (cb) => emitter.addListener('onSmsReceived', cb),
  };
}

export const smsForwarder = {
  async start(): Promise<void> {
    if (listenerStarted || Platform.OS !== 'android') {
      return;
    }

    const permitted = await requestSmsPermissions();
    if (!permitted) {
      console.warn('PANOPTES-X: permissions SMS refusées');
      return;
    }

    await flushQueue();

    const native = getNativeSmsModule();
    if (native) {
      subscription = native.addListener((sms) => {
        handleIncomingSms(sms).catch(console.error);
      });
      listenerStarted = true;
      console.log('[PANOPTES-X] SMS listener started (native module)');
      return;
    }

    console.warn(
      'PANOPTES-X: module natif SMS absent — build dev client requis pour la capture en arrière-plan.',
    );
    listenerStarted = true;
  },

  stop(): void {
    if (listenerStarted) {
      console.log('[PANOPTES-X] SMS listener stopped');
    }
    subscription?.remove();
    subscription = null;
    listenerStarted = false;
  },

  async flushQueue(): Promise<void> {
    await flushQueue();
  },

  /** Permet de tester le relais sans module natif (Device B). */
  async simulateIncomingSms(sender: string, message: string): Promise<void> {
    await handleIncomingSms({
      originatingAddress: sender,
      body: message,
      timestamp: Date.now(),
    });
  },
};
