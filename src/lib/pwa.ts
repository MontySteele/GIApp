import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
export const CACHE_PREFIX = `giapp-v${APP_VERSION}`;

type SWRegistrationState = {
  offlineReady: boolean;
  needRefresh: boolean;
  updateServiceWorker: (reloadPage?: boolean) => Promise<ServiceWorkerRegistration | undefined>;
};

export function useServiceWorkerRegistration(): SWRegistrationState {
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW, setUpdateSW] = useState<SWRegistrationState['updateServiceWorker']>(() => async () => undefined);

  useEffect(() => {
    const updateServiceWorker = registerSW({
      immediate: true,
      onOfflineReady() {
        setOfflineReady(true);
      },
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onRegisterError(error) {
        console.error('Service worker registration failed', error);
      },
    });

    setUpdateSW(() => updateServiceWorker);

    return () => {
      setOfflineReady(false);
      setNeedRefresh(false);
    };
  }, []);

  return {
    offlineReady,
    needRefresh,
    updateServiceWorker: updateSW,
  };
}
