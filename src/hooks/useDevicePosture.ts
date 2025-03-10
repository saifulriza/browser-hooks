export interface DevicePostureState {
  isSupported: boolean;
  isListening: boolean;
  posture: DevicePostureInfo | null;
}

export interface DevicePostureInfo {
  type: 'continuous' | 'folded' | 'flat';
  angle?: number;
}

export function useDevicePosture() {
  let state: DevicePostureState = {
    isSupported: !!(navigator as DevicePostureNavigator).devicePosture,
    isListening: false,
    posture: null
  };

  const listeners = new Set<(state: DevicePostureState) => void>();

  const updateState = (newState: Partial<DevicePostureState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const handlePostureChange = (event: any) => {
    // Handle both standard and Edge-specific event formats
    const postureInfo: DevicePostureInfo = {
      type: event.postureType || event.type,
      angle: event.angle || event.posture?.angle
    };

    updateState({ posture: postureInfo });
  };

  const startListening = (): boolean => {
    if (!state.isSupported) {
      return false;
    }

    try {
      const devicePosture = (navigator as DevicePostureNavigator).devicePosture;
      if (devicePosture) {
        // Edge implementation
        devicePosture.addEventListener('change', handlePostureChange);
      } else {
        // Standard implementation
        window.addEventListener('deviceposture', handlePostureChange);
      }
      updateState({ isListening: true });
      return true;
    } catch (error) {
      console.error('Failed to start device posture listening:', error);
      return false;
    }
  };

  const stopListening = (): void => {
    if (state.isListening) {
      const devicePosture = (navigator as DevicePostureNavigator).devicePosture;
      if (devicePosture) {
        // Edge implementation
        devicePosture.removeEventListener('change', handlePostureChange);
      } else {
        // Standard implementation
        window.removeEventListener('deviceposture', handlePostureChange);
      }
      updateState({ isListening: false });
    }
  };

  // Cleanup on unmount
  const cleanup = () => {
    stopListening();
  };

  return {
    get state() { return state; },
    startListening,
    stopListening,
    cleanup,
    subscribe(callback: (state: DevicePostureState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}