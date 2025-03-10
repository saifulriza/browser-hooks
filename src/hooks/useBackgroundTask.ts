export interface BackgroundTaskOptions {
  timeout?: number;
  signal?: AbortSignal;
}

export interface BackgroundTaskState {
  isSupported: boolean;
  pendingTasks: number;
}

export function useBackgroundTask() {
  let state: BackgroundTaskState = {
    isSupported: 'requestIdleCallback' in window,
    pendingTasks: 0
  };

  const listeners = new Set<(state: BackgroundTaskState) => void>();

  const updateState = (newState: Partial<BackgroundTaskState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const scheduleTask = (
    callback: (deadline: IdleDeadline) => void,
    options: BackgroundTaskOptions = {}
  ) => {
    if (!state.isSupported) {
      throw new Error('Background Tasks API is not supported');
    }

    updateState({ pendingTasks: state.pendingTasks + 1 });

    const { timeout, signal } = options;

    const wrappedCallback = (deadline: IdleDeadline) => {
      try {
        callback(deadline);
      } finally {
        updateState({ pendingTasks: state.pendingTasks - 1 });
      }
    };

    const handle = requestIdleCallback(wrappedCallback, { timeout });

    if (signal) {
      signal.addEventListener('abort', () => {
        cancelIdleCallback(handle);
        updateState({ pendingTasks: state.pendingTasks - 1 });
      }, { once: true });
    }

    return handle;
  };

  return {
    get state() { return state; },
    scheduleTask,
    subscribe(callback: (state: BackgroundTaskState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}