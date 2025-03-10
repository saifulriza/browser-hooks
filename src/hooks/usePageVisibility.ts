export interface PageVisibilityState {
  hidden: boolean;
  visibilityState: DocumentVisibilityState;
}

export function usePageVisibility() {
  let state: PageVisibilityState = {
    hidden: document.hidden,
    visibilityState: document.visibilityState
  };
  
  const listeners = new Set<(state: PageVisibilityState) => void>();

  const updateState = () => {
    state = {
      hidden: document.hidden,
      visibilityState: document.visibilityState
    };
    listeners.forEach(listener => listener(state));
  };

  document.addEventListener("visibilitychange", updateState);

  return {
    get state() { return state; },
    subscribe(callback: (state: PageVisibilityState) => void) {
      listeners.add(callback);
      callback(state);
      return () => {
        listeners.delete(callback);
        document.removeEventListener("visibilitychange", updateState);
      };
    }
  };
}