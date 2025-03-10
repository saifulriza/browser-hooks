export interface WebAuthnState {
  isSupported: boolean;
  isUserVerifyingPlatformAuthenticatorAvailable: boolean;
  isConditionalMediationAvailable: boolean;
  error: Error | null;
}

export interface CreateCredentialOptions extends Omit<CredentialCreationOptions, 'publicKey'> {
  publicKey: PublicKeyCredentialCreationOptions;
}

export interface GetCredentialOptions extends Omit<CredentialRequestOptions, 'publicKey'> {
  publicKey: PublicKeyCredentialRequestOptions;
  mediation?: CredentialMediationRequirement;
}

export function useWebAuthn() {
  let state: WebAuthnState = {
    isSupported: typeof window !== 'undefined' && !!window.PublicKeyCredential,
    isUserVerifyingPlatformAuthenticatorAvailable: false,
    isConditionalMediationAvailable: false,
    error: null
  };

  const listeners = new Set<(state: WebAuthnState) => void>();

  const updateState = (newState: Partial<WebAuthnState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  // Check if user-verifying platform authenticator is available
  if (state.isSupported && typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then((available) => {
        updateState({ isUserVerifyingPlatformAuthenticatorAvailable: available });
      })
      .catch((error) => {
        console.error('Error checking platform authenticator availability:', error);
        updateState({ error: error as Error });
      });
  }

  // Check if conditional mediation is available (for autofill support)
  if (state.isSupported && typeof PublicKeyCredential.isConditionalMediationAvailable === 'function') {
    PublicKeyCredential.isConditionalMediationAvailable()
      .then((available) => {
        updateState({ isConditionalMediationAvailable: available });
      })
      .catch((error) => {
        console.error('Error checking conditional mediation availability:', error);
      });
  }

  /**
   * Creates a new credential (registration)
   */
  const createCredential = async (options: CreateCredentialOptions): Promise<PublicKeyCredential | null> => {
    if (!state.isSupported) {
      throw new Error('Web Authentication API is not supported in this browser');
    }

    try {
      updateState({ error: null });
      // Handle both localhost and 127.0.0.1 for local development
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        if (!options.publicKey.rp) {
          options.publicKey.rp = {
            // Always use localhost as rpId for both localhost and 127.0.0.1
            id: 'localhost',
            name: 'Local Development'
          };
        } else {
          options.publicKey.rp.id = 'localhost';
          if (!options.publicKey.rp.name) {
            options.publicKey.rp.name = 'Local Development';
          }
        }
        
        // Ensure the authenticator parameters are correctly set
        if (!options.publicKey.authenticatorSelection) {
          options.publicKey.authenticatorSelection = {
            authenticatorAttachment: 'platform',
            requireResidentKey: false,
            userVerification: 'preferred'
          };
        }
      }

      const credential = await navigator.credentials.create(options) as PublicKeyCredential;
      return credential;
    } catch (error) {
      console.error('Error creating credential:', error);
      updateState({ error: error as Error });
      throw error;
    }
  };

  /**
   * Gets an existing credential (authentication)
   */
  const getCredential = async (options: GetCredentialOptions): Promise<PublicKeyCredential | null> => {
    if (!state.isSupported) {
      throw new Error('Web Authentication API is not supported in this browser');
    }

    try {
      updateState({ error: null });
      // Handle both localhost and 127.0.0.1 for local development
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Always use localhost as rpId for both localhost and 127.0.0.1
        options.publicKey.rpId = 'localhost';
      }
      const credential = await navigator.credentials.get(options) as PublicKeyCredential;
      return credential;
    } catch (error) {
      console.error('Error getting credential:', error);
      updateState({ error: error as Error });
      throw error;
    }
  };

  /**
   * Helper to convert Base64URL string to ArrayBuffer
   */
  const base64UrlToArrayBuffer = (base64Url: string): ArrayBuffer => {
    const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
    const base64 = (base64Url + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const buffer = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i++) {
      buffer[i] = rawData.charCodeAt(i);
    }

    return buffer.buffer;
  };

  /**
   * Helper to convert ArrayBuffer to Base64URL string
   */
  const arrayBufferToBase64Url = (arrayBuffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(arrayBuffer);
    let base64 = '';
    const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    const byteLength = bytes.byteLength;
    const byteRemainder = byteLength % 3;
    const mainLength = byteLength - byteRemainder;

    let a, b, c, d;
    let chunk;

    // Main loop deals with bytes in chunks of 3
    for (let i = 0; i < mainLength; i = i + 3) {
      // Combine the three bytes into a single integer
      chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

      // Use bitmasks to extract 6-bit segments from the triplet
      a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
      b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
      c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
      d = chunk & 63; // 63       = 2^6 - 1

      // Convert the raw binary segments to the appropriate ASCII encoding
      base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder === 1) {
      chunk = bytes[mainLength];
      a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2
      b = (chunk & 3) << 4; // 3   = 2^2 - 1
      base64 += encodings[a] + encodings[b] + '==';
    } else if (byteRemainder === 2) {
      chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
      a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
      b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4
      c = (chunk & 15) << 2; // 15    = 2^4 - 1
      base64 += encodings[a] + encodings[b] + encodings[c] + '=';
    }

    // Convert to base64url format
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  return {
    get state() { return state; },
    createCredential,
    getCredential,
    base64UrlToArrayBuffer,
    arrayBufferToBase64Url,
    subscribe(callback: (state: WebAuthnState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}