import { useEffect, useRef, useCallback, useMemo } from "preact/hooks";
import { AppHeader } from "@/components/AppHeader";
import { UploadDropzone } from "@/components/UploadDropzone";
import { ResultsToolbar } from "@/components/ResultsToolbar";
import { ImageComparison } from "@/components/ImageComparison";
import { PalettesSection } from "@/components/PalettesSection";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useImageProcessor, type ProcessImageFn } from "@/hooks/useImageProcessor";
import { useAppCallbacks } from "@/hooks/useAppCallbacks";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useClipboard } from "@/hooks/useClipboard";
import { preprocessImageForCanvas } from "@/core/preprocess";
import { useAppStore, getProcessImageArgs } from "@/app/store";
import { findClosestCanvas } from "@/types";
import { dispatchError } from "@/lib/helpers";

function App() {
  const state = useAppStore();
  const { undo, redo } = state;

  useLocalStorage("dark");

  const { startTimer, endTimer } = usePerformanceMonitor();

  const toggleGrid = useCallback(() => {
    useAppStore.getState().setShowGrid(!useAppStore.getState().showGrid);
  }, []);

  const toggleQuantize = useCallback(() => {
    useAppStore.getState().setQuantizationEnabled(!useAppStore.getState().quantizationEnabled);
  }, []);

  const processImage = useCallback<ProcessImageFn>(
    async (
      img,
      canvas,
      method,
      mode,
      padding,
      quantEnabled,
      quantOptions,
      resizeOptions,
      paddingAlpha,
    ) => {
      try {
        const workers = workersRef.current;
        if (!workers?.workerRef.current) {
          dispatchError(new Error("Image processor not ready"), "Image processor not ready");
          return;
        }

        workers.pendingProcessRef.current = {
          displayDataUrl: "",
          method,
          quantEnabled,
          quantOptions,
        };

        const preprocessedData = await preprocessImageForCanvas(
          img,
          canvas,
          mode,
          padding,
          resizeOptions,
          paddingAlpha,
        );
        workers.preprocessedDataRef.current = preprocessedData;

        const displayBitmap = await createImageBitmap(img);
        workers.workerRef.current.postMessage({
          type: "display",
          imageBitmap: displayBitmap,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          fitMode: mode,
          paddingColor: padding,
          paddingAlpha,
        });

        if (quantEnabled) {
          const msg = {
            type: "quantize" as const,
            imageData: {
              data: preprocessedData.data,
              width: preprocessedData.width,
              height: preprocessedData.height,
            },
            method,
            options: quantOptions,
          };
          workers.workerRef.current.postMessage(msg, [preprocessedData.data.buffer]);
        } else {
          workers.quantizedDataRef.current = { quantized: preprocessedData, adaptivePalette: [] };
          workers.pendingResultRef.current = {
            type: "preprocessed",
            processedData: preprocessedData,
          };
          workers.flushPendingResult();
        }
      } catch (err) {
        dispatchError(err, "Failed to process image");
      } finally {
        endTimer("process-image");
      }
    },
    [endTimer],
  );

  const workers = useImageProcessor(processImage);
  const workersRef = useRef(workers);
  workersRef.current = workers;

  const { handleUpload, handleExportPaintFile, handleExportPng } = useAppCallbacks(
    processImage,
    workers,
  );

  const handleCopyToClipboard = useClipboard(workers, startTimer, endTimer);

  useKeyboardShortcuts({
    "ctrl+z": undo,
    "ctrl+shift+z": redo,
    "ctrl+y": redo,
    g: toggleGrid,
    q: toggleQuantize,
    "ctrl+shift+e": handleExportPaintFile,
    "ctrl+shift+p": handleExportPng,
    "ctrl+shift+c": handleCopyToClipboard,
  });

  const reprocessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (reprocessTimeoutRef.current !== null) {
      clearTimeout(reprocessTimeoutRef.current);
    }
    reprocessTimeoutRef.current = setTimeout(() => {
      reprocessTimeoutRef.current = null;
      if (workers.originalImageRef.current && useAppStore.getState().originalUrl) {
        useAppStore.getState().setLoading(true);
        const s = useAppStore.getState();
        startTimer("process-image");
        void processImage(workers.originalImageRef.current, ...getProcessImageArgs(s));
      }
    }, 50);
    return () => {
      if (reprocessTimeoutRef.current !== null) {
        clearTimeout(reprocessTimeoutRef.current);
      }
    };
  }, [
    state.selectedCanvas,
    state.quantMethod,
    state.fitMode,
    state.paddingColor,
    state.paddingAlpha,
    state.quantizationEnabled,
    state.adaptiveColorCount,
    state.includeFixedPalette,
    state.resizeFilter,
    state.unsharpAmount,
    processImage,
    workers.originalImageRef,
    startTimer,
  ]);

  const hasResults = useMemo(
    () => state.originalUrl && state.preprocessedUrl && state.quantizedUrl,
    [state.originalUrl, state.preprocessedUrl, state.quantizedUrl],
  );

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {state.error && (
            <div
              role="alert"
              className="mx-auto mb-6 max-w-2xl rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
            >
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
                onCanvasChange={(canvas) => useAppStore.getState().setCanvas(canvas)}
                paddingColorPreview={state.paddingColorPreview}
                paddingAlpha={state.paddingAlpha}
                onPaddingPreview={(color, alpha) =>
                  useAppStore.getState().setPaddingColorPreview(color, alpha)
                }
                onPaddingCommit={(color, alpha) =>
                  useAppStore.getState().setPaddingColor(color, alpha)
                }
                showGrid={state.showGrid}
                onToggleGrid={toggleGrid}
                quantMethod={state.quantMethod}
                onQuantMethodChange={(method) => useAppStore.getState().setQuantMethod(method)}
                fitMode={state.fitMode}
                onFitModeChange={(mode) => useAppStore.getState().setFitMode(mode)}
                quantizationEnabled={state.quantizationEnabled}
                onQuantizationEnabledChange={(enabled) =>
                  useAppStore.getState().setQuantizationEnabled(enabled)
                }
                adaptiveColorCount={state.adaptiveColorCount}
                onAdaptiveColorCountChange={(count) =>
                  useAppStore.getState().setAdaptiveColorCount(count)
                }
                includeFixedPalette={state.includeFixedPalette}
                onIncludeFixedPaletteChange={(include) =>
                  useAppStore.getState().setIncludeFixedPalette(include)
                }
                resizeFilter={state.resizeFilter}
                onResizeFilterChange={(filter) => useAppStore.getState().setResizeFilter(filter)}
                unsharpAmount={state.unsharpAmount}
                onUnsharpAmountChange={(amount) => useAppStore.getState().setUnsharpAmount(amount)}
                title={state.title}
                onTitleChange={(title) => useAppStore.getState().setTitle(title)}
                author={state.author}
                onAuthorChange={(author) => useAppStore.getState().setAuthor(author)}
                signed={state.signed}
                onSignedChange={(signed) => useAppStore.getState().setSigned(signed)}
                embedOriginalImage={state.embedOriginalImage}
                onEmbedOriginalImageChange={(embed) =>
                  useAppStore.getState().setEmbedOriginalImage(embed)
                }
                paintFormat={state.paintFormat}
                onPaintFormatChange={(format) =>
                  useAppStore.getState()._set(
                    {
                      paintFormat: format,
                      selectedCanvas: findClosestCanvas(
                        useAppStore.getState().selectedCanvas,
                        format,
                      ),
                      glassPadding: useAppStore.getState().glass && format === "jop-2x",
                    },
                    "setPaintFormat",
                  )
                }
                glass={state.glass}
                onGlassChange={(glass) =>
                  useAppStore.getState()._set(
                    {
                      glass,
                      glassPadding: glass && useAppStore.getState().paintFormat === "jop-2x",
                      paddingAlpha: glass ? 0 : 1,
                    },
                    "setGlass",
                  )
                }
                sidesActive={state.sidesActive}
                onSidesActiveChange={(active) =>
                  useAppStore.getState()._set({ sidesActive: active }, "setSidesActive")
                }
                showTransparencyGrid={state.showTransparencyGrid}
                onShowTransparencyGridChange={(show) =>
                  useAppStore.getState().setShowTransparencyGrid(show)
                }
                loading={state.loading}
                onExportPaint={handleExportPaintFile}
                onExportPng={handleExportPng}
                onReset={() => useAppStore.getState().reset()}
              />
              <ImageComparison
                originalUrl={state.originalUrl}
                quantizedUrl={state.quantizedUrl}
                showGrid={state.showGrid}
                cellsX={state.selectedCanvas.cellsX}
                cellsY={state.selectedCanvas.cellsY}
                colorCount={state.quantizationEnabled ? state.adaptiveColorCount : 0}
                quantizationEnabled={state.quantizationEnabled}
                showTransparencyGrid={state.showTransparencyGrid}
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
