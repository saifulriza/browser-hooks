export interface WebNFCState {
  isSupported: boolean;
  isReading: boolean;
  isWriting: boolean;
  error: Error | null;
  lastReading: NDEFMessage | null;
}

export interface NFCReadingOptions {
  recordType?: string;
  mediaType?: string;
  signal?: AbortSignal;
}

export interface NFCRecord {
  recordType: string;
  mediaType?: string;
  id?: string;
  data?: any;
  encoding?: string;
  lang?: string;
}

export interface NFCWriteOptions extends NFCReadingOptions {
  overwrite?: boolean;
}

export function useWebNFC() {
  let state: WebNFCState = {
    isSupported: typeof window !== 'undefined' && 'NDEFReader' in window,
    isReading: false,
    isWriting: false,
    error: null,
    lastReading: null
  };

  const listeners = new Set<(state: WebNFCState) => void>();

  const updateState = (newState: Partial<WebNFCState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Web NFC API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  let ndefReader: any = null; // NDEFReader
  let readingAbortController: AbortController | null = null;

  /**
   * Start scanning for NFC tags
   */
  const startScanning = async (options: NFCReadingOptions = {}, 
                               onReading?: (message: any, serialNumber: string) => void,
                               onReadingError?: (error: Error) => void): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('Web NFC API is not supported in this browser');
    }

    try {
      clearError();
      
      if (state.isReading) {
        stopScanning();
      }
      
      readingAbortController = new AbortController();
      
      if (!options.signal && readingAbortController) {
        options.signal = readingAbortController.signal;
      }
      
      if (!ndefReader) {
        const NDEFReader = (window as any).NDEFReader;
        if (!NDEFReader) {
          throw new Error('NDEFReader is not supported');
        }
        ndefReader = new NDEFReader();
      }
      
      updateState({ isReading: true });
      
      await ndefReader.scan(options);
      
      ndefReader.onreading = (event: any) => {
        if (onReading) {
          onReading(event.message, event.serialNumber);
        }
      };
      
      ndefReader.onreadingerror = (event: any) => {
        const error = new Error(`Reading error: ${event.message}`);
        
        if (onReadingError) {
          onReadingError(error);
        } else {
          setError(error);
        }
      };
    } catch (error) {
      updateState({ isReading: false });
      setError(error as Error);
      throw error;
    }
  };

  /**
   * Stop scanning for NFC tags
   */
  const stopScanning = (): void => {
    if (readingAbortController) {
      readingAbortController.abort();
      readingAbortController = null;
      updateState({ isReading: false });
    }
  };

  /**
   * Write data to an NFC tag
   */
  const writeTag = async (records: NFCRecord[], options: NFCWriteOptions = {}): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('Web NFC API is not supported in this browser');
    }

    try {
      clearError();
      updateState({ isWriting: true });
      
      if (!ndefReader) {
        // @ts-ignore - NDEFReader might not be recognized by TypeScript
        ndefReader = new NDEFReader();
      }
      
      await ndefReader.write(records, options);
      updateState({ isWriting: false });
    } catch (error) {
      updateState({ isWriting: false });
      setError(error as Error);
      throw error;
    }
  };

  /**
   * Create a simple text record
   */
  const createTextRecord = (text: string, lang = 'en'): NFCRecord => {
    return {
      recordType: 'text',
      lang,
      data: text
    };
  };

  /**
   * Create a URL record
   */
  const createUrlRecord = (url: string): NFCRecord => {
    return {
      recordType: 'url',
      data: url
    };
  };

  /**
   * Create a MIME type record (for JSON, images, etc.)
   */
  const createMimeRecord = (mediaType: string, data: any): NFCRecord => {
    return {
      recordType: 'mime',
      mediaType,
      data
    };
  };

  /**
   * Create a JSON record as a special case of MIME type record
   */
  const createJsonRecord = (data: object): NFCRecord => {
    return {
      recordType: 'mime',
      mediaType: 'application/json',
      data: JSON.stringify(data)
    };
  };

  /**
   * Clean up resources when no longer needed
   */
  const cleanup = (): void => {
    stopScanning();
    ndefReader = null;
  };

  const isSupported = 'NDEFReader' in window;

  const write = async (message: NDEFMessageInit, options?: NFCWriteOptions) => {
    if (!state.isSupported) {
      throw new Error('Web NFC API is not supported');
    }

    try {
      clearError();
      if (!(window as any).NDEFReader) {
        throw new Error('NDEFReader not available');
      }
      const NDEFReaderClass = (window as any).NDEFReader;
      const ndef = new NDEFReaderClass();
      await ndef.write(message, options);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  interface NFCReaderClass {
    new(): NDEFReader;
  }

  const scan = async (options?: NFCReaderOptions) => {
    if (!state.isSupported) {
      throw new Error('Web NFC API is not supported');
    }

    try {
      clearError();
      const NDEFReaderClass = (window as any).NDEFReader as NFCReaderClass;
      if (!NDEFReaderClass) {
        throw new Error('NDEFReader not available');
      }
      const ndef = new NDEFReaderClass();
      await ndef.scan(options);

      ndef.addEventListener('reading', ((event: Event) => {
        const nfcEvent = event as unknown as { message: NDEFMessage };
        if (nfcEvent.message) {
          updateState({ lastReading: nfcEvent.message });
        }
      }) as EventListener);

      ndef.addEventListener('error', ((event: Event) => {
        const nfcEvent = event as unknown as { error: Error };
        if (nfcEvent.error) {
          setError(nfcEvent.error);
        }
      }) as EventListener);

      return ndef;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const read = async (options?: NFCReadingOptions) => {
    if (!state.isSupported) return null;

    try {
      const NDEFReaderClass = (window as any).NDEFReader as NFCReaderClass;
      if (!NDEFReaderClass) {
        throw new Error('NDEFReader not available');
      }
      const ndef = new NDEFReaderClass();
      await ndef.scan(options);
      
      return new Promise<NDEFMessage>((resolve, reject) => {
        ndef.addEventListener('reading', ((event: Event) => {
          const nfcEvent = event as unknown as { message: NDEFMessage };
          if (nfcEvent.message) {
            resolve(nfcEvent.message);
          }
        }) as EventListener, { once: true });

        ndef.addEventListener('error', ((event: Event) => {
          const nfcEvent = event as unknown as { error: Error };
          if (nfcEvent.error) {
            reject(nfcEvent.error);
          }
        }) as EventListener, { once: true });
      });
    } catch (error) {
      console.error('Error reading NFC:', error);
      return null;
    }
  };

  return {
    get state() { return state; },
    startScanning,
    stopScanning,
    writeTag,
    createTextRecord,
    createUrlRecord,
    createMimeRecord,
    createJsonRecord,
    cleanup,
    subscribe(callback: (state: WebNFCState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    },
    isSupported,
    write,
    scan,
    read
  };
}