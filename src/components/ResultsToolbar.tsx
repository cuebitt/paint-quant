import { memo } from "preact/compat";
import { PaintBucketIcon, ImageIcon, UploadIcon, LayersIcon, Grid3x3Icon } from "lucide-react";
import type { CanvasType } from "@/types";
import type { QuantMethod } from "@/core/quantize";
import type { ImageFitMode, PaintFormat } from "@/types";
import type { ResizeFilter } from "@/core/preprocess";
import type { RGB } from "@/core/palette";
import { CanvasSelector } from "@/components/CanvasSelector";
import { PaddingColorPicker } from "@/components/PaddingColorPicker";
import { Toolbar } from "@/components/Toolbar";
import { ToggleField } from "@/components/ToggleField";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/ThemeProvider";

interface ResultsToolbarProps {
  selectedCanvas: CanvasType;
  onCanvasChange: (canvas: CanvasType) => void;
  paddingColorPreview: RGB;
  paddingAlpha: number;
  onPaddingPreview: (color: RGB, alpha: number) => void;
  onPaddingCommit: (color: RGB, alpha: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  quantMethod: QuantMethod;
  onQuantMethodChange: (method: QuantMethod) => void;
  fitMode: ImageFitMode;
  onFitModeChange: (mode: ImageFitMode) => void;
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
  showTransparencyGrid: boolean;
  onShowTransparencyGridChange: (show: boolean) => void;
  loading: boolean;
  onExportPaint: () => void;
  onExportPng: () => void;
  onReset: () => void;
}

export const ResultsToolbar = memo(function ResultsToolbar({
  selectedCanvas,
  onCanvasChange,
  paddingColorPreview,
  paddingAlpha,
  onPaddingPreview,
  onPaddingCommit,
  showGrid,
  onToggleGrid,
  quantMethod,
  onQuantMethodChange,
  fitMode,
  onFitModeChange,
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
  showTransparencyGrid,
  onShowTransparencyGridChange,
  loading,
  onExportPaint,
  onExportPng,
  onReset,
}: ResultsToolbarProps) {
  const { showTooltips } = useTheme();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <CanvasSelector
          selectedCanvas={selectedCanvas}
          onChange={onCanvasChange}
          disabled={loading}
          paintFormat={paintFormat}
          showTooltips={showTooltips}
        />
        <Separator orientation="vertical" />
        <PaddingColorPicker
          selectedColor={paddingColorPreview}
          paddingAlpha={paddingAlpha}
          glass={glass}
          showTransparencyGrid={showTransparencyGrid}
          onPreview={onPaddingPreview}
          onCommit={onPaddingCommit}
          showTooltips={showTooltips}
        />
        <Separator orientation="vertical" />
        <Tooltip disabled={!showTooltips}>
          <TooltipTrigger render={<div className="flex items-center gap-2" />}>
            <ToggleField
              id="grid-toggle"
              checked={showGrid}
              onCheckedChange={onToggleGrid}
              label={
                <span className="flex items-center gap-1.5">
                  <Grid3x3Icon className="size-3.5 text-accent" />
                  Cell Grid
                </span>
              }
            />
          </TooltipTrigger>
          <TooltipContent>Show a grid overlay on the image</TooltipContent>
        </Tooltip>
        <Tooltip disabled={!showTooltips}>
          <TooltipTrigger render={<div className="flex items-center gap-2" />}>
            <ToggleField
              id="transparency-grid-toggle"
              checked={showTransparencyGrid}
              onCheckedChange={onShowTransparencyGridChange}
              label={
                <span className="flex items-center gap-1.5">
                  <LayersIcon className="size-3.5 text-accent" />
                  Transparency Grid
                </span>
              }
            />
          </TooltipTrigger>
          <TooltipContent>Show a checkerboard pattern behind transparent areas</TooltipContent>
        </Tooltip>

        <div className="ml-auto flex items-center gap-2">
          <Tooltip disabled={!signed || (author !== "" && title !== "")}>
            <TooltipTrigger
              render={
                <span>
                  <Button
                    variant="secondary"
                    className="w-fit"
                    onClick={onExportPaint}
                    disabled={loading || (signed && (author === "" || title === ""))}
                  >
                    <PaintBucketIcon data-icon="inline-start" />
                    Export .paint
                  </Button>
                </span>
              }
            />
            <TooltipContent>Title and author are required for signed paintings</TooltipContent>
          </Tooltip>
          <Button variant="secondary" onClick={onExportPng} disabled={loading}>
            <ImageIcon data-icon="inline-start" />
            Export PNG
          </Button>
          <Tooltip>
            <TooltipTrigger
              render={
                <span>
                  <Button variant="outline" onClick={onReset} disabled={loading}>
                    <UploadIcon data-icon="inline-start" />
                    Upload new
                  </Button>
                </span>
              }
            />
            <TooltipContent
              className="bg-destructive text-destructive-foreground"
              arrowClassName="fill-destructive bg-destructive"
            >
              This will delete your current progress
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <Toolbar
        quantMethod={quantMethod}
        onQuantMethodChange={onQuantMethodChange}
        fitMode={fitMode}
        onFitModeChange={onFitModeChange}
        disabled={loading}
        quantizationEnabled={quantizationEnabled}
        onQuantizationEnabledChange={onQuantizationEnabledChange}
        adaptiveColorCount={adaptiveColorCount}
        onAdaptiveColorCountChange={onAdaptiveColorCountChange}
        includeFixedPalette={includeFixedPalette}
        onIncludeFixedPaletteChange={onIncludeFixedPaletteChange}
        resizeFilter={resizeFilter}
        onResizeFilterChange={onResizeFilterChange}
        unsharpAmount={unsharpAmount}
        onUnsharpAmountChange={onUnsharpAmountChange}
        title={title}
        onTitleChange={onTitleChange}
        author={author}
        onAuthorChange={onAuthorChange}
        signed={signed}
        onSignedChange={onSignedChange}
        embedOriginalImage={embedOriginalImage}
        onEmbedOriginalImageChange={onEmbedOriginalImageChange}
        paintFormat={paintFormat}
        onPaintFormatChange={onPaintFormatChange}
        glass={glass}
        onGlassChange={onGlassChange}
        sidesActive={sidesActive}
        onSidesActiveChange={onSidesActiveChange}
        showTooltips={showTooltips}
      />
    </div>
  );
});
