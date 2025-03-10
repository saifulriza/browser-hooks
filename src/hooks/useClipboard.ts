export interface ClipboardState {
  isSupported: boolean;
  hasPermission: boolean;
  isSecureContext: boolean;
}

export interface ClipboardItem {
  text?: string;
  html?: string;
  image?: Blob;
}

export function useClipboard() {
  let state: ClipboardState = {
    isSupported: typeof navigator.clipboard !== 'undefined',
    hasPermission: false,
    isSecureContext: window.isSecureContext
  };

  const listeners = new Set<(state: ClipboardState) => void>();

  const updateState = (newState: Partial<ClipboardState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const checkPermission = async () => {
    if (!state.isSupported) return false;

    try {
      const permission = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
      const hasPermission = permission.state === 'granted';
      updateState({ hasPermission });
      return hasPermission;
    } catch (error) {
      console.error(`Failed to check clipboard permission: ${error}`);
      return false;
    }
  };

  const writeText = async (text: string): Promise<boolean> => {
    if (!state.isSupported) {
      throw new Error('Clipboard API is not supported');
    }

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error(`Failed to write to clipboard: ${error}`);
      return false;
    }
  };

  const readText = async (): Promise<string | null> => {
    if (!state.isSupported) {
      throw new Error('Clipboard API is not supported');
    }

    if (!state.hasPermission) {
      const permitted = await checkPermission();
      if (!permitted) {
        throw new Error('Clipboard read permission not granted');
      }
    }

    try {
      const text = await navigator.clipboard.readText();
      return text;
    } catch (error) {
      console.error(`Failed to read from clipboard: ${error}`);
      return null;
    }
  };

  const writeItems = async (items: ClipboardItem[]): Promise<boolean> => {
    if (!state.isSupported || !('ClipboardItem' in window)) {
      throw new Error('Advanced Clipboard API is not supported');
    }

    try {
      const clipboardItems = items.map(item => {
        const types: Record<string, Blob> = {};
        
        if (item.text) {
          types['text/plain'] = new Blob([item.text], { type: 'text/plain' });
        }
        if (item.html) {
          types['text/html'] = new Blob([item.html], { type: 'text/html' });
        }
        if (item.image) {
          types[item.image.type] = item.image;
        }
        
        return new (window as any).ClipboardItem(types);
      });

      await navigator.clipboard.write(clipboardItems);
      return true;
    } catch (error) {
      console.error(`Failed to write items to clipboard: ${error}`);
      return false;
    }
  };

  // Initialize permission check
  checkPermission();

  return {
    get state() { return state; },
    writeText,
    readText,
    writeItems,
    checkPermission,
    subscribe(callback: (state: ClipboardState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}