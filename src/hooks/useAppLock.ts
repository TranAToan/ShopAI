import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuthStore } from '@store/useAuthStore';

export const APP_LOCK_TIMEOUT_MS = 2 * 60 * 1000;

export function useAppLock(): void {
  const sessionId = useAuthStore(state => state.sessionId);
  const token = useAuthStore(state => state.token);
  const backgroundedAt = useRef<number | null>(null);
  useEffect(() => {
    backgroundedAt.current = null;
    if (!token) {
      return;
    }
    let previous: AppStateStatus = (AppState.currentState ??
      'active') as AppStateStatus;
    if (previous !== 'active') {
      backgroundedAt.current = Date.now();
    }
    const subscription = AppState.addEventListener('change', next => {
      if (
        next !== 'active' &&
        previous === 'active' &&
        backgroundedAt.current === null
      ) {
        backgroundedAt.current = Date.now();
      }
      if (next === 'active' && backgroundedAt.current !== null) {
        if (Date.now() - backgroundedAt.current > APP_LOCK_TIMEOUT_MS) {
          useAuthStore.getState().setIsUnlocked(false, sessionId);
        }
        backgroundedAt.current = null;
      }
      previous = next;
    });
    return () => {
      subscription.remove();
      backgroundedAt.current = null;
    };
  }, [token, sessionId]);
}
