import { useState, useEffect, useRef, useCallback } from "react";
import { PaintBucketIcon } from "lucide-react";
import { quantize } from "./quantize";
import {
  preprocessImageForCanvas,
  serializeQuantizedImage,
  type CanvasType,
  CANVAS_TYPES,
} from "./utils";
import { UploadDropzone } from "./components/UploadDropzone";
import { CanvasSelector } from "./components/CanvasSelector";
import { Toolbar } from "./components/Toolbar";
import { ImageComparison } from "./components/ImageComparison";
import { PalettesSection } from "./components/PalettesSection";

function App() {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [quantizedUrl, setQuantizedUrl] = useState<string | null>(null);
  const [adaptivePalette, setAdaptivePalette] = useState<readonly [number, number, number][]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCanvas, setSelectedCanvas] = useState<CanvasType>(CANVAS_TYPES[0]);
  const [showGrid, setShowGrid] = useState(true);

  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const quantizedDataRef = useRef<{
    quantized: ImageData;
    adaptivePalette: readonly [number, number, number][];
  } | null>(null);

  const processImage = useCallback((img: HTMLImageElement, canvas: CanvasType) => {
    const processedData = preprocessImageForCanvas(img, canvas);
    const result = quantize(processedData);

    quantizedDataRef.current = {
      quantized: result.quantized,
      adaptivePalette: result.adaptivePalette,
    };

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.putImageData(result.quantized, 0, 0);

    const dataUrl = tempCanvas.toDataURL();
    setProcessedImageUrl(dataUrl);
    setQuantizedUrl(dataUrl);
    setAdaptivePalette(result.adaptivePalette);
    setLoading(false);
  }, []);

  const handleUpload = (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        setOriginalUrl(reader.result as string);
        processImage(img, selectedCanvas);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (originalImageRef.current && originalUrl) {
      setLoading(true);
      processImage(originalImageRef.current, selectedCanvas);
    }
  }, [selectedCanvas, originalUrl, processImage]);

  const handleReset = useCallback(() => {
    originalImageRef.current = null;
    quantizedDataRef.current = null;
    setOriginalUrl(null);
    setProcessedImageUrl(null);
    setQuantizedUrl(null);
    setAdaptivePalette([]);
    setLoading(false);
  }, []);

  const handleExport = useCallback(() => {
    if (!quantizedDataRef.current) return;
    const json = serializeQuantizedImage({
      quantized: quantizedDataRef.current.quantized,
      adaptivePalette: quantizedDataRef.current.adaptivePalette,
      canvasType: selectedCanvas,
    });
    void navigator.clipboard.writeText(JSON.stringify(json, null, 2));
  }, [selectedCanvas]);

  const hasResults = originalUrl && processedImageUrl && quantizedUrl;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/10 p-2">
              <PaintBucketIcon className="size-6 text-accent" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">paint-quant</h1>
              <p className="text-xs text-muted-foreground">
                Quantize images to 32 colors (16 fixed + 16 adaptive)
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!hasResults ? (
          <div className="mx-auto max-w-2xl">
            <UploadDropzone onUpload={handleUpload} loading={loading} />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Maximum file size: 10MB. Supported formats: PNG, JPG, WEBP, GIF
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CanvasSelector
                selectedCanvas={selectedCanvas}
                onChange={setSelectedCanvas}
                disabled={loading}
              />
              <Toolbar
                showGrid={showGrid}
                onToggleGrid={() => setShowGrid(!showGrid)}
                onExport={handleExport}
                onReset={handleReset}
                disabled={loading}
              />
            </div>

            <ImageComparison
              originalUrl={originalUrl}
              quantizedUrl={quantizedUrl}
              showGrid={showGrid}
              cellsX={selectedCanvas.cellsX}
              cellsY={selectedCanvas.cellsY}
            />

            <PalettesSection adaptivePalette={adaptivePalette} />
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-background/80">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          paint-quant — Built with React + shadcn/ui + TailwindCSS
        </div>
      </footer>
    </div>
  );
}

export default App;
