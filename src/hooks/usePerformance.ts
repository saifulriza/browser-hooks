export interface PerformanceMetrics {
  navigation: PerformanceNavigationTiming | null;
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  timeOrigin: number;
}

export function usePerformance() {
  const getMetrics = (): PerformanceMetrics => {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const memory = (performance as any).memory;

    return {
      navigation: navigationEntry,
      memory: memory ? {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      } : undefined,
      timeOrigin: performance.timeOrigin
    };
  };

  const mark = (name: string) => {
    performance.mark(name);
  };

  const measure = (name: string, startMark: string, endMark: string) => {
    performance.measure(name, startMark, endMark);
  };

  const getEntries = () => {
    return performance.getEntries();
  };

  const clearMarks = (name?: string) => {
    performance.clearMarks(name);
  };

  const clearMeasures = (name?: string) => {
    performance.clearMeasures(name);
  };

  return {
    getMetrics,
    mark,
    measure,
    getEntries,
    clearMarks,
    clearMeasures
  };
}