declare class Highlight {
  constructor(...ranges: Range[]);
  entries(): IterableIterator<Range>;
  keys(): IterableIterator<Range>;
  values(): IterableIterator<Range>;
  forEach(callback: (range: Range) => void): void;
  priority: number;
}

interface HighlightRegistry {
  set(name: string, highlight: Highlight): void;
  get(name: string): Highlight | undefined;
  has(name: string): boolean;
  delete(name: string): void;
  clear(): void;
}

declare global {
  interface CSSConstructor {
    highlights: HighlightRegistry;
    readonly Highlight: {
      prototype: Highlight;
      new(...ranges: Range[]): Highlight;
    };
  }

  var CSS: CSSConstructor;
}