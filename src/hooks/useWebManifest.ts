export interface WebManifestState {
  isSupported: boolean;
  manifest: Partial<WebAppManifest> | null;
  error: Error | null;
  isLoading: boolean;
}

export interface WebAppManifest {
  background_color?: string;
  categories?: string[];
  description?: string;
  dir?: 'auto' | 'ltr' | 'rtl';
  display?: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
  icons?: Array<{
    src: string;
    sizes?: string;
    type?: string;
    purpose?: 'any' | 'maskable' | 'monochrome';
  }>;
  lang?: string;
  name?: string;
  orientation?: 'any' | 'natural' | 'landscape' | 'landscape-primary' | 
               'landscape-secondary' | 'portrait' | 'portrait-primary' | 
               'portrait-secondary';
  prefer_related_applications?: boolean;
  related_applications?: Array<{
    platform?: string;
    url?: string;
    id?: string;
  }>;
  scope?: string;
  screenshots?: Array<{
    src: string;
    sizes?: string;
    type?: string;
  }>;
  short_name?: string;
  start_url?: string;
  theme_color?: string;
}

export function useWebManifest() {
  let state: WebManifestState = {
    isSupported: typeof document !== 'undefined',
    manifest: null,
    error: null,
    isLoading: false
  };

  const listeners = new Set<(state: WebManifestState) => void>();
  
  const updateState = (newState: Partial<WebManifestState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const fetchManifest = async (url?: string) => {
    if (!state.isSupported) {
      throw new Error('Web App Manifest API requires browser environment');
    }
    
    try {
      updateState({ isLoading: true, error: null });
      
      // Find manifest link if URL is not provided
      const manifestUrl = url || 
        document.querySelector('link[rel="manifest"]')?.getAttribute('href');
      
      if (!manifestUrl) {
        throw new Error('No manifest URL found. Add a <link rel="manifest"> or provide URL.');
      }
      
      const absoluteUrl = new URL(manifestUrl, document.baseURI).href;
      const response = await fetch(absoluteUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
      }
      
      const manifest = await response.json();
      updateState({ 
        manifest, 
        isLoading: false 
      });
      
      return manifest;
    } catch (error) {
      updateState({ 
        error: error as Error, 
        isLoading: false 
      });
      throw error;
    }
  };

  const getManifestUrl = (): string | null => {
    if (!state.isSupported) {
      return null;
    }
    
    const manifestLink = document.querySelector('link[rel="manifest"]');
    return manifestLink ? manifestLink.getAttribute('href') : null;
  };

  const isInstallable = (): boolean => {
    if (!state.isSupported) {
      return false;
    }
    
    // Check for presence of beforeinstallprompt event
    return 'BeforeInstallPromptEvent' in window || 'onbeforeinstallprompt' in window;
  };

  // Initialize listener for install prompt events
  let deferredPrompt: any = null;
  
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;
      // Update state to reflect app is installable
      updateState({ ...state });
      
      // Notify listeners
      listeners.forEach(listener => listener(state));
    });
  }

  const promptInstall = async (): Promise<any> => {
    if (!deferredPrompt) {
      throw new Error('No installation prompt available');
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;
    
    // Reset the deferred prompt variable
    deferredPrompt = null;
    
    return choiceResult;
  };

  return {
    get state() { return state; },
    fetchManifest,
    getManifestUrl,
    isInstallable,
    promptInstall,
    subscribe(callback: (state: WebManifestState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}