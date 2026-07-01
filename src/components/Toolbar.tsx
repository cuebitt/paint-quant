import { memo } from "preact/compat";
import type { QuantMethod } from "@/core/quantize";
import type { ImageFitMode, PaintFormat } from "@/types";
import type { ResizeFilter } from "@/core/preprocess";
import { QuantMethodSelector } from "@/components/QuantMethodSelector";
import { FitModeSelector } from "@/components/FitModeSelector";
import { ResizeFilterSelector } from "@/components/ResizeFilterSelector";
import { PaintFormatSelector } from "@/components/PaintFormatSelector";
import { ToggleField } from "@/components/ToggleField";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  SparklesIcon,
  WandIcon,
  HashIcon,
  SwatchBookIcon,
  TypeIcon,
  UserIcon,
  GlassWaterIcon,
  BoxIcon,
  PenIcon,
  PaperclipIcon,
} from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface ToolbarProps {
  quantMethod: QuantMethod;
  onQuantMethodChange: (method: QuantMethod) => void;
  fitMode: ImageFitMode;
  onFitModeChange: (mode: ImageFitMode) => void;
  disabled?: boolean;
  quantizationEnabled: boolean;
  onQuantizationEnabledChange: (enabled: boolean) => void;
  adaptiveColorCount: number;
  onAdaptiveColorCountChange: (count: number) => void;
  includeFixedPalette: boolean;
  onIncludeFixedPaletteChange: (include: boolean) => void;
  resizeFilter: ResizeFilter;
  onResizeFilterChange: (filter: ResizeFilter) => void;
  unsharpAmount: number;
  onUnsharpAmountChange: (amount: number) => void;
  title: string;
  onTitleChange: (title: string) => void;
  author: string;
  onAuthorChange: (author: string) => void;
  signed: boolean;
  onSignedChange: (signed: boolean) => void;
  embedOriginalImage: boolean;
  onEmbedOriginalImageChange: (embed: boolean) => void;
  paintFormat: PaintFormat;
  onPaintFormatChange: (format: PaintFormat) => void;
  glass: boolean;
  onGlassChange: (glass: boolean) => void;
  sidesActive: boolean;
  onSidesActiveChange: (active: boolean) => void;
  showTooltips: boolean;
}

