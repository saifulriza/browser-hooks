export type ReportType = 'deprecation' | 'intervention' | 'crash' | 'csp-violation';

export interface ReportingState {
  isSupported: boolean;
  observers: Map<ReportType, ReportingObserver>;
  reports: Report[];
}

export interface ReportingOptions {
  types?: ReportType[];
  buffered?: boolean;
  onReport?: (reports: Report[]) => void;
}

export function useReportingAPI() {
  const state: ReportingState = {
    isSupported: typeof window !== 'undefined' && 'ReportingObserver' in window,
    observers: new Map(),
    reports: []
  };

  const listeners = new Set<(state: ReportingState) => void>();

  const updateState = (newState: Partial<ReportingState>) => {
    Object.assign(state, newState);
    listeners.forEach(listener => listener(state));
  };

  const observe = (options: ReportingOptions = {}) => {
    if (!state.isSupported) {
      throw new Error('Reporting API is not supported');
    }

    try {
      const types = options.types || ['deprecation', 'intervention'];
      
      types.forEach(type => {
        if (!state.observers.has(type)) {
          const observer = new ReportingObserver(
            (reports: Report[]) => {
              const updatedReports = [...state.reports, ...reports];
              updateState({ reports: updatedReports });
              options.onReport?.(reports);
            },
            { 
              types: [type],
              buffered: options.buffered || false
            }
          );

          observer.observe();
          state.observers.set(type, observer);
        }
      });

      updateState({ observers: new Map(state.observers) });
    } catch (error) {
      throw new Error(`Failed to observe reports: ${error}`);
    }
  };

  const disconnect = (type?: ReportType) => {
    if (type) {
      const observer = state.observers.get(type);
      if (observer) {
        observer.disconnect();
        state.observers.delete(type);
      }
    } else {
      state.observers.forEach(observer => observer.disconnect());
      state.observers.clear();
    }
    
    updateState({ observers: new Map(state.observers) });
  };

  const clearReports = () => {
    updateState({ reports: [] });
  };

  const getReports = (type?: ReportType) => {
    if (type) {
      return state.reports.filter(report => report.type === type);
    }
    return state.reports;
  };

  const takeRecords = (type?: ReportType) => {
    if (!state.isSupported) {
      return [];
    }

    let records: Report[] = [];

    if (type) {
      const observer = state.observers.get(type);
      if (observer) {
        records = observer.takeRecords();
      }
    } else {
      state.observers.forEach(observer => {
        records = [...records, ...observer.takeRecords()];
      });
    }

    return records;
  };

  return {
    get state() { return state; },
    observe,
    disconnect,
    clearReports,
    getReports,
    takeRecords,
    subscribe(callback: (state: ReportingState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}