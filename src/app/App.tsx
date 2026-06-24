import { useEffect, useRef, useCallback } from "preact/hooks";
import { AppHeader } from "@/components/AppHeader";
import { UploadDropzone } from "@/components/UploadDropzone";
import { ResultsToolbar } from "@/components/ResultsToolbar";
import { ImageComparison } from "@/components/ImageComparison";
import { PalettesSection } from "@/components/PalettesSection";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useImageProcessor, type ProcessImageFn } from "@/hooks/useImageProcessor";
import { useAppCallbacks } from "@/hooks/useAppCallbacks";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";

function App() {
  const { state, dispatch, undo, redo } = useUndoRedo();
  const stateRef = useRef(state);
  stateRef.current = state;

  useLocalStorage(state, "dark");

  const { startTimer, endTimer } = usePerformanceMonitor();

  const toggleGrid = useCallback(() => {
    dispatch({ type: "SET_SHOW_GRID", show: !state.showGrid });
  }, [state.showGrid, dispatch]);

  const toggleQuantize = useCallback(() => {
    dispatch({ type: "SET_QUANTIZATION_ENABLED", enabled: !state.quantizationEnabled });
  }, [state.quantizationEnabled, dispatch]);

  const processImage = useCallback<ProcessImageFn>(
    async (img, canvas, method, mode, padding, quantEnabled, quantOptions, resizeOptions) => {
      try {
        const workers = workersRef.current;
        if (!workers?.workerRef.current) {
          dispatch({ type: "SET_ERROR", error: "Image processor not ready" });
          return;
        }

        workers.pendingProcessRef.current = {
          displayDataUrl: "",
          method,
          quantEnabled,
          quantOptions,
        };

        const preprocessBitmap = await createImageBitmap(img);
        workers.workerRef.current.postMessage({
          type: "preprocess",
          imageBitmap: preprocessBitmap,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          fitMode: mode,
          paddingColor: padding,
          resizeFilter: resizeOptions.filter,
          unsharpAmount: resizeOptions.unsharpAmount,
        });

        const displayBitmap = await createImageBitmap(img);
        workers.workerRef.current.postMessage({
          type: "display",
          imageBitmap: displayBitmap,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          fitMode: mode,
          paddingColor: padding,
        });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          error: err instanceof Error ? err.message : "Failed to process image",
        });
      } finally {
        endTimer("process-image");
      }
    },
    [endTimer, dispatch],
  );

  const workers = useImageProcessor(dispatch, processImage, stateRef);
  const workersRef = useRef(workers);
  workersRef.current = workers;

  const { handleUpload, handleExportPaintFile, handleExportPng } = useAppCallbacks(
    dispatch,
    state,
    stateRef,
    processImage,
    workers,
  );

  useKeyboardShortcuts({
    "ctrl+z": undo,
    "ctrl+shift+z": redo,
    "ctrl+y": redo,
    g: toggleGrid,
    q: toggleQuantize,
    "ctrl+shift+e": handleExportPaintFile,
    "ctrl+shift+p": handleExportPng,
    "ctrl+shift+c": async () => {
      const result = workers.quantizedDataRef.current;
      if (!result) return;

      const { quantized } = result;
      startTimer("copy-to-clipboard");
      const canvas = new OffscreenCanvas(quantized.width, quantized.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.putImageData(quantized, 0, 0);
      try {
        const blob = await canvas.convertToBlob({ type: "image/png" });
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      } catch {
        // clipboard unsupported or denied
      }
      endTimer("copy-to-clipboard");
    },
  });

  useEffect(() => {
    if (workers.originalImageRef.current && stateRef.current.originalUrl) {
      dispatch({ type: "SET_LOADING", loading: true });
      const s = stateRef.current;
      startTimer("process-image");
      void processImage(
        workers.originalImageRef.current,
        s.selectedCanvas,
        s.quantMethod,
        s.fitMode,
        s.paddingColor,
        s.quantizationEnabled,
        { colors: s.adaptiveColorCount, includeFixedPalette: s.includeFixedPalette },
        { filter: s.resizeFilter, unsharpAmount: s.unsharpAmount },
      );
    }
  }, [
    state.selectedCanvas,
    state.quantMethod,
    state.fitMode,
    state.paddingColor,
    state.quantizationEnabled,
    state.adaptiveColorCount,
    state.includeFixedPalette,
    state.resizeFilter,
    state.unsharpAmount,
    dispatch,
    processImage,
    workers.originalImageRef,
    startTimer,
  ]);

  const hasResults = state.originalUrl && state.preprocessedUrl && state.quantizedUrl;

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />

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
                Maximum file size: 10MB. Supported formats: PNG, JPG, WEBP, GIF, .paint, .ase,
                .aseprite, .psd, .svg, .piskel, .pixil
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              <ResultsToolbar
                selectedCanvas={state.selectedCanvas}
                onCanvasChange={(canvas) => dispatch({ type: "SET_CANVAS", canvas })}
                paddingColorPreview={state.paddingColorPreview}
                onPaddingPreview={(color) => dispatch({ type: "SET_PADDING_PREVIEW", color })}
                onPaddingCommit={(color) => dispatch({ type: "SET_PADDING_COLOR", color })}
                showGrid={state.showGrid}
                onToggleGrid={() => dispatch({ type: "SET_SHOW_GRID", show: !state.showGrid })}
                quantMethod={state.quantMethod}
                onQuantMethodChange={(method) => dispatch({ type: "SET_QUANT_METHOD", method })}
                fitMode={state.fitMode}
                onFitModeChange={(mode) => dispatch({ type: "SET_FIT_MODE", mode })}
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
                onUnsharpAmountChange={(amount) => dispatch({ type: "SET_UNSHARP_AMOUNT", amount })}
                title={state.title}
                onTitleChange={(title) => dispatch({ type: "SET_TITLE", title })}
                author={state.author}
                onAuthorChange={(author) => dispatch({ type: "SET_AUTHOR", author })}
                signed={state.signed}
                onSignedChange={(signed) => dispatch({ type: "SET_SIGNED", signed })}
                loading={state.loading}
                onExportPaint={handleExportPaintFile}
                onExportPng={handleExportPng}
                onReset={() => dispatch({ type: "RESET" })}
              />
              <ImageComparison
                originalUrl={state.originalUrl}
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
            paintcraft - Built with React + shadcn/ui + TailwindCSS
            <span className="mx-2">·</span>
            <a
              href="https://github.com/cuebitt/paintcraft"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              GitHub
            </a>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}

export default App;
