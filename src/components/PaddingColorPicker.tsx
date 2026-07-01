import { PaintbrushIcon } from "lucide-react";
import { rgbToHex, hexToRgb, rgbaToHex, hexToRgba, type RGB } from "@/core/palette";
import { PopoverPicker } from "@/components/PopoverPicker";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface PaddingColorPickerProps {
  selectedColor: RGB;
  paddingAlpha: number;
  glass: boolean;
  showTransparencyGrid: boolean;
  onPreview: (color: RGB, alpha: number) => void;
  onCommit: (color: RGB, alpha: number) => void;
  showTooltips?: boolean;
}

export function PaddingColorPicker({
  selectedColor,
  paddingAlpha,
  glass,
  showTransparencyGrid,
  onPreview,
  onCommit,
  showTooltips = true,
}: PaddingColorPickerProps) {
  const hexColor = glass ? rgbaToHex(selectedColor, paddingAlpha) : rgbToHex(selectedColor);

  return (
    <div className="flex items-center gap-3">
      <PaintbrushIcon className="size-4 text-accent" />
      <span className="text-sm font-medium whitespace-nowrap text-foreground">Padding:</span>
      <Tooltip disabled={!showTooltips}>
        <TooltipTrigger render={<div className="flex items-center gap-2" />}>
          <PopoverPicker
            color={hexColor}
            alpha={glass}
            showTransparencyGrid={showTransparencyGrid}
            onChange={(hex) => {
              if (glass) {
                const { color, alpha } = hexToRgba(hex);
                onPreview(color, alpha);
              } else {
                onPreview(hexToRgb(hex), 1);
              }
            }}
            onChangeEnd={(hex) => {
              if (glass) {
                const { color, alpha } = hexToRgba(hex);
                onCommit(color, alpha);
              } else {
                onCommit(hexToRgb(hex), 1);
              }
            }}
          />
        </TooltipTrigger>
        <TooltipContent>Set the background color for padding areas</TooltipContent>
      </Tooltip>
    </div>
  );
}
