export interface RealtimeState {
  isSupported: boolean;
  isConnected: boolean;
  latency: number;
  dataChannels: Map<string, RTCDataChannel>;
}

export interface RealtimeOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (channel: string, data: any) => void;
  onError?: (error: Error) => void;
  configuration?: RTCConfiguration;
}

export interface RealtimeChannelOptions extends RTCDataChannelInit {
  onMessage?: (data: any) => void;
}

export function useRealtime() {
  const state: RealtimeState = {
    isSupported: typeof RTCPeerConnection !== 'undefined',
    isConnected: false,
    latency: 0,
    dataChannels: new Map()
  };

  let peerConnection: RTCPeerConnection | null = null;
  const listeners = new Set<(state: RealtimeState) => void>();

  const updateState = (newState: Partial<RealtimeState>) => {
    Object.assign(state, newState);
    listeners.forEach(listener => listener(state));
  };

  const createConnection = async (options: RealtimeOptions = {}) => {
    if (!state.isSupported) {
      throw new Error('WebRTC API is not supported');
    }

    try {
      // Create the peer connection
      peerConnection = new RTCPeerConnection(options.configuration);

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        const isConnected = peerConnection?.connectionState === 'connected';
        updateState({ isConnected });
        
        if (isConnected) {
          options.onConnect?.();
        } else if (peerConnection?.connectionState === 'disconnected') {
          options.onDisconnect?.();
        }
      };

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        if (peerConnection?.iceConnectionState === 'connected') {
          options.onConnect?.();
        } else if (peerConnection?.iceConnectionState === 'disconnected') {
          options.onDisconnect?.();
        }
      };

      // Handle errors
      peerConnection.onerror = (error: Event) => {
        options.onError?.(new Error('PeerConnection error: ' + error.type));
      };

      // Create a local test data channel for loopback testing
      const testChannel = peerConnection.createDataChannel('test');
      testChannel.onopen = () => {
        testChannel.send('Test connection');
      };
      testChannel.onmessage = (event) => {
        console.log('Test channel received:', event.data);
      };

      return peerConnection;

    } catch (error) {
      throw new Error(`Failed to create RTCPeerConnection: ${error}`);
    }
  };

  const createDataChannel = (
    channelId: string,
    { onMessage, ...channelOptions }: RealtimeChannelOptions = {}
  ) => {
    if (!peerConnection) {
      throw new Error('No active peer connection');
    }

    try {
      const channel = peerConnection.createDataChannel(channelId, channelOptions);
      
      channel.onopen = () => {
        state.dataChannels.set(channelId, channel);
        updateState({ dataChannels: new Map(state.dataChannels) });
      };

      channel.onclose = () => {
        state.dataChannels.delete(channelId);
        updateState({ dataChannels: new Map(state.dataChannels) });
      };

      channel.onmessage = (event) => {
        if (event.data === 'ping') {
          channel.send('pong');
        } else {
          try {
            const data = JSON.parse(event.data);
            onMessage?.(data);
          } catch {
            onMessage?.(event.data);
          }
        }
      };

      // Set up local connection for testing
      setupLocalConnection(channel);

      return channel;
    } catch (error) {
      throw new Error(`Failed to create data channel: ${error}`);
    }
  };

  const setupLocalConnection = async (channel: RTCDataChannel) => {
    try {
      // Create a local connection for testing
      const localConnection = new RTCPeerConnection();
      
      // Handle the data channel when it arrives
      localConnection.ondatachannel = (event) => {
        const receiveChannel = event.channel;
        receiveChannel.onmessage = (e) => {
          // Echo back any messages
          receiveChannel.send(`Echo: ${e.data}`);
        };
      };

      // Connect the peer connections
      const offer = await peerConnection!.createOffer();
      await peerConnection!.setLocalDescription(offer);
      await localConnection.setRemoteDescription(offer);
      
      const answer = await localConnection.createAnswer();
      await localConnection.setLocalDescription(answer);
      await peerConnection!.setRemoteDescription(answer);

      // Handle ICE candidates
      peerConnection!.onicecandidate = (e) => {
        if (e.candidate) {
          localConnection.addIceCandidate(e.candidate);
        }
      };

      localConnection.onicecandidate = (e) => {
        if (e.candidate) {
          peerConnection!.addIceCandidate(e.candidate);
        }
      };

    } catch (error) {
      console.error('Error setting up local connection:', error);
    }
  };

  const sendMessage = (channelId: string, data: any) => {
    const channel = state.dataChannels.get(channelId);
    if (!channel) {
      throw new Error(`Data channel ${channelId} not found`);
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      channel.send(message);
    } catch (error) {
      throw new Error(`Failed to send message: ${error}`);
    }
  };

  const measureLatency = async (channelId: string): Promise<number> => {
    const channel = state.dataChannels.get(channelId);
    if (!channel) {
      throw new Error(`Data channel ${channelId} not found`);
    }

    const startTime = performance.now();
    channel.send('ping');

    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data === 'pong') {
          channel.removeEventListener('message', handler);
          const latency = performance.now() - startTime;
          updateState({ latency });
          resolve(latency);
        }
      };

      channel.addEventListener('message', handler);
      // Timeout after 5 seconds
      setTimeout(() => {
        channel.removeEventListener('message', handler);
        resolve(-1);
      }, 5000);
    });
  };

  const closeConnection = () => {
    state.dataChannels.forEach(channel => channel.close());
    peerConnection?.close();
    peerConnection = null;
    updateState({
      isConnected: false,
      dataChannels: new Map(),
      latency: 0
    });
  };

  return {
    get state() { return state; },
    createConnection,
    createDataChannel,
    sendMessage,
    measureLatency,
    closeConnection,
    subscribe(callback: (state: RealtimeState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}