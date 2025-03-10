interface PaintWorklet {
  addModule(moduleURL: string): Promise<void>;
}

declare namespace CSS {
  const paintWorklet: PaintWorklet;
  function registerPaint(name: string, paintCtor: { new(): object }): void;
}