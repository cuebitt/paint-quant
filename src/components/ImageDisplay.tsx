import { Card, CardContent } from "@/components/ui/card";

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
      <CardContent className="pt-(--card-spacing)">
        <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
        <div className="relative overflow-hidden rounded-xl border border-border bg-muted/50 transition-[border-radius] hover:rounded-none">
          <img src={imageUrl} alt={title} className="image-rendering-pixelated h-auto w-full" />
          {showGrid && (
            <div
              className="pointer-events-none absolute inset-0 z-10 divide-x divide-y divide-black"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cellsX}, 1fr)`,
                gridTemplateRows: `repeat(${cellsY}, 1fr)`,
                gap: "1px",
              }}
            >
              {gridCells.map((_, i) => (
                <div key={i} className="size-full" />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
