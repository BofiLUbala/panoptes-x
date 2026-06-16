import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@panoptes_sms_queue';

export interface QueuedSms {
  sender: string;
  message: string;
  timestamp: string;
}

export const smsQueue = {
  async enqueue(sms: QueuedSms): Promise<void> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: QueuedSms[] = raw ? JSON.parse(raw) : [];
    queue.push(sms);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  async drain(): Promise<QueuedSms[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: QueuedSms[] = raw ? JSON.parse(raw) : [];
    await AsyncStorage.removeItem(QUEUE_KEY);
    return queue;
  },

  async size(): Promise<number> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: QueuedSms[] = raw ? JSON.parse(raw) : [];
    return queue.length;
  },
};
