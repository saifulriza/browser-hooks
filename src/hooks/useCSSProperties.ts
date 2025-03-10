export interface CSSPropertyDefinition {
  name: string;
  syntax?: string;
  inherits: boolean; // Make this required since CSS.registerProperty requires it
  initialValue?: string;
}

export interface CSSPropertiesState {
  isSupported: boolean;
  registeredProperties: string[];
}

export function useCSSProperties() {
  let state: CSSPropertiesState = {
    isSupported: 'registerProperty' in CSS,
    registeredProperties: []
  };

  const listeners = new Set<(state: CSSPropertiesState) => void>();

  const updateState = (newState: Partial<CSSPropertiesState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const registerProperty = (definition: CSSPropertyDefinition) => {
    if (!state.isSupported) {
      throw new Error('CSS Properties and Values API is not supported');
    }

    try {
      CSS.registerProperty({
        name: definition.name,
        syntax: definition.syntax,
        inherits: definition.inherits || false, // Provide default value
        initialValue: definition.initialValue
      });

      const newRegisteredProperties = [...state.registeredProperties, definition.name];
      updateState({ registeredProperties: newRegisteredProperties });
    } catch (error) {
      throw new Error(`Failed to register CSS property: ${error}`);
    }
  };

  const getPropertyValue = (propertyName: string, element: Element) => {
    const computedStyle = window.getComputedStyle(element);
    return computedStyle.getPropertyValue(propertyName);
  };

  const setPropertyValue = (propertyName: string, value: string, element: Element) => {
    (element as HTMLElement).style.setProperty(propertyName, value);
  };

  const setProperty = (element: Element, propertyName: string, value: string) => {
    if (!state.isSupported) {
      throw new Error('CSS Custom Properties API is not supported');
    }
    const htmlElement = element as HTMLElement;
    htmlElement.style.setProperty(propertyName, value);
  };

  return {
    get state() { return state; },
    registerProperty,
    getPropertyValue,
    setPropertyValue,
    setProperty,
    subscribe(callback: (state: CSSPropertiesState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}