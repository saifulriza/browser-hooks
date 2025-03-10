export interface MediaKeySystemConfiguration {
  initDataTypes?: string[];
  audioCapabilities?: MediaKeySystemMediaCapability[];
  videoCapabilities?: MediaKeySystemMediaCapability[];
  distinctiveIdentifier?: MediaKeysRequirement;
  persistentState?: MediaKeysRequirement;
  sessionTypes?: string[];
}

export interface EncryptedMediaState {
  isSupported: boolean;
  activeKeySystems: Set<string>;
}

export function useEncryptedMedia() {
  let state: EncryptedMediaState = {
    isSupported: typeof window.navigator.requestMediaKeySystemAccess === 'function',
    activeKeySystems: new Set()
  };

  const listeners = new Set<(state: EncryptedMediaState) => void>();

  const updateState = (newState: Partial<EncryptedMediaState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const requestAccess = async (
    keySystem: string,
    config: MediaKeySystemConfiguration[]
  ) => {
    if (!state.isSupported) {
      throw new Error('Encrypted Media Extensions API is not supported');
    }

    try {
      const mediaKeys = await navigator.requestMediaKeySystemAccess(keySystem, config);
      const newActiveKeySystems = new Set(state.activeKeySystems);
      newActiveKeySystems.add(keySystem);
      updateState({ activeKeySystems: newActiveKeySystems });
      return mediaKeys;
    } catch (error) {
      console.error(`Failed to request media key system access: ${error}`);
      return null;
    }
  };

  const createMediaKeys = async (mediaKeySystemAccess: MediaKeySystemAccess) => {
    try {
      return await mediaKeySystemAccess.createMediaKeys();
    } catch (error) {
      console.error(`Failed to create media keys: ${error}`);
      return null;
    }
  };

  const setMediaKeys = async (element: HTMLMediaElement, mediaKeys: MediaKeys | null) => {
    try {
      await element.setMediaKeys(mediaKeys);
      return true;
    } catch (error) {
      console.error(`Failed to set media keys: ${error}`);
      return false;
    }
  };

  const createSession = (
    mediaKeys: MediaKeys,
    sessionType: MediaKeySessionType = 'temporary'
  ) => {
    try {
      return mediaKeys.createSession(sessionType);
    } catch (error) {
      console.error(`Failed to create media key session: ${error}`);
      return null;
    }
  };

  const removeKeySystem = (keySystem: string) => {
    const newActiveKeySystems = new Set(state.activeKeySystems);
    newActiveKeySystems.delete(keySystem);
    updateState({ activeKeySystems: newActiveKeySystems });
  };

  return {
    get state() { return state; },
    requestAccess,
    createMediaKeys,
    setMediaKeys,
    createSession,
    removeKeySystem,
    subscribe(callback: (state: EncryptedMediaState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}