export interface WebCryptoState {
  isSupported: boolean;
  subtle: SubtleCrypto | null;
  error: Error | null;
}

export interface GenerateKeyOptions {
  algorithm: RsaHashedKeyGenParams | EcKeyGenParams | AesKeyGenParams | HmacKeyGenParams | Pbkdf2Params;
  extractable: boolean;
  keyUsages: KeyUsage[];
}

export interface SimpleEncryptOptions {
  key?: CryptoKey;
  iv?: Uint8Array;
}

export interface CryptoKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export function useWebCrypto() {
  let state: WebCryptoState = {
    isSupported: typeof window !== 'undefined' && 
                 typeof window.crypto !== 'undefined' && 
                 typeof window.crypto.subtle !== 'undefined',
    subtle: typeof window !== 'undefined' && window.crypto?.subtle || null,
    error: null
  };

  const listeners = new Set<(state: WebCryptoState) => void>();

  const updateState = (newState: Partial<WebCryptoState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Web Crypto API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  /**
   * Simple encrypt function that uses AES-GCM by default
   */
  const simpleEncrypt = async (data: string, options: SimpleEncryptOptions = {}): Promise<{ encrypted: ArrayBuffer; key: CryptoKey; iv: Uint8Array }> => {
    if (!state.isSupported) {
      throw new Error('Web Crypto API is not supported');
    }

    try {
      clearError();
      
      // Use provided key or generate a new one
      const key = options.key || await window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );

      // Use provided IV or generate a new one
      const iv = options.iv || window.crypto.getRandomValues(new Uint8Array(12));

      // Convert string to ArrayBuffer
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      // Encrypt the data
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        dataBuffer
      );

      return { encrypted, key, iv };
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  /**
   * Simple decrypt function that uses AES-GCM
   */
  const simpleDecrypt = async (encrypted: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<string> => {
    if (!state.isSupported) {
      throw new Error('Web Crypto API is not supported');
    }

    try {
      clearError();
      
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        encrypted
      );

      // Convert ArrayBuffer back to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  // Advanced API functions
  const generateKey = async (options: GenerateKeyOptions): Promise<CryptoKey | CryptoKeyPair> => {
    if (!state.isSupported) {
      throw new Error('Web Crypto API is not supported');
    }

    try {
      clearError();
      return await window.crypto.subtle.generateKey(
        options.algorithm,
        options.extractable,
        options.keyUsages
      );
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const encrypt = async (
    algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
    key: CryptoKey,
    data: ArrayBuffer
  ): Promise<ArrayBuffer> => {
    if (!state.isSupported) {
      throw new Error('Web Crypto API is not supported');
    }

    try {
      clearError();
      return await window.crypto.subtle.encrypt(algorithm, key, data);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const decrypt = async (
    algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
    key: CryptoKey,
    data: ArrayBuffer
  ): Promise<ArrayBuffer> => {
    if (!state.isSupported) {
      throw new Error('Web Crypto API is not supported');
    }

    try {
      clearError();
      return await window.crypto.subtle.decrypt(algorithm, key, data);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const stringToArrayBuffer = (str: string): ArrayBuffer => {
    const encoder = new TextEncoder();
    return encoder.encode(str).buffer;
  };

  const arrayBufferToString = (buffer: ArrayBuffer): string => {
    const decoder = new TextDecoder();
    return decoder.decode(buffer);
  };

  return {
    // Simple API
    simpleEncrypt,
    simpleDecrypt,
    
    // Advanced API
    get state() { return state; },
    generateKey,
    encrypt,
    decrypt,
    stringToArrayBuffer,
    arrayBufferToString,
    subscribe(callback: (state: WebCryptoState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}