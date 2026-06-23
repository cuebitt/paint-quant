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
            alt={`${title} - quantized preview`}
            className="image-rendering-pixelated h-auto w-full"
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
