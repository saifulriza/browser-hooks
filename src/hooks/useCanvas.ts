export interface CanvasState {
  isSupported: boolean;
  context: CanvasRenderingContext2D | null;
  width: number;
  height: number;
}

export interface CanvasOptions {
  width?: number;
  height?: number;
  contextType?: '2d' | 'webgl' | 'webgl2' | 'bitmaprenderer';
  contextAttributes?: CanvasRenderingContext2DSettings;
}

export function useCanvas(canvas: HTMLCanvasElement | null, options: CanvasOptions = {}) {
  const {
    width = 300,
    height = 150,
    contextType = '2d',
    contextAttributes = {}
  } = options;

  let state: CanvasState = {
    isSupported: typeof HTMLCanvasElement !== 'undefined',
    context: null,
    width,
    height
  };

  const listeners = new Set<(state: CanvasState) => void>();

  const updateState = (newState: Partial<CanvasState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const initializeCanvas = (element: HTMLCanvasElement) => {
    if (!state.isSupported) {
      throw new Error('Canvas API is not supported');
    }

    element.width = width;
    element.height = height;

    try {
      const ctx = element.getContext(contextType, contextAttributes);
      updateState({ context: ctx as CanvasRenderingContext2D });
      return ctx;
    } catch (error) {
      console.error(`Failed to get canvas context: ${error}`);
      return null;
    }
  };

  const clearCanvas = () => {
    if (!state.context || !canvas) return;
    state.context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const drawRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) => {
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) => {
    if (!ctx) return;
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  const resizeCanvas = (newWidth: number, newHeight: number) => {
    if (!canvas) return;
    
    canvas.width = newWidth;
    canvas.height = newHeight;
    updateState({ width: newWidth, height: newHeight });
    
    // Re-initialize context after resize
    initializeCanvas(canvas);
  };

  // Initialize if canvas is provided
  if (canvas) {
    initializeCanvas(canvas);
  }

  return {
    get state() { return state; },
    initializeCanvas,
    clearCanvas,
    drawRect,
    drawCircle,
    resizeCanvas,
    subscribe(callback: (state: CanvasState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}