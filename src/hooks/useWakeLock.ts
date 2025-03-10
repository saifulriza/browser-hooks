export interface WakeLockState {
  isSupported: boolean;
  isActive: boolean;
  type: 'screen' | null;
  sentinel: WakeLockSentinel | null;
}

export interface WakeLockOptions {
  onError?: (error: Error) => void;
  onRelease?: () => void;
}

export function useWakeLock() {
  let state: WakeLockState = {
    isSupported: typeof navigator !== 'undefined' && 'wakeLock' in navigator,
    isActive: false,
    type: null,
    sentinel: null
  };

  const listeners = new Set<(state: WakeLockState) => void>();

  const updateState = (newState: Partial<WakeLockState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const requestLock = async (options: WakeLockOptions = {}) => {
    if (!state.isSupported) {
      throw new Error('Screen Wake Lock API is not supported');
    }

    try {
      const sentinel = await navigator.wakeLock.request('screen');
      
      sentinel.addEventListener('release', () => {
        updateState({
          isActive: false,
          type: null,
          sentinel: null
        });
        options.onRelease?.();
      });

      updateState({
        isActive: true,
        type: 'screen',
        sentinel
      });

      return sentinel;
    } catch (error) {
      options.onError?.(error as Error);
      throw new Error(`Failed to request wake lock: ${error}`);
    }
  };

  const releaseLock = async () => {
    if (state.sentinel) {
      await state.sentinel.release();
      // State update will be handled by release event listener
    }
  };

  // Handle page visibility changes
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', async () => {
      if (state.isActive && document.visibilityState === 'visible') {
        // Re-request the lock when page becomes visible
        try {
          await requestLock();
        } catch (error) {
          console.error('Failed to re-acquire wake lock:', error);
        }
      }
    });
  }

  return {
    get state() { return state; },
    requestLock,
    releaseLock,
    subscribe(callback: (state: WakeLockState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}