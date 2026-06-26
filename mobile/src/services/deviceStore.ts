import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_SECRET_KEY = '@panoptes_device_secret';
const DEVICE_PHONE_KEY = '@panoptes_device_phone';

const isWeb = Platform.OS === 'web';

const secureGet = async (key: string): Promise<string | null> => {
  if (isWeb) return null;
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
};

const secureSet = async (key: string, value: string): Promise<void> => {
  if (isWeb) return;
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {}
};

const secureRemove = async (key: string): Promise<void> => {
  if (isWeb) return;
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {}
};

export const deviceStore = {
  async saveDevice(phoneNumber: string, deviceSecret: string): Promise<void> {
    await secureSet(DEVICE_PHONE_KEY, phoneNumber);
    await secureSet(DEVICE_SECRET_KEY, deviceSecret);
  },

  async getDeviceSecret(): Promise<string | null> {
    return secureGet(DEVICE_SECRET_KEY);
  },

  async getDevicePhone(): Promise<string | null> {
    return secureGet(DEVICE_PHONE_KEY);
  },

  async clear(): Promise<void> {
    await secureRemove(DEVICE_SECRET_KEY);
    await secureRemove(DEVICE_PHONE_KEY);
  },
};
