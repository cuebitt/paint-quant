import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

interface ImageDisplayProps {
  imageUrl: string | null;
  title: string;
  showGrid?: boolean;
  cellsX?: number;
  cellsY?: number;
  className?: string;
}

export function ImageDisplay({
  imageUrl,
  title,
  showGrid = false,
  cellsX = 1,
  cellsY = 1,
  className = "",
}: ImageDisplayProps) {
  if (!imageUrl) return null;

  const gridCells = Array.from({ length: cellsX * cellsY });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ImageIcon className="size-4 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden rounded-xl border-2 border-border bg-muted/50 transition-[border-radius] hover:rounded-none">
          <img
            src={imageUrl}
            alt={`${title} - quantized image preview`}
            className="image-rendering-pixelated h-auto w-full"
          />
          {showGrid && (
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cellsX}, 1fr)`,
                gridTemplateRows: `repeat(${cellsY}, 1fr)`,
              }}
            >
              {gridCells.map((_, i) => (
                <div
                  key={i}
                  className="size-auto border bg-transparent"
                  style={{
                    borderColor: "var(--accent)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
