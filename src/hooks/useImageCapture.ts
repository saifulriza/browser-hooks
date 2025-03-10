export interface ImageCaptureState {
  isSupported: boolean;
  isReady: boolean;
  capabilities: PhotoCapabilities | null;
  error: Error | null;
  stream: MediaStream | null;
}

export interface PhotoSettings {
  imageWidth?: number;
  imageHeight?: number;
  redEyeReduction?: boolean;
  fillLightMode?: string;
}

export interface CameraOptions {
  video?: MediaTrackConstraints;
  audio?: boolean;
  targetElement?: HTMLVideoElement | null;
}

export function useImageCapture() {
  let state: ImageCaptureState = {
    isSupported: typeof window !== 'undefined' && 'ImageCapture' in window,
    isReady: false,
    capabilities: null,
    error: null,
    stream: null
  };

  const listeners = new Set<(state: ImageCaptureState) => void>();
  let imageCapture: any | null = null;

  const updateState = (newState: Partial<ImageCaptureState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Image Capture API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const startCamera = async (options: CameraOptions = {}): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('Image Capture API is not supported in this browser');
    }

    try {
      clearError();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: options.video || { facingMode: "user" },
        audio: options.audio || false
      });

      // If a target video element is provided, set its source
      if (options.targetElement instanceof HTMLVideoElement) {
        options.targetElement.srcObject = stream;
      }

      const videoTrack = stream.getVideoTracks()[0];
      // @ts-ignore - ImageCapture might not be recognized by TypeScript
      imageCapture = new ImageCapture(videoTrack);
      
      const capabilities = await imageCapture.getPhotoCapabilities();
      updateState({
        isReady: true,
        capabilities,
        stream
      });
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const stopCamera = () => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
      updateState({ stream: null, isReady: false });
    }
    cleanup();
  };

  const takePhoto = async (settings?: PhotoSettings): Promise<Blob> => {
    if (!state.isSupported || !imageCapture) {
      throw new Error('Image Capture is not initialized');
    }

    try {
      clearError();
      return await imageCapture.takePhoto(settings);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const grabFrame = async (): Promise<ImageBitmap> => {
    if (!state.isSupported || !imageCapture) {
      throw new Error('Image Capture is not initialized');
    }

    try {
      clearError();
      return await imageCapture.grabFrame();
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const setOptions = async (settings: PhotoSettings) => {
    if (!state.isSupported || !imageCapture) {
      throw new Error('Image Capture is not initialized');
    }

    try {
      clearError();
      await imageCapture.setOptions(settings);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const cleanup = () => {
    imageCapture = null;
    updateState({
      isReady: false,
      capabilities: null
    });
  };

  return {
    get state() { return state; },
    startCamera,
    stopCamera,
    takePhoto,
    grabFrame,
    setOptions,
    cleanup,
    subscribe(callback: (state: ImageCaptureState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}