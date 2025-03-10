export interface CSSPaintingState {
  isSupported: boolean;
  registeredWorklets: Set<string>;
}

export interface PaintWorkletOptions {
  code: string;
  name: string;
}

export function useCSSPainting() {
  let state: CSSPaintingState = {
    isSupported: !!(window.CSS && 'paintWorklet' in window.CSS),
    registeredWorklets: new Set()
  };

  const listeners = new Set<(state: CSSPaintingState) => void>();
  const workletBlobs = new Map<string, string>();

  const updateState = (newState: Partial<CSSPaintingState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const registerPaintWorklet = async (options: PaintWorkletOptions): Promise<boolean> => {
    if (!state.isSupported) {
      throw new Error('CSS Painting API is not supported');
    }

    try {
      // Create a blob URL for the worklet code
      const blob = new Blob([options.code], { type: 'text/javascript' });
      const workletUrl = URL.createObjectURL(blob);
      
      // Store the blob URL for cleanup
      workletBlobs.set(options.name, workletUrl);

      // Add the worklet module
      await CSS.paintWorklet.addModule(workletUrl);

      const newRegisteredWorklets = new Set(state.registeredWorklets);
      newRegisteredWorklets.add(options.name);
      updateState({ registeredWorklets: newRegisteredWorklets });

      return true;
    } catch (error) {
      console.error(`Failed to register paint worklet "${options.name}": ${error}`);
      return false;
    }
  };

  const unregisterPaintWorklet = (name: string): boolean => {
    if (!state.isSupported || !state.registeredWorklets.has(name)) {
      return false;
    }

    try {
      // Revoke the blob URL
      const workletUrl = workletBlobs.get(name);
      if (workletUrl) {
        URL.revokeObjectURL(workletUrl);
        workletBlobs.delete(name);
      }

      const newRegisteredWorklets = new Set(state.registeredWorklets);
      newRegisteredWorklets.delete(name);
      updateState({ registeredWorklets: newRegisteredWorklets });

      return true;
    } catch (error) {
      console.error(`Failed to unregister paint worklet "${name}": ${error}`);
      return false;
    }
  };

  const clearAllWorklets = (): boolean => {
    if (!state.isSupported) {
      return false;
    }

    try {
      // Revoke all blob URLs
      workletBlobs.forEach((url) => URL.revokeObjectURL(url));
      workletBlobs.clear();

      updateState({ registeredWorklets: new Set() });
      return true;
    } catch (error) {
      console.error('Failed to clear all paint worklets:', error);
      return false;
    }
  };

  // Cleanup on unmount
  const cleanup = () => {
    clearAllWorklets();
  };

  return {
    get state() { return state; },
    registerPaintWorklet,
    unregisterPaintWorklet,
    clearAllWorklets,
    cleanup,
    subscribe(callback: (state: CSSPaintingState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}