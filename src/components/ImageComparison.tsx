import { memo } from "preact/compat";
import { ImageDisplay } from "@/components/ImageDisplay";

interface ImageComparisonProps {
  originalUrl: string | null;
  quantizedUrl: string | null;
  showGrid: boolean;
  cellsX: number;
  cellsY: number;
  colorCount: number;
  quantizationEnabled: boolean;
  showTransparencyGrid: boolean;
}

export const ImageComparison = memo(function ImageComparison({
  originalUrl,
  quantizedUrl,
  showGrid,
  cellsX,
  cellsY,
  colorCount,
  quantizationEnabled,
  showTransparencyGrid,
}: ImageComparisonProps) {
  const quantizedTitle = quantizationEnabled
    ? `Resized + Quantized (${colorCount} colors)`
    : "Resized";

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      <ImageDisplay
        imageUrl={originalUrl}
        title="Original"
        cellsX={cellsX}
        cellsY={cellsY}
        className="flex-1"
        showTransparencyGrid={showTransparencyGrid}
      />
      <ImageDisplay
        imageUrl={quantizedUrl}
        title={quantizedTitle}
        showGrid={showGrid}
        cellsX={cellsX}
        cellsY={cellsY}
        className="flex-1"
        showTransparencyGrid={showTransparencyGrid}
      />
    </div>
  );
});
