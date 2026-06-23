import { useCallback } from "preact/hooks";
import type { QuantMethod, QuantizeOptions } from "@/quantize";
import type { CanvasType, ImageFitMode } from "@/types";
import { CANVAS_TYPES } from "@/types";
import { writePaintFile, readPaintFile, getCanvasTypeIndex } from "@/paint-nbt";
import type { PaintingData } from "@/paint-nbt";
import type { RGB } from "@/palette";
import type { ResizeOptions } from "@/preprocess";

const NBT_CT_TO_CANVAS_INDEX = [0, 3, 1, 2] as const;

function generateShortId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 8);
}

function sanitizeForFilename(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 48);
}

function imageDataToBlob(imageData: ImageData): Promise<Blob> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  ctx.putImageData(imageData, 0, 0);
  return canvas.convertToBlob({ type: "image/png" });
}

export function useAppCallbacks(
  dispatch: React.Dispatch<any>,
  state: {
    selectedCanvas: CanvasType;
    quantMethod: QuantMethod;
    fitMode: ImageFitMode;
    paddingColor: RGB;
    quantizationEnabled: boolean;
    adaptiveColorCount: number;
    includeFixedPalette: boolean;
    resizeFilter: any;
    unsharpAmount: number;
    title: string;
    author: string;
    signed: boolean;
  },
  stateRef: React.RefObject<any>,
  processImage: (
    img: HTMLImageElement,
    canvas: CanvasType,
    method: QuantMethod,
    mode: ImageFitMode,
    padding: RGB,
    quantEnabled: boolean,
    quantOptions: QuantizeOptions,
    resizeOptions: ResizeOptions,
  ) => Promise<void>,
  workers: {
    workerRef: React.RefObject<Worker | null>;
    importWorkerRef: React.RefObject<Worker | null>;
    originalImageRef: React.RefObject<HTMLImageElement | null>;
    quantizedDataRef: React.RefObject<{
      quantized: ImageData;
      adaptivePalette: readonly RGB[];
    } | null>;
    pendingProcessRef: React.RefObject<{
      displayDataUrl: string;
      method: QuantMethod;
      quantEnabled: boolean;
      quantOptions: QuantizeOptions;
    } | null>;
  },
) {
  const handleImportPaintFile = useCallback(
    (file: File) => {
      dispatch({ type: "SET_LOADING", loading: true });
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const painting: PaintingData = await readPaintFile(reader.result as ArrayBuffer);

          const canvasTypeIndex = NBT_CT_TO_CANVAS_INDEX[painting.canvasType];
          if (canvasTypeIndex === undefined) {
            throw new Error(`Unknown canvas type: ${painting.canvasType}`);
          }
          const canvasType = CANVAS_TYPES[canvasTypeIndex];

          const data = new Uint8ClampedArray(canvasType.width * canvasType.height * 4);
          for (let i = 0; i < painting.pixels.length; i++) {
            const [r, g, b] = painting.pixels[i];
            data[i * 4] = r;
            data[i * 4 + 1] = g;
            data[i * 4 + 2] = b;
            data[i * 4 + 3] = 255;
          }
          const imageData = new ImageData(data, canvasType.width, canvasType.height);

          workers.quantizedDataRef.current = {
            quantized: imageData,
            adaptivePalette: [],
          };
          workers.originalImageRef.current = null;

          const blob = await imageDataToBlob(imageData);
          const dataUrl = URL.createObjectURL(blob);

          dispatch({
            type: "IMPORT_PAINT",
            canvas: canvasType,
            title: painting.title,
            author: painting.author,
            signed: painting.generation === 1 && painting.version === 2,
            preprocessed: dataUrl,
            processed: dataUrl,
          });
        } catch (err) {
          dispatch({
            type: "SET_ERROR",
            error: err instanceof Error ? err.message : "Failed to import .paint file",
          });
        }
      };
      reader.onerror = () => {
        dispatch({ type: "SET_ERROR", error: "Failed to read file" });
      };
      reader.readAsArrayBuffer(file);
    },
    [dispatch, workers],
  );

  const handleImportWorkerFile = useCallback(
    (file: File, messageType: string, dataExtractor: (reader: FileReader) => any) => {
      dispatch({ type: "SET_LOADING", loading: true });
      const reader = new FileReader();
      reader.onload = () => {
        if (!workers.importWorkerRef.current) {
          dispatch({ type: "SET_ERROR", error: "Import worker not initialized" });
          return;
        }
        workers.importWorkerRef.current.postMessage({
          type: messageType,
          ...dataExtractor(reader),
        });
      };
      reader.onerror = () => {
        dispatch({ type: "SET_ERROR", error: "Failed to read file" });
      };
      if (messageType === "parseSvg") {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    },
    [dispatch, workers],
  );

  const handleUpload = useCallback(
    (file: File) => {
      if (file.name.endsWith(".paint")) {
        handleImportPaintFile(file);
        return;
      }
      if (file.name.endsWith(".ase") || file.name.endsWith(".aseprite")) {
        handleImportWorkerFile(file, "parseAseprite", (r) => ({ buffer: r.result }));
        return;
      }
      if (file.name.endsWith(".psd")) {
        handleImportWorkerFile(file, "parsePsd", (r) => ({ buffer: r.result }));
        return;
      }
      if (file.name.endsWith(".svg")) {
        handleImportWorkerFile(file, "parseSvg", (r) => ({ text: r.result }));
        return;
      }
      dispatch({ type: "SET_LOADING", loading: true });
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          workers.originalImageRef.current = img;
          dispatch({ type: "SET_ORIGINAL", url: reader.result as string });
          const s = stateRef.current;
          void processImage(
            img,
            s.selectedCanvas,
            s.quantMethod,
            s.fitMode,
            s.paddingColor,
            s.quantizationEnabled,
            { colors: s.adaptiveColorCount, includeFixedPalette: s.includeFixedPalette },
            { filter: s.resizeFilter, unsharpAmount: s.unsharpAmount },
          );
        };
        img.onerror = () => {
          dispatch({ type: "SET_ERROR", error: "Failed to load image" });
        };
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        dispatch({ type: "SET_ERROR", error: "Failed to read file" });
      };
      reader.readAsDataURL(file);
    },
    [processImage, handleImportPaintFile, handleImportWorkerFile, workers, stateRef, dispatch],
  );

  const handleExportPaintFile = useCallback(async () => {
    if (!workers.quantizedDataRef.current) return;

    const { quantized } = workers.quantizedDataRef.current;
    const pixels: [number, number, number][] = [];
    for (let i = 0; i < quantized.data.length; i += 4) {
      pixels.push([quantized.data[i], quantized.data[i + 1], quantized.data[i + 2]]);
    }

    const timestamp = Date.now().toString(36);
    const name = `${crypto.randomUUID()}_${timestamp}`;
    const canvasTypeIndex = getCanvasTypeIndex(state.selectedCanvas);

    const hasAuthorAndTitle = state.author !== "" && state.title !== "";
    const paintBuffer = await writePaintFile({
      canvasType: canvasTypeIndex,
      pixels,
      name,
      author: hasAuthorAndTitle ? state.author : "",
      title: hasAuthorAndTitle ? state.title : "",
      generation: state.signed ? 1 : 0,
      version: state.signed ? 2 : 99,
    });

    let downloadName: string;
    if (hasAuthorAndTitle) {
      const safeAuthor = sanitizeForFilename(state.author);
      const safeTitle = sanitizeForFilename(state.title);
      downloadName = `${safeAuthor}_${safeTitle}.paint`;
    } else {
      downloadName = `${generateShortId()}.paint`;
    }

    const blob = new Blob([paintBuffer as BlobPart], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [state.selectedCanvas, state.title, state.author, state.signed, workers]);

  const handleExportPng = useCallback(() => {
    if (!workers.quantizedDataRef.current) return;

    const { quantized } = workers.quantizedDataRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = quantized.width;
    canvas.height = quantized.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(quantized, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const timestamp = Date.now().toString(36);
      const name = `${crypto.randomUUID()}_${timestamp}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `painting_${name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [workers]);

  return { handleUpload, handleExportPaintFile, handleExportPng };
}
