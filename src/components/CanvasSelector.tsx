import { type CanvasType, CANVAS_TYPES, ALLOWED_CANVAS_TYPES_FOR_FORMAT } from "@/types";
import type { PaintFormat } from "@/types";
import { Grid3x3Icon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface CanvasSelectorProps {
  selectedCanvas: CanvasType;
  onChange: (canvas: CanvasType) => void;
  disabled?: boolean;
  paintFormat: PaintFormat;
  showTooltips?: boolean;
}

export function CanvasSelector({
  selectedCanvas,
  onChange,
  disabled = false,
  paintFormat,
  showTooltips = true,
}: CanvasSelectorProps) {
  const allowedTypes = ALLOWED_CANVAS_TYPES_FOR_FORMAT[paintFormat];
  const filteredCanvases = CANVAS_TYPES.filter((c) => allowedTypes.has(c.name));

  const selectedAllowed = allowedTypes.has(selectedCanvas.name);

  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-foreground">
        <Grid3x3Icon className="size-4 text-accent" />
        Canvas:
      </span>
      <Tooltip disabled={!showTooltips}>
        <TooltipTrigger
          render={
            <Select
              value={selectedAllowed ? selectedCanvas.name : filteredCanvases[0]?.name}
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
                  {filteredCanvases.map((canvas) => (
                    <SelectItem key={canvas.name} value={canvas.name}>
                      {canvas.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          }
        />
        <TooltipContent side="bottom" sideOffset={8}>
          Choose the painting canvas size
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
