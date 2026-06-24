import { createCanvas, Image } from "canvas";

(globalThis as any).HTMLCanvasElement = createCanvas(1, 1).constructor;
(globalThis as any).Image = Image;

const originalCreateElement = document.createElement.bind(document);
document.createElement = function (tagName: string, options?: ElementCreationOptions): HTMLElement {
  if (tagName.toLowerCase() === "canvas") {
    return createCanvas(1, 1) as unknown as HTMLCanvasElement;
  }
  return originalCreateElement(tagName, options);
} as typeof document.createElement;
