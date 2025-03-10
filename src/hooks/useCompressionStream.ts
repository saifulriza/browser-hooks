export interface CompressionState {
  isSupported: boolean;
  format: CompressionFormat;
}

export type CompressionFormat = 'gzip' | 'deflate' | 'deflate-raw';

export function useCompressionStream(format: CompressionFormat = 'gzip') {
  let state: CompressionState = {
    isSupported: typeof window !== 'undefined' && 'CompressionStream' in window,
    format
  };

  const listeners = new Set<(state: CompressionState) => void>();

  const updateState = (newState: Partial<CompressionState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const compress = async (data: Uint8Array | string): Promise<Uint8Array | null> => {
    if (!state.isSupported) {
      console.error('CompressionStream not supported in this browser');
      throw new Error('Compression Streams API is not supported in this browser');
    }

    const inputData = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    
    try {
      // Create a ReadableStream from the input data
      const readableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(inputData);
          controller.close();
        }
      });

      // Create compression stream and pipe the data through it
      const cs = new CompressionStream(state.format);
      const compressedStream = readableStream.pipeThrough(cs);
      
      // Read all chunks from the compressed stream
      const reader = compressedStream.getReader();
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }

      // Combine all chunks
      const totalLength = chunks.reduce((len, chunk) => len + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      return result;
    } catch (error) {
      console.error('Compression error:', error);
      throw error;
    }
  };

  const decompress = async (data: Uint8Array): Promise<Uint8Array | null> => {
    if (!state.isSupported) {
      throw new Error('Compression Streams API is not supported in this browser');
    }

    try {
      // Create a ReadableStream from the compressed data
      const readableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(data);
          controller.close();
        }
      });

      // Create decompression stream and pipe the data through it
      const ds = new DecompressionStream(state.format);
      const decompressedStream = readableStream.pipeThrough(ds);
      
      // Read all chunks from the decompressed stream
      const reader = decompressedStream.getReader();
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }

      // Combine all chunks
      const totalLength = chunks.reduce((len, chunk) => len + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      return result;
    } catch (error) {
      console.error('Decompression error:', error);
      throw error;
    }
  };

  const setFormat = (newFormat: CompressionFormat) => {
    updateState({ format: newFormat });
  };

  return {
    get state() { return state; },
    compress,
    decompress,
    setFormat,
    subscribe(callback: (state: CompressionState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}