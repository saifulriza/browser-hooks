export interface NavigationState {
  isSupported: boolean;
  currentEntry: NavigationHistoryEntry | null;
  canGoBack: boolean;
  canGoForward: boolean;
  transition: NavigationTransition | null;
  error: Error | null;
}

export interface NavigationOptions {
  info?: any;
  state?: any;
  history?: 'auto' | 'push' | 'replace';
}

export function useNavigation() {
  let state: NavigationState = {
    isSupported: typeof window !== 'undefined' && 'navigation' in window,
    currentEntry: null,
    canGoBack: false,
    canGoForward: false,
    transition: null,
    error: null
  };

  const listeners = new Set<(state: NavigationState) => void>();

  const updateState = (newState: Partial<NavigationState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Navigation API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  // Initialize navigation state
  if (state.isSupported && typeof window !== 'undefined') {
    try {
      // @ts-ignore - Navigation API might not be recognized by TypeScript
      const navigation = window.navigation;
      
      updateState({
        currentEntry: navigation.currentEntry,
        canGoBack: navigation.canGoBack,
        canGoForward: navigation.canGoForward,
        transition: navigation.transition
      });

      navigation.addEventListener('navigate', (event: NavigateEvent) => {
        updateState({
          currentEntry: navigation.currentEntry,
          canGoBack: navigation.canGoBack,
          canGoForward: navigation.canGoForward,
          transition: navigation.transition
        });
      });

      navigation.addEventListener('currententrychange', (event: NavigationCurrentEntryChangeEvent) => {
        updateState({
          currentEntry: navigation.currentEntry,
          canGoBack: navigation.canGoBack,
          canGoForward: navigation.canGoForward
        });
      });

      navigation.addEventListener('navigatesuccess', () => {
        clearError();
      });

      navigation.addEventListener('navigateerror', (event: NavigateEvent) => {
        const error = new Error(`Navigation failed: ${event.destination}`);
        setError(error);
      });
    } catch (error) {
      setError(error as Error);
    }
  }

  const navigate = async (url: string | URL, options?: NavigationOptions) => {
    if (!state.isSupported) {
      throw new Error('Navigation API is not supported in this browser');
    }

    try {
      clearError();
      // @ts-ignore - Navigation API might not be recognized by TypeScript
      await window.navigation.navigate(url, options);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const reload = async (options?: NavigationOptions) => {
    if (!state.isSupported) {
      throw new Error('Navigation API is not supported in this browser');
    }

    try {
      clearError();
      // @ts-ignore - Navigation API might not be recognized by TypeScript
      await window.navigation.reload(options);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const goBack = async () => {
    if (!state.isSupported) {
      throw new Error('Navigation API is not supported in this browser');
    }

    try {
      clearError();
      if (!state.canGoBack) {
        throw new Error('Cannot go back');
      }
      // @ts-ignore - Navigation API might not be recognized by TypeScript
      await window.navigation.back();
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const goForward = async () => {
    if (!state.isSupported) {
      throw new Error('Navigation API is not supported in this browser');
    }

    try {
      clearError();
      if (!state.canGoForward) {
        throw new Error('Cannot go forward');
      }
      // @ts-ignore - Navigation API might not be recognized by TypeScript
      await window.navigation.forward();
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const traverseTo = async (key: string, options?: NavigationOptions) => {
    if (!state.isSupported) {
      throw new Error('Navigation API is not supported in this browser');
    }

    try {
      clearError();
      // @ts-ignore - Navigation API might not be recognized by TypeScript
      await window.navigation.traverseTo(key, options);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  return {
    get state() { return state; },
    navigate,
    reload,
    goBack,
    goForward,
    traverseTo,
    subscribe(callback: (state: NavigationState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}