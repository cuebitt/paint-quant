import { useReducer, useEffect, useRef, useCallback } from "react";
import { PaintBucketIcon, HeartIcon } from "lucide-react";
import type { QuantMethod } from "./quantize";
import { preprocessImageForCanvas, preprocessForDisplay } from "./preprocess";
import { serializePaintFile } from "./serialize";
import type { CanvasType, ImageFitMode } from "./types";
import type { RGB } from "./palette";
import { CANVAS_TYPES } from "./types";
import { UploadDropzone } from "./components/UploadDropzone";
import { CanvasSelector } from "./components/CanvasSelector";
import { Toolbar } from "./components/Toolbar";
import { ImageComparison } from "./components/ImageComparison";
import { PalettesSection } from "./components/PalettesSection";
import { ModeToggle } from "./components/ModeToggle";

interface AppState {
  originalUrl: string | null;
  preprocessedUrl: string | null;
  processedImageUrl: string | null;
  quantizedUrl: string | null;
  adaptivePalette: readonly RGB[];
  loading: boolean;
  error: string | null;
  selectedCanvas: CanvasType;
  showGrid: boolean;
  quantMethod: QuantMethod;
  fitMode: ImageFitMode;
  paddingColor: RGB;
  paddingColorPreview: RGB;
}

type AppAction =
  | { type: "SET_ORIGINAL"; url: string }
  | {
      type: "SET_RESULT";
      preprocessed: string;
      processed: string;
      adaptive: readonly RGB[];
    }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_CANVAS"; canvas: CanvasType }
  | { type: "SET_SHOW_GRID"; show: boolean }
  | { type: "SET_QUANT_METHOD"; method: QuantMethod }
  | { type: "SET_FIT_MODE"; mode: ImageFitMode }
  | { type: "SET_PADDING_COLOR"; color: RGB }
  | { type: "SET_PADDING_PREVIEW"; color: RGB }
  | { type: "RESET" };

