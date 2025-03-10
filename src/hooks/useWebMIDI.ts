export interface WebMIDIState {
  isSupported: boolean;
  access: MIDIAccess | null;
  inputs: Map<string, MIDIInput> | null;
  outputs: Map<string, MIDIOutput> | null;
  error: Error | null;
  isConnecting: boolean;
}

export interface MIDIConnectionOptions {
  sysex?: boolean;
  software?: boolean;
}

export interface MIDIMessageEvent {
  data: Uint8Array;
  receivedTime: number;
  currentTarget: MIDIInput;
  target: MIDIInput;
  srcElement: MIDIInput;
  port: MIDIInput;
}

export function useWebMIDI() {
  let state: WebMIDIState = {
    isSupported: typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator,
    access: null,
    inputs: null,
    outputs: null,
    error: null,
    isConnecting: false
  };

  const listeners = new Set<(state: WebMIDIState) => void>();
  const messageListeners = new Map<string, Set<(event: MIDIMessageEvent) => void>>();

  const updateState = (newState: Partial<WebMIDIState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error, isConnecting: false });
    console.error('Web MIDI API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  /**
   * Request access to MIDI devices
   */
  const requestAccess = async (options: MIDIConnectionOptions = {}): Promise<MIDIAccess> => {
    if (!state.isSupported) {
      throw new Error('Web MIDI API is not supported in this browser');
    }

    try {
      updateState({ isConnecting: true });
      clearError();
      
      const access = await navigator.requestMIDIAccess(options);
      
      const handleStateChange = () => {
        updateState({
          inputs: access.inputs,
          outputs: access.outputs
        });
      };

      // Listen for connection changes
      access.addEventListener('statechange', (event) => {
        handleStateChange();
      });
      
      updateState({
        access,
        inputs: access.inputs,
        outputs: access.outputs,
        isConnecting: false
      });
      
      return access;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  /**
   * Get all available MIDI inputs
   */
  const getInputs = (): MIDIInput[] => {
    if (!state.access || !state.inputs) {
      return [];
    }
    
    return Array.from(state.inputs.values());
  };

  /**
   * Get all available MIDI outputs
   */
  const getOutputs = (): MIDIOutput[] => {
    if (!state.access || !state.outputs) {
      return [];
    }
    
    return Array.from(state.outputs.values());
  };

  /**
   * Get an input by ID
   */
  const getInputById = (id: string): MIDIInput | undefined => {
    if (!state.inputs) {
      return undefined;
    }
    
    return state.inputs.get(id);
  };

  /**
   * Get an output by ID
   */
  const getOutputById = (id: string): MIDIOutput | undefined => {
    if (!state.outputs) {
      return undefined;
    }
    
    return state.outputs.get(id);
  };

  /**
   * Add a message listener to a specific input
   */
  const addMessageListener = (
    input: MIDIInput, 
    callback: (event: MIDIMessageEvent) => void
  ): (() => void) => {
    if (!messageListeners.has(input.id)) {
      messageListeners.set(input.id, new Set());
    }
    
    const inputListeners = messageListeners.get(input.id)!;
    inputListeners.add(callback);
    
    const handleMessage = ((event: Event) => {
      const target = event.target as MIDIInput;
      if (target && 'data' in event) {
        const midiEvent: MIDIMessageEvent = {
          data: (event as any).data,
          receivedTime: event.timeStamp,
          currentTarget: target,
          target: target,
          srcElement: target,
          port: target
        };
        inputListeners.forEach(listener => listener(midiEvent));
      }
    }) as EventListener;

    input.addEventListener('midimessage', handleMessage);
    
    return () => {
      input.removeEventListener('midimessage', handleMessage);
      inputListeners.delete(callback);
      if (inputListeners.size === 0) {
        messageListeners.delete(input.id);
      }
    };
  };

  /**
   * Send a MIDI message to an output
   */
  const sendMessage = (output: MIDIOutput, message: number[], timestamp?: number): void => {
    try {
      output.send(message, timestamp);
    } catch (error) {
      console.error('Error sending MIDI message:', error);
      throw error;
    }
  };

  /**
   * Send a note on message
   */
  const sendNoteOn = (
    output: MIDIOutput, 
    note: number, 
    velocity = 127, 
    channel = 0, 
    timestamp?: number
  ): void => {
    const status = 0x90 + (channel & 0x0F);
    sendMessage(output, [status, note & 0x7F, velocity & 0x7F], timestamp);
  };

  /**
   * Send a note off message
   */
  const sendNoteOff = (
    output: MIDIOutput, 
    note: number, 
    velocity = 0, 
    channel = 0, 
    timestamp?: number
  ): void => {
    const status = 0x80 + (channel & 0x0F);
    sendMessage(output, [status, note & 0x7F, velocity & 0x7F], timestamp);
  };

  /**
   * Send a control change message
   */
  const sendControlChange = (
    output: MIDIOutput, 
    controller: number, 
    value: number, 
    channel = 0, 
    timestamp?: number
  ): void => {
    const status = 0xB0 + (channel & 0x0F);
    sendMessage(output, [status, controller & 0x7F, value & 0x7F], timestamp);
  };

  /**
   * Send a program change message
   */
  const sendProgramChange = (
    output: MIDIOutput, 
    program: number, 
    channel = 0, 
    timestamp?: number
  ): void => {
    const status = 0xC0 + (channel & 0x0F);
    sendMessage(output, [status, program & 0x7F], timestamp);
  };

  /**
   * Parse a MIDI message
   */
  const parseMIDIMessage = (data: Uint8Array): { 
    messageType: string; 
    channel?: number; 
    note?: number;
    velocity?: number;
    controller?: number;
    value?: number;
    program?: number;
  } => {
    const status = data[0];
    const messageType = status & 0xF0;
    const channel = status & 0x0F;

    switch (messageType) {
      case 0x80:
        return {
          messageType: 'noteOff',
          channel,
          note: data[1],
          velocity: data[2]
        };
      case 0x90:
        return {
          messageType: data[2] === 0 ? 'noteOff' : 'noteOn',
          channel,
          note: data[1],
          velocity: data[2]
        };
      case 0xB0:
        return {
          messageType: 'controlChange',
          channel,
          controller: data[1],
          value: data[2]
        };
      case 0xC0:
        return {
          messageType: 'programChange',
          channel,
          program: data[1]
        };
      default:
        return {
          messageType: 'unknown'
        };
    }
  };

  return {
    get state() { return state; },
    requestAccess,
    getInputs,
    getOutputs,
    getInputById,
    getOutputById,
    addMessageListener,
    sendMessage,
    sendNoteOn,
    sendNoteOff,
    sendControlChange,
    sendProgramChange,
    parseMIDIMessage,
    subscribe(callback: (state: WebMIDIState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}