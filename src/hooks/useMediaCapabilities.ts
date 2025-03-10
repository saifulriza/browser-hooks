export interface MediaCapabilitiesState {
  isSupported: boolean;
  decodingInfo: Map<string, MediaCapabilitiesDecodingInfo>;
  encodingInfo: Map<string, MediaCapabilitiesEncodingInfo>;
  error: Error | null;
}

export interface MediaDecodingConfiguration {
  type: 'file' | 'media-source' | 'webrtc';
  video?: VideoConfiguration;
  audio?: AudioConfiguration;
}

export interface MediaEncodingConfiguration {
  type: 'webrtc';
  video?: VideoConfiguration;
  audio?: AudioConfiguration;
}

interface VideoConfiguration {
  contentType: string;
  width: number;
  height: number;
  bitrate: number;
  framerate: number;
}

interface AudioConfiguration {
  contentType: string;
  channels: string | number;  // Updated to accept both string and number
  bitrate: number;
  samplerate: number;
}

interface MediaCapabilitiesInfo {
  supported: boolean;
  smooth: boolean;
  powerEfficient: boolean;
}

interface MediaCapabilitiesDecodingInfo extends MediaCapabilitiesInfo {}
interface MediaCapabilitiesEncodingInfo extends MediaCapabilitiesInfo {}

export function useMediaCapabilities() {
  let state: MediaCapabilitiesState = {
    isSupported: typeof window !== 'undefined' && 'mediaCapabilities' in navigator,
    decodingInfo: new Map(),
    encodingInfo: new Map(),
    error: null
  };

  const listeners = new Set<(state: MediaCapabilitiesState) => void>();

  const updateState = (newState: Partial<MediaCapabilitiesState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Media Capabilities API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const getDecodingInfo = async (
    configuration: MediaDecodingConfiguration,
    key: string
  ): Promise<MediaCapabilitiesDecodingInfo> => {
    if (!state.isSupported) {
      throw new Error('Media Capabilities API is not supported in this browser');
    }

    try {
      clearError();
      // Convert number channels to string for the API
      if (configuration.audio?.channels) {
        configuration = {
          ...configuration,
          audio: {
            ...configuration.audio,
            channels: configuration.audio.channels.toString()
          }
        };
      }
      const info = await navigator.mediaCapabilities.decodingInfo(configuration);
      state.decodingInfo.set(key, info);
      updateState({ decodingInfo: new Map(state.decodingInfo) });
      return info;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const getEncodingInfo = async (
    configuration: MediaEncodingConfiguration,
    key: string
  ): Promise<MediaCapabilitiesEncodingInfo> => {
    if (!state.isSupported) {
      throw new Error('Media Capabilities API is not supported in this browser');
    }

    try {
      clearError();
      // Convert number channels to string for the API
      if (configuration.audio?.channels) {
        configuration = {
          ...configuration,
          audio: {
            ...configuration.audio,
            channels: configuration.audio.channels.toString()
          }
        };
      }
      const info = await navigator.mediaCapabilities.encodingInfo(configuration);
      state.encodingInfo.set(key, info);
      updateState({ encodingInfo: new Map(state.encodingInfo) });
      return info;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const checkDecodingCapabilities = async (configuration: MediaDecodingConfiguration): Promise<MediaCapabilitiesDecodingInfo> => {
    if (!state.isSupported) {
      throw new Error('Media Capabilities API is not supported');
    }

    try {
      clearError();
      // Convert configuration to match the browser API
      const apiConfig = {
        ...configuration,
        audio: configuration.audio && {
          ...configuration.audio,
          channels: String(configuration.audio.channels)
        }
      };
      
      const info = await navigator.mediaCapabilities.decodingInfo(apiConfig);
      return info;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const checkEncodingCapabilities = async (configuration: MediaEncodingConfiguration): Promise<MediaCapabilitiesEncodingInfo> => {
    if (!state.isSupported) {
      throw new Error('Media Capabilities API is not supported');
    }

    try {
      clearError();
      // Convert configuration to match the browser API
      const apiConfig = {
        ...configuration,
        audio: configuration.audio && {
          ...configuration.audio,
          channels: String(configuration.audio.channels)
        }
      };
      
      const info = await navigator.mediaCapabilities.encodingInfo(apiConfig);
      return info;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const clearCache = (type?: 'decoding' | 'encoding') => {
    if (type === 'decoding' || !type) {
      state.decodingInfo.clear();
    }
    if (type === 'encoding' || !type) {
      state.encodingInfo.clear();
    }
    updateState({
      decodingInfo: new Map(state.decodingInfo),
      encodingInfo: new Map(state.encodingInfo)
    });
  };

  return {
    get state() { return state; },
    getDecodingInfo,
    getEncodingInfo,
    clearCache,
    checkDecodingCapabilities,
    checkEncodingCapabilities,
    subscribe(callback: (state: MediaCapabilitiesState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}