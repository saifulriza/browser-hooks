export interface MediaSessionState {
  isSupported: boolean;
  playbackState: MediaSessionPlaybackState;
  metadata: MediaMetadata | null;
  error: Error | null;
}

export interface MediaMetadataInit {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: MediaImage[];
}

export type MediaSessionAction =
  | 'play'
  | 'pause'
  | 'stop'
  | 'seekbackward'
  | 'seekforward'
  | 'seekto'
  | 'previoustrack'
  | 'nexttrack'
  | 'skipad';

export interface MediaSessionActionHandler {
  action: MediaSessionAction;
  handler: MediaSessionActionHandler;
}

export function useMediaSession() {
  let state: MediaSessionState = {
    isSupported: typeof navigator !== 'undefined' && 'mediaSession' in navigator,
    playbackState: 'none',
    metadata: null,
    error: null
  };

  const listeners = new Set<(state: MediaSessionState) => void>();

  const updateState = (newState: Partial<MediaSessionState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Media Session API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const setMetadata = (init: MediaMetadataInit) => {
    if (!state.isSupported || !navigator.mediaSession) {
      throw new Error('Media Session API is not supported');
    }

    try {
      clearError();
      const metadata = new MediaMetadata(init);
      navigator.mediaSession.metadata = metadata;
      updateState({ metadata });
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const setPlaybackState = (playbackState: MediaSessionPlaybackState) => {
    if (!state.isSupported || !navigator.mediaSession) {
      throw new Error('Media Session API is not supported');
    }

    try {
      clearError();
      navigator.mediaSession.playbackState = playbackState;
      updateState({ playbackState });
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const setActionHandler = (
    action: MediaSessionAction,
    handler: ((details: MediaSessionActionDetails) => void) | null
  ) => {
    if (!state.isSupported || !navigator.mediaSession) {
      throw new Error('Media Session API is not supported');
    }

    try {
      clearError();
      navigator.mediaSession.setActionHandler(action, handler);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const setPositionState = (state?: MediaPositionState) => {
    if (!navigator.mediaSession) {
      throw new Error('Media Session API is not supported');
    }

    try {
      clearError();
      navigator.mediaSession.setPositionState(state);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  // Initialize state if supported
  if (state.isSupported && navigator.mediaSession) {
    state.playbackState = navigator.mediaSession.playbackState;
    state.metadata = navigator.mediaSession.metadata;
  }

  return {
    get state() { return state; },
    setPlaybackState,
    setMetadata,
    setActionHandler,
    setPositionState,
    subscribe(callback: (state: MediaSessionState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}