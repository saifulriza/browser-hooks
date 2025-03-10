export interface MediaStreamState {
  isSupported: boolean;
  streams: Map<string, MediaStream>;
  devices: MediaDeviceInfo[];
  error: Error | null;
}

export interface MediaStreamOptions extends MediaStreamConstraints {
  deviceId?: string;
  streamId?: string;
}

export function useMediaStream() {
  let state: MediaStreamState = {
    isSupported: typeof navigator !== 'undefined' && 'mediaDevices' in navigator,
    streams: new Map(),
    devices: [],
    error: null
  };

  const listeners = new Set<(state: MediaStreamState) => void>();

  const updateState = (newState: Partial<MediaStreamState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Media Stream API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const requestPermissions = async (constraints: MediaStreamConstraints): Promise<PermissionState> => {
    if (!state.isSupported) {
      throw new Error('Media Stream API is not supported in this browser');
    }

    try {
      clearError();
      const names: PermissionName[] = [];
      if (constraints.audio) names.push('microphone' as PermissionName);
      if (constraints.video) names.push('camera' as PermissionName);

      const results = await Promise.all(
        names.map(name => navigator.permissions.query({ name }))
      );

      // If any permission is denied, return denied
      if (results.some(result => result.state === 'denied')) {
        return 'denied';
      }
      // If all are granted, return granted
      if (results.every(result => result.state === 'granted')) {
        return 'granted';
      }
      // Otherwise, return prompt
      return 'prompt';
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const getDevices = async () => {
    if (!state.isSupported) {
      throw new Error('Media Stream API is not supported in this browser');
    }

    try {
      clearError();
      const devices = await navigator.mediaDevices.enumerateDevices();
      updateState({ devices });
      return devices;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const getStream = async (options: MediaStreamOptions = {}): Promise<MediaStream> => {
    if (!state.isSupported) {
      throw new Error('Media Stream API is not supported in this browser');
    }

    try {
      clearError();
      const { deviceId, streamId, ...constraints } = options;

      // Add deviceId constraint if provided
      if (deviceId) {
        if (constraints.video) {
          constraints.video = typeof constraints.video === 'object' 
            ? { ...constraints.video, deviceId }
            : { deviceId };
        }
        if (constraints.audio) {
          constraints.audio = typeof constraints.audio === 'object'
            ? { ...constraints.audio, deviceId }
            : { deviceId };
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const id = streamId || stream.id;
      state.streams.set(id, stream);
      updateState({ streams: new Map(state.streams) });
      return stream;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const getDisplayMedia = async (options: MediaStreamOptions = {}): Promise<MediaStream> => {
    if (!state.isSupported || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error('Display Media API is not supported in this browser');
    }

    try {
      clearError();
      const { streamId, ...constraints } = options;
      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      const id = streamId || stream.id;
      state.streams.set(id, stream);
      updateState({ streams: new Map(state.streams) });
      return stream;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const stopStream = (streamId: string) => {
    const stream = state.streams.get(streamId);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      state.streams.delete(streamId);
      updateState({ streams: new Map(state.streams) });
    }
  };

  const stopAllStreams = () => {
    state.streams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    state.streams.clear();
    updateState({ streams: new Map() });
  };

  // Setup device change listener
  if (state.isSupported && typeof navigator !== 'undefined') {
    navigator.mediaDevices.addEventListener('devicechange', () => {
      getDevices().catch(console.error);
    });
  }

  // Initialize devices list
  if (state.isSupported) {
    getDevices().catch(console.error);
  }

  // Cleanup function
  const cleanup = () => {
    stopAllStreams();
  };

  return {
    get state() { return state; },
    requestPermissions,
    getDevices,
    getStream,
    getDisplayMedia,
    stopStream,
    stopAllStreams,
    cleanup,
    subscribe(callback: (state: MediaStreamState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}