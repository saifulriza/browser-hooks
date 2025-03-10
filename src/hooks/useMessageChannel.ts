export interface MessageChannelState {
  isSupported: boolean;
  isConnected: boolean;
  port1: MessagePort | null;
  port2: MessagePort | null;
}

export interface MessageChannelOptions {
  onMessage?: (event: MessageEvent) => void;
  onMessageError?: (event: MessageEvent) => void;
}

export function useMessageChannel(options: MessageChannelOptions = {}) {
  let state: MessageChannelState = {
    isSupported: typeof MessageChannel !== 'undefined',
    isConnected: false,
    port1: null,
    port2: null
  };

  const listeners = new Set<(state: MessageChannelState) => void>();

  const updateState = (newState: Partial<MessageChannelState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const createChannel = () => {
    if (!state.isSupported) {
      throw new Error('Channel Messaging API is not supported');
    }

    try {
      const channel = new MessageChannel();
      
      if (options.onMessage) {
        channel.port1.onmessage = options.onMessage;
      }
      
      if (options.onMessageError) {
        channel.port1.onmessageerror = options.onMessageError;
      }

      updateState({
        port1: channel.port1,
        port2: channel.port2,
        isConnected: true
      });

      return channel;
    } catch (error) {
      console.error(`Failed to create MessageChannel: ${error}`);
      return null;
    }
  };

  const closeChannel = () => {
    if (state.port1) {
      state.port1.close();
    }
    if (state.port2) {
      state.port2.close();
    }
    
    updateState({
      isConnected: false,
      port1: null,
      port2: null
    });
  };

  const postMessage = (message: any, transfer: Transferable[] = []) => {
    if (!state.port1 || !state.isConnected) {
      throw new Error('Channel is not connected');
    }

    try {
      state.port1.postMessage(message, transfer);
      return true;
    } catch (error) {
      console.error(`Failed to post message: ${error}`);
      return false;
    }
  };

  return {
    get state() { return state; },
    createChannel,
    closeChannel,
    postMessage,
    subscribe(callback: (state: MessageChannelState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}