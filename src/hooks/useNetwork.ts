export interface NetworkState {
  isSupported: boolean;
  isOnline: boolean;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | null;
  type: ConnectionType;
  downlink: number | null;
  downlinkMax: number | null;
  rtt: number | null;
  saveData: boolean;
  error: Error | null;
}

type ConnectionType = 
  | 'bluetooth'
  | 'cellular'
  | 'ethernet'
  | 'none'
  | 'wifi'
  | 'wimax'
  | 'other'
  | 'unknown';

export function useNetwork() {
  let state: NetworkState = {
    isSupported: typeof navigator !== 'undefined' && 'connection' in navigator,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: null,
    type: 'unknown',
    downlink: null,
    downlinkMax: null,
    rtt: null,
    saveData: false,
    error: null
  };

  const listeners = new Set<(state: NetworkState) => void>();

  const updateState = (newState: Partial<NetworkState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Network Information API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const updateNetworkInformation = () => {
    if (!state.isSupported) return;

    try {
      clearError();
      // @ts-ignore - connection might not be recognized by TypeScript
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

      updateState({
        effectiveType: connection.effectiveType || null,
        type: connection.type || 'unknown',
        downlink: typeof connection.downlink === 'number' ? connection.downlink : null,
        downlinkMax: typeof connection.downlinkMax === 'number' ? connection.downlinkMax : null,
        rtt: typeof connection.rtt === 'number' ? connection.rtt : null,
        saveData: !!connection.saveData
      });
    } catch (error) {
      setError(error as Error);
    }
  };

  // Initialize event listeners
  if (typeof window !== 'undefined') {
    // Online/offline events
    window.addEventListener('online', () => {
      updateState({ isOnline: true });
    });

    window.addEventListener('offline', () => {
      updateState({ isOnline: false });
    });

    // Network information events
    if (state.isSupported) {
      try {
        // @ts-ignore - connection might not be recognized by TypeScript
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        connection.addEventListener('change', updateNetworkInformation);
        
        // Initial update
        updateNetworkInformation();
      } catch (error) {
        setError(error as Error);
      }
    }
  }

  // Cleanup function
  const cleanup = () => {
    if (state.isSupported && typeof window !== 'undefined') {
      try {
        // @ts-ignore - connection might not be recognized by TypeScript
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        connection.removeEventListener('change', updateNetworkInformation);
      } catch (error) {
        console.error('Error cleaning up network listeners:', error);
      }
    }
  };

  return {
    get state() { return state; },
    cleanup,
    subscribe(callback: (state: NetworkState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}
