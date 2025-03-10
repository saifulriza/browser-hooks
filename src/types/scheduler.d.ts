export interface Scheduler {
  postTask<T>(callback: () => T, options?: {
    signal?: AbortSignal;
    priority?: 'user-blocking' | 'user-visible' | 'background';
  }): Promise<T>;
  wait(signal?: AbortSignal): Promise<void>;
}

declare global {
  interface Window {
    scheduler?: Scheduler;
  }
}

export {};