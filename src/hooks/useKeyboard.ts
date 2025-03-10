export interface KeyboardState {
  isSupported: boolean;
  layout: KeyboardLayoutMap | null;
  activeKeys: Set<string>;
  lastKey: string | null;
  error: Error | null;
}

export interface KeyboardOptions {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  target?: EventTarget;
}

export function useKeyboard(options: KeyboardOptions = {}) {
  let state: KeyboardState = {
    isSupported: typeof window !== 'undefined' && 'Keyboard' in navigator,
    layout: null,
    activeKeys: new Set(),
    lastKey: null,
    error: null
  };

  const listeners = new Set<(state: KeyboardState) => void>();
  const target = options.target || (typeof window !== 'undefined' ? window : null);

  const updateState = (newState: Partial<KeyboardState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Keyboard API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (options.preventDefault) {
      event.preventDefault();
    }
    if (options.stopPropagation) {
      event.stopPropagation();
    }

    state.activeKeys.add(event.code);
    updateState({ 
      activeKeys: new Set(state.activeKeys),
      lastKey: event.code
    });
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (options.preventDefault) {
      event.preventDefault();
    }
    if (options.stopPropagation) {
      event.stopPropagation();
    }

    state.activeKeys.delete(event.code);
    updateState({ 
      activeKeys: new Set(state.activeKeys),
      lastKey: null
    });
  };

  const getLayout = async () => {
    if (!state.isSupported) {
      throw new Error('Keyboard API is not supported in this browser');
    }

    try {
      clearError();
      // @ts-ignore - navigator.keyboard might not be recognized by TypeScript
      const layout = await navigator.keyboard.getLayoutMap();
      updateState({ layout });
      return layout;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const lock = async (keyCodes?: string[]) => {
    if (!state.isSupported) {
      throw new Error('Keyboard API is not supported in this browser');
    }

    try {
      clearError();
      // @ts-ignore - navigator.keyboard might not be recognized by TypeScript
      await navigator.keyboard.lock(keyCodes);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const unlock = () => {
    if (!state.isSupported) {
      throw new Error('Keyboard API is not supported in this browser');
    }

    try {
      clearError();
      // @ts-ignore - navigator.keyboard might not be recognized by TypeScript
      navigator.keyboard.unlock();
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  // Initialize keyboard layout
  if (state.isSupported) {
    getLayout().catch(console.error);
  }

  // Setup event listeners
  if (target) {
    target.addEventListener('keydown', handleKeyDown);
    target.addEventListener('keyup', handleKeyUp);
  }

  // Cleanup function
  const cleanup = () => {
    if (target) {
      target.removeEventListener('keydown', handleKeyDown);
      target.removeEventListener('keyup', handleKeyUp);
    }
    unlock();
  };

  return {
    get state() { return state; },
    getLayout,
    lock,
    unlock,
    cleanup,
    isKeyActive: (code: string) => state.activeKeys.has(code),
    subscribe(callback: (state: KeyboardState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}