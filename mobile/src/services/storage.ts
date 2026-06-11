import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, FailedParse, SyncStatus } from '../types';

const TRANSACTIONS_KEY = '@agenttrack_transactions';
const FAILED_PARSES_KEY = '@agenttrack_failed_parses';

export async function saveTransaction(transaction: Transaction): Promise<void> {
  try {
    const existing = await getTransactions();
    existing.push(transaction);
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Failed to save transaction:', error);
  }
}

export async function getTransactions(): Promise<Transaction[]> {
  try {
    const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get transactions:', error);
    return [];
  }
}

export async function getPendingSyncTransactions(): Promise<Transaction[]> {
  const transactions = await getTransactions();
  return transactions.filter((t) => t.syncStatus === SyncStatus.PENDING);
}

export async function markTransactionSynced(id: string): Promise<void> {
  const transactions = await getTransactions();
  const updated = transactions.map((t) =>
    t.id === id ? { ...t, syncStatus: SyncStatus.SYNCED } : t
  );
  await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
}

export async function saveFailedParse(failed: FailedParse): Promise<void> {
  try {
    const existing = await getFailedParses();
    existing.push(failed);
    await AsyncStorage.setItem(FAILED_PARSES_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Failed to save failed parse:', error);
  }
}

export async function getFailedParses(): Promise<FailedParse[]> {
  try {
    const data = await AsyncStorage.getItem(FAILED_PARSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get failed parses:', error);
    return [];
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([TRANSACTIONS_KEY, FAILED_PARSES_KEY]);
  } catch (error) {
    console.error('Failed to clear data:', error);
  }
}
