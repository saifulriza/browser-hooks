interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

interface UseFileSystemOptions {
  onError?: (error: Error) => void;
}

export function useFileSystem(options: UseFileSystemOptions = {}) {
  const isSupported = 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;

  const openFile = async (fileTypes?: { description: string; accept: Record<string, string[]> }[]) => {
    if (!isSupported) {
      const error = new Error('File System API is not supported in this browser');
      options.onError?.(error);
      return null;
    }

    try {
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: fileTypes,
        multiple: false
      });
      return fileHandle;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        options.onError?.(error as Error);
      }
      return null;
    }
  };

  const saveFile = async (
    data: string | BufferSource | Blob,
    suggestedName?: string,
    fileTypes?: { description: string; accept: Record<string, string[]> }[]
  ) => {
    if (!isSupported) {
      const error = new Error('File System API is not supported in this browser');
      options.onError?.(error);
      return null;
    }

    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName,
        types: fileTypes
      });

      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
      return handle;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        options.onError?.(error as Error);
      }
      return null;
    }
  };

  const openDirectory = async () => {
    if (!isSupported) {
      const error = new Error('File System API is not supported in this browser');
      options.onError?.(error);
      return null;
    }

    try {
      return await (window as any).showDirectoryPicker();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        options.onError?.(error as Error);
      }
      return null;
    }
  };

  const listDirectoryContents = async (dirHandle: any) => {
    const entries: FileSystemHandle[] = [];
    try {
      for await (const entry of dirHandle.values()) {
        entries.push({
          kind: entry.kind,
          name: entry.name
        });
      }
      return entries;
    } catch (error) {
      options.onError?.(error as Error);
      return [];
    }
  };

  return {
    isSupported,
    openFile,
    saveFile,
    openDirectory,
    listDirectoryContents
  };
}