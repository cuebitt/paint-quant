import { PaintBucketIcon, ImageIcon, UploadIcon, Grid3x3Icon } from "lucide-react";
import type { CanvasType } from "@/types";
import type { QuantMethod } from "@/quantize";
import type { ImageFitMode } from "@/types";
import type { ResizeFilter } from "@/preprocess";
import type { RGB } from "@/palette";
import { CanvasSelector } from "@/components/CanvasSelector";
import { PaddingColorPicker } from "@/components/PaddingColorPicker";
import { Toolbar } from "@/components/Toolbar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ResultsToolbarProps {
  selectedCanvas: CanvasType;
  onCanvasChange: (canvas: CanvasType) => void;
  paddingColorPreview: RGB;
  onPaddingPreview: (color: RGB) => void;
  onPaddingCommit: (color: RGB) => void;
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
  loading: boolean;
  onExportPaint: () => void;
  onExportPng: () => void;
  onReset: () => void;
}

export function ResultsToolbar({
  selectedCanvas,
  onCanvasChange,
  paddingColorPreview,
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
  loading,
  onExportPaint,
  onExportPng,
  onReset,
}: ResultsToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <CanvasSelector
          selectedCanvas={selectedCanvas}
          onChange={onCanvasChange}
          disabled={loading}
        />
        <Separator orientation="vertical" className="h-5" />
        <PaddingColorPicker
          selectedColor={paddingColorPreview}
          onPreview={onPaddingPreview}
          onCommit={onPaddingCommit}
        />
        <Separator orientation="vertical" className="h-5" />
        <div className="flex items-center gap-2">
          <Switch id="grid-toggle" checked={showGrid} onCheckedChange={onToggleGrid} />
          <Label htmlFor="grid-toggle" className="flex items-center gap-1.5 text-sm">
            <Grid3x3Icon className="size-3.5 text-muted-foreground" />
            Grid
          </Label>
        </div>

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
            ></TooltipTrigger>
            <TooltipContent>Title and author are required for signed paintings</TooltipContent>
          </Tooltip>
          <Button variant="secondary" onClick={onExportPng} disabled={loading}>
            <ImageIcon data-icon="inline-start" />
            Export PNG
          </Button>
          <Button variant="outline" onClick={onReset} disabled={loading}>
            <UploadIcon data-icon="inline-start" />
            Upload new
          </Button>
        </div>
      </div>
      <Toolbar
        showGrid={showGrid}
        onToggleGrid={onToggleGrid}
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
      />
    </div>
  );
}
