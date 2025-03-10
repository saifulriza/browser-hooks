export interface CustomMediaRecorderOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
  videoBitsPerSecond?: number;
  bitsPerSecond?: number;
  audioBitrateMode?: 'constant' | 'variable';
  videoBitrateMode?: 'constant' | 'variable';
  audio?: boolean | MediaTrackConstraints;
  video?: boolean | MediaTrackConstraints;
}

export interface MediaRecorderState {
  isSupported: boolean;
  isRecording: boolean;
  isPaused: boolean;
  recordedChunks: Blob[];
  mimeType: string | null;
  error: Error | null;
  stream: MediaStream | null;
  permissionState: PermissionState | null;
}

export function useMediaRecorder(options: CustomMediaRecorderOptions = {}) {
  let state: MediaRecorderState = {
    isSupported: typeof window !== 'undefined' && 'MediaRecorder' in window,
    isRecording: false,
    isPaused: false,
    recordedChunks: [],
    mimeType: null,
    error: null,
    stream: null,
    permissionState: null
  };

  const listeners = new Set<(state: MediaRecorderState) => void>();
  let recorder: MediaRecorder | null = null;

  const updateState = (newState: Partial<MediaRecorderState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('MediaRecorder API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const isTypeSupported = (type: string): boolean => {
    if (!state.isSupported) return false;
    return MediaRecorder.isTypeSupported(type);
  };

  const checkPermissions = async (constraints: MediaStreamConstraints): Promise<PermissionState> => {
    if (!state.isSupported) {
      throw new Error('MediaRecorder API is not supported in this browser');
    }

    try {
      clearError();
      const permissionRequests: Promise<PermissionStatus>[] = [];
      
      if (constraints.audio) {
        permissionRequests.push(navigator.permissions.query({ name: 'microphone' as PermissionName }));
      }
      if (constraints.video) {
        permissionRequests.push(navigator.permissions.query({ name: 'camera' as PermissionName }));
      }

      const results = await Promise.all(permissionRequests);

      // If any permission is denied, return denied
      if (results.some(result => result.state === 'denied')) {
        updateState({ permissionState: 'denied' });
        return 'denied';
      }
      // If all are granted, return granted
      if (results.every(result => result.state === 'granted')) {
        updateState({ permissionState: 'granted' });
        return 'granted';
      }
      // Otherwise, return prompt
      updateState({ permissionState: 'prompt' });
      return 'prompt';
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const getStream = async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      updateState({ stream });
      return stream;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const start = async (options: CustomMediaRecorderOptions = {}) => {
    if (!state.isSupported) {
      throw new Error('MediaRecorder API is not supported in this browser');
    }

    try {
      clearError();
      if (recorder) {
        throw new Error('Recording already in progress');
      }

      const constraints = {
        audio: options.audio ?? true,
        video: options.video ?? false
      };

      // Check permissions first
      const permissionState = await checkPermissions(constraints);
      if (permissionState === 'denied') {
        throw new Error('Permission denied for media access');
      }

      // Get media stream
      const stream = await getStream(constraints);
      
      // Create and set up recorder
      recorder = new MediaRecorder(stream, {
        ...options
      });
      
      recorder.addEventListener('dataavailable', (event: BlobEvent) => {
        if (event.data.size > 0) {
          state.recordedChunks.push(event.data);
          updateState({ recordedChunks: [...state.recordedChunks] });
        }
      });

      recorder.addEventListener('start', () => {
        updateState({
          isRecording: true,
          isPaused: false,
          mimeType: recorder?.mimeType || null
        });
      });

      recorder.addEventListener('stop', () => {
        updateState({
          isRecording: false,
          isPaused: false
        });
        // Stop all tracks and clear stream
        if (state.stream) {
          state.stream.getTracks().forEach(track => track.stop());
          updateState({ stream: null });
        }
      });

      recorder.addEventListener('pause', () => {
        updateState({ isPaused: true });
      });

      recorder.addEventListener('resume', () => {
        updateState({ isPaused: false });
      });

      recorder.addEventListener('error', (event) => {
        setError(new Error('MediaRecorder error: ' + event.error));
      });

      recorder.start(1000); // Request data every second to ensure we don't lose anything
      return recorder;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const stop = () => {
    if (!recorder || !state.isRecording) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      try {
        clearError();
        // Add one-time listener for the final dataavailable event
        recorder!.addEventListener('dataavailable', () => {
          resolve();
        }, { once: true });
        
        recorder!.addEventListener('error', (event) => {
          reject(new Error('MediaRecorder error during stop: ' + event.error));
        }, { once: true });

        recorder!.stop();
        recorder = null;
      } catch (error) {
        setError(error as Error);
        reject(error);
      }
    });
  };

  const pause = () => {
    if (!recorder || !state.isRecording || state.isPaused) {
      return;
    }

    try {
      clearError();
      recorder.pause();
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const resume = () => {
    if (!recorder || !state.isRecording || !state.isPaused) {
      return;
    }

    try {
      clearError();
      recorder.resume();
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const requestData = () => {
    if (!recorder || !state.isRecording) {
      return;
    }

    try {
      clearError();
      recorder.requestData();
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const clearRecordedData = () => {
    updateState({ recordedChunks: [] });
  };

  const getBlob = (type?: string): Blob => {
    if (state.recordedChunks.length === 0) {
      throw new Error('No recorded data available');
    }

    return new Blob(state.recordedChunks, { type: type || state.mimeType || undefined });
  };

  // Cleanup function
  const cleanup = () => {
    if (recorder && state.isRecording) {
      stop();
    }
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
      updateState({ stream: null });
    }
    clearRecordedData();
  };

  return {
    get state() { return state; },
    isTypeSupported,
    start,
    stop,
    pause,
    resume,
    requestData,
    clearRecordedData,
    getBlob,
    cleanup,
    subscribe(callback: (state: MediaRecorderState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}