import { type CanvasType, CANVAS_TYPES } from "@/types";
import { Grid3x3Icon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CanvasSelectorProps {
  selectedCanvas: CanvasType;
  onChange: (canvas: CanvasType) => void;
  disabled?: boolean;
}

export function CanvasSelector({
  selectedCanvas,
  onChange,
  disabled = false,
}: CanvasSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-foreground">
        <Grid3x3Icon className="size-4 text-accent" />
        Canvas:
      </span>
      <Select
        value={selectedCanvas.name}
        onValueChange={(value) => {
          const canvas = CANVAS_TYPES.find((c) => c.name === value);
          if (canvas) onChange(canvas);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="min-w-45">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {CANVAS_TYPES.map((canvas) => (
              <SelectItem key={canvas.name} value={canvas.name}>
                {canvas.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
