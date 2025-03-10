export interface WebAnimationsState {
  isSupported: boolean;
  animations: Map<string, Animation>;
}

export interface AnimationOptions extends KeyframeAnimationOptions {
  id?: string;
  onFinish?: () => void;
  onCancel?: () => void;
}

export function useWebAnimations() {
  const state: WebAnimationsState = {
    isSupported: typeof Element !== 'undefined' && 
                'animate' in Element.prototype && 
                typeof Animation !== 'undefined',
    animations: new Map()
  };

  const listeners = new Set<(state: WebAnimationsState) => void>();

  const notifyListeners = () => {
    listeners.forEach(listener => listener({...state}));
  };

  const animate = (
    element: Element, 
    keyframes: Keyframe[] | PropertyIndexedKeyframes, 
    options: AnimationOptions = {}
  ) => {
    if (!state.isSupported) {
      throw new Error('Web Animations API is not supported in this browser');
    }

    const { id, onFinish, onCancel, ...animationOptions } = options;
    const animation = element.animate(keyframes, animationOptions);
    
    const animationId = id || `animation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    state.animations.set(animationId, animation);
    
    if (onFinish) {
      animation.onfinish = () => {
        onFinish();
      };
    }
    
    if (onCancel) {
      animation.oncancel = () => {
        onCancel();
      };
    }
    
    animation.onfinish = (event) => {
      options.onFinish?.();
      if (animation.playState === 'finished') {
        state.animations.delete(animationId);
        notifyListeners();
      }
    };

    notifyListeners();
    return { 
      animation, 
      id: animationId 
    };
  };

  const cancelAnimation = (idOrAnimation: string | Animation) => {
    if (typeof idOrAnimation === 'string') {
      const animation = state.animations.get(idOrAnimation);
      if (animation) {
        animation.cancel();
        state.animations.delete(idOrAnimation);
        notifyListeners();
      }
    } else {
      idOrAnimation.cancel();
      // Find and remove the animation from the map
      for (const [id, anim] of state.animations.entries()) {
        if (anim === idOrAnimation) {
          state.animations.delete(id);
          break;
        }
      }
      notifyListeners();
    }
  };

  const pauseAnimation = (idOrAnimation: string | Animation) => {
    if (typeof idOrAnimation === 'string') {
      const animation = state.animations.get(idOrAnimation);
      if (animation) {
        animation.pause();
        notifyListeners();
      }
    } else {
      idOrAnimation.pause();
      notifyListeners();
    }
  };

  const playAnimation = (idOrAnimation: string | Animation) => {
    if (typeof idOrAnimation === 'string') {
      const animation = state.animations.get(idOrAnimation);
      if (animation) {
        animation.play();
        notifyListeners();
      }
    } else {
      idOrAnimation.play();
      notifyListeners();
    }
  };

  const getAllAnimations = () => {
    if (!state.isSupported) {
      return [];
    }
    
    return document.getAnimations?.() || [];
  };

  return {
    get state() { return { ...state }; },
    animate,
    cancelAnimation,
    pauseAnimation,
    playAnimation,
    getAllAnimations,
    subscribe(callback: (state: WebAnimationsState) => void) {
      listeners.add(callback);
      callback({...state});
      return () => listeners.delete(callback);
    }
  };
}