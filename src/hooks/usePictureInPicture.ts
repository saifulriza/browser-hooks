export interface PictureInPictureState {
  isSupported: boolean;
  isActive: boolean;
  window: PictureInPictureWindow | null;
  error: Error | null;
}

export interface PictureInPictureOptions {
  width?: number;
  height?: number;
}

export function usePictureInPicture() {
  let state: PictureInPictureState = {
    isSupported: typeof document !== 'undefined' && 'pictureInPictureEnabled' in document,
    isActive: false,
    window: null,
    error: null
  };

  const listeners = new Set<(state: PictureInPictureState) => void>();

  const updateState = (newState: Partial<PictureInPictureState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Picture-in-Picture error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const request = async (
    element: HTMLVideoElement,
    options: PictureInPictureOptions = {}
  ): Promise<PictureInPictureWindow> => {
    if (!state.isSupported) {
      throw new Error('Picture-in-Picture is not supported');
    }

    try {
      clearError();
      const pipWindow = await element.requestPictureInPicture();
      
      // Get current dimensions
      const currentWidth = pipWindow.width;
      const currentHeight = pipWindow.height;
      
      // Calculate new dimensions while maintaining aspect ratio
      const aspectRatio = currentWidth / currentHeight;
      let newWidth = options.width || currentWidth;
      let newHeight = options.height || currentHeight;
      
      if (options.width && !options.height) {
        newHeight = newWidth / aspectRatio;
      } else if (options.height && !options.width) {
        newWidth = newHeight * aspectRatio;
      }
      
      // Apply size through CSS since the properties are read-only
      pipWindow.addEventListener('resize', () => {
        const pipElement = document.pictureInPictureElement;
        if (pipElement && pipElement instanceof HTMLElement) {
          pipElement.style.width = `${newWidth}px`;
          pipElement.style.height = `${newHeight}px`;
        }
      }, { once: true });

      updateState({
        isActive: true,
        window: pipWindow
      });

      return pipWindow;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const exit = async (): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('Picture-in-Picture is not supported');
    }

    try {
      clearError();
      await document.exitPictureInPicture();
      updateState({
        isActive: false,
        window: null
      });
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  return {
    get state() { return state; },
    request,
    exit,
    subscribe(callback: (state: PictureInPictureState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}