import type { Scheduler } from '../types/scheduler';

export interface SchedulerState {
  isSupported: boolean;
  activeTaskCount: number;
  priorityLevels: string[];
}

interface WindowWithScheduler extends Window {
  scheduler?: Scheduler;
}

export interface SchedulerTask {
  id: string;
  priority: TaskPriority;
  signal?: AbortSignal;
  delay?: number;
}

export type TaskPriority = 'user-blocking' | 'user-visible' | 'background';

export interface SchedulerOptions {
  onTaskStart?: (taskId: string) => void;
  onTaskComplete?: (taskId: string) => void;
  onTaskError?: (taskId: string, error: Error) => void;
}

export function useScheduler() {
  let state: SchedulerState = {
    isSupported: typeof window !== 'undefined' && 'scheduler' in window,
    activeTaskCount: 0,
    priorityLevels: ['user-blocking', 'user-visible', 'background']
  };

  const getScheduler = (): Scheduler | undefined => {
    return (window as WindowWithScheduler).scheduler;
  };

  const listeners = new Set<(state: SchedulerState) => void>();
  const taskControllers = new Map<string, AbortController>();

  const updateState = (newState: Partial<SchedulerState>) => {
    Object.assign(state, newState);
    listeners.forEach(listener => listener(state));
  };

  const wait = async (signal?: AbortSignal): Promise<void> => {
    // If native scheduler is available, use it
    const scheduler = getScheduler();
    if (scheduler?.wait) {
      return scheduler.wait(signal);
    }

    // Fallback implementation using requestIdleCallback
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }

      const cleanup = signal?.addEventListener('abort', () => {
        cancelIdleCallback(handle);
        reject(new DOMException('Aborted', 'AbortError'));
      });

      const handle = requestIdleCallback(() => {
        if (cleanup) signal?.removeEventListener('abort', cleanup);
        resolve();
      });
    });
  };

  const postTask = async <T>(
    callback: () => Promise<T> | T,
    task: SchedulerTask,
    options: SchedulerOptions = {}
  ): Promise<T> => {
    // Check if native scheduler is available
    const scheduler = getScheduler();
    
    const controller = new AbortController();
    taskControllers.set(task.id, controller);

    const signal = task.signal 
      ? AbortSignal.any([task.signal, controller.signal])
      : controller.signal;

    try {
      // Wait for scheduler slot using either native or fallback implementation
      await wait(signal);
      
      updateState({ activeTaskCount: state.activeTaskCount + 1 });
      options.onTaskStart?.(task.id);

      // Handle delay with abort signal support
      if (task.delay) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, task.delay);
          signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new DOMException('Aborted', 'AbortError'));
          }, { once: true });
        });
      }

      // If signal is aborted after delay, throw abort error
      if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      // If native scheduler available, use it, otherwise run directly
      const result = scheduler?.postTask 
        ? await scheduler.postTask(
            () => callback(),
            { priority: task.priority, signal }
          )
        : await callback();

      options.onTaskComplete?.(task.id);
      return result;
    } catch (err) {
      const error = err as Error;
      if (error.name !== 'AbortError') {
        options.onTaskError?.(task.id, error);
      }
      throw error;
    } finally {
      taskControllers.delete(task.id);
      updateState({ activeTaskCount: Math.max(0, state.activeTaskCount - 1) });
    }
  };

  const cancelTask = (taskId: string) => {
    const controller = taskControllers.get(taskId);
    if (controller) {
      controller.abort();
      taskControllers.delete(taskId);
      updateState({ activeTaskCount: Math.max(0, state.activeTaskCount - 1) });
    }
  };

  const cancelAllTasks = () => {
    taskControllers.forEach(controller => controller.abort());
    taskControllers.clear();
    updateState({ activeTaskCount: 0 });
  };

  const getPriorityLevels = () => {
    return state.priorityLevels;
  };

  const getActiveTaskCount = () => {
    return state.activeTaskCount;
  };

  return {
    get state() { return state; },
    postTask,
    cancelTask,
    cancelAllTasks,
    getPriorityLevels,
    getActiveTaskCount,
    subscribe(callback: (state: SchedulerState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}