export const Toolbar = memo(function Toolbar({
  quantMethod,
  onQuantMethodChange,
  fitMode,
  onFitModeChange,
  disabled = false,
  quantizationEnabled,
  onQuantizationEnabledChange,
  adaptiveColorCount,
  onAdaptiveColorCountChange,
  includeFixedPalette,
  onIncludeFixedPaletteChange,
  resizeFilter,
  onResizeFilterChange,
  unsharpAmount,
  onUnsharpAmountChange,
  title,
  onTitleChange,
  author,
  onAuthorChange,
  signed,
  onSignedChange,
  embedOriginalImage,
  onEmbedOriginalImageChange,
  paintFormat,
  onPaintFormatChange,
  glass,
  onGlassChange,
  sidesActive,
  onSidesActiveChange,
  showTooltips,
}: ToolbarProps) {
  const [colorCountLocal, setColorCount] = useDebouncedValue(adaptiveColorCount, 400);
  const [sharpenLocal, setSharpen] = useDebouncedValue(unsharpAmount, 400);

  const handleColorCountChange = (val: number) => {
    setColorCount(val);
    onAdaptiveColorCountChange(val);
  };

  const handleSharpenChange = (val: number) => {
    setSharpen(val);
    onUnsharpAmountChange(val);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <ResizeFilterSelector
          selectedFilter={resizeFilter}
          onChange={onResizeFilterChange}
          disabled={disabled}
          showTooltips={showTooltips}
        />
        {resizeFilter !== "nearest" && (
          <>
            <Separator orientation="vertical" />
            <Tooltip disabled={!showTooltips || sharpenLocal === 0}>
              <TooltipTrigger render={<div className="flex items-center gap-2" />}>
                <ToggleField
                  id="sharpen-toggle"
                  checked={sharpenLocal > 0}
                  onCheckedChange={(checked) => handleSharpenChange(checked ? 150 : 0)}
                  disabled={disabled}
                  label={
                    <span className="flex items-center gap-1.5">
                      <WandIcon className="size-3.5 text-accent" />
                      Sharpen
                    </span>
                  }
                />
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8} className="!block w-56 p-3">
                <div className="flex items-center gap-2">
                  <Slider
                    min={10}
                    max={300}
                    step={10}
                    value={[sharpenLocal]}
                    onValueChange={(v) => {
                      const val = Array.isArray(v) ? v[0] : v;
                      handleSharpenChange(val);
                    }}
                    disabled={disabled}
                    className="flex-1"
                  />
                  <span className="w-8 text-right text-xs text-background">{sharpenLocal}</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </>
        )}
        <Separator orientation="vertical" />
        <FitModeSelector
          selectedMode={fitMode}
          onChange={onFitModeChange}
          disabled={disabled}
          showTooltips={showTooltips}
        />

        <Separator orientation="vertical" />
        <PaintFormatSelector
          selectedFormat={paintFormat}
          onChange={onPaintFormatChange}
          disabled={disabled}
          showTooltips={showTooltips}
        />
      </div>
      <div className="flex flex-wrap items-center gap-5">
        {paintFormat === "jop-2x" && (
          <>
            <Tooltip disabled={!showTooltips}>
              <TooltipTrigger render={<div className="flex items-center gap-2" />}>
                <ToggleField
                  id="glass-toggle"
                  checked={glass}
                  onCheckedChange={onGlassChange}
                  disabled={disabled}
                  label={
                    <span className="flex items-center gap-1.5">
                      <GlassWaterIcon className="size-3.5 text-accent" />
                      Glass canvas
                    </span>
                  }
                />
              </TooltipTrigger>
              <TooltipContent>Enable transparent background for glass paintings</TooltipContent>
            </Tooltip>
            <Tooltip disabled={!showTooltips}>
              <TooltipTrigger render={<div className="flex items-center gap-2" />}>
                <ToggleField
                  id="sides-toggle"
                  checked={sidesActive}
                  onCheckedChange={onSidesActiveChange}
                  disabled={disabled}
                  label={
                    <span className="flex items-center gap-1.5">
                      <BoxIcon className="size-3.5 text-accent" />
                      Paint sides
                    </span>
                  }
                />
              </TooltipTrigger>
              <TooltipContent>Paint the sides of 3D canvas blocks</TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" />
          </>
        )}
        <Tooltip disabled={!showTooltips}>
          <TooltipTrigger render={<div className="flex items-center gap-2" />}>
            <ToggleField
              id="signed-toggle"
              checked={signed}
              onCheckedChange={onSignedChange}
              disabled={disabled}
              label={
                <span className="flex items-center gap-1.5">
                  <PenIcon className="size-3.5 text-accent" />
                  {signed ? "Signed (Non-editable)" : "Unsigned (Editable)"}
                </span>
              }
            />
          </TooltipTrigger>
          <TooltipContent>Signed paintings require a title and author</TooltipContent>
        </Tooltip>
        <Tooltip disabled={!showTooltips}>
          <TooltipTrigger render={<div className="flex items-center gap-2" />}>
            <ToggleField
              id="embed-original-image"
              checked={embedOriginalImage}
              onCheckedChange={onEmbedOriginalImageChange}
              disabled={disabled}
              label={
                <span className="flex items-center gap-1.5">
                  <PaperclipIcon className="size-3.5 text-accent" />
                  Embed original
                </span>
              }
            />
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="!block w-56 p-3">
            Include the original image in the .paint file. Increases file size. Only recognized by
            paintcraft.
          </TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" />
        <Tooltip disabled={!showTooltips}>
          <TooltipTrigger render={<div className="flex items-center gap-2" />}>
            <ToggleField
              id="quantization-toggle"
              checked={quantizationEnabled}
              onCheckedChange={onQuantizationEnabledChange}
              disabled={disabled}
              label={
                <span className="flex items-center gap-1.5">
                  <SparklesIcon className="size-3.5 text-accent" />
                  Quantize
                </span>
              }
            />
          </TooltipTrigger>
          <TooltipContent>Reduce colors to a limited palette</TooltipContent>
        </Tooltip>
      </div>
      {quantizationEnabled && (
        <div className="flex w-full flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <QuantMethodSelector
            selectedMethod={quantMethod}
            onChange={onQuantMethodChange}
            disabled={disabled}
            showTooltips={showTooltips}
          />
          <div className="flex items-center gap-2">
            <HashIcon className="size-3.5 text-accent" />
            <Input
              id="adaptive-colors"
              type="number"
              min={1}
              max={256}
              value={colorCountLocal}
              onChange={(e) => {
                const val = parseInt((e.target as HTMLInputElement).value, 10);
                if (!isNaN(val) && val >= 1 && val <= 256) {
                  handleColorCountChange(val);
                }
              }}
              disabled={disabled}
              className="w-20"
            />
          </div>
          <Tooltip disabled={!showTooltips}>
            <TooltipTrigger render={<div className="flex items-center gap-2" />}>
              <ToggleField
                id="include-fixed-palette"
                checked={includeFixedPalette}
                onCheckedChange={onIncludeFixedPaletteChange}
                disabled={disabled}
                label={
                  <span className="flex items-center gap-1.5">
                    <SwatchBookIcon className="size-3.5 text-accent" />
                    Fixed palette
                  </span>
                }
              />
            </TooltipTrigger>
            <TooltipContent>Include the Minecraft dye palette</TooltipContent>
          </Tooltip>
        </div>
      )}
      {signed && (
        <div className="flex w-full flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-2">
            <TypeIcon className="size-3.5 text-accent" />
            <Input
              id="painting-title"
              type="text"
              maxLength={64}
              value={title}
              onChange={(e) => onTitleChange((e.target as HTMLInputElement).value)}
              disabled={disabled}
              placeholder="Painting title"
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <UserIcon className="size-3.5 text-accent" />
            <Input
              id="painting-author"
              type="text"
              maxLength={64}
              value={author}
              onChange={(e) => onAuthorChange((e.target as HTMLInputElement).value)}
              disabled={disabled}
              placeholder="Author name"
              className="w-40"
            />
          </div>
        </div>
      )}
    </>
  );
});
