export interface PopoverState {
  isSupported: boolean;
  activePopover: HTMLElement | null;
}

export interface PopoverOptions {
  mode?: 'manual' | 'auto';
  onBeforeToggle?: (event: Event) => void;
  onToggle?: (event: Event) => void;
}

export function usePopover() {
  const state: PopoverState = {
    isSupported: 'HTMLElement' in window && 'popover' in HTMLElement.prototype,
    activePopover: null
  };

  const listeners = new Set<(state: PopoverState) => void>();

  const updateState = (newState: Partial<PopoverState>) => {
    Object.assign(state, newState);
    listeners.forEach(listener => listener(state));
  };

  const showPopover = (element: HTMLElement) => {
    if (!state.isSupported) {
      throw new Error('Popover API is not supported');
    }

    if (element.popover !== 'manual' && element.popover !== 'auto') {
      element.popover = 'auto';
    }

    try {
      element.showPopover();
      updateState({ activePopover: element });
    } catch (error) {
      throw new Error(`Failed to show popover: ${error}`);
    }
  };

  const hidePopover = (element: HTMLElement) => {
    if (!state.isSupported) {
      throw new Error('Popover API is not supported');
    }

    try {
      element.hidePopover();
      updateState({ activePopover: null });
    } catch (error) {
      throw new Error(`Failed to hide popover: ${error}`);
    }
  };

  const togglePopover = (element: HTMLElement) => {
    if (state.activePopover === element) {
      hidePopover(element);
    } else {
      showPopover(element);
    }
  };

  const setupPopover = (element: HTMLElement, options: PopoverOptions = {}) => {
    if (!state.isSupported) {
      throw new Error('Popover API is not supported');
    }

    element.popover = options.mode || 'auto';

    if (options.onBeforeToggle) {
      element.addEventListener('beforetoggle', options.onBeforeToggle);
    }

    if (options.onToggle) {
      element.addEventListener('toggle', options.onToggle);
    }

    return () => {
      if (options.onBeforeToggle) {
        element.removeEventListener('beforetoggle', options.onBeforeToggle);
      }
      if (options.onToggle) {
        element.removeEventListener('toggle', options.onToggle);
      }
    };
  };

  return {
    get state() { return state; },
    showPopover,
    hidePopover,
    togglePopover,
    setupPopover,
    subscribe(callback: (state: PopoverState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}