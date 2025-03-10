export interface EncodingState {
  isSupported: boolean;
}

export function useEncoding() {
  let state: EncodingState = {
    isSupported: typeof TextEncoder !== 'undefined' && typeof TextDecoder !== 'undefined'
  };

  const listeners = new Set<(state: EncodingState) => void>();

  const updateState = (newState: Partial<EncodingState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const encode = (input: string, encoding: string = 'utf-8'): Uint8Array | null => {
    if (!state.isSupported) {
      throw new Error('Encoding API is not supported');
    }

    try {
      const encoder = new TextEncoder();
      return encoder.encode(input);
    } catch (error) {
      console.error(`Failed to encode text: ${error}`);
      return null;
    }
  };

  const decode = (input: BufferSource | Uint8Array | number[] | string, encoding: string = 'utf-8'): string | null => {
    if (!state.isSupported) {
      throw new Error('Encoding API is not supported');
    }

    if (!input) {
      console.error('Input cannot be null or undefined');
      return null;
    }

    try {
      const decoder = new TextDecoder(encoding);
      
      // Handle different input types
      let buffer: ArrayBuffer;
      if (typeof input === 'string') {
        // Handle string input more robustly
        try {
          // Remove any non-numeric characters and split by commas
          const numbers = input.replace(/[^\d,-]/g, '').split(',')
            .filter(s => s.length > 0)
            .map(num => parseInt(num.trim(), 10));
          
          if (numbers.some(isNaN)) {
            throw new TypeError('Input string contains invalid numbers');
          }
          
          buffer = new Uint8Array(numbers).buffer;
        } catch (error) {
          console.error('Failed to parse string input:', error);
          throw new TypeError('Input string must be comma-separated numbers');
        }
      } else if (input instanceof ArrayBuffer) {
        buffer = input;
      } else if (input instanceof Uint8Array || input instanceof Int8Array || 
                 input instanceof Uint16Array || input instanceof Int16Array ||
                 input instanceof Uint32Array || input instanceof Int32Array ||
                 input instanceof Float32Array || input instanceof Float64Array ||
                 input instanceof DataView) {
        buffer = input.buffer;
      } else if (Array.isArray(input)) {
        // Validate array contains only numbers
        if (!input.every(item => typeof item === 'number')) {
          throw new TypeError('Array must contain only numbers');
        }
        buffer = new Uint8Array(input).buffer;
      } else {
        throw new TypeError('Input must be an ArrayBuffer, TypedArray, number array, or comma-separated string of numbers');
      }
      
      return decoder.decode(buffer);
    } catch (error) {
      console.error(`Failed to decode text: ${error}`);
      return null;
    }
  };

  return {
    get state() { return state; },
    encode,
    decode,
    subscribe(callback: (state: EncodingState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}