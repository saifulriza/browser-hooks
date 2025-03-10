interface UseFileEntryOptions {
  onError?: (error: Error) => void;
}

export function useFileEntry(options: UseFileEntryOptions = {}) {
  const isSupported = 'webkitRequestFileSystem' in window;

  const requestFileSystem = (type: number = (window as any).TEMPORARY, size: number = 1024 * 1024) => {
    return new Promise<FileSystem>((resolve, reject) => {
      const requestFS = window.requestFileSystem || (window as any).webkitRequestFileSystem;
      requestFS(type, size, resolve, reject);
    });
  };

  const getFile = async (path: string, options: { create?: boolean } = {}): Promise<FileEntry> => {
    if (!isSupported) {
      throw new Error('FileSystem API is not supported');
    }

    const fs = await requestFileSystem();
    return new Promise<FileEntry>((resolve, reject) => {
      fs.root.getFile(path, options, 
        (entry) => resolve(entry as FileEntry), 
        (error) => reject(error));
    });
  };

  const writeFile = async (fileEntry: FileEntry, data: Blob): Promise<void> => {
    if (!isSupported) {
      throw new Error('FileSystem API is not supported');
    }

    try {
      const writer = await new Promise<FileWriter>((resolve, reject) => {
        (fileEntry as any).createWriter(
          (writer: FileWriter) => resolve(writer),
          (error: Error) => reject(error)
        );
      });

      return new Promise<void>((resolve, reject) => {
        writer.onwriteend = () => resolve();
        writer.onerror = (error: Error) => {
          console.error('Error writing file:', error);
          reject(error);
        };
        writer.write(data);
      });
    } catch (error) {
      console.error('Error getting FileWriter:', error);
      throw error;
    }
  };

  const readFile = async (fileEntry: FileEntry): Promise<string> => {
    return new Promise((resolve, reject) => {
      fileEntry.file((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          const error = new Error('Error reading file');
          options.onError?.(error);
          reject(error);
        };
        reader.readAsText(file);
      }, (error: Error) => {
        reject(error);
      });
    });
  };

  const getDirectory = async (path: string, options: { create?: boolean } = {}): Promise<DirectoryEntry> => {
    if (!isSupported) {
      throw new Error('FileSystem API is not supported');
    }

    const fs = await requestFileSystem();
    return new Promise<DirectoryEntry>((resolve, reject) => {
      fs.root.getDirectory(path, options, 
        (entry) => resolve(entry as DirectoryEntry), 
        (error) => reject(error));
    });
  };

  const listDirectory = async (dirEntry: DirectoryEntry): Promise<Entry[]> => {
    if (!isSupported) {
      throw new Error('FileSystem API is not supported');
    }

    const entries: Entry[] = [];
    const reader = dirEntry.createReader();

    const readEntries = (): Promise<Entry[]> => {
      return new Promise((resolve, reject) => {
        reader.readEntries(
          (results) => {
            if (!results.length) {
              resolve(entries as Entry[]);
            } else {
              entries.push(...(results as Entry[]));
              readEntries().then(resolve, reject);
            }
          },
          (error) => reject(error)
        );
      });
    };

    return readEntries();
  };

  const removeEntry = async (entry: Entry): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (entry.isDirectory) {
        (entry as DirectoryEntry).removeRecursively(resolve, reject);
      } else {
        entry.remove(resolve, reject);
      }
    });
  };

  return {
    isSupported,
    requestFileSystem,
    getFile,
    writeFile,
    readFile,
    getDirectory,
    listDirectory,
    removeEntry,
    TEMPORARY: (window as any).TEMPORARY,
    PERSISTENT: (window as any).PERSISTENT
  };
}