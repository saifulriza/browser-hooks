export interface CSSOMState {
  isSupported: boolean;
  styleSheets: {
    href: string | null;
    rules: number;
  }[];
}

export interface StyleRule {
  selector: string;
  properties: Record<string, string>;
}

export function useCSSOM() {
  let state: CSSOMState = {
    isSupported: 'styleSheets' in document,
    styleSheets: []
  };

  const listeners = new Set<(state: CSSOMState) => void>();

  const updateState = (newState: Partial<CSSOMState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const refreshStyleSheets = () => {
    if (!state.isSupported) return;

    const sheets = Array.from(document.styleSheets).map(sheet => ({
      href: sheet.href,
      rules: sheet.cssRules?.length ?? 0
    }));

    updateState({ styleSheets: sheets });
  };

  const createStyleSheet = () => {
    if (!state.isSupported) {
      throw new Error('CSSOM is not supported');
    }

    const style = document.createElement('style');
    document.head.appendChild(style);
    refreshStyleSheets();
    return style.sheet;
  };

  const addRule = (sheet: CSSStyleSheet, rule: StyleRule) => {
    try {
      const { selector, properties } = rule;
      const cssText = Object.entries(properties)
        .map(([prop, value]) => `${prop}: ${value}`)
        .join('; ');
      
      const index = sheet.insertRule(
        `${selector} { ${cssText} }`,
        sheet.cssRules.length
      );
      
      refreshStyleSheets();
      return index;
    } catch (error) {
      throw new Error(`Failed to add CSS rule: ${error}`);
    }
  };

  const removeRule = (sheet: CSSStyleSheet, index: number) => {
    try {
      sheet.deleteRule(index);
      refreshStyleSheets();
    } catch (error) {
      throw new Error(`Failed to remove CSS rule: ${error}`);
    }
  };

  const getMatchingRules = (element: Element) => {
    return Array.from(document.styleSheets)
      .flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules);
        } catch {
          return [];
        }
      })
      .filter(rule => {
        try {
          return rule instanceof CSSStyleRule && 
                 element.matches(rule.selectorText);
        } catch {
          return false;
        }
      });
  };

  // Initialize state
  refreshStyleSheets();

  return {
    get state() { return state; },
    createStyleSheet,
    addRule,
    removeRule,
    getMatchingRules,
    refreshStyleSheets,
    subscribe(callback: (state: CSSOMState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}