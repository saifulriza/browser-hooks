interface EyeDropperResult {
  sRGBHex: string;
}

interface UseEyeDropperOptions {
  onColorSelect?: (color: string) => void;
  onError?: (error: Error) => void;
}

export function useEyeDropper(options: UseEyeDropperOptions = {}) {
  const isSupported = 'EyeDropper' in window;

  const openPicker = async (): Promise<EyeDropperResult | null> => {
    if (!isSupported) {
      const error = new Error('EyeDropper API is not supported in this browser');
      options.onError?.(error);
      return null;
    }

    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      options.onColorSelect?.(result.sRGBHex);
      return result;
    } catch (error) {
      options.onError?.(error as Error);
      return null;
    }
  };

  return {
    isSupported,
    openPicker
  };
}