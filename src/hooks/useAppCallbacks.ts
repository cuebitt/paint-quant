import { useCallback } from "preact/hooks";
import type { Dispatch } from "preact/hooks";
import type { RefObject } from "preact";
import type { AppState, AppAction } from "@/app/app-state";
import type { ProcessImageFn, ImageProcessorWorkers } from "@/hooks/useImageProcessor";
import { CANVAS_TYPES } from "@/types";
import { writePaintFile, readPaintFile, getCanvasTypeIndex } from "@/formats/paint-nbt";
import type { PaintingData } from "@/formats/paint-nbt";
import { imageDataToBlob } from "@/lib/utils";

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

const IMPORT_HANDLERS: Record<
  string,
  { type: string; extract: (reader: FileReader) => Record<string, unknown>; text?: boolean }
> = {
  ".ase": { type: "parseAseprite", extract: (r) => ({ buffer: r.result }) },
  ".aseprite": { type: "parseAseprite", extract: (r) => ({ buffer: r.result }) },
  ".psd": { type: "parsePsd", extract: (r) => ({ buffer: r.result }) },
  ".svg": { type: "parseSvg", extract: (r) => ({ text: r.result }), text: true },
  ".piskel": { type: "parsePiskel", extract: (r) => ({ text: r.result }), text: true },
  ".pixil": { type: "parsePixil", extract: (r) => ({ text: r.result }), text: true },
};

export function useAppCallbacks(
  dispatch: Dispatch<AppAction>,
  state: AppState,
  stateRef: RefObject<AppState>,
  processImage: ProcessImageFn,
  workers: ImageProcessorWorkers,
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
          const canvasType = CANVAS_TYPES[canvasTypeIndex]!;

          const data = new Uint8ClampedArray(canvasType.width * canvasType.height * 4);
          for (let i = 0; i < painting.pixels.length; i++) {
            const [r, g, b] = painting.pixels[i]!;
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
            error:
              err instanceof Error
                ? `Failed to import ${file.name}: ${err.message}`
                : `Failed to import ${file.name}`,
          });
        }
      };
      reader.onerror = () => {
        dispatch({ type: "SET_ERROR", error: `Failed to read ${file.name}` });
      };
      reader.readAsArrayBuffer(file);
    },
    [dispatch, workers],
  );

  const readIntoImportWorker = useCallback(
    (
      file: File,
      type: string,
      extract: (reader: FileReader) => Record<string, unknown>,
      asText = false,
    ) => {
      dispatch({ type: "SET_LOADING", loading: true });
      const reader = new FileReader();
      reader.onload = () => {
        if (!workers.importWorkerRef.current) {
          dispatch({ type: "SET_ERROR", error: "Import worker not initialized" });
          return;
        }
        workers.importWorkerRef.current.postMessage({ type, ...extract(reader) });
      };
      reader.onerror = () => {
        dispatch({ type: "SET_ERROR", error: `Failed to read ${file.name}` });
      };
      if (asText) {
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
      for (const [ext, handler] of Object.entries(IMPORT_HANDLERS)) {
        if (file.name.endsWith(ext)) {
          readIntoImportWorker(file, handler.type, handler.extract, handler.text);
          return;
        }
      }

      dispatch({ type: "SET_LOADING", loading: true });
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          workers.originalImageRef.current = img;
          dispatch({ type: "SET_ORIGINAL", url: reader.result as string });
          const s = stateRef.current;
          if (!s) return;
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
          dispatch({ type: "SET_ERROR", error: `Failed to load ${file.name}` });
        };
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        dispatch({ type: "SET_ERROR", error: `Failed to read ${file.name}` });
      };
      reader.readAsDataURL(file);
    },
    [processImage, handleImportPaintFile, workers, stateRef, dispatch, readIntoImportWorker],
  );

  const handleExportPaintFile = useCallback(async () => {
    if (!workers.quantizedDataRef.current) return;

    const { quantized } = workers.quantizedDataRef.current;
    const pixels: [number, number, number][] = [];
    for (let i = 0; i < quantized.data.length; i += 4) {
      pixels.push([quantized.data[i]!, quantized.data[i + 1]!, quantized.data[i + 2]!]);
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

    let filename: string;
    if (hasAuthorAndTitle) {
      const safeAuthor = sanitizeForFilename(state.author);
      const safeTitle = sanitizeForFilename(state.title);
      filename = `${safeAuthor}_${safeTitle}.paint`;
    } else {
      filename = `${generateShortId()}.paint`;
    }

    const blob = new Blob([paintBuffer as BlobPart], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
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
