interface FedCMCredential {
  id: string;
  type: string;
  name?: string;
  iconURL?: string;
}

interface UseFedCMOptions {
  onSuccess?: (credential: FedCMCredential) => void;
  onError?: (error: Error) => void;
}

export function useFedCM(options: UseFedCMOptions = {}) {
  const isSupported = 'IdentityCredential' in window || 'FederatedCredential' in window;

  const getMediationMode = () => {
    if ('IdentityCredential' in window) {
      return 'conditional';
    }
    return 'optional';
  };

  const signIn = async (providerId: string): Promise<FedCMCredential | null> => {
    if (!isSupported) {
      const error = new Error('FedCM API is not supported in this browser');
      options.onError?.(error);
      return null;
    }

    try {
      const credential = await (navigator.credentials as any).get({
        identity: {
          providers: [{
            configURL: `/.well-known/fedcm/${providerId}-config.json`,
            clientId: providerId
          }],
          mediation: getMediationMode()
        }
      });

      if (credential) {
        options.onSuccess?.(credential);
        return credential;
      }
      return null;
    } catch (error) {
      options.onError?.(error as Error);
      return null;
    }
  };

  return {
    isSupported,
    signIn
  };
}