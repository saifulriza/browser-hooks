export interface DeviceMemoryState {
  isSupported: boolean;
  memoryGB: number | null;
}

export function useDeviceMemory() {
  let state: DeviceMemoryState = {
    isSupported: 'deviceMemory' in navigator,
    memoryGB: null
  };

  const listeners = new Set<(state: DeviceMemoryState) => void>();

  const updateState = (newState: Partial<DeviceMemoryState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const getMemory = (): number | null => {
    if (!state.isSupported) {
      return null;
    }

    try {
      const memory = (navigator as any).deviceMemory;
      updateState({ memoryGB: memory });
      return memory;
    } catch (error) {
      console.error('Failed to get device memory:', error);
      return null;
    }
  };

  // Initialize memory value
  if (state.isSupported) {
    getMemory();
  }

  return {
    get state() { return state; },
    getMemory,
    subscribe(callback: (state: DeviceMemoryState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}