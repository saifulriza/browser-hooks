export interface WebLocksState {
  isSupported: boolean;
  heldLocks: LockInfo[];
  error: Error | null;
}

export interface LockOptions {
  mode?: LockMode;
  signal?: AbortSignal;
  ifAvailable?: boolean;
  steal?: boolean;
}

export interface LockInfo {
  name: string;
  mode: LockMode;
  clientId?: string;
}

type LockMode = 'shared' | 'exclusive';

export function useWebLocks() {
  let state: WebLocksState = {
    isSupported: typeof navigator !== 'undefined' && 'locks' in navigator,
    heldLocks: [],
    error: null
  };

  const listeners = new Set<(state: WebLocksState) => void>();

  const updateState = (newState: Partial<WebLocksState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Web Locks API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  /**
   * Request a lock on a resource
   */
  const requestLock = async <T>(
    name: string,
    callback: (lock: Lock) => Promise<T>,
    options: LockOptions = {}
  ): Promise<T | undefined> => {
    if (!state.isSupported) {
      throw new Error('Web Locks API is not supported in this browser');
    }

    try {
      clearError();

      // Track lock acquisition
      const trackLock = (granted: Lock | null) => {
        if (granted) {
          const lockId = `${granted.name}-${Date.now()}`;
          state.heldLocks.push({ 
            name: granted.name,
            mode: granted.mode
          });
          updateState({ heldLocks: [...state.heldLocks] });

          // Clean up when lock is released
          setTimeout(() => {
            // Check if lock is still in our held locks
            const index = state.heldLocks.findIndex(lock => lock.name === granted.name);
            if (index !== -1) {
              state.heldLocks.splice(index, 1);
              updateState({ heldLocks: [...state.heldLocks] });
            }
          }, 0);
        }
        return granted;
      };

      // Request the lock
      const result = await navigator.locks.request(name, options, async (lock) => {
        trackLock(lock);
        if (lock) {
          return await callback(lock);
        }
        return undefined;
      });

      return result;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  /**
   * Query the state of locks
   */
  const query = async (): Promise<LockManagerSnapshot> => {
    if (!state.isSupported) {
      throw new Error('Web Locks API is not supported in this browser');
    }

    try {
      clearError();
      return await navigator.locks.query();
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  /**
   * Get all currently held locks
   */
  const getHeldLocks = async (): Promise<LockInfo[]> => {
    if (!state.isSupported) {
      throw new Error('Web Locks API is not supported in this browser');
    }

    try {
      const snapshot = await query();
      const heldLocks = snapshot.held?.filter(lock => lock.name !== undefined)
        .map(lock => ({
          name: lock.name!,
          mode: lock.mode || 'exclusive',
          clientId: lock.clientId
        })) || [];
      return heldLocks;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  /**
   * Check if a lock is currently held
   */
  const isLockHeld = async (name: string): Promise<boolean> => {
    if (!state.isSupported) {
      throw new Error('Web Locks API is not supported in this browser');
    }

    try {
      const snapshot = await query();
      return snapshot.held?.some(lock => lock.name === name) || false;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  /**
   * Request a shared lock on a resource
   */
  const requestSharedLock = async <T>(
    name: string,
    callback: (lock: Lock) => Promise<T>,
    options: Omit<LockOptions, 'mode'> = {}
  ): Promise<T | undefined> => {
    return requestLock(name, callback, { ...options, mode: 'shared' });
  };

  /**
   * Request an exclusive lock on a resource
   */
  const requestExclusiveLock = async <T>(
    name: string,
    callback: (lock: Lock) => Promise<T>,
    options: Omit<LockOptions, 'mode'> = {}
  ): Promise<T | undefined> => {
    return requestLock(name, callback, { ...options, mode: 'exclusive' });
  };

  /**
   * Try to acquire a lock, but don't wait if it's not available
   */
  const tryLock = async <T>(
    name: string,
    callback: (lock: Lock | null) => Promise<T>,
    options: Omit<LockOptions, 'ifAvailable'> = {}
  ): Promise<T> => {
    if (!state.isSupported) {
      throw new Error('Web Locks API is not supported in this browser');
    }

    try {
      clearError();
      const result = await navigator.locks.request(
        name, 
        { ...options, ifAvailable: true }, 
        callback
      );
      return result as T;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  /**
   * Create an AbortController to timeout a lock request
   */
  const createLockTimeoutSignal = (timeoutMs: number): AbortController => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
    
    // Clean up the timeout if the lock is acquired or the request ends
    const originalAbort = controller.abort;
    controller.abort = () => {
      clearTimeout(timeoutId);
      originalAbort.call(controller);
    };
    
    return controller;
  };

  const getLocks = async (): Promise<LockInfo[]> => {
    if (!state.isSupported) {
      throw new Error('Web Locks API is not supported');
    }

    try {
      clearError();
      const snapshot = await navigator.locks.query();
      const heldLocks = snapshot.held?.map(lock => ({
        name: lock.name || '',
        mode: lock.mode || 'exclusive'
      })) as LockInfo[];
      updateState({ heldLocks: heldLocks || [] });
      return heldLocks || [];
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  return {
    get state() { return state; },
    requestLock,
    requestSharedLock,
    requestExclusiveLock,
    tryLock,
    query,
    getHeldLocks,
    isLockHeld,
    createLockTimeoutSignal,
    getLocks,
    subscribe(callback: (state: WebLocksState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}