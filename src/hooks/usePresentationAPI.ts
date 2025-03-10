export interface PresentationState {
  isSupported: boolean;
  availability: boolean;
  connection: PresentationConnection | null;
  displays: string[];
}

export interface PresentationOptions {
  onAvailabilityChange?: (available: boolean) => void;
  onConnectionAvailable?: (connection: PresentationConnection) => void;
  onConnectionClose?: () => void;
  onMessage?: (message: string | ArrayBuffer | Blob) => void;
}

export function usePresentationAPI() {
  const state: PresentationState = {
    isSupported: typeof window !== 'undefined' && 'PresentationRequest' in window,
    availability: false,
    connection: null,
    displays: []
  };

  const listeners = new Set<(state: PresentationState) => void>();

  const updateState = (newState: Partial<PresentationState>) => {
    Object.assign(state, newState);
    listeners.forEach(listener => listener(state));
  };

  const setupConnection = (
    connection: PresentationConnection,
    options: PresentationOptions
  ) => {
    connection.onclose = () => {
      updateState({ connection: null });
      options.onConnectionClose?.();
    };

    connection.onmessage = (event) => {
      options.onMessage?.(event.data);
    };

    updateState({ connection });
    options.onConnectionAvailable?.(connection);
  };

  const startPresentation = async (
    urls: string[],
    options: PresentationOptions = {}
  ) => {
    if (!state.isSupported) {
      throw new Error('Presentation API is not supported');
    }

    try {
      // Use window.PresentationRequest to access the constructor
      const PresentationRequestConstructor = window.PresentationRequest;
      const request = new PresentationRequestConstructor(urls);

      // Check availability
      const availability = await request.getAvailability();
      availability.onchange = () => {
        updateState({ availability: availability.value });
        options.onAvailabilityChange?.(availability.value);
      };
      updateState({ availability: availability.value });

      // Start presentation
      const connection = await request.start();
      setupConnection(connection, options);
      return connection;
    } catch (error) {
      throw new Error(`Failed to start presentation: ${error}`);
    }
  };

  const reconnect = async (
    presentationId: string,
    urls: string[],
    options: PresentationOptions = {}
  ) => {
    if (!state.isSupported) {
      throw new Error('Presentation API is not supported');
    }

    try {
      const PresentationRequestConstructor = window.PresentationRequest;
      const request = new PresentationRequestConstructor(urls);
      const connection = await request.reconnect(presentationId);
      setupConnection(connection, options);
      return connection;
    } catch (error) {
      throw new Error(`Failed to reconnect presentation: ${error}`);
    }
  };

  const sendMessage = (message: string | ArrayBuffer | Blob) => {
    if (!state.connection) {
      throw new Error('No active presentation connection');
    }

    try {
      state.connection.send(message);
    } catch (error) {
      throw new Error(`Failed to send message: ${error}`);
    }
  };

  const closeConnection = () => {
    if (state.connection) {
      state.connection.close();
    }
  };

  return {
    get state() { return state; },
    startPresentation,
    reconnect,
    sendMessage,
    closeConnection,
    subscribe(callback: (state: PresentationState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}