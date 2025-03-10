export interface ConsoleState {
  isSupported: boolean;
  historyEnabled: boolean;
  maxHistorySize: number;
}

export interface LogEntry {
  type: 'log' | 'info' | 'warn' | 'error' | 'debug';
  timestamp: number;
  messages: any[];
}

export function useConsole(options: { historyEnabled?: boolean; maxHistorySize?: number } = {}) {
  const {
    historyEnabled = true,
    maxHistorySize = 1000
  } = options;

  let state: ConsoleState = {
    isSupported: typeof console !== 'undefined',
    historyEnabled,
    maxHistorySize
  };

  const listeners = new Set<(state: ConsoleState) => void>();
  const history: LogEntry[] = [];

  const updateState = (newState: Partial<ConsoleState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const addToHistory = (entry: LogEntry) => {
    if (!state.historyEnabled) return;
    
    history.push(entry);
    if (history.length > state.maxHistorySize) {
      history.shift();
    }
  };

  const createLogger = (type: LogEntry['type']) => {
    return (...messages: any[]) => {
      if (!state.isSupported) return;

      const entry: LogEntry = {
        type,
        timestamp: Date.now(),
        messages
      };

      console[type](...messages);
      addToHistory(entry);
    };
  };

  const clearHistory = () => {
    history.length = 0;
  };

  const getHistory = () => {
    return [...history];
  };

  const setHistoryEnabled = (enabled: boolean) => {
    updateState({ historyEnabled: enabled });
  };

  const setMaxHistorySize = (size: number) => {
    updateState({ maxHistorySize: size });
    while (history.length > size) {
      history.shift();
    }
  };

  return {
    get state() { return state; },
    log: createLogger('log'),
    info: createLogger('info'),
    warn: createLogger('warn'),
    error: createLogger('error'),
    debug: createLogger('debug'),
    clearHistory,
    getHistory,
    setHistoryEnabled,
    setMaxHistorySize,
    subscribe(callback: (state: ConsoleState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}