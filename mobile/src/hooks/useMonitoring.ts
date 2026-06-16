import { useEffect, useRef } from 'react';
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

export function useMonitoringLifecycle(
  isAuthenticated: boolean,
  profile?: { phone?: string; whatsapp_number?: string },
) {
  // Use stable primitive deps instead of the object reference to avoid
  // re-running the effect on every render when `profile` is a new object.
  const profilePhone = profile?.phone;
  const profileWhatsapp = profile?.whatsapp_number;

  // Keep a ref so the effect can always see the latest profile without
  // adding it to the dependency array (which would cause infinite loops).
  const profileRef = useRef(profile);
  profileRef.current = profile;

  useEffect(() => {
    if (!isAuthenticated) {
      smsForwarder.stop();
      return;
    }
    setupMonitoringAfterLogin(profileRef.current).catch(console.error);
    return () => smsForwarder.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, profilePhone, profileWhatsapp]);
}
