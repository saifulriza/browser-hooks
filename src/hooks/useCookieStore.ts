export interface CookieStoreState {
  isSupported: boolean;
  hasChangeListener: boolean;
}

export interface CookieOptions {
  domain?: string;
  expires?: Date;
  path?: string;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
}

export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  expires?: Date;
  path?: string;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
}

export function useCookieStore() {
  let state: CookieStoreState = {
    isSupported: typeof cookieStore !== 'undefined',
    hasChangeListener: false
  };

  const listeners = new Set<(state: CookieStoreState) => void>();
  const changeListeners = new Set<(event: CookieChangeEvent) => void>();

  const updateState = (newState: Partial<CookieStoreState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const getCookie = async (name: string): Promise<Cookie | null> => {
    if (!state.isSupported) {
      throw new Error('Cookie Store API is not supported');
    }

    try {
      const cookie = await cookieStore.get(name);
      return cookie ? {
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        expires: cookie.expires ? new Date(cookie.expires) : undefined,
        path: cookie.path,
        sameSite: cookie.sameSite,
        secure: cookie.secure
      } : null;
    } catch (error) {
      console.error(`Failed to get cookie: ${error}`);
      return null;
    }
  };

  const getAllCookies = async (): Promise<Cookie[]> => {
    if (!state.isSupported) {
      throw new Error('Cookie Store API is not supported');
    }

    try {
      const cookies = await cookieStore.getAll();
      return cookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        expires: cookie.expires ? new Date(cookie.expires) : undefined,
        path: cookie.path,
        sameSite: cookie.sameSite,
        secure: cookie.secure
      }));
    } catch (error) {
      console.error(`Failed to get all cookies: ${error}`);
      return [];
    }
  };

  const setCookie = async (name: string, value: string, options: CookieOptions = {}): Promise<boolean> => {
    if (!state.isSupported) {
      throw new Error('Cookie Store API is not supported');
    }

    try {
      await cookieStore.set({
        name,
        value,
        ...options
      });
      return true;
    } catch (error) {
      console.error(`Failed to set cookie: ${error}`);
      return false;
    }
  };

  const deleteCookie = async (name: string, options: Pick<CookieOptions, 'domain' | 'path'> = {}): Promise<boolean> => {
    if (!state.isSupported) {
      throw new Error('Cookie Store API is not supported');
    }

    try {
      await cookieStore.delete({
        name,
        ...options
      });
      return true;
    } catch (error) {
      console.error(`Failed to delete cookie: ${error}`);
      return false;
    }
  };

  const subscribeToChanges = (callback: (event: CookieChangeEvent) => void) => {
    if (!state.isSupported) {
      throw new Error('Cookie Store API is not supported');
    }

    changeListeners.add(callback);
    
    if (!state.hasChangeListener) {
      cookieStore.addEventListener('change', (event: CookieChangeEvent) => {
        changeListeners.forEach(listener => listener(event));
      });
      updateState({ hasChangeListener: true });
    }

    return () => {
      changeListeners.delete(callback);
      if (changeListeners.size === 0) {
        cookieStore.removeEventListener('change', () => {});
        updateState({ hasChangeListener: false });
      }
    };
  };

  return {
    get state() { return state; },
    getCookie,
    getAllCookies,
    setCookie,
    deleteCookie,
    subscribeToChanges,
    subscribe(callback: (state: CookieStoreState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}