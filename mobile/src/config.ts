import { Platform } from 'react-native';

const API_PORT = 8000;

function getApiBaseUrl(): string {
  if (Platform.OS === 'web') {
    return `http://localhost:${API_PORT}/api`;
  }

  // IP actuelle détectée via ipconfig (change si le réseau change)
  return `http://10.130.154.79:${API_PORT}/api`;
}

export const API_BASE_URL = getApiBaseUrl();
