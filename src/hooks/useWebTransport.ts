export interface WebTransportState {
  isSupported: boolean;
  isConnected: boolean;
  error: Error | null;
  stats: {
    bytesReceived: number;
    bytesSent: number;
  };
}

export interface WebTransportOptions {
  allowPooling?: boolean;
  requireUnreliable?: boolean;
  serverCertificateHashes?: WebTransportHash[];
}

export interface WebTransportHash {
  algorithm: string;
  value: BufferSource;
}

export function useWebTransport() {
  let state: WebTransportState = {
    isSupported: typeof window !== 'undefined' && 'WebTransport' in window,
    isConnected: false,
    error: null,
    stats: {
      bytesReceived: 0,
      bytesSent: 0
    }
  };

  const listeners = new Set<(state: WebTransportState) => void>();
  let transport: any | null = null; // WebTransport type
  let streams = new Map<string, ReadableStream | WritableStream>();

  const updateState = (newState: Partial<WebTransportState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Web Transport API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const connect = async (url: string, options: WebTransportOptions = {}) => {
    if (!state.isSupported) {
      throw new Error('Web Transport API is not supported in this browser');
    }

    try {
      clearError();
      // @ts-ignore - WebTransport might not be recognized by TypeScript
      transport = new WebTransport(url, options);

      await transport.ready;
      updateState({ isConnected: true });

      // Handle connection closed
      transport.closed.then(() => {
        updateState({ isConnected: false });
        transport = null;
      }).catch((error: Error) => {
        setError(error);
        transport = null;
      });

      return transport;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const disconnect = async () => {
    if (!transport) return;

    try {
      await transport.close();
      transport = null;
      updateState({ isConnected: false });
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const createBidirectionalStream = async () => {
    if (!transport) {
      throw new Error('Transport not connected');
    }

    try {
      const stream = await transport.createBidirectionalStream();
      const id = `bidir-${Date.now()}-${Math.random()}`;
      streams.set(id, stream);
      return { id, stream };
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const createUnidirectionalStream = async () => {
    if (!transport) {
      throw new Error('Transport not connected');
    }

    try {
      const stream = await transport.createUnidirectionalStream();
      const id = `unidir-${Date.now()}-${Math.random()}`;
      streams.set(id, stream);
      return { id, stream };
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const receiveUnidirectionalStream = async () => {
    if (!transport) {
      throw new Error('Transport not connected');
    }

    try {
      const reader = transport.incomingUnidirectionalStreams.getReader();
      const { value: stream } = await reader.read();
      const id = `incoming-${Date.now()}-${Math.random()}`;
      streams.set(id, stream);
      return { id, stream };
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const closeStream = async (streamId: string) => {
    const stream = streams.get(streamId);
    if (!stream) return;

    try {
      if (stream instanceof WritableStream) {
        await stream.close();
      }
      streams.delete(streamId);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const updateStats = async () => {
    if (!transport) return;

    try {
      const stats = await transport.stats();
      updateState({
        stats: {
          bytesReceived: stats.bytesReceived,
          bytesSent: stats.bytesSent
        }
      });
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  return {
    get state() { return state; },
    connect,
    disconnect,
    createBidirectionalStream,
    createUnidirectionalStream,
    receiveUnidirectionalStream,
    closeStream,
    updateStats,
    subscribe(callback: (state: WebTransportState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}