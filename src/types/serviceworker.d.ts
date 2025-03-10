interface SyncManager {
  getTags(): Promise<string[]>;
  register(tag: string): Promise<void>;
}

interface ServiceWorkerRegistration {
  sync: SyncManager;
  backgroundFetch: BackgroundFetchManager;
}

interface BackgroundFetchManager {
  fetch(id: string, requests: RequestInfo[], options?: BackgroundFetchOptions): Promise<BackgroundFetchRegistration>;
  get(id: string): Promise<BackgroundFetchRegistration | undefined>;
  getIds(): Promise<string[]>;
}

interface BackgroundFetchOptions {
  title?: string;
  icons?: IconDefinition[];
  downloadTotal?: number;
}

interface IconDefinition {
  src: string;
  sizes?: string;
  type?: string;
}

interface BackgroundFetchRegistration {
  id: string;
  uploadTotal: number;
  uploaded: number;
  downloadTotal: number;
  downloaded: number;
  result: boolean;
  failureReason: BackgroundFetchFailureReason | null;
  recordsAvailable: boolean;
  abort(): Promise<void>;
  match(request: RequestInfo, options?: CacheQueryOptions): Promise<Response | undefined>;
  matchAll(request?: RequestInfo, options?: CacheQueryOptions): Promise<Response[]>;
}