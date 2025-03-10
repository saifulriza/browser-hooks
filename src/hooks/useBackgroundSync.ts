export interface BackgroundSyncState {
  isSupported: boolean;
  registrations: string[];
}

export function useBackgroundSync() {
  let state: BackgroundSyncState = {
    isSupported: 'serviceWorker' in navigator && 'SyncManager' in window,
    registrations: []
  };

  const listeners = new Set<(state: BackgroundSyncState) => void>();

  const updateState = (newState: Partial<BackgroundSyncState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const register = async (tag: string) => {
    if (!state.isSupported) {
      throw new Error('Background Sync is not supported');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      
      const newRegistrations = [...state.registrations, tag];
      updateState({ registrations: newRegistrations });
      
      return true;
    } catch (error) {
      throw new Error(`Failed to register background sync: ${error}`);
    }
  };

  const getTags = async () => {
    if (!state.isSupported) {
      return [];
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const tags = await registration.sync.getTags();
      updateState({ registrations: tags });
      return tags;
    } catch (error) {
      console.error('Failed to get sync tags:', error);
      return [];
    }
  };

  // Initialize tags
  getTags().catch(console.error);

  return {
    get state() { return state; },
    register,
    getTags,
    subscribe(callback: (state: BackgroundSyncState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}