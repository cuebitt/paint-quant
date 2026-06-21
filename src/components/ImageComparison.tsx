import { ImageDisplay } from "./ImageDisplay";

interface ImageComparisonProps {
  originalUrl: string | null;
  quantizedUrl: string | null;
  showGrid: boolean;
  cellsX: number;
  cellsY: number;
  colorCount: number;
}

export function ImageComparison({
  originalUrl,
  quantizedUrl,
  showGrid,
  cellsX,
  cellsY,
  colorCount,
}: ImageComparisonProps) {
  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      <ImageDisplay imageUrl={originalUrl} title="Original" className="flex-1" />
      <ImageDisplay
        imageUrl={quantizedUrl}
        title={`Quantized (${colorCount} colors)`}
        showGrid={showGrid}
        cellsX={cellsX}
        cellsY={cellsY}
        className="flex-1"
      />
    </div>
  );
}
