export interface ResizeObserverState {
  isSupported: boolean;
  observedElements: Map<Element, ResizeObserverEntry>;
}

export interface ResizeObserverOptions {
  box?: ResizeObserverBoxOptions;
  onResize?: (entries: ResizeObserverEntry[]) => void;
  onError?: (error: Error) => void;
}

export function useResizeObserver() {
  const state: ResizeObserverState = {
    isSupported: typeof window !== 'undefined' && 'ResizeObserver' in window,
    observedElements: new Map()
  };

  let observer: ResizeObserver | null = null;
  const listeners = new Set<(state: ResizeObserverState) => void>();

  const updateState = (newState: Partial<ResizeObserverState>) => {
    Object.assign(state, newState);
    listeners.forEach(listener => listener(state));
  };

  const createObserver = (options: ResizeObserverOptions = {}) => {
    if (!state.isSupported) {
      throw new Error('ResizeObserver is not supported');
    }

    try {
      observer = new ResizeObserver((entries) => {
        entries.forEach(entry => {
          state.observedElements.set(entry.target, entry);
        });
        updateState({ observedElements: new Map(state.observedElements) });
        options.onResize?.(entries);
      });
    } catch (error) {
      options.onError?.(error as Error);
      throw new Error(`Failed to create ResizeObserver: ${error}`);
    }
  };

  const observe = (
    element: Element,
    options: ResizeObserverOptions = {}
  ) => {
    if (!observer) {
      createObserver(options);
    }

    try {
      observer?.observe(element, { box: options.box });
    } catch (error) {
      options.onError?.(error as Error);
      throw new Error(`Failed to observe element: ${error}`);
    }
  };

  const unobserve = (element: Element) => {
    observer?.unobserve(element);
    state.observedElements.delete(element);
    updateState({ observedElements: new Map(state.observedElements) });
  };

  const disconnect = () => {
    observer?.disconnect();
    state.observedElements.clear();
    updateState({ observedElements: new Map() });
  };

  const getObservedSize = (element: Element) => {
    return state.observedElements.get(element);
  };

  return {
    get state() { return state; },
    observe,
    unobserve,
    disconnect,
    getObservedSize,
    subscribe(callback: (state: ResizeObserverState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}