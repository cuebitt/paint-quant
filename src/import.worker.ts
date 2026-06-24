import { imageDataToBlob } from "@/lib/utils";

interface ParseAsepriteRequest {
  type: "parseAseprite";
  buffer: ArrayBuffer;
}

interface ParsePsdRequest {
  type: "parsePsd";
  buffer: ArrayBuffer;
}

interface ParseSvgRequest {
  type: "parseSvg";
  text: string;
}

type ParseRequest = ParseAsepriteRequest | ParsePsdRequest | ParseSvgRequest;

interface ParseResponse {
  type: "result";
  width: number;
  height: number;
  imageData: Uint8ClampedArray;
}

interface ErrorResponse {
  type: "error";
  message: string;
}

async function parseSvg(svgText: string): Promise<ParseResponse> {
  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const bitmap = await createImageBitmap(blob);

  if (bitmap.width === 0 || bitmap.height === 0) {
    throw new Error("SVG must have explicit width and height attributes");
  }

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

  const pngBlob = await imageDataToBlob(imageData);
  const arrayBuffer = await pngBlob.arrayBuffer();

  return {
    type: "result",
    width: bitmap.width,
    height: bitmap.height,
    imageData: new Uint8ClampedArray(arrayBuffer),
  };
}

async function parseAseprite(buffer: ArrayBuffer): Promise<ParseResponse> {
  const { readAsepriteFile } = await import("@/aseprite");
  const data = readAsepriteFile(buffer);

  const pngBlob = await imageDataToBlob(data.imageData);
  const arrayBuffer = await pngBlob.arrayBuffer();

  return {
    type: "result",
    width: data.width,
    height: data.height,
    imageData: new Uint8ClampedArray(arrayBuffer),
  };
}

async function parsePsd(buffer: ArrayBuffer): Promise<ParseResponse> {
  const { readPsdFile } = await import("@/psd");
  const data = readPsdFile(buffer);

  const pngBlob = await imageDataToBlob(data.imageData);
  const arrayBuffer = await pngBlob.arrayBuffer();

  return {
    type: "result",
    width: data.width,
    height: data.height,
    imageData: new Uint8ClampedArray(arrayBuffer),
  };
}

self.onmessage = async (e: MessageEvent<ParseRequest>) => {
  try {
    const msg = e.data;
    let response: ParseResponse;

    switch (msg.type) {
      case "parseAseprite":
        response = await parseAseprite(msg.buffer);
        break;
      case "parsePsd":
        response = await parsePsd(msg.buffer);
        break;
      case "parseSvg":
        response = await parseSvg(msg.text);
        break;
      default:
        throw new Error(`Unknown message type: ${(msg as { type: string }).type}`);
    }

    self.postMessage(response);
  } catch (err) {
    const response: ErrorResponse = {
      type: "error",
      message: err instanceof Error ? err.message : "Import failed",
    };
    self.postMessage(response);
  }
};
