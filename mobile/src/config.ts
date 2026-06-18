import { Platform } from 'react-native';

const API_PORT = 8000;

// ============================================
// Mets ici l'IP du PC où tourne le backend Django
// Trouve-la avec: ipconfig (cherche IPv4)
// ============================================
const API_HOST = '10.130.154.79';

function getApiBaseUrl(): string {
  if (Platform.OS === 'web') {
    return `http://localhost:${API_PORT}/api`;
  }
  return `http://${API_HOST}:${API_PORT}/api`;
}

export const API_BASE_URL = getApiBaseUrl();
