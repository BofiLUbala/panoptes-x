import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_SECRET_KEY = '@panoptes_device_secret';
const DEVICE_PHONE_KEY = '@panoptes_device_phone';

export const deviceStore = {
  async saveDevice(phoneNumber: string, deviceSecret: string): Promise<void> {
    await AsyncStorage.multiSet([
      [DEVICE_PHONE_KEY, phoneNumber],
      [DEVICE_SECRET_KEY, deviceSecret],
    ]);
  },

  async getDeviceSecret(): Promise<string | null> {
    return AsyncStorage.getItem(DEVICE_SECRET_KEY);
  },

  async getDevicePhone(): Promise<string | null> {
    return AsyncStorage.getItem(DEVICE_PHONE_KEY);
  },

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([DEVICE_SECRET_KEY, DEVICE_PHONE_KEY]);
  },
};