const initialState: AppState = {
  originalUrl: null,
  preprocessedUrl: null,
  processedImageUrl: null,
  quantizedUrl: null,
  adaptivePalette: [],
  loading: false,
  error: null,
  selectedCanvas: CANVAS_TYPES[0],
  showGrid: false,
  quantMethod: "median-cut",
  fitMode: "contain",
  paddingColor: [255, 255, 255],
  paddingColorPreview: [255, 255, 255],
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_ORIGINAL":
      return { ...state, originalUrl: action.url, error: null };
    case "SET_RESULT":
      return {
        ...state,
        preprocessedUrl: action.preprocessed,
        processedImageUrl: action.processed,
        quantizedUrl: action.processed,
        adaptivePalette: action.adaptive,
        loading: false,
      };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };
    case "SET_CANVAS":
      return { ...state, selectedCanvas: action.canvas };
    case "SET_SHOW_GRID":
      return { ...state, showGrid: action.show };
    case "SET_QUANT_METHOD":
      return { ...state, quantMethod: action.method };
    case "SET_FIT_MODE":
      return { ...state, fitMode: action.mode };
    case "SET_PADDING_COLOR":
      return { ...state, paddingColor: action.color, paddingColorPreview: action.color };
    case "SET_PADDING_PREVIEW":
      return { ...state, paddingColorPreview: action.color };
    case "RESET":
      return initialState;
  }
}

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const quantizedDataRef = useRef<{
    quantized: ImageData;
    adaptivePalette: readonly RGB[];
  } | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const pendingPreprocessedRef = useRef<string | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("./quantize.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === "error") {
        dispatch({ type: "SET_ERROR", error: msg.message });
        return;
      }

      if (msg.type === "result") {
        const quantized = new ImageData(
          new Uint8ClampedArray(msg.quantized.data),
          msg.quantized.width,
          msg.quantized.height,
        );

        quantizedDataRef.current = {
          quantized,
          adaptivePalette: msg.adaptivePalette,
        };

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = msg.quantized.width;
        tempCanvas.height = msg.quantized.height;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) {
          dispatch({ type: "SET_ERROR", error: "Failed to get output canvas context" });
          return;
        }
        tempCtx.putImageData(quantized, 0, 0);

        dispatch({
          type: "SET_RESULT",
          preprocessed: pendingPreprocessedRef.current ?? "",
          processed: tempCanvas.toDataURL(),
          adaptive: msg.adaptivePalette,
        });
        pendingPreprocessedRef.current = null;
      }
    };

    worker.onerror = () => {
      dispatch({ type: "SET_ERROR", error: "Worker error" });
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const processImage = useCallback(
    (
      img: HTMLImageElement,
      canvas: CanvasType,
      method: QuantMethod,
      mode: ImageFitMode,
      padding: RGB,
    ) => {
      try {
        const processedData = preprocessImageForCanvas(img, canvas, mode, padding);
        const displayData = preprocessForDisplay(img, canvas, mode, padding);

        const preCanvas = document.createElement("canvas");
        preCanvas.width = displayData.width;
        preCanvas.height = displayData.height;
        const preCtx = preCanvas.getContext("2d");
        if (!preCtx) throw new Error("Failed to get display canvas context");
        preCtx.putImageData(displayData, 0, 0);

        pendingPreprocessedRef.current = preCanvas.toDataURL();

        if (!workerRef.current) {
          dispatch({ type: "SET_ERROR", error: "Worker not initialized" });
          return;
        }

        workerRef.current.postMessage({
          type: "quantize",
          imageData: {
            data: new Uint8ClampedArray(processedData.data),
            width: processedData.width,
            height: processedData.height,
          },
          method,
        });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          error: err instanceof Error ? err.message : "Failed to process image",
        });
      }
    },
    [],
  );

  const handleUpload = useCallback(
    (file: File) => {
      dispatch({ type: "SET_LOADING", loading: true });
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          originalImageRef.current = img;
          dispatch({ type: "SET_ORIGINAL", url: reader.result as string });
          processImage(
            img,
            state.selectedCanvas,
            state.quantMethod,
            state.fitMode,
            state.paddingColor,
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
    [state.selectedCanvas, state.quantMethod, state.fitMode, state.paddingColor, processImage],
  );

  useEffect(() => {
    if (originalImageRef.current && state.originalUrl) {
      dispatch({ type: "SET_LOADING", loading: true });
      processImage(
        originalImageRef.current,
        state.selectedCanvas,
        state.quantMethod,
        state.fitMode,
        state.paddingColor,
      );
    }
  }, [
    state.selectedCanvas,
    state.originalUrl,
    state.quantMethod,
    state.fitMode,
    state.paddingColor,
    processImage,
  ]);

  const handleExportPaintFile = useCallback(() => {
    if (!quantizedDataRef.current) return;
    const paintFile = serializePaintFile({
      quantized: quantizedDataRef.current.quantized,
      adaptivePalette: quantizedDataRef.current.adaptivePalette,
      canvasType: state.selectedCanvas,
    });

    const blob = new Blob([JSON.stringify(paintFile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `painting_${paintFile.name}.paint`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [state.selectedCanvas]);

  const hasResults =
    state.originalUrl && state.preprocessedUrl && state.processedImageUrl && state.quantizedUrl;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent p-2">
              <PaintBucketIcon className="size-6 text-accent-foreground" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">paint-quant</h1>
              <p className="text-xs text-muted-foreground">
                Quantize images to 28 colors (16 fixed + 12 adaptive)
              </p>
            </div>
            <div className="ml-auto">
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {state.error && (
          <div className="mx-auto mb-6 max-w-2xl rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {state.error}
          </div>
        )}

        {!hasResults ? (
          <div className="mx-auto max-w-2xl">
            <UploadDropzone onUpload={handleUpload} loading={state.loading} />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Maximum file size: 10MB. Supported formats: PNG, JPG, WEBP, GIF
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CanvasSelector
                selectedCanvas={state.selectedCanvas}
                onChange={(canvas) => dispatch({ type: "SET_CANVAS", canvas })}
                disabled={state.loading}
              />
              <Toolbar
                showGrid={state.showGrid}
                onToggleGrid={() => dispatch({ type: "SET_SHOW_GRID", show: !state.showGrid })}
                onExportPaintFile={handleExportPaintFile}
                onReset={() => dispatch({ type: "RESET" })}
                quantMethod={state.quantMethod}
                onQuantMethodChange={(method) => dispatch({ type: "SET_QUANT_METHOD", method })}
                fitMode={state.fitMode}
                onFitModeChange={(mode) => dispatch({ type: "SET_FIT_MODE", mode })}
                paddingColor={state.paddingColorPreview}
                onPaddingColorPreview={(color) => dispatch({ type: "SET_PADDING_PREVIEW", color })}
                onPaddingColorChange={(color) => dispatch({ type: "SET_PADDING_COLOR", color })}
                disabled={state.loading}
              />
            </div>

            <ImageComparison
              originalUrl={state.preprocessedUrl}
              quantizedUrl={state.quantizedUrl}
              showGrid={state.showGrid}
              cellsX={state.selectedCanvas.cellsX}
              cellsY={state.selectedCanvas.cellsY}
            />

            <PalettesSection />
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-background/80">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          paint-quant — Built with{" "}
          <HeartIcon className="mx-0.5 inline-block size-3.5 text-accent" /> React + shadcn/ui +
          TailwindCSS
        </div>
      </footer>
    </div>
  );
}

export default App;
