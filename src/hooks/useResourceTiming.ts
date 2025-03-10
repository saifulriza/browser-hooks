export interface ResourceTimingState {
  isSupported: boolean;
  bufferSize: number;
  entries: PerformanceResourceTiming[];
}

export interface ResourceTimingOptions {
  onResourceTiming?: (entry: PerformanceResourceTiming) => void;
  bufferSize?: number;
  initiatorTypes?: string[];
}

export function useResourceTiming() {
  const state: ResourceTimingState = {
    isSupported: typeof performance !== 'undefined' && 
      'getEntriesByType' in performance &&
      typeof PerformanceObserver !== 'undefined',
    bufferSize: 150,
    entries: []
  };

  const listeners = new Set<(state: ResourceTimingState) => void>();

  const updateState = (newState: Partial<ResourceTimingState>) => {
    Object.assign(state, newState);
    listeners.forEach(listener => listener(state));
  };

  const observe = (options: ResourceTimingOptions = {}) => {
    if (!state.isSupported) {
      throw new Error('Resource Timing API is not supported');
    }

    try {
      // Set buffer size if specified
      if (options.bufferSize) {
        performance.setResourceTimingBufferSize(options.bufferSize);
        updateState({ bufferSize: options.bufferSize });
      }

      // Get existing entries
      const currentEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      updateState({ entries: currentEntries });

      // Set up observer for new entries
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        const filteredEntries = options.initiatorTypes
          ? entries.filter(entry => options.initiatorTypes?.includes(entry.initiatorType))
          : entries;

        filteredEntries.forEach(entry => {
          options.onResourceTiming?.(entry);
        });

        updateState({
          entries: [...state.entries, ...filteredEntries]
        });
      });

      observer.observe({ entryTypes: ['resource'] });

      // Handle buffer full event
      performance.onresourcetimingbufferfull = () => {
        performance.clearResourceTimings();
        updateState({ entries: [] });
      };

      return () => {
        observer.disconnect();
        performance.onresourcetimingbufferfull = null;
      };
    } catch (error) {
      throw new Error(`Failed to observe resource timing: ${error}`);
    }
  };

  const clearEntries = () => {
    if (!state.isSupported) {
      throw new Error('Resource Timing API is not supported');
    }

    performance.clearResourceTimings();
    updateState({ entries: [] });
  };

  const getEntries = (filter?: {
    name?: string;
    entryType?: string;
    initiatorType?: string;
  }) => {
    if (!state.isSupported) {
      return [];
    }

    let entries = state.entries;

    if (filter) {
      entries = entries.filter(entry => {
        let match = true;
        if (filter.name) match = match && entry.name === filter.name;
        if (filter.entryType) match = match && entry.entryType === filter.entryType;
        if (filter.initiatorType) match = match && entry.initiatorType === filter.initiatorType;
        return match;
      });
    }

    return entries;
  };

  const getMetrics = (entry: PerformanceResourceTiming) => {
    return {
      // Timing
      startTime: entry.startTime,
      duration: entry.duration,
      fetchStart: entry.fetchStart,
      responseEnd: entry.responseEnd,
      
      // Network timing
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ssl: entry.secureConnectionStart > 0 
        ? entry.connectEnd - entry.secureConnectionStart 
        : 0,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      
      // Size info
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
      
      // Compression ratio
      compressionRatio: entry.encodedBodySize > 0
        ? entry.decodedBodySize / entry.encodedBodySize
        : 1
    };
  };

  return {
    get state() { return state; },
    observe,
    clearEntries,
    getEntries,
    getMetrics,
    subscribe(callback: (state: ResourceTimingState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}