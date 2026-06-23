import { useReducer, useEffect, useRef, useCallback } from "preact/hooks";
import type { QuantMethod, QuantizeOptions } from "@/quantize";
import type { CanvasType, ImageFitMode } from "@/types";
import type { RGB } from "@/palette";
import { AppHeader } from "@/components/AppHeader";
import { UploadView } from "@/components/UploadView";
import { ResultsToolbar } from "@/components/ResultsToolbar";
import { ImageComparison } from "@/components/ImageComparison";
import { PalettesSection } from "@/components/PalettesSection";
import { TooltipProvider } from "@/components/ui/tooltip";
import { appReducer, initialState } from "@/app-state";
import { useImageProcessor } from "@/hooks/useImageProcessor";
import { useAppCallbacks } from "@/hooks/useAppCallbacks";
import type { ResizeOptions } from "@/preprocess";

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

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
        const workers = useImageProcessorRef.current;
        if (!workers?.workerRef.current) {
          dispatch({ type: "SET_ERROR", error: "Worker not initialized" });
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
      }
    },
    [],
  );

  const workers = useImageProcessor(dispatch, processImage, stateRef);
  const useImageProcessorRef = useRef(workers);
  useImageProcessorRef.current = workers;

  const { handleUpload, handleExportPaintFile, handleExportPng } = useAppCallbacks(
    dispatch,
    state,
    stateRef,
    processImage,
    workers,
  );

  useEffect(() => {
    if (workers.originalImageRef.current && stateRef.current.originalUrl) {
      dispatch({ type: "SET_LOADING", loading: true });
      const s = stateRef.current;
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
    processImage,
    workers.originalImageRef,
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
            <UploadView onUpload={handleUpload} loading={state.loading} />
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
