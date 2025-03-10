export interface LocalFontAccessState {
  isSupported: boolean;
  permissionState: PermissionState | null;
  fonts: FontData[];
  error: Error | null;
}

export interface FontData {
  family: string;
  fullName: string;
  postscriptName: string;
  style: string;
}

export function useLocalFontAccess() {
  let state: LocalFontAccessState = {
    isSupported: typeof window !== 'undefined' && 'queryLocalFonts' in window,
    permissionState: null,
    fonts: [],
    error: null
  };

  const listeners = new Set<(state: LocalFontAccessState) => void>();

  const updateState = (newState: Partial<LocalFontAccessState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Local Font Access API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const checkPermission = async (): Promise<PermissionState> => {
    if (!state.isSupported) {
      throw new Error('Local Font Access API is not supported in this browser');
    }

    try {
      clearError();
      // @ts-ignore - Permissions API might not recognize 'local-fonts'
      const permission = await navigator.permissions.query({ name: 'local-fonts' });
      updateState({ permissionState: permission.state });
      return permission.state;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const requestPermission = async (): Promise<PermissionState> => {
    if (!state.isSupported) {
      throw new Error('Local Font Access API is not supported in this browser');
    }

    try {
      clearError();
      
      // First check current permission state
      const currentState = await checkPermission();
      if (currentState === 'granted') {
        return currentState;
      }

      // If not granted, try to request access
      try {
        // @ts-ignore - queryLocalFonts might not be recognized by TypeScript
        await window.queryLocalFonts();
        // If we get here, permission was granted
        updateState({ permissionState: 'granted' });
        return 'granted';
      } catch (error: unknown) {
        if (error instanceof Error) {
          if (error.name === 'SecurityError' || error.message.includes('permission')) {
            updateState({ permissionState: 'denied' });
            return 'denied';
          }
        }
        throw error;
      }
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const queryFonts = async () => {
    if (!state.isSupported) {
      throw new Error('Local Font Access API is not supported in this browser');
    }

    try {
      clearError();
      
      // Always check permission first
      const permissionState = await checkPermission();
      if (permissionState !== 'granted') {
        // Try to request permission if not granted
        const newState = await requestPermission();
        if (newState !== 'granted') {
          throw new Error('Permission to access local fonts not granted');
        }
      }

      // @ts-ignore - queryLocalFonts might not be recognized by TypeScript
      const fontIterator = await window.queryLocalFonts();
      const fonts: FontData[] = [];

      for await (const font of fontIterator) {
        fonts.push({
          family: font.family,
          fullName: font.fullName,
          postscriptName: font.postscriptName,
          style: font.style
        });
      }

      updateState({ fonts });
      return fonts;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const getFontBlob = async (postscriptName: string): Promise<Blob | null> => {
    if (!state.isSupported) {
      throw new Error('Local Font Access API is not supported in this browser');
    }

    try {
      clearError();
      
      // Check permission before proceeding
      const permissionState = await checkPermission();
      if (permissionState !== 'granted') {
        throw new Error('Permission to access local fonts not granted');
      }

      // @ts-ignore - queryLocalFonts might not be recognized by TypeScript
      const fonts = await window.queryLocalFonts();
      for await (const font of fonts) {
        if (font.postscriptName === postscriptName) {
          return await font.blob();
        }
      }
      return null;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  // Initialize by checking permission
  if (state.isSupported) {
    checkPermission().catch(() => {
      // Ignore initial permission check errors
    });
  }

  return {
    get state() { return state; },
    checkPermission,
    requestPermission,
    queryFonts,
    getFontBlob,
    subscribe(callback: (state: LocalFontAccessState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}