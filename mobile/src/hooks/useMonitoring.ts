import { useEffect } from 'react';
import { api } from '../services/api';
import { deviceStore } from '../services/deviceStore';
import { smsForwarder } from '../services/smsForwarder';

/**
 * Enregistre l'appareil et démarre l'écoute SMS après connexion.
 * Utilise le numéro du profil utilisateur si disponible.
 */
export async function setupMonitoringAfterLogin(profile?: {
  phone?: string;
  whatsapp_number?: string;
}): Promise<void> {
  const existingPhone = await deviceStore.getDevicePhone();
  const existingSecret = await deviceStore.getDeviceSecret();

  if (existingPhone && existingSecret) {
    await smsForwarder.start();
    return;
  }

  const phone = profile?.phone || profile?.whatsapp_number;
  if (!phone) {
    return;
  }

  try {
    await api.registerDevice(phone);
    await smsForwarder.start();
  } catch (err) {
    console.warn('Monitoring setup skipped:', err);
  }
}

export function useMonitoringLifecycle(isAuthenticated: boolean, profile?: { phone?: string; whatsapp_number?: string }) {
  useEffect(() => {
    if (!isAuthenticated) {
      smsForwarder.stop();
      return;
    }
    setupMonitoringAfterLogin(profile).catch(console.error);
    return () => smsForwarder.stop();
  }, [isAuthenticated, profile?.phone, profile?.whatsapp_number]);
}
