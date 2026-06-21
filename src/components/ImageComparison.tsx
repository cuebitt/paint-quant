import { ImageDisplay } from "@/components/ImageDisplay";

interface ImageComparisonProps {
  originalUrl: string | null;
  quantizedUrl: string | null;
  showGrid: boolean;
  cellsX: number;
  cellsY: number;
  colorCount: number;
  quantizationEnabled: boolean;
}

export function ImageComparison({
  originalUrl,
  quantizedUrl,
  showGrid,
  cellsX,
  cellsY,
  colorCount,
  quantizationEnabled,
}: ImageComparisonProps) {
  const quantizedTitle = quantizationEnabled
    ? `Resized + Quantized (${colorCount} colors)`
    : "Resized";

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      <ImageDisplay imageUrl={originalUrl} title="Original" className="flex-1" />
      <ImageDisplay
        imageUrl={quantizedUrl}
        title={quantizedTitle}
        showGrid={showGrid}
        cellsX={cellsX}
        cellsY={cellsY}
        className="flex-1"
      />
    </div>
  );
}
