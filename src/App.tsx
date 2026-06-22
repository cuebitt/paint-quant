import { useReducer, useEffect, useRef, useCallback } from "react";
import { PaintBucketIcon, HeartIcon, ImageIcon, UploadIcon, Grid3x3Icon } from "lucide-react";
import type { QuantMethod, QuantizeOptions } from "@/quantize";
import { preprocessImageForCanvas, preprocessForDisplay } from "@/preprocess";
import type { ResizeOptions } from "@/preprocess";
import type { CanvasType, ImageFitMode } from "@/types";
import { CANVAS_TYPES } from "@/types";
import { writePaintFile, readPaintFile, getCanvasTypeIndex } from "@/paint-nbt";
import type { PaintingData } from "@/paint-nbt";
import type { RGB } from "@/palette";
import { UploadDropzone } from "@/components/UploadDropzone";
import { CanvasSelector } from "@/components/CanvasSelector";
import { Toolbar } from "@/components/Toolbar";
import { ImageComparison } from "@/components/ImageComparison";
import { PalettesSection } from "@/components/PalettesSection";
import { ModeToggle } from "@/components/ModeToggle";
import { AboutDialog } from "@/components/AboutDialog";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PaddingColorPicker } from "@/components/PaddingColorPicker";
import { appReducer, initialState } from "@/app-state";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
          dispatch({
            type: "SET_ERROR",
            error: "Failed to get output canvas context",
          });
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
    async (
      img: HTMLImageElement,
      canvas: CanvasType,
      method: QuantMethod,
      mode: ImageFitMode,
      padding: RGB,
      quantEnabled: boolean,
      quantOptions: QuantizeOptions,
      resizeOptions: ResizeOptions,
    ) => {
      try {
        const processedData = await preprocessImageForCanvas(
          img,
          canvas,
          mode,
          padding,
          resizeOptions,
        );
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

        if (!quantEnabled) {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = processedData.width;
          tempCanvas.height = processedData.height;
          const tempCtx = tempCanvas.getContext("2d");
          if (!tempCtx) {
            dispatch({
              type: "SET_ERROR",
              error: "Failed to get output canvas context",
            });
            return;
          }
          tempCtx.putImageData(processedData, 0, 0);

          quantizedDataRef.current = {
            quantized: processedData,
            adaptivePalette: [],
          };
          dispatch({
            type: "SET_RESULT",
            preprocessed: pendingPreprocessedRef.current ?? "",
            processed: tempCanvas.toDataURL(),
            adaptive: [],
          });
          pendingPreprocessedRef.current = null;
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
          options: quantOptions,
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

  const handleImportPaintFile = useCallback((file: File) => {
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

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvasType.width;
        tempCanvas.height = canvasType.height;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) throw new Error("Failed to get canvas context");
        tempCtx.putImageData(imageData, 0, 0);
        const dataUrl = tempCanvas.toDataURL();

        quantizedDataRef.current = {
          quantized: imageData,
          adaptivePalette: [],
        };
        originalImageRef.current = null;

        dispatch({ type: "SET_CANVAS", canvas: canvasType });
        dispatch({ type: "SET_TITLE", title: painting.title });
        dispatch({ type: "SET_AUTHOR", author: painting.author });
        dispatch({
          type: "SET_SIGNED",
          signed: painting.generation === 1 && painting.version === 2,
        });
        dispatch({
          type: "SET_RESULT",
          preprocessed: dataUrl,
          processed: dataUrl,
          adaptive: [],
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
  }, []);

  const handleUpload = useCallback(
    (file: File) => {
      if (file.name.endsWith(".paint")) {
        handleImportPaintFile(file);
        return;
      }
      dispatch({ type: "SET_LOADING", loading: true });
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          originalImageRef.current = img;
          dispatch({ type: "SET_ORIGINAL", url: reader.result as string });
          void processImage(
            img,
            state.selectedCanvas,
            state.quantMethod,
            state.fitMode,
            state.paddingColor,
            state.quantizationEnabled,
            {
              colors: state.adaptiveColorCount,
              includeFixedPalette: state.includeFixedPalette,
            },
            { filter: state.resizeFilter, unsharpAmount: state.unsharpAmount },
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
    [
      state.selectedCanvas,
      state.quantMethod,
      state.fitMode,
      state.paddingColor,
      state.quantizationEnabled,
      state.adaptiveColorCount,
      state.includeFixedPalette,
      state.resizeFilter,
      state.unsharpAmount,
      processImage,
      handleImportPaintFile,
    ],
  );

  useEffect(() => {
    if (originalImageRef.current && state.originalUrl) {
      dispatch({ type: "SET_LOADING", loading: true });
      void processImage(
        originalImageRef.current,
        state.selectedCanvas,
        state.quantMethod,
        state.fitMode,
        state.paddingColor,
        state.quantizationEnabled,
        {
          colors: state.adaptiveColorCount,
          includeFixedPalette: state.includeFixedPalette,
        },
        { filter: state.resizeFilter, unsharpAmount: state.unsharpAmount },
      );
    }
  }, [
    state.selectedCanvas,
    state.originalUrl,
    state.quantMethod,
    state.fitMode,
    state.paddingColor,
    state.quantizationEnabled,
    state.adaptiveColorCount,
    state.includeFixedPalette,
    state.resizeFilter,
    state.unsharpAmount,
    processImage,
  ]);

  const handleExportPaintFile = useCallback(async () => {
    if (!quantizedDataRef.current) return;

    const { quantized } = quantizedDataRef.current;
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
  }, [state.selectedCanvas, state.title, state.author, state.signed]);

  const handleExportPng = useCallback(() => {
    if (!quantizedDataRef.current) return;

    const { quantized } = quantizedDataRef.current;
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
  }, []);

  const hasResults = state.originalUrl && state.preprocessedUrl && state.quantizedUrl;

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent p-2">
                <PaintBucketIcon className="size-6 text-accent-foreground" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">paintcraft</h1>
                <p className="text-xs text-muted-foreground">
                  Resize, quantize, and export images as paint files
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <AboutDialog />
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
                Maximum file size: 10MB. Supported formats: PNG, JPG, WEBP, GIF, .paint
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <CanvasSelector
                    selectedCanvas={state.selectedCanvas}
                    onChange={(canvas) => dispatch({ type: "SET_CANVAS", canvas })}
                    disabled={state.loading}
                  />
                  <Separator orientation="vertical" className="h-5" />
                  <PaddingColorPicker
                    selectedColor={state.paddingColorPreview}
                    onPreview={(color) => dispatch({ type: "SET_PADDING_PREVIEW", color })}
                    onCommit={(color) => dispatch({ type: "SET_PADDING_COLOR", color })}
                  />
                  <Separator orientation="vertical" className="h-5" />
                  <div className="flex items-center gap-2">
                    <Switch
                      id="grid-toggle"
                      checked={state.showGrid}
                      onCheckedChange={() =>
                        dispatch({
                          type: "SET_SHOW_GRID",
                          show: !state.showGrid,
                        })
                      }
                    />
                    <Label htmlFor="grid-toggle" className="flex items-center gap-1.5 text-sm">
                      <Grid3x3Icon className="size-3.5 text-muted-foreground" />
                      Grid
                    </Label>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span>
                            <Button
                              variant="secondary"
                              className="w-fit"
                              onClick={handleExportPaintFile}
                              disabled={
                                state.loading ||
                                (state.signed && (state.author === "" || state.title === ""))
                              }
                            >
                              <PaintBucketIcon data-icon="inline-start" />
                              Export .paint
                            </Button>
                          </span>
                        }
                      ></TooltipTrigger>
                      {state.signed && (state.author === "" || state.title === "") && (
                        <TooltipContent>
                          Title and author are required for signed paintings
                        </TooltipContent>
                      )}
                    </Tooltip>
                    <Button variant="secondary" onClick={handleExportPng} disabled={state.loading}>
                      <ImageIcon data-icon="inline-start" />
                      Export PNG
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => dispatch({ type: "RESET" })}
                      disabled={state.loading}
                    >
                      <UploadIcon data-icon="inline-start" />
                      Upload new
                    </Button>
                  </div>
                </div>
                <Toolbar
                  showGrid={state.showGrid}
                  onToggleGrid={() => dispatch({ type: "SET_SHOW_GRID", show: !state.showGrid })}
                  quantMethod={state.quantMethod}
                  onQuantMethodChange={(method) => dispatch({ type: "SET_QUANT_METHOD", method })}
                  fitMode={state.fitMode}
                  onFitModeChange={(mode) => dispatch({ type: "SET_FIT_MODE", mode })}
                  disabled={state.loading}
                  quantizationEnabled={state.quantizationEnabled}
                  onQuantizationEnabledChange={(enabled) =>
                    dispatch({ type: "SET_QUANTIZATION_ENABLED", enabled })
                  }
                  adaptiveColorCount={state.adaptiveColorCount}
                  onAdaptiveColorCountChange={(count) =>
                    dispatch({ type: "SET_ADAPTIVE_COLOR_COUNT", count })
                  }
                  includeFixedPalette={state.includeFixedPalette}
                  onIncludeFixedPaletteChange={(include) =>
                    dispatch({ type: "SET_INCLUDE_FIXED_PALETTE", include })
                  }
                  resizeFilter={state.resizeFilter}
                  onResizeFilterChange={(filter) => dispatch({ type: "SET_RESIZE_FILTER", filter })}
                  unsharpAmount={state.unsharpAmount}
                  onUnsharpAmountChange={(amount) =>
                    dispatch({ type: "SET_UNSHARP_AMOUNT", amount })
                  }
                  title={state.title}
                  onTitleChange={(title) => dispatch({ type: "SET_TITLE", title })}
                  author={state.author}
                  onAuthorChange={(author) => dispatch({ type: "SET_AUTHOR", author })}
                  signed={state.signed}
                  onSignedChange={(signed) => dispatch({ type: "SET_SIGNED", signed })}
                />
              </div>
              <ImageComparison
                originalUrl={state.preprocessedUrl}
                quantizedUrl={state.quantizedUrl}
                showGrid={state.showGrid}
                cellsX={state.selectedCanvas.cellsX}
                cellsY={state.selectedCanvas.cellsY}
                colorCount={state.quantizationEnabled ? state.adaptiveColorCount : 0}
                quantizationEnabled={state.quantizationEnabled}
              />

              {state.quantizationEnabled && (
                <PalettesSection
                  adaptivePalette={state.adaptivePalette}
                  adaptiveColorCount={state.adaptiveColorCount}
                />
              )}
            </div>
          )}
        </main>

        <footer className="border-t border-border bg-background/80">
          <div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
            paintcraft - Built with{" "}
            <HeartIcon className="mx-0.5 inline-block size-3.5 text-accent" /> React + shadcn/ui +
            TailwindCSS
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}

export default App;
