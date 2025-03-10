export interface BadgeState {
  isSupported: boolean;
  count: number | null;
}

export function useBadge() {
  let state: BadgeState = {
    isSupported: 'setAppBadge' in navigator,
    count: null
  };

  const listeners = new Set<(state: BadgeState) => void>();

  const updateState = (newState: Partial<BadgeState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setBadge = async (count?: number) => {
    if (!state.isSupported) {
      throw new Error('Badge API is not supported');
    }

    try {
      if (typeof count === 'number') {
        await navigator.setAppBadge(count);
        updateState({ count });
      } else {
        await navigator.setAppBadge();
        updateState({ count: 1 });
      }
    } catch (error) {
      throw new Error(`Failed to set badge: ${error}`);
    }
  };

  const clearBadge = async () => {
    if (!state.isSupported) {
      throw new Error('Badge API is not supported');
    }

    try {
      await navigator.clearAppBadge();
      updateState({ count: null });
    } catch (error) {
      throw new Error(`Failed to clear badge: ${error}`);
    }
  };

  return {
    get state() { return state; },
    setBadge,
    clearBadge,
    subscribe(callback: (state: BadgeState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}