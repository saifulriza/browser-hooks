interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

export function useWebShare() {
  const isSupported = 'share' in navigator;
  const isFilesSupported = 'canShare' in navigator;

  const share = async (data: ShareData): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      if (data.files && !isFilesSupported) {
        console.warn('File sharing is not supported in this browser');
        return false;
      }

      if (data.files && isFilesSupported) {
        const canShare = await navigator.canShare(data);
        if (!canShare) {
          console.warn('Cannot share this content');
          return false;
        }
      }

      await navigator.share(data);
      return true;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled the share operation
        return false;
      }
      console.error('Error sharing content:', error);
      return false;
    }
  };

  return {
    isSupported,
    isFilesSupported,
    share
  };
}