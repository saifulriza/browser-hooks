export interface LaunchHandlerState {
  isSupported: boolean;
  launchParams: LaunchParams | null;
  error: Error | null;
}

export interface LaunchParams {
  targetURL: string | null;
  files: FileSystemFileHandle[];
}

export function useLaunchHandler() {
  let state: LaunchHandlerState = {
    isSupported: typeof window !== 'undefined' && 'launchQueue' in window,
    launchParams: null,
    error: null
  };

  const listeners = new Set<(state: LaunchHandlerState) => void>();

  const updateState = (newState: Partial<LaunchHandlerState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Launch Handler API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  // Initialize launch queue handler
  if (state.isSupported && typeof window !== 'undefined') {
    try {
      clearError();
      // @ts-ignore - launchQueue might not be recognized by TypeScript
      window.launchQueue.setConsumer(async (launchParams: any) => {
        try {
          const files = await Promise.all(launchParams.files.map((handle: any) => handle.getFile()));
          updateState({
            launchParams: {
              targetURL: launchParams.targetURL,
              files
            }
          });
        } catch (error) {
          setError(error as Error);
        }
      });
    } catch (error) {
      setError(error as Error);
    }
  }

  return {
    get state() { return state; },
    subscribe(callback: (state: LaunchHandlerState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}