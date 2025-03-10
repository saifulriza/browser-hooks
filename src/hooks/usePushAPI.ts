export interface PushSubscriptionOptions {
  userVisibleOnly?: boolean;
  applicationServerKey?: string | Uint8Array;
}

export interface PushState {
  isSupported: boolean;
  permission: NotificationPermission;
  subscription: PushSubscription | null;
}

export interface PushAPIOptions {
  onSubscriptionChange?: (subscription: PushSubscription | null) => void;
  onMessage?: (event: PushMessageData) => void;
  onError?: (error: Error) => void;
}

export interface PushAPIState {
  isSupported: boolean;
  subscription: PushSubscription | null;
  permissionState: NotificationPermission;
  error: Error | null;
}

export interface PushSubscribeOptions {
  applicationServerKey?: string | ArrayBuffer;
  userVisibleOnly?: boolean;
}

export const createPushAPI = async () => {
  let state: PushAPIState = {
    isSupported: typeof navigator !== 'undefined' && 
                 'serviceWorker' in navigator &&
                 'PushManager' in window,
    subscription: null,
    permissionState: 'denied',
    error: null
  };

  const listeners = new Set<(state: PushAPIState) => void>();

  const updateState = (newState: Partial<PushAPIState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Push API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const checkPermission = async (): Promise<NotificationPermission> => {
    if (!state.isSupported) {
      throw new Error('Push API is not supported in this browser');
    }

    try {
      clearError();
      const permission = await navigator.permissions.query({ name: 'notifications' });
      updateState({ permissionState: permission.state as NotificationPermission });
      return permission.state as NotificationPermission;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!state.isSupported) {
      throw new Error('Push API is not supported in this browser');
    }

    try {
      clearError();
      const result = await Notification.requestPermission();
      updateState({ permissionState: result });
      return result;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const getSubscription = async (): Promise<PushSubscription | null> => {
    if (!state.isSupported) {
      throw new Error('Push API is not supported in this browser');
    }

    try {
      clearError();
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      updateState({ subscription });
      return subscription;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const subscribe = async (options: PushSubscribeOptions = {}): Promise<PushSubscription> => {
    if (!state.isSupported) {
      throw new Error('Push API is not supported in this browser');
    }

    try {
      clearError();
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: options.userVisibleOnly ?? true,
        applicationServerKey: options.applicationServerKey
      });
      
      updateState({ subscription });
      return subscription;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!state.isSupported) {
      throw new Error('Push API is not supported in this browser');
    }

    try {
      clearError();
      const subscription = await getSubscription();
      if (subscription) {
        const result = await subscription.unsubscribe();
        if (result) {
          updateState({ subscription: null });
        }
        return result;
      }
      return false;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  // Initialize only if supported
  if (state.isSupported) {
    await Promise.all([
      checkPermission().catch(console.error),
      getSubscription().catch(console.error)
    ]);
  }

  // Cleanup function
  const cleanup = () => {
    // No cleanup needed as subscriptions persist
  };

  return {
    get state() { return state; },
    checkPermission,
    requestPermission,
    getSubscription,
    subscribe,
    unsubscribe,
    cleanup,
    onStateChange(callback: (state: PushAPIState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
};

export const usePushAPI = (() => {
  let instance: ReturnType<typeof createPushAPI> | null = null;

  return async () => {
    if (!instance) {
      instance = createPushAPI();
    }
    return instance;
  };
})();