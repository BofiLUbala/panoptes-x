import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = parseInt(process.env.EXPO_PUBLIC_API_PORT || '8000', 10);

function getApiBaseUrl(): string {
  if (Platform.OS === 'web') {
    const host = process.env.EXPO_PUBLIC_API_HOST || 'localhost';
    return `http://${host}:${API_PORT}/api`;
  }
  const extra = Constants.expoConfig?.extra as Record<string, any> | undefined;
  const apiHost = extra?.apiHost as string | undefined;
  if (apiHost) {
    return `http://${apiHost}:${API_PORT}/api`;
  }
  const envHost = process.env.EXPO_PUBLIC_API_HOST;
  if (envHost) {
    return `http://${envHost}:${API_PORT}/api`;
  }
  return `http://localhost:${API_PORT}/api`;
}

function getWsBaseUrl(): string {
  const httpUrl = getApiBaseUrl();
  return httpUrl.replace(/^http/, 'ws').replace(/\/api$/, '');
}

export const API_BASE_URL = getApiBaseUrl();
export const WS_BASE_URL = getWsBaseUrl();
