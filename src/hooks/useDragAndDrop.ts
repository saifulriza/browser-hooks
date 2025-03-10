export interface DragAndDropState {
  isSupported: boolean;
  isDragging: boolean;
  dragData: DragData | null;
  error: Error | null;
}

export interface DragData {
  types: string[];
  items: DataTransferItem[];
  files: File[];
}

export interface DragOptions {
  effectAllowed?: DataTransfer['effectAllowed'];
  dropEffect?: DataTransfer['dropEffect'];
  onDragStart?: (event: DragEvent) => void;
  onDragEnd?: (event: DragEvent) => void;
  onDragOver?: (event: DragEvent) => void;
  onDragLeave?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent) => void;
}

export function useDragAndDrop() {
  let state: DragAndDropState = {
    isSupported: typeof window !== 'undefined' && 'DataTransfer' in window,
    isDragging: false,
    dragData: null,
    error: null
  };

  const listeners = new Set<(state: DragAndDropState) => void>();

  const updateState = (newState: Partial<DragAndDropState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Drag and Drop API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const handleDragStart = (event: DragEvent, options?: DragOptions) => {
    try {
      clearError();
      if (!event.dataTransfer) return;

      if (options?.effectAllowed) {
        event.dataTransfer.effectAllowed = options.effectAllowed;
      }

      updateState({ 
        isDragging: true,
        dragData: {
          types: Array.from(event.dataTransfer.types),
          items: Array.from(event.dataTransfer.items),
          files: Array.from(event.dataTransfer.files)
        }
      });

      options?.onDragStart?.(event);
    } catch (error) {
      setError(error as Error);
    }
  };

  const handleDragEnd = (event: DragEvent, options?: DragOptions) => {
    updateState({ 
      isDragging: false,
      dragData: null
    });
    options?.onDragEnd?.(event);
  };

  const handleDragOver = (event: DragEvent, options?: DragOptions) => {
    event.preventDefault();
    if (event.dataTransfer && options?.dropEffect) {
      event.dataTransfer.dropEffect = options.dropEffect;
    }
    options?.onDragOver?.(event);
  };

  const handleDragLeave = (event: DragEvent, options?: DragOptions) => {
    options?.onDragLeave?.(event);
  };

  const handleDrop = async (event: DragEvent, options?: DragOptions): Promise<DragData> => {
    event.preventDefault();
    
    try {
      clearError();
      if (!event.dataTransfer) {
        throw new Error('No data transfer available');
      }

      const data: DragData = {
        types: Array.from(event.dataTransfer.types),
        items: Array.from(event.dataTransfer.items),
        files: Array.from(event.dataTransfer.files)
      };

      updateState({ 
        isDragging: false,
        dragData: data
      });

      options?.onDrop?.(event);
      return data;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const enableDragSource = (element: HTMLElement, options?: DragOptions) => {
    if (!state.isSupported) {
      throw new Error('Drag and Drop API is not supported in this browser');
    }

    const dragStartHandler = (e: DragEvent) => handleDragStart(e, options);
    const dragEndHandler = (e: DragEvent) => handleDragEnd(e, options);

    element.draggable = true;
    element.addEventListener('dragstart', dragStartHandler);
    element.addEventListener('dragend', dragEndHandler);

    return () => {
      element.removeEventListener('dragstart', dragStartHandler);
      element.removeEventListener('dragend', dragEndHandler);
    };
  };

  const enableDropTarget = (element: HTMLElement, options?: DragOptions) => {
    if (!state.isSupported) {
      throw new Error('Drag and Drop API is not supported in this browser');
    }

    const dragOverHandler = (e: DragEvent) => handleDragOver(e, options);
    const dragLeaveHandler = (e: DragEvent) => handleDragLeave(e, options);
    const dropHandler = (e: DragEvent) => handleDrop(e, options);
    
    element.addEventListener('dragover', dragOverHandler);
    element.addEventListener('dragleave', dragLeaveHandler);
    element.addEventListener('drop', dropHandler);

    return () => {
      element.removeEventListener('dragover', dragOverHandler);
      element.removeEventListener('dragleave', dragLeaveHandler);
      element.removeEventListener('drop', dropHandler);
    };
  };

  const setDragData = (dataTransfer: DataTransfer, format: string, data: string) => {
    try {
      clearError();
      dataTransfer.setData(format, data);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const getDragData = (dataTransfer: DataTransfer, format: string): string => {
    try {
      clearError();
      return dataTransfer.getData(format);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  return {
    get state() { return state; },
    enableDragSource,
    enableDropTarget,
    setDragData,
    getDragData,
    subscribe(callback: (state: DragAndDropState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}