import { Card, CardContent } from "@/components/ui/card";
import { SwatchBookIcon } from "lucide-react";

interface PaletteDisplayProps {
  title: string;
  colors: readonly [number, number, number][];
}

export function PaletteDisplay({ title, colors }: PaletteDisplayProps) {
  return (
    <Card className="min-w-[200px] flex-1">
      <CardContent className="pt-(--card-spacing)">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <SwatchBookIcon className="size-4 text-accent" />
          {title}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {colors.map(([r, g, b], i) => (
            <div
              key={i}
              className="size-8 cursor-help rounded-lg border border-border transition-transform hover:scale-110"
              style={{ backgroundColor: `rgb(${r},${g},${b})` }}
              title={`rgb(${r}, ${g}, ${b})`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
