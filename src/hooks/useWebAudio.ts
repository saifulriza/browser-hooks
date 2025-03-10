export interface WebAudioState {
  isSupported: boolean;
  context: AudioContext | null;
  isRunning: boolean;
}

export interface WebAudioOptions {
  autoStart?: boolean;
  sampleRate?: number;
  latencyHint?: AudioContextLatencyCategory | number;
  onStateChange?: (state: AudioContextState) => void;
}

export interface WebAudioSynthesizer {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  filterNode: BiquadFilterNode;
  reverbNode: ConvolverNode;
}

export function useWebAudio(options: WebAudioOptions = {}) {
  const { autoStart = false, sampleRate, latencyHint } = options;

  let state: WebAudioState = {
    isSupported: typeof window !== 'undefined' && 'AudioContext' in window,
    context: null,
    isRunning: false
  };

  const listeners = new Set<(state: WebAudioState) => void>();

  const updateState = (newState: Partial<WebAudioState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const createContext = () => {
    if (!state.isSupported) {
      throw new Error('Web Audio API is not supported in this browser');
    }

    if (state.context) {
      return state.context;
    }

    try {
      const contextOptions: AudioContextOptions = {};
      if (sampleRate !== undefined) contextOptions.sampleRate = sampleRate;
      if (latencyHint !== undefined) contextOptions.latencyHint = latencyHint;

      const context = new AudioContext(contextOptions);

      // Add state change event listener
      if (options.onStateChange) {
        context.addEventListener('statechange', () => {
          options.onStateChange?.(context.state);
        });
      }

      const checkContextState = () => {
        if (!context) return;
        updateState({ 
          isRunning: context.state === ('running' as AudioContextState),
          context 
        });
      };

      updateState({ 
        context, 
        isRunning: context.state === ('running' as AudioContextState) 
      });

      if (autoStart) {
        resume();
      }

      return context;
    } catch (error) {
      console.error('Error creating AudioContext:', error);
      throw error;
    }
  };

  const resume = async () => {
    const context = state.context || createContext();
    if (context.state !== ('running' as AudioContextState)) {
      try {
        await context.resume();
        updateState({ isRunning: context.state === ('running' as AudioContextState) });
      } catch (error) {
        console.error('Error resuming AudioContext:', error);
        throw error;
      }
    }
    return context;
  };

  const suspend = async () => {
    if (!state.context) return;
    
    try {
      await state.context.suspend();
      updateState({ isRunning: state.context.state === ('running' as AudioContextState) });
    } catch (error) {
      console.error('Error suspending AudioContext:', error);
      throw error;
    }
  };

  const close = async () => {
    if (!state.context) return;
    
    try {
      await state.context.close();
      updateState({ 
        isRunning: false,
        context: null
      });
    } catch (error) {
      console.error('Error closing AudioContext:', error);
      throw error;
    }
  };

  // Helper methods for common audio operations
  const createOscillator = (type: OscillatorType = 'sine', frequency = 440) => {
    const context = state.context || createContext();
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    return oscillator;
  };

  const createGain = (gainValue = 1) => {
    const context = state.context || createContext();
    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(gainValue, context.currentTime);
    return gainNode;
  };

  const createAnalyser = (fftSize = 2048) => {
    const context = state.context || createContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = fftSize;
    return analyser;
  };

  const createMediaStreamSource = (mediaStream: MediaStream) => {
    const context = state.context || createContext();
    return context.createMediaStreamSource(mediaStream);
  };

  const createMediaElementSource = (mediaElement: HTMLMediaElement) => {
    const context = state.context || createContext();
    return context.createMediaElementSource(mediaElement);
  };

  const decodeAudioData = async (arrayBuffer: ArrayBuffer) => {
    const context = state.context || createContext();
    try {
      return await context.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error('Error decoding audio data:', error);
      throw error;
    }
  };

  // If autoStart is true, create the context right away
  if (autoStart && state.isSupported && typeof window !== 'undefined') {
    createContext();
  }

  return {
    get state() { return state; },
    createContext,
    resume,
    suspend,
    close,
    createOscillator,
    createGain,
    createAnalyser,
    createMediaStreamSource,
    createMediaElementSource,
    decodeAudioData,
    subscribe(callback: (state: WebAudioState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}

// Add type declaration for webkit prefix
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export function useWebAudioAdvanced() {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContextConstructor();

  const createSynthesizer = (): WebAudioSynthesizer => {
    // Create audio nodes
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filterNode = audioContext.createBiquadFilter();
    const reverbNode = audioContext.createConvolver();

    // Set default values
    oscillator.type = 'sine';
    gainNode.gain.value = 0;
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 1000;
    filterNode.Q.value = 1;

    // Create reverb impulse response
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * 2; // 2 seconds
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (sampleRate * 0.1));
      impulseL[i] = (Math.random() * 2 - 1) * decay;
      impulseR[i] = (Math.random() * 2 - 1) * decay;
    }
    
    reverbNode.buffer = impulse;

    // Connect nodes
    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(reverbNode);
    reverbNode.connect(audioContext.destination);

    // Start oscillator
    oscillator.start();

    return { oscillator, gainNode, filterNode, reverbNode };
  };

  const setWaveform = (synth: WebAudioSynthesizer, type: OscillatorType) => {
    synth.oscillator.type = type;
  };

  const setFilterFrequency = (synth: WebAudioSynthesizer, frequency: number) => {
    synth.filterNode.frequency.setValueAtTime(frequency, audioContext.currentTime);
  };

  const setReverbLevel = (synth: WebAudioSynthesizer, level: number) => {
    synth.reverbNode.connect(audioContext.destination);
    synth.gainNode.gain.setValueAtTime(level, audioContext.currentTime);
  };

  const playNote = (synth: WebAudioSynthesizer, note: string, octave: number) => {
    const freq = getNoteFrequency(note, octave);
    synth.oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    synth.gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
  };

  const stopNote = (synth: WebAudioSynthesizer, note: string, octave: number) => {
    synth.gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  };

  const getNoteFrequency = (note: string, octave: number): number => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseFreq = 440; // A4 frequency
    const a4Index = notes.indexOf('A') + (4 * 12);
    const noteIndex = notes.indexOf(note) + (octave * 12);
    const halfSteps = noteIndex - a4Index;
    return baseFreq * Math.pow(2, halfSteps / 12);
  };

  return {
    createSynthesizer,
    setWaveform,
    setFilterFrequency,
    setReverbLevel,
    playNote,
    stopNote
  };
}