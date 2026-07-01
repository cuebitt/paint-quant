import type { PaintFormat } from "@/types";
import { PAINT_FORMATS } from "@/types";
import { FileIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface PaintFormatSelectorProps {
  selectedFormat: PaintFormat;
  onChange: (format: PaintFormat) => void;
  disabled?: boolean;
  showTooltips?: boolean;
}

export function PaintFormatSelector({
  selectedFormat,
  onChange,
  disabled = false,
  showTooltips = true,
}: PaintFormatSelectorProps) {
  const selected = PAINT_FORMATS.find((f) => f.value === selectedFormat);

  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-foreground">
        <FileIcon className="size-4 text-accent" />
        Format:
      </span>
      <Tooltip disabled={!showTooltips}>
        <TooltipTrigger
          render={
            <Select
              value={selectedFormat}
              onValueChange={(value) => onChange(value as PaintFormat)}
              items={PAINT_FORMATS}
              disabled={disabled}
            >
              <SelectTrigger className="min-w-45">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {PAINT_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      <div className="flex flex-col">
                        <span>{format.label}</span>
                        <span className="text-xs text-muted-foreground">{format.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          }
        />
        <TooltipContent side="bottom" sideOffset={8}>
          {selected?.description}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
