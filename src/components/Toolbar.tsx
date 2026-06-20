import type { QuantMethod } from "../quantize";
import type { ImageFitMode } from "../types";
import type { RGB } from "../palette";
import { QuantMethodSelector } from "./QuantMethodSelector";
import { FitModeSelector } from "./FitModeSelector";
import { PaddingColorPicker } from "./PaddingColorPicker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UploadIcon, Grid3x3Icon, PaintBucketIcon } from "lucide-react";

interface ToolbarProps {
  showGrid: boolean;
  onToggleGrid: () => void;
  onExportPaintFile: () => void;
  onReset: () => void;
  quantMethod: QuantMethod;
  onQuantMethodChange: (method: QuantMethod) => void;
  fitMode: ImageFitMode;
  onFitModeChange: (mode: ImageFitMode) => void;
  paddingColor: RGB;
  onPaddingColorChange: (color: RGB) => void;
  disabled?: boolean;
}

export function Toolbar({
  showGrid,
  onToggleGrid,
  onExportPaintFile,
  onReset,
  quantMethod,
  onQuantMethodChange,
  fitMode,
  onFitModeChange,
  paddingColor,
  onPaddingColorChange,
  disabled = false,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <QuantMethodSelector
          selectedMethod={quantMethod}
          onChange={onQuantMethodChange}
          disabled={disabled}
        />
        <FitModeSelector selectedMode={fitMode} onChange={onFitModeChange} disabled={disabled} />
        <div className="flex items-center gap-2">
          <Switch
            id="grid-toggle"
            checked={showGrid}
            onCheckedChange={onToggleGrid}
            disabled={disabled}
          />
          <Label htmlFor="grid-toggle" className="flex items-center gap-1.5 text-sm">
            <Grid3x3Icon className="size-3.5 text-muted-foreground" />
            Show Grid
          </Label>
        </div>
        <Button variant="secondary" onClick={onExportPaintFile} disabled={disabled}>
          <PaintBucketIcon data-icon="inline-start" />
          Export .paint
        </Button>
        <Button variant="outline" onClick={onReset} disabled={disabled}>
          <UploadIcon data-icon="inline-start" />
          Upload new
        </Button>
      </div>
      <PaddingColorPicker
        selectedColor={paddingColor}
        onChange={onPaddingColorChange}
        disabled={disabled}
      />
    </div>
  );
}
