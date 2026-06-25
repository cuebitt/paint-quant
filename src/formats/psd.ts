import { readPsd, initializeCanvas, type Psd, type Layer } from "ag-psd";

interface PsdData {
  width: number;
  height: number;
  imageData: ImageData;
}

initializeCanvas(
  // ag-psd expects an HTMLCanvasElement factory, but this code runs in a worker
  // where only OffscreenCanvas is available. The cast keeps the library happy.
  (width, height) => new OffscreenCanvas(width, height) as unknown as HTMLCanvasElement,
);

function renderLayer(ctx: OffscreenCanvasRenderingContext2D, layer: Layer) {
  if (layer.hidden) return;

  if (layer.children) {
    for (let i = layer.children.length - 1; i >= 0; i--) {
      renderLayer(ctx, layer.children[i]!);
    }
  }

  if (layer.canvas) {
    ctx.globalAlpha = (layer.opacity ?? 100) / 100;
    ctx.drawImage(layer.canvas, layer.left ?? 0, layer.top ?? 0);
    ctx.globalAlpha = 1;
  }
}

function compositeLayersManually(psd: Psd): ImageData {
  const { width, height } = psd;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create canvas context");

  if (psd.children) {
    for (let i = psd.children.length - 1; i >= 0; i--) {
      renderLayer(ctx, psd.children[i]!);
    }
  }

  return ctx.getImageData(0, 0, width, height);
}

export function readPsdFile(data: ArrayBuffer): PsdData {
  const psd = readPsd(data, {
    skipLayerImageData: false,
    skipCompositeImageData: false,
    skipThumbnail: true,
  });
  const { width, height } = psd;

  if (!width || !height) {
    throw new Error(`Invalid PSD dimensions: ${width ?? "undefined"}x${height ?? "undefined"}`);
  }

  const imageData =
    psd.canvas?.getContext("2d")?.getImageData(0, 0, width, height) ?? compositeLayersManually(psd);

  return { width, height, imageData };
}
