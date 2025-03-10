export interface DeviceOrientationState {
  isSupported: boolean;
  hasPermission: boolean;
  isListening: boolean;
  orientation: DeviceOrientationData | null;
}

export interface DeviceOrientationData {
  absolute: boolean;
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}

export interface DeviceOrientationOptions {
  onPermissionDenied?: () => void;
}

export function useDeviceOrientation(options: DeviceOrientationOptions = {}) {
  let state: DeviceOrientationState = {
    isSupported: 'DeviceOrientationEvent' in window,
    hasPermission: false,
    isListening: false,
    orientation: null
  };

  const listeners = new Set<(state: DeviceOrientationState) => void>();

  const updateState = (newState: Partial<DeviceOrientationState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const handleOrientation = (event: DeviceOrientationEvent) => {
    const orientationData: DeviceOrientationData = {
      absolute: event.absolute,
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma
    };

    updateState({ orientation: orientationData });
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!state.isSupported) {
      return false;
    }

    try {
      // Check if permission API is available for device orientation
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        const hasPermission = permission === 'granted';
        updateState({ hasPermission });
        
        if (!hasPermission && options.onPermissionDenied) {
          options.onPermissionDenied();
        }
        
        return hasPermission;
      }
      
      // If no permission API, assume it's allowed
      updateState({ hasPermission: true });
      return true;
    } catch (error) {
      console.error('Failed to request device orientation permission:', error);
      updateState({ hasPermission: false });
      if (options.onPermissionDenied) {
        options.onPermissionDenied();
      }
      return false;
    }
  };

  const startListening = async (): Promise<boolean> => {
    if (!state.isSupported) {
      return false;
    }

    if (!state.hasPermission) {
      const permissionGranted = await requestPermission();
      if (!permissionGranted) {
        return false;
      }
    }

    try {
      window.addEventListener('deviceorientation', handleOrientation);
      updateState({ isListening: true });
      return true;
    } catch (error) {
      console.error('Failed to start device orientation listening:', error);
      return false;
    }
  };

  const stopListening = (): void => {
    if (state.isListening) {
      window.removeEventListener('deviceorientation', handleOrientation);
      updateState({ isListening: false });
    }
  };

  // Check initial permission state
  if (state.isSupported) {
    requestPermission();
  }

  // Cleanup on unmount
  const cleanup = () => {
    stopListening();
  };

  return {
    get state() { return state; },
    requestPermission,
    startListening,
    stopListening,
    cleanup,
    subscribe(callback: (state: DeviceOrientationState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}