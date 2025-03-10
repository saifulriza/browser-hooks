interface UseFileOptions {
  accept?: string;
  multiple?: boolean;
  onLoad?: (result: string | ArrayBuffer | null, file: File) => void;
  onError?: (error: Error, file: File) => void;
}

export function useFile(options: UseFileOptions = {}) {
  const readFile = (file: File, readAs: 'text' | 'dataURL' | 'arrayBuffer' = 'text'): Promise<string | ArrayBuffer | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        options.onLoad?.(reader.result, file);
        resolve(reader.result);
      };

      reader.onerror = () => {
        const error = new Error('Error reading file');
        options.onError?.(error, file);
        reject(error);
      };

      switch (readAs) {
        case 'text':
          reader.readAsText(file);
          break;
        case 'dataURL':
          reader.readAsDataURL(file);
          break;
        case 'arrayBuffer':
          reader.readAsArrayBuffer(file);
          break;
      }
    });
  };

  const createInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    if (options.accept) input.accept = options.accept;
    if (options.multiple) input.multiple = true;
    return input;
  };

  const selectFile = async (): Promise<File[]> => {
    return new Promise((resolve) => {
      const input = createInput();
      
      input.onchange = () => {
        const files = Array.from(input.files || []);
        resolve(files);
      };

      input.click();
    });
  };

  const getFileInfo = (file: File) => ({
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  });

  const isFileSupported = 'File' in window && 'FileReader' in window && 'FileList' in window;

  return {
    isFileSupported,
    readFile,
    selectFile,
    getFileInfo
  };
}