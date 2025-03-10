export interface PointerLockState {
  isSupported: boolean;
  isLocked: boolean;
  element: Element | null;
  movementX: number;
  movementY: number;
  error: Error | null;
}

export interface PointerLockOptions {
  unadjustedMovement?: boolean;
}

export function usePointerLock() {
  let state: PointerLockState = {
    isSupported: typeof document !== 'undefined' && 
                 'pointerLockElement' in document,
    isLocked: false,
    element: null,
    movementX: 0,
    movementY: 0,
    error: null
  };

  const listeners = new Set<(state: PointerLockState) => void>();

  const updateState = (newState: Partial<PointerLockState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Pointer Lock API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const requestLock = async (element: Element, options?: PointerLockOptions) => {
    if (!state.isSupported) {
      throw new Error('Pointer Lock API is not supported in this browser');
    }

    try {
      clearError();
      await element.requestPointerLock(options);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const exitLock = () => {
    if (!state.isSupported) {
      throw new Error('Pointer Lock API is not supported in this browser');
    }

    try {
      clearError();
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  // Initialize event listeners
  if (typeof document !== 'undefined') {
    document.addEventListener('pointerlockchange', () => {
      const lockedElement = document.pointerLockElement;
      updateState({
        isLocked: !!lockedElement,
        element: lockedElement
      });
    });

    document.addEventListener('pointerlockerror', () => {
      setError(new Error('Failed to acquire pointer lock'));
    });

    document.addEventListener('mousemove', (event: MouseEvent) => {
      if (state.isLocked) {
        updateState({
          movementX: event.movementX,
          movementY: event.movementY
        });
      }
    });
  }

  // Cleanup function
  const cleanup = () => {
    if (state.isLocked) {
      exitLock();
    }
  };

  return {
    get state() { return state; },
    requestLock,
    exitLock,
    cleanup,
    subscribe(callback: (state: PointerLockState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}