export interface FullscreenState {
  isSupported: boolean;
  isFullscreen: boolean;
  error: Error | null;
}

export function useFullscreen() {
  let state: FullscreenState = {
    isSupported: typeof document !== 'undefined' && 
                (document.documentElement.requestFullscreen !== undefined ||
                 document.documentElement.webkitRequestFullscreen !== undefined ||
                 document.documentElement.mozRequestFullScreen !== undefined ||
                 document.documentElement.msRequestFullscreen !== undefined),
    isFullscreen: false,
    error: null
  };

  const listeners = new Set<(state: FullscreenState) => void>();
  let debounceTimeout: number | null = null;

  const updateState = (newState: Partial<FullscreenState>) => {
    const oldState = { ...state };
    state = { ...state, ...newState };
    
    // Only notify listeners if state actually changed
    if (JSON.stringify(oldState) !== JSON.stringify(state)) {
      listeners.forEach(listener => listener(state));
    }
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Fullscreen API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const getCurrentFullscreenElement = () => 
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;

  const checkFullscreenState = () => {
    const isFullscreen = !!getCurrentFullscreenElement();
    updateState({ isFullscreen });
    return isFullscreen;
  };

  const debouncedCheckState = () => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = window.setTimeout(() => {
      checkFullscreenState();
      debounceTimeout = null;
    }, 50);
  };

  const handleFullscreenChange = () => {
    debouncedCheckState();
  };

  // Setup event listeners
  if (typeof document !== 'undefined') {
    document.addEventListener('fullscreenchange', handleFullscreenChange, true);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange, true);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange, true);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange, true);

    // Initialize state
    checkFullscreenState();
  }

  const request = async (element: Element = document.documentElement) => {
    if (!state.isSupported) {
      throw new Error('Fullscreen API is not supported in this browser');
    }

    const currentFullscreenElement = getCurrentFullscreenElement();
    if (currentFullscreenElement === element) {
      return true; // Already in fullscreen with the same element
    }

    try {
      clearError();
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
      
      // Wait for the state to be updated
      await new Promise(resolve => setTimeout(resolve, 100));
      return checkFullscreenState();
    } catch (error) {
      console.error('Error requesting fullscreen:', error);
      setError(error as Error);
      throw error;
    }
  };

  const exit = async () => {
    if (!state.isSupported) {
      throw new Error('Fullscreen API is not supported in this browser');
    }

    if (!getCurrentFullscreenElement()) {
      return true; // Already not in fullscreen
    }

    try {
      clearError();
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }

      // Wait for the state to be updated
      await new Promise(resolve => setTimeout(resolve, 100));
      return checkFullscreenState();
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
      setError(error as Error);
      throw error;
    }
  };

  const toggle = async (element: Element = document.documentElement) => {
    const currentFullscreenElement = getCurrentFullscreenElement();
    
    if (currentFullscreenElement) {
      return await exit();
    } else {
      return await request(element);
    }
  };

  const cleanup = () => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('fullscreenchange', handleFullscreenChange, true);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange, true);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange, true);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange, true);
    }
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
  };

  return {
    get state() { return state; },
    request,
    exit,
    toggle,
    cleanup,
    subscribe(callback: (state: FullscreenState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}