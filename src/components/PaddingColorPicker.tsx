import { FIXED_PALETTE, type RGB } from "../palette";
import { PaintbrushIcon } from "lucide-react";

interface PaddingColorPickerProps {
  selectedColor: RGB;
  onChange: (color: RGB) => void;
  disabled?: boolean;
}

export function PaddingColorPicker({
  selectedColor,
  onChange,
  disabled = false,
}: PaddingColorPickerProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-foreground">
        <PaintbrushIcon className="size-4 text-accent" />
        Padding:
      </span>
      <div className="flex gap-1" role="radiogroup" aria-label="Padding color">
        {FIXED_PALETTE.map(([r, g, b], i) => {
          const isSelected =
            selectedColor[0] === r && selectedColor[1] === g && selectedColor[2] === b;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Color rgb(${r}, ${g}, ${b})`}
              className={`size-6 rounded-md border transition-all ${
                isSelected
                  ? "scale-110 ring-2 ring-foreground ring-offset-1"
                  : "border-border hover:scale-110"
              } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              style={{ backgroundColor: `rgb(${r},${g},${b})` }}
              onClick={() => !disabled && onChange([r, g, b])}
              disabled={disabled}
            />
          );
        })}
      </div>
    </div>
  );
}
