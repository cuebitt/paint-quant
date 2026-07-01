import { type ImageFitMode, FIT_MODES } from "@/types";
import { Maximize2Icon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface FitModeSelectorProps {
  selectedMode: ImageFitMode;
  onChange: (mode: ImageFitMode) => void;
  disabled?: boolean;
  showTooltips?: boolean;
}

export function FitModeSelector({
  selectedMode,
  onChange,
  disabled = false,
  showTooltips = true,
}: FitModeSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-foreground">
        <Maximize2Icon className="size-4 text-accent" />
        Fit:
      </span>
      <Tooltip disabled={!showTooltips}>
        <TooltipTrigger
          render={
            <Select
              value={selectedMode}
              onValueChange={(value) => onChange(value as ImageFitMode)}
              items={FIT_MODES}
              disabled={disabled}
            >
              <SelectTrigger className="min-w-45">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {FIT_MODES.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          }
        />
        <TooltipContent side="bottom" sideOffset={8}>
          How the image fits within the canvas dimensions
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
