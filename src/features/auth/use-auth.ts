import { useEffect, useSyncExternalStore } from 'react';
import type { AuthController } from './auth-session';

export function useAuth(controller: AuthController) {
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  useEffect(() => {
    void controller.start();
  }, [controller]);
  return state;
}
