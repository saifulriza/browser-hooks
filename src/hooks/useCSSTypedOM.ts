export interface CSSTypedOMState {
  isSupported: boolean;
}

export type CSSNumericType = 'length' | 'angle' | 'time' | 'frequency' | 'resolution' | 'flex' | 'percent';

export function useCSSTypedOM() {
  let state: CSSTypedOMState = {
    isSupported: typeof CSS !== 'undefined' && 'px' in CSS
  };

  const listeners = new Set<(state: CSSTypedOMState) => void>();

  const updateState = (newState: Partial<CSSTypedOMState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const px = (value: number): CSSUnitValue => {
    return CSS.px(value);
  };

  const setNumericValue = (
    element: Element,
    property: string,
    value: number,
    unit: CSSNumericType
  ) => {
    if (!state.isSupported) {
      throw new Error('CSS Typed OM is not supported');
    }

    try {
      const numericValue = unit === 'length' ? CSS.px(value) :
                          unit === 'angle' ? CSS.deg(value) :
                          unit === 'time' ? CSS.s(value) :
                          unit === 'frequency' ? CSS.Hz(value) :
                          unit === 'resolution' ? CSS.dpi(value) :
                          unit === 'flex' ? CSS.number(value) :
                          unit === 'percent' ? CSS.percent(value) :
                          CSS.number(value);
      
      (element as HTMLElement).attributeStyleMap.set(property, numericValue);
    } catch (error) {
      // Fallback to regular style API
      try {
        (element as HTMLElement).style[property as any] = `${value}${unit === 'length' ? 'px' : 
                                                               unit === 'angle' ? 'deg' :
                                                               unit === 'time' ? 's' :
                                                               unit === 'frequency' ? 'hz' :
                                                               unit === 'resolution' ? 'dpi' :
                                                               unit === 'percent' ? '%' : ''}`;
      } catch (fallbackError) {
        throw new Error(`Failed to set CSS value: ${fallbackError}`);
      }
    }
  };

  const getComputedValue = (
    element: Element,
    property: string
  ): CSSStyleValue | null => {
    if (!state.isSupported) {
      return null;
    }

    try {
      return element.computedStyleMap().get(property) || null;
    } catch (error) {
      // Fallback to getComputedStyle
      try {
        const value = window.getComputedStyle(element).getPropertyValue(property);
        return CSSStyleValue.parse(property, value);
      } catch {
        return null;
      }
    }
  };

  const parseValue = (cssText: string): CSSStyleValue | null => {
    if (!state.isSupported) {
      return null;
    }

    try {
      return CSSStyleValue.parse('width', cssText); // Using width as a generic property
    } catch (error) {
      console.error(`Failed to parse CSS value: ${error}`);
      return null;
    }
  };

  return {
    get state() { return state; },
    px,
    setNumericValue,
    getComputedValue,
    parseValue,
    subscribe(callback: (state: CSSTypedOMState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}