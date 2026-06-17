import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { smsForwarder } from '../services/smsForwarder';

export function useMonitoringLifecycle(isMain: boolean, profile: any) {
  const prevState = useRef<boolean>(false);

  useEffect(() => {
    if (!isMain) {
      if (prevState.current) {
        smsForwarder.stop();
        prevState.current = false;
      }
      return;
    }

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        smsForwarder.start();
      } else {
        smsForwarder.stop();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);

    smsForwarder.start();
    prevState.current = true;

    return () => {
      subscription.remove();
      smsForwarder.stop();
      prevState.current = false;
    };
  }, [isMain, profile]);
}
