import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SwatchBookIcon } from "lucide-react";

interface PaletteDisplayProps {
  title: string;
  colors: readonly [number, number, number][];
}

export function PaletteDisplay({ title, colors }: PaletteDisplayProps) {
  return (
    <Card className="min-w-[200px] flex-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <SwatchBookIcon className="size-4 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
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
