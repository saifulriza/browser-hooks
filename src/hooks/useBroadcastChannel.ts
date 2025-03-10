export interface BroadcastChannelState {
  isSupported: boolean;
  channelName: string;
  isConnected: boolean;
}

export function useBroadcastChannel(channelName: string) {
  let channel: BroadcastChannel | null = null;
  let state: BroadcastChannelState = {
    isSupported: 'BroadcastChannel' in window,
    channelName,
    isConnected: false
  };

  const listeners = new Set<(state: BroadcastChannelState) => void>();
  const messageListeners = new Set<(message: any) => void>();

  const updateState = (newState: Partial<BroadcastChannelState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const connect = () => {
    if (!state.isSupported) {
      throw new Error('BroadcastChannel API is not supported');
    }

    if (!channel) {
      try {
        channel = new BroadcastChannel(channelName);
        channel.onmessage = (event) => {
          if (event.data !== undefined && event.data !== null) {
            messageListeners.forEach(listener => listener(event.data));
          }
        };
        updateState({ isConnected: true });
      } catch (error) {
        console.error('Error creating BroadcastChannel:', error);
        updateState({ isConnected: false });
      }
    }
  };

  const disconnect = () => {
    if (channel) {
      channel.close();
      channel = null;
      updateState({ isConnected: false });
    }
  };

  const postMessage = (message: any) => {
    if (!channel) {
      connect(); // Try to reconnect if channel is null
    }
    
    if (!channel || !state.isConnected) {
      throw new Error('Channel is not connected');
    }

    try {
      channel.postMessage(message);
      return true;
    } catch (error) {
      console.error('Error posting message:', error);
      return false;
    }
  };

  // Connect by default
  if (state.isSupported) {
    connect();
  }

  return {
    get state() { return state; },
    connect,
    disconnect,
    postMessage,
    subscribe(callback: (state: BroadcastChannelState) => void) {
      listeners.add(callback);
      callback(state);
      return () => {
        listeners.delete(callback);
      };
    },
    onMessage(callback: (message: any) => void) {
      messageListeners.add(callback);
      if (!state.isConnected) {
        connect(); // Ensure channel is connected when adding message listener
      }
      return () => {
        messageListeners.delete(callback);
        if (messageListeners.size === 0) {
          disconnect();
        }
      };
    }
  };
}