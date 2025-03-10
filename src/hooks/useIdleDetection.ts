export interface IdleState {
  isSupported: boolean;
  isIdle: boolean;
  isScreenLocked: boolean;
  error: Error | null;
}

export interface IdleOptions {
  threshold: number;
  signal?: AbortSignal;
  onStateChange?: (state: { user: string; screen: string }) => void;
}

export function useIdleDetection() {
  let state: IdleState = {
    isSupported: typeof window !== 'undefined' && 'IdleDetector' in window,
    isIdle: false,
    isScreenLocked: false,
    error: null
  };

  const listeners = new Set<(state: IdleState) => void>();
  let detector: any | null = null; // IdleDetector type
  let visibilityChangeHandler: ((e: Event) => void) | null = null;

  const updateState = (newState: Partial<IdleState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Idle Detection API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const cleanupListeners = () => {
    if (visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', visibilityChangeHandler);
      visibilityChangeHandler = null;
    }
  };

  const requestPermission = async (): Promise<PermissionState> => {
    if (!state.isSupported) {
      throw new Error('Idle Detection API is not supported in this browser');
    }

    try {
      clearError();
      // First check current permission state
      const permission = await navigator.permissions.query({ name: 'idle-detection' as PermissionName });
      
      // If permission is already granted or denied, return the state
      if (permission.state !== 'prompt') {
        return permission.state;
      }

      // If we need to request permission, use the IdleDetector.requestPermission() method
      // @ts-ignore - IdleDetector might not be recognized by TypeScript
      const result = await IdleDetector.requestPermission();
      return result as PermissionState;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const start = async (options: IdleOptions) => {
    if (!state.isSupported) {
      throw new Error('Idle Detection API is not supported in this browser');
    }

    try {
      clearError();
      
      const permissionState = await requestPermission();
      if (permissionState !== 'granted') {
        throw new Error('Idle Detection permission not granted');
      }

      // Stop any existing detector
      if (detector) {
        await stop();
      }

      // Clean up any existing listeners
      cleanupListeners();

      try {
        // @ts-ignore - IdleDetector might not be recognized by TypeScript
        detector = new IdleDetector();

        // Set up the change event handler before starting
        detector.addEventListener('change', () => {
          if (!detector) return;
          
          const userState = detector.userState;
          const screenState = detector.screenState;
          
          console.log(`Idle state change detected - User: ${userState}, Screen: ${screenState}`);
          
          updateState({
            isIdle: userState === 'idle',
            isScreenLocked: screenState === 'locked'
          });
          
          if (options.onStateChange) {
            options.onStateChange({
              user: userState,
              screen: screenState
            });
          }
        });

        // Start the detector with the specified threshold
        await detector.start({
          threshold: options.threshold,
          signal: options.signal
        });

        console.log('IdleDetector started with threshold:', options.threshold);

        // Get and report initial state
        const initialUserState = detector.userState;
        const initialScreenState = detector.screenState;
        
        console.log(`Initial idle state - User: ${initialUserState}, Screen: ${initialScreenState}`);
        
        if (options.onStateChange) {
          options.onStateChange({
            user: initialUserState,
            screen: initialScreenState
          });
        }

      } catch (error) {
        console.error('Failed to start IdleDetector:', error);
        detector = null;
        cleanupListeners();
        throw error;
      }

    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const stop = async () => {
    if (detector) {
      try {
        detector.stop();
        cleanupListeners();
        detector = null;
        updateState({
          isIdle: false,
          isScreenLocked: false
        });
      } catch (error) {
        setError(error as Error);
        throw error;
      }
    }
  };

  // Cleanup function
  const cleanup = () => {
    stop().catch(console.error);
  };

  return {
    get state() { return state; },
    requestPermission,
    start,
    stop,
    cleanup,
    subscribe(callback: (state: IdleState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}