import { ImageDisplay } from "./ImageDisplay";

interface ImageComparisonProps {
  originalUrl: string | null;
  quantizedUrl: string | null;
  showGrid: boolean;
  cellsX: number;
  cellsY: number;
}

export function ImageComparison({
  originalUrl,
  quantizedUrl,
  showGrid,
  cellsX,
  cellsY,
}: ImageComparisonProps) {
  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      <ImageDisplay imageUrl={originalUrl} title="Original" className="flex-1" />
      <ImageDisplay
        imageUrl={quantizedUrl}
        title="Quantized (32 colors)"
        showGrid={showGrid}
        cellsX={cellsX}
        cellsY={cellsY}
        className="flex-1"
      />
    </div>
  );
}
