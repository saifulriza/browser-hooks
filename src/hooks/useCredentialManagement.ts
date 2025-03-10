export interface CredentialManagementState {
  isSupported: boolean;
  isAvailable: boolean;
  mediation: CredentialMediationRequirement;
}

export interface CredentialRequestOptions {
  mediation?: CredentialMediationRequirement;
  signal?: AbortSignal;
  password?: boolean;
  federated?: {
    providers: string[];
    protocols?: string[];
  };
}

export interface CredentialCreationData {
  id: string;
  password?: string;
  name?: string;
  iconURL?: string;
}

export function useCredentialManagement() {
  let state: CredentialManagementState = {
    isSupported: typeof window.navigator.credentials !== 'undefined',
    isAvailable: false,
    mediation: 'optional'
  };

  const listeners = new Set<(state: CredentialManagementState) => void>();

  const updateState = (newState: Partial<CredentialManagementState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const checkAvailability = async (): Promise<boolean> => {
    if (!state.isSupported) {
      return false;
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      updateState({ isAvailable: available });
      return available;
    } catch (error) {
      console.error(`Failed to check credential availability: ${error}`);
      return false;
    }
  };

  const get = async (options: CredentialRequestOptions = {}): Promise<Credential | null> => {
    if (!state.isSupported) {
      throw new Error('Credential Management API is not supported');
    }

    try {
      const credential = await navigator.credentials.get({
        mediation: options.mediation || state.mediation,
        signal: options.signal,
        password: options.password,
        federated: options.federated
      });

      if (options.mediation) {
        updateState({ mediation: options.mediation });
      }

      return credential;
    } catch (error) {
      console.error(`Failed to get credential: ${error}`);
      return null;
    }
  };

  const store = async (data: CredentialCreationData): Promise<boolean> => {
    if (!state.isSupported) {
      throw new Error('Credential Management API is not supported');
    }

    try {
      const credential = new PasswordCredential({
        id: data.id,
        password: data.password || '',
        name: data.name,
        iconURL: data.iconURL
      });

      await navigator.credentials.store(credential);
      return true;
    } catch (error) {
      console.error(`Failed to store credential: ${error}`);
      return false;
    }
  };

  const preventSilentAccess = async (): Promise<boolean> => {
    if (!state.isSupported) {
      throw new Error('Credential Management API is not supported');
    }

    try {
      await navigator.credentials.preventSilentAccess();
      updateState({ mediation: 'required' });
      return true;
    } catch (error) {
      console.error(`Failed to prevent silent access: ${error}`);
      return false;
    }
  };

  // Check availability on initialization
  if (state.isSupported) {
    checkAvailability();
  }

  return {
    get state() { return state; },
    get,
    store,
    preventSilentAccess,
    checkAvailability,
    subscribe(callback: (state: CredentialManagementState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}