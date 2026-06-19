import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeneralMessage } from '../types';

const STORAGE_KEY = '@panoptes_general_messages';
const MAX_MESSAGES = 500;

export async function saveGeneralMessage(message: GeneralMessage): Promise<void> {
  try {
    const existing = await getGeneralMessages();
    existing.unshift(message);
    if (existing.length > MAX_MESSAGES) {
      existing.length = MAX_MESSAGES;
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Failed to save general message:', error);
  }
}

export async function getGeneralMessages(): Promise<GeneralMessage[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get general messages:', error);
    return [];
  }
}

export async function clearGeneralMessages(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear general messages:', error);
  }
}