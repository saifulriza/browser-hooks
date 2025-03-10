interface RTCState {
  isConnected: boolean;
  isClosed: boolean;
  error: Error | null;
}

interface RTCConfig extends RTCConfiguration {
  polite?: boolean;
}

export function useWebRTC(config: RTCConfig = {}) {
  const isSupported = 'RTCPeerConnection' in window;
  let peerConnection: RTCPeerConnection | null = null;
  let dataChannel: RTCDataChannel | null = null;
  
  let state: RTCState = {
    isConnected: false,
    isClosed: false,
    error: null
  };

  const listeners = new Set<(state: RTCState) => void>();

  const updateState = (newState: Partial<RTCState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const createPeerConnection = () => {
    if (!isSupported) return null;
    
    try {
      peerConnection = new RTCPeerConnection(config);
      
      peerConnection.oniceconnectionstatechange = () => {
        updateState({
          isConnected: peerConnection?.iceConnectionState === 'connected',
          isClosed: peerConnection?.iceConnectionState === 'closed'
        });
      };

      peerConnection.onerror = (error: Event) => {
        updateState({ error: new Error('PeerConnection error') });
      };

      return peerConnection;
    } catch (error) {
      updateState({ error: error as Error });
      return null;
    }
  };

  const createOffer = async () => {
    if (!peerConnection) return null;

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      updateState({ error: error as Error });
      return null;
    }
  };

  const createAnswer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnection) return null;

    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      updateState({ error: error as Error });
      return null;
    }
  };

  const addIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnection) return false;

    try {
      await peerConnection.addIceCandidate(candidate);
      return true;
    } catch (error) {
      updateState({ error: error as Error });
      return false;
    }
  };

  const createDataChannel = (label: string, options?: RTCDataChannelInit) => {
    if (!peerConnection) return null;

    try {
      dataChannel = peerConnection.createDataChannel(label, options);
      return dataChannel;
    } catch (error) {
      updateState({ error: error as Error });
      return null;
    }
  };

  const close = () => {
    if (dataChannel) {
      dataChannel.close();
      dataChannel = null;
    }
    
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    
    updateState({
      isConnected: false,
      isClosed: true,
      error: null
    });
  };

  return {
    isSupported,
    get state() { return state; },
    createPeerConnection,
    createOffer,
    createAnswer,
    addIceCandidate,
    createDataChannel,
    close,
    subscribe(callback: (state: RTCState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}