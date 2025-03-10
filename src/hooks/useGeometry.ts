interface UseGeometryOptions {
  onError?: (error: Error) => void;
}

export function useGeometry(options: UseGeometryOptions = {}) {
  const isSupported = typeof DOMMatrix === 'function' &&
    typeof DOMPoint === 'function' &&
    typeof DOMRect === 'function' &&
    typeof DOMQuad === 'function';

  const createPoint = (x = 0, y = 0, z = 0, w = 1): DOMPoint => {
    try {
      return new DOMPoint(x, y, z, w);
    } catch (error) {
      options.onError?.(error as Error);
      return { x, y, z, w } as DOMPoint;
    }
  };

  const createRect = (x = 0, y = 0, width = 0, height = 0): DOMRect => {
    try {
      return new DOMRect(x, y, width, height);
    } catch (error) {
      options.onError?.(error as Error);
      return { x, y, width, height, top: y, right: x + width, bottom: y + height, left: x } as DOMRect;
    }
  };

  const createMatrix = (
    matrix?: string | number[] | { 
      a?: number; b?: number; c?: number; d?: number; 
      e?: number; f?: number; m11?: number; m12?: number;
      m13?: number; m14?: number; m21?: number; m22?: number;
      m23?: number; m24?: number; m31?: number; m32?: number;
      m33?: number; m34?: number; m41?: number; m42?: number;
      m43?: number; m44?: number;
    }
  ): DOMMatrix => {
    try {
      if (typeof matrix === 'string') {
        return new DOMMatrix(matrix);
      } else if (Array.isArray(matrix)) {
        return new DOMMatrix(matrix);
      } else if (typeof matrix === 'object') {
        return new DOMMatrix([
          matrix.m11 ?? matrix.a ?? 1, matrix.m12 ?? matrix.b ?? 0,
          matrix.m13 ?? 0, matrix.m14 ?? 0,
          matrix.m21 ?? matrix.c ?? 0, matrix.m22 ?? matrix.d ?? 1,
          matrix.m23 ?? 0, matrix.m24 ?? 0,
          matrix.m31 ?? 0, matrix.m32 ?? 0,
          matrix.m33 ?? 1, matrix.m34 ?? 0,
          matrix.m41 ?? matrix.e ?? 0, matrix.m42 ?? matrix.f ?? 0,
          matrix.m43 ?? 0, matrix.m44 ?? 1
        ]);
      }
      return new DOMMatrix();
    } catch (error) {
      options.onError?.(error as Error);
      return new DOMMatrix();
    }
  };

  const createQuad = (points?: DOMPoint[]): DOMQuad => {
    try {
      if (points && points.length === 4) {
        return new DOMQuad(points[0], points[1], points[2], points[3]);
      }
      return new DOMQuad();
    } catch (error) {
      options.onError?.(error as Error);
      return new DOMQuad();
    }
  };

  const transformPoint = (point: DOMPoint, matrix: DOMMatrix): DOMPoint => {
    try {
      return point.matrixTransform(matrix);
    } catch (error) {
      options.onError?.(error as Error);
      return point;
    }
  };

  const combineMatrices = (...matrices: DOMMatrix[]): DOMMatrix => {
    try {
      return matrices.reduce((acc, matrix) => acc.multiply(matrix), new DOMMatrix());
    } catch (error) {
      options.onError?.(error as Error);
      return new DOMMatrix();
    }
  };

  const getRectFromElement = (element: Element): DOMRect => {
    try {
      return element.getBoundingClientRect();
    } catch (error) {
      options.onError?.(error as Error);
      return new DOMRect();
    }
  };

  return {
    isSupported,
    createPoint,
    createRect,
    createMatrix,
    createQuad,
    transformPoint,
    combineMatrices,
    getRectFromElement,
    // Constants for common transformations
    IDENTITY_MATRIX: new DOMMatrix(),
    ORIGIN_POINT: new DOMPoint(0, 0, 0, 1)
  };
}