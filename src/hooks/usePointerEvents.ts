export interface PointerEventsState {
  isSupported: boolean;
  pointers: Map<number, PointerEvent>;
  primaryPointer: PointerEvent | null;
  error: Error | null;
}

export interface PointerEventsOptions {
  target?: EventTarget;
  capture?: boolean;
  passive?: boolean;
}

export function usePointerEvents(options: PointerEventsOptions = {}) {
  let state: PointerEventsState = {
    isSupported: typeof window !== 'undefined' && 'PointerEvent' in window,
    pointers: new Map(),
    primaryPointer: null,
    error: null
  };

  const listeners = new Set<(state: PointerEventsState) => void>();
  const target = options.target || (typeof window !== 'undefined' ? window : null);
  const eventOptions = {
    capture: options.capture ?? false,
    passive: options.passive ?? true
  };

  const updateState = (newState: Partial<PointerEventsState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Pointer Events API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const handlePointerDown = (event: PointerEvent) => {
    try {
      clearError();
      state.pointers.set(event.pointerId, event);
      if (event.isPrimary) {
        updateState({ 
          pointers: new Map(state.pointers),
          primaryPointer: event 
        });
      } else {
        updateState({ pointers: new Map(state.pointers) });
      }
    } catch (error) {
      setError(error as Error);
    }
  };

  const handlePointerMove = (event: PointerEvent) => {
    try {
      clearError();
      state.pointers.set(event.pointerId, event);
      if (event.isPrimary) {
        updateState({ 
          pointers: new Map(state.pointers),
          primaryPointer: event 
        });
      } else {
        updateState({ pointers: new Map(state.pointers) });
      }
    } catch (error) {
      setError(error as Error);
    }
  };

  const handlePointerUp = (event: PointerEvent) => {
    try {
      clearError();
      state.pointers.delete(event.pointerId);
      if (event.isPrimary) {
        updateState({ 
          pointers: new Map(state.pointers),
          primaryPointer: null
        });
      } else {
        updateState({ pointers: new Map(state.pointers) });
      }
    } catch (error) {
      setError(error as Error);
    }
  };

  const handlePointerCancel = handlePointerUp;

  const handlePointerLeave = (event: PointerEvent) => {
    if (event.relatedTarget === null) {
      handlePointerUp(event);
    }
  };

  // Initialize event listeners
  if (target && state.isSupported) {
    target.addEventListener('pointerdown', handlePointerDown, eventOptions);
    target.addEventListener('pointermove', handlePointerMove, eventOptions);
    target.addEventListener('pointerup', handlePointerUp, eventOptions);
    target.addEventListener('pointercancel', handlePointerCancel, eventOptions);
    target.addEventListener('pointerleave', handlePointerLeave, eventOptions);
  }

  const getPointerById = (pointerId: number): PointerEvent | undefined => {
    return state.pointers.get(pointerId);
  };

  const getAllPointers = (): PointerEvent[] => {
    return Array.from(state.pointers.values());
  };

  const getPrimaryPointer = (): PointerEvent | null => {
    return state.primaryPointer;
  };

  const getPointerCount = (): number => {
    return state.pointers.size;
  };

  // Cleanup function
  const cleanup = () => {
    if (target) {
      target.removeEventListener('pointerdown', handlePointerDown, eventOptions);
      target.removeEventListener('pointermove', handlePointerMove, eventOptions);
      target.removeEventListener('pointerup', handlePointerUp, eventOptions);
      target.removeEventListener('pointercancel', handlePointerCancel, eventOptions);
      target.removeEventListener('pointerleave', handlePointerLeave, eventOptions);
    }
    state.pointers.clear();
    updateState({
      pointers: new Map(),
      primaryPointer: null
    });
  };

  return {
    get state() { return state; },
    getPointerById,
    getAllPointers,
    getPrimaryPointer,
    getPointerCount,
    cleanup,
    subscribe(callback: (state: PointerEventsState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}