export interface ScreenCaptureState {
  isSupported: boolean;
  error: Error | null;
}

export interface ScreenCaptureOptions extends DisplayMediaStreamOptions {
  targetTabPreferred?: boolean;
}

export function useScreenCapture() {
  let state: ScreenCaptureState = {
    isSupported: typeof navigator !== 'undefined' && 'mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices,
    error: null
  };

  const listeners = new Set<(state: ScreenCaptureState) => void>();

  const updateState = (newState: Partial<ScreenCaptureState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const startCapture = async (options: ScreenCaptureOptions = {}): Promise<MediaStream | null> => {
    if (!state.isSupported) {
      throw new Error('Screen Capture API is not supported');
    }

    try {
      // Create standard DisplayMediaStreamOptions
      const streamOptions: DisplayMediaStreamOptions = {
        video: options.video ?? {
          preferCurrentTab: options.targetTabPreferred
        },
        audio: options.audio
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(streamOptions);
      return stream;
    } catch (error) {
      updateState({ error: error as Error });
      return null;
    }
  };

  const stopCapture = (stream: MediaStream): void => {
    stream.getTracks().forEach(track => track.stop());
  };

  return {
    get state() { return state; },
    startCapture,
    stopCapture,
    subscribe(callback: (state: ScreenCaptureState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}