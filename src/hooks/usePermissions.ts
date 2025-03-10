export type PermissionName = 
  | 'geolocation'
  | 'notifications'
  | 'push'
  | 'midi'
  | 'camera'
  | 'microphone'
  | 'background-fetch'
  | 'persistent-storage'
  | 'ambient-light-sensor'
  | 'accelerometer'
  | 'gyroscope'
  | 'magnetometer';

export type PermissionState = 'granted' | 'denied' | 'prompt';

export interface PermissionsState {
  isSupported: boolean;
  permissions: Map<CustomPermissionName, PermissionState>;
  error: Error | null;
}

export type CustomPermissionName = 
  | PermissionName
  | 'background-sync'
  | 'background-fetch'
  | 'nfc';

export type CustomPermissionDescriptor = {
  name: CustomPermissionName;
};

export function usePermissions() {
  let state: PermissionsState = {
    isSupported: typeof navigator !== 'undefined' && 'permissions' in navigator,
    permissions: new Map(),
    error: null
  };

  const listeners = new Set<(state: PermissionsState) => void>();

  const updateState = (newState: Partial<PermissionsState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Permissions API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const query = async (name: CustomPermissionName): Promise<PermissionState> => {
    if (!state.isSupported) {
      throw new Error('Permissions API is not supported');
    }

    try {
      clearError();
      const status = await navigator.permissions.query({ name } as PermissionDescriptor);
      const permissions = new Map(state.permissions);
      permissions.set(name, status.state);
      updateState({ permissions });
      return status.state;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const queryMultiple = async (names: CustomPermissionName[]): Promise<PermissionState[]> => {
    return Promise.all(names.map(name => query(name)));
  };

  const watchPermission = (name: CustomPermissionName, onChange: (state: PermissionState) => void) => {
    if (!state.isSupported) {
      throw new Error('Permissions API is not supported');
    }

    try {
      navigator.permissions.query({ name } as PermissionDescriptor)
        .then(status => {
          const listener = () => {
            onChange(status.state);
          };
          
          status.addEventListener('change', listener);
          onChange(status.state);

          return () => status.removeEventListener('change', listener);
        })
        .catch(error => {
          throw new Error(`Failed to watch permission ${name}: ${error}`);
        });
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  return {
    query,
    queryMultiple,
    watch: watchPermission
  };
}