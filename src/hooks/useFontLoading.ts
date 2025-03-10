export interface FontLoadingState {
  isSupported: boolean;
  loadedFonts: Set<string>;
  loading: boolean;
  error: Error | null;
}

export interface FontOptions {
  style?: string;
  weight?: string;
  stretch?: string;
  unicodeRange?: string;
  variant?: string;
  featureSettings?: string;
  display?: FontDisplay;
}

export function useFontLoading() {
  let state: FontLoadingState = {
    isSupported: 'FontFace' in window,
    loadedFonts: new Set(),
    loading: false,
    error: null
  };

  const listeners = new Set<(state: FontLoadingState) => void>();

  const updateState = (newState: Partial<FontLoadingState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const setError = (error: Error) => {
    updateState({ error });
  };

  const loadFont = async (
    family: string,
    source: string | URL | ArrayBuffer | Blob,
    options: FontOptions = {}
  ): Promise<FontFace> => {
    if (!state.isSupported) {
      throw new Error('Font Loading API is not supported');
    }

    updateState({ loading: true });

    try {
      clearError();
      let fontSource: string | ArrayBuffer;
      
      // Convert Blob or URL to string/ArrayBuffer
      if (source instanceof Blob) {
        fontSource = await source.arrayBuffer();
      } else if (source instanceof URL) {
        fontSource = source.toString();
      } else {
        fontSource = source;
      }
      
      const font = new FontFace(family, fontSource as string | ArrayBuffer | ArrayBufferView, options);
      await font.load();
      document.fonts.add(font);
      
      const loadedFonts = new Set(state.loadedFonts);
      loadedFonts.add(family);
      updateState({ loadedFonts, loading: false });
      
      return font;
    } catch (error) {
      setError(error as Error);
      updateState({ loading: false });
      throw error;
    }
  };

  const checkFont = async (family: string) => {
    if (!state.isSupported) {
      return false;
    }

    const font = document.fonts.check(`12px "${family}"`);
    return font;
  };

  const ready = async () => {
    if (!state.isSupported) {
      return;
    }
    return document.fonts.ready;
  };

  return {
    get state() { return state; },
    loadFont,
    checkFont,
    ready,
    subscribe(callback: (state: FontLoadingState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}