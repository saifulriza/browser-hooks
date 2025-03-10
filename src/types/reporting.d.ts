interface ReportBody {
  message?: string;
  lineNumber?: number;
  fileName?: string;
  columnNumber?: number;
  id?: string;
  sourceFile?: string;
}

interface Report {
  type: string;
  url: string;
  body: ReportBody;
}

interface ReportingObserverOptions {
  types?: string[];
  buffered?: boolean;
}

interface ReportingObserver {
  new(callback: (reports: Report[], observer: ReportingObserver) => void, options?: ReportingObserverOptions): ReportingObserver;
  observe(): void;
  disconnect(): void;
  takeRecords(): Report[];
}

interface Window {
  ReportingObserver: ReportingObserver;
}