export interface EditContextState {
  isSupported: boolean;
  isActive: boolean;
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

export interface EditContextOptions {
  initialText?: string;
  onInput?: (text: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
  onCompositionStart?: () => void;
  onCompositionEnd?: () => void;
}

export function useEditContext(options: EditContextOptions = {}) {
  let state: EditContextState = {
    isSupported: 'EditContext' in window,
    isActive: false,
    text: options.initialText || '',
    selectionStart: 0,
    selectionEnd: 0
  };

  const listeners = new Set<(state: EditContextState) => void>();

  const updateState = (newState: Partial<EditContextState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const handleTextUpdate = (event: Event) => {
    const target = event.target as HTMLElement;
    const text = target.textContent || '';
    updateState({ text });
    if (options.onInput) {
      options.onInput(text);
    }
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const start = range.startOffset;
      const end = range.endOffset;
      
      updateState({ selectionStart: start, selectionEnd: end });
      if (options.onSelectionChange) {
        const selectedText = selection.toString();
        options.onSelectionChange(start, end);
      }
    }
  };

  const handleCompositionStart = (event: CompositionEvent) => {
    if (options.onCompositionStart) {
      options.onCompositionStart();
    }
  };

  const handleCompositionEnd = (event: CompositionEvent) => {
    const target = event.target as HTMLElement;
    const text = target.textContent || '';
    updateState({ text });
    
    if (options.onCompositionEnd) {
      options.onCompositionEnd();
    }
    
    // Trigger input handler after composition ends
    if (options.onInput) {
      options.onInput(text);
    }
  };

  const initialize = (element: HTMLElement): boolean => {
    if (!state.isSupported) {
      return false;
    }

    try {
      cleanup(element);
      
      // Add more selection-related events
      element.addEventListener('input', handleTextUpdate, true);
      element.addEventListener('mouseup', handleSelectionChange, true);
      element.addEventListener('keyup', handleSelectionChange, true);
      element.addEventListener('select', handleSelectionChange, true); // Add select event
      element.addEventListener('selectionchange', handleSelectionChange, true); // Add selectionchange event
      element.addEventListener('compositionstart', handleCompositionStart, true);
      element.addEventListener('compositionend', handleCompositionEnd, true);

      // Set initial state
      updateState({ 
        isActive: true,
        text: element.textContent || ''
      });

      // Initial selection check
      handleSelectionChange();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize EditContext:', error);
      return false;
    }
  };

  const cleanup = (element: HTMLElement) => {
    if (element) {
      element.removeEventListener('input', handleTextUpdate, true);
      element.removeEventListener('mouseup', handleSelectionChange, true);
      element.removeEventListener('keyup', handleSelectionChange, true);
      element.removeEventListener('select', handleSelectionChange, true);
      element.removeEventListener('selectionchange', handleSelectionChange, true);
      element.removeEventListener('compositionstart', handleCompositionStart, true);
      element.removeEventListener('compositionend', handleCompositionEnd, true);
      updateState({ isActive: false });
    }
  };

  const setText = (text: string): boolean => {
    updateState({ text });
    return true;
  };

  const setSelection = (start: number, end: number): boolean => {
    updateState({ selectionStart: start, selectionEnd: end });
    return true;
  };

  return {
    get state() { return state; },
    setText,
    setSelection,
    initialize,
    cleanup,
    subscribe(callback: (state: EditContextState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}