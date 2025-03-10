export interface CSSCustomHighlightState {
  isSupported: boolean;
  activeHighlights: Set<string>;
}

export interface HighlightInit {
  range: Range | Range[];
  priority?: number;
}

export function useCSSCustomHighlight() {
  const checkSupport = () => {
    try {
      return typeof window !== 'undefined' && 
             'CSS' in window && 
             'highlights' in CSS && 
             typeof CSS.highlights !== 'undefined' &&
             typeof window.Highlight === 'function';
    } catch {
      return false;
    }
  };

  let state: CSSCustomHighlightState = {
    isSupported: checkSupport(),
    activeHighlights: new Set()
  };

  const highlights = new Map<string, Highlight>();
  const listeners = new Set<(state: CSSCustomHighlightState) => void>();

  const updateState = (newState: Partial<CSSCustomHighlightState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const createHighlight = (name: string, init: HighlightInit): boolean => {
    if (!checkSupport()) {
      console.warn('CSS Custom Highlight API is not supported in this browser');
      return false;
    }

    try {
      const ranges = Array.isArray(init.range) ? init.range : [init.range];
      const highlight = new Highlight(...ranges);
      
      if (init.priority !== undefined) {
        highlight.priority = init.priority;
      }

      CSS.highlights.set(name, highlight);
      highlights.set(name, highlight);
      
      const newActiveHighlights = new Set(state.activeHighlights);
      newActiveHighlights.add(name);
      updateState({ activeHighlights: newActiveHighlights });

      return true;
    } catch (error) {
      console.error(`Failed to create highlight "${name}": ${error}`);
      return false;
    }
  };

  const updateHighlight = (name: string, init: HighlightInit): boolean => {
    if (!state.isSupported || !highlights.has(name)) {
      return false;
    }

    try {
      const oldHighlight = highlights.get(name)!;
      const ranges = Array.isArray(init.range) ? init.range : [init.range];
      const newHighlight = new Highlight(...ranges);
      
      if (init.priority !== undefined) {
        newHighlight.priority = init.priority;
      }

      CSS.highlights.set(name, newHighlight);
      highlights.set(name, newHighlight);

      return true;
    } catch (error) {
      console.error(`Failed to update highlight "${name}": ${error}`);
      return false;
    }
  };

  const deleteHighlight = (name: string): boolean => {
    if (!state.isSupported || !highlights.has(name)) {
      return false;
    }

    try {
      CSS.highlights.delete(name);
      highlights.delete(name);

      const newActiveHighlights = new Set(state.activeHighlights);
      newActiveHighlights.delete(name);
      updateState({ activeHighlights: newActiveHighlights });

      return true;
    } catch (error) {
      console.error(`Failed to delete highlight "${name}": ${error}`);
      return false;
    }
  };

  const clearAllHighlights = (): boolean => {
    if (!state.isSupported) {
      return false;
    }

    try {
      CSS.highlights.clear();
      highlights.clear();
      updateState({ activeHighlights: new Set() });
      return true;
    } catch (error) {
      console.error(`Failed to clear all highlights: ${error}`);
      return false;
    }
  };

  return {
    get state() { return state; },
    createHighlight,
    updateHighlight,
    deleteHighlight,
    clearAllHighlights,
    subscribe(callback: (state: CSSCustomHighlightState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}