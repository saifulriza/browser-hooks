export interface WebOTPState {
  isSupported: boolean;
  error: Error | null;
}

export interface WebOTPOptions {
  signal?: AbortSignal;
}

export interface OTPCredential extends Credential {
  code: string;
}

export function useWebOTP() {
  let state: WebOTPState = {
    isSupported: typeof navigator !== 'undefined' && 'credentials' in navigator && 'otp' in (navigator.credentials as any),
    error: null
  };

  const listeners = new Set<(state: WebOTPState) => void>();

  const updateState = (newState: Partial<WebOTPState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const receive = async (options: WebOTPOptions = {}): Promise<string | null> => {
    if (!state.isSupported) {
      throw new Error('WebOTP API is not supported');
    }

    try {
      const credential = await (navigator.credentials as any).get({
        abort: options.signal,
        otp: { transport: ['sms'] }
      }) as OTPCredential;

      return credential?.code || null;
    } catch (error) {
      updateState({ error: error as Error });
      return null;
    }
  };

  return {
    get state() { return state; },
    receive,
    subscribe(callback: (state: WebOTPState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}