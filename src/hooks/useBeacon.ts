export interface BeaconState {
  isSupported: boolean;
  pendingBeacons: number;
}

export interface BeaconOptions {
  type?: string;
}

export function useBeacon() {
  let state: BeaconState = {
    isSupported: 'sendBeacon' in navigator,
    pendingBeacons: 0
  };

  const listeners = new Set<(state: BeaconState) => void>();

  const updateState = (newState: Partial<BeaconState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const sendBeacon = (url: string, data?: string | Blob | FormData | URLSearchParams, options: BeaconOptions = {}) => {
    if (!state.isSupported) {
      throw new Error('Beacon API is not supported');
    }

    let blob: Blob | undefined;
    if (data) {
      if (data instanceof Blob) {
        blob = data;
      } else if (data instanceof FormData || data instanceof URLSearchParams) {
        blob = new Blob([data.toString()], { type: options.type || 'application/x-www-form-urlencoded' });
      } else {
        blob = new Blob([data], { type: options.type || 'text/plain' });
      }
    }

    updateState({ pendingBeacons: state.pendingBeacons + 1 });
    const success = navigator.sendBeacon(url, blob);
    updateState({ pendingBeacons: state.pendingBeacons - 1 });

    return success;
  };

  return {
    get state() { return state; },
    sendBeacon,
    subscribe(callback: (state: BeaconState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}