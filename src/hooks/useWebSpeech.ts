export interface WebSpeechState {
  isSupported: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  error: Error | null;
  transcript: string;
  voices: SpeechSynthesisVoice[];
}

export interface SpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
}

export interface SpeechSynthesisOptions {
  text: string;
  voice?: SpeechSynthesisVoice;
  lang?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export interface SpeechSynthesisUtteranceOptions {
  voice?: SpeechSynthesisVoice;
  pitch?: number;
  rate?: number;
  volume?: number;
  lang?: string;
}

export function useWebSpeech() {
  let state: WebSpeechState = {
    isSupported: typeof window !== 'undefined' && 
                'SpeechRecognition' in window || 
                'webkitSpeechRecognition' in window ||
                'speechSynthesis' in window,
    isSpeaking: false,
    isListening: false,
    error: null,
    transcript: '',
    voices: []
  };

  const listeners = new Set<(state: WebSpeechState) => void>();
  let recognition: SpeechRecognition | null = null;
  let synthesis: SpeechSynthesis | null = null;

  const updateState = (newState: Partial<WebSpeechState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Web Speech API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  // Initialize Speech Recognition
  const initRecognition = () => {
    if (!state.isSupported) {
      throw new Error('Web Speech API is not supported in this browser');
    }

    if (!recognition) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognition = new SpeechRecognition();
    }

    return recognition;
  };

  // Initialize Speech Synthesis
  const initSynthesis = () => {
    if (!state.isSupported) {
      throw new Error('Web Speech API is not supported in this browser');
    }

    if (!synthesis && 'speechSynthesis' in window) {
      synthesis = window.speechSynthesis;
      updateVoices();
    }

    return synthesis;
  };

  // Update available voices
  const updateVoices = () => {
    if (!synthesis) return;
    
    const voices = synthesis.getVoices();
    updateState({ voices });
  };

  // Start speech recognition
  const startListening = (options: SpeechRecognitionOptions = {}) => {
    try {
      const recognition = initRecognition();
      clearError();

      recognition.continuous = options.continuous ?? false;
      recognition.interimResults = options.interimResults ?? true;
      recognition.maxAlternatives = options.maxAlternatives ?? 1;
      if (options.lang) recognition.lang = options.lang;

      recognition.onstart = () => {
        updateState({ isListening: true });
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        const isFinal = event.results[event.results.length - 1].isFinal;
        
        updateState({ transcript });
        options.onResult?.(transcript, isFinal);
      };

      recognition.onerror = (event) => {
        const error = new Error(`Recognition error: ${event.error}`);
        setError(error);
        options.onError?.(error);
      };

      recognition.onend = () => {
        updateState({ isListening: false });
      };

      recognition.start();
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  // Stop speech recognition
  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      updateState({ isListening: false });
    }
  };

  // Speak text
  const speak = (text: string, options: SpeechSynthesisUtteranceOptions = {}) => {
    if (!state.isSupported || !window.speechSynthesis) {
      throw new Error('Speech Synthesis API is not supported');
    }

    try {
      clearError();
      const utterance = new SpeechSynthesisUtterance(text);

      if (options.voice) utterance.voice = options.voice;
      if (options.pitch) utterance.pitch = options.pitch;
      if (options.rate) utterance.rate = options.rate;
      if (options.volume) utterance.volume = options.volume;
      if (options.lang) utterance.lang = options.lang;

      window.speechSynthesis.speak(utterance);
      updateState({ isSpeaking: true });
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (synthesis) {
      synthesis.cancel();
      updateState({ isSpeaking: false });
    }
  };

  // Pause speaking
  const pauseSpeaking = () => {
    if (synthesis) {
      synthesis.pause();
    }
  };

  // Resume speaking
  const resumeSpeaking = () => {
    if (synthesis) {
      synthesis.resume();
    }
  };

  // Initialize voices when available
  if (state.isSupported && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    if (window.speechSynthesis.getVoices().length > 0) {
      updateVoices();
    }
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }

  return {
    get state() { return state; },
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    subscribe(callback: (state: WebSpeechState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}