import { PaintbrushIcon } from "lucide-react";
import { rgbToHex, type RGB } from "@/core/palette";
import { PopoverPicker } from "@/components/PopoverPicker";

interface PaddingColorPickerProps {
  selectedColor: RGB;
  onPreview: (color: RGB) => void;
  onCommit: (color: RGB) => void;
}

const hexToRgb = (hex: string): RGB => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

export function PaddingColorPicker({
  selectedColor,
  onPreview,
  onCommit,
}: PaddingColorPickerProps) {
  const hexColor = rgbToHex(selectedColor);

  return (
    <div className="flex items-center gap-3">
      <PaintbrushIcon className="size-4 text-accent" />
      <span className="text-sm font-medium whitespace-nowrap text-foreground">Padding:</span>
      <PopoverPicker
        color={hexColor}
        onChange={(hex) => onPreview(hexToRgb(hex))}
        onChangeEnd={(hex) => onCommit(hexToRgb(hex))}
      />
    </div>
  );
}
