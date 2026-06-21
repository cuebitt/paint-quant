import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SwatchBookIcon } from "lucide-react";

interface PaletteDisplayProps {
  title: string;
}

export function PaletteDisplay({ title }: PaletteDisplayProps) {
  return (
    <Card className="min-w-[200px] flex-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <SwatchBookIcon className="size-4 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-20 items-center justify-center text-muted-foreground">
          Color palette preview removed - using PopoverPicker for color selection
        </div>
      </CardContent>
    </Card>
  );
}
