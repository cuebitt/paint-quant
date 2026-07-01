import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

interface ImageDisplayProps {
  imageUrl: string | null;
  title: string;
  showGrid?: boolean;
  cellsX?: number;
  cellsY?: number;
  className?: string;
  showTransparencyGrid?: boolean;
}

export function ImageDisplay({
  imageUrl,
  title,
  showGrid = false,
  cellsX = 1,
  cellsY = 1,
  className = "",
  showTransparencyGrid = false,
}: ImageDisplayProps) {
  if (!imageUrl) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ImageIcon className="size-4 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`relative overflow-hidden rounded-xl border-2 border-border transition-[border-radius] hover:rounded-none ${showTransparencyGrid ? "transparency-grid" : "bg-muted/50"}`}
          style={{ aspectRatio: `${cellsX} / ${cellsY}` }}
        >
          <img
            src={imageUrl}
            alt={`${title} preview`}
            className="image-rendering-pixelated h-full w-full object-contain"
          />
          {showGrid && (
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(90deg, var(--accent) 0, var(--accent) 1px, transparent 1px, transparent ${100 / cellsX}%),
                  repeating-linear-gradient(0deg, var(--accent) 0, var(--accent) 1px, transparent 1px, transparent ${100 / cellsY}%)
                `,
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
