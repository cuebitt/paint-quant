import { PaintbrushIcon } from "lucide-react";
import { rgbToHex, type RGB } from "@/palette";
import { PopoverPicker } from "@/components/PopoverPicker";

interface PaddingColorPickerProps {
  selectedColor: RGB;
  onPreview: (color: RGB) => void;
  onCommit: (color: RGB) => void;
}

export function PaddingColorPicker({
  selectedColor,
  onPreview,
  onCommit,
}: PaddingColorPickerProps) {
  const hexColor = rgbToHex(selectedColor);

  const toRgb = (hex: string): RGB => {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return [r, g, b];
  };

  return (
    <div className="flex items-center gap-3">
      <PaintbrushIcon className="size-4 text-accent" />
      <span className="text-sm font-medium whitespace-nowrap text-foreground">Padding:</span>
      <PopoverPicker
        color={hexColor}
        onChange={(hex) => onPreview(toRgb(hex))}
        onChangeEnd={(hex) => onCommit(toRgb(hex))}
      />
    </div>
  );
}
