import { memo } from "preact/compat";
import { useAppStore } from "@/app/store";
import { CanvasSelector } from "@/components/CanvasSelector";
import { PaddingColorPicker } from "@/components/PaddingColorPicker";
import { LabeledSelect } from "@/components/LabeledSelect";
import { ToggleField } from "@/components/ToggleField";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "@/components/ThemeProvider";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  PaintBucketIcon,
  ImageIcon,
  UploadIcon,
  Grid3x3Icon,
  LayersIcon,
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
  Maximize2Icon,
  ScalingIcon,
  FileIcon,
} from "lucide-react";
import type { ImageFitMode, PaintFormat } from "@/types";
import { PAINT_FORMATS, FIT_MODES } from "@/types";
import type { QuantMethod } from "@/core/quantize";
import type { ResizeFilter } from "@/core/preprocess";

const QUANT_METHODS: { value: QuantMethod; label: string }[] = [
  { value: "median-cut", label: "Median Cut" },
  { value: "neuquant", label: "NeuQuant Adaptive" },
  { value: "wuquant", label: "WuQuant Remap" },
];

const RESIZE_FILTERS: { value: ResizeFilter; label: string }[] = [
  { value: "box", label: "Box" },
  { value: "hamming", label: "Hamming" },
  { value: "lanczos2", label: "Lanczos 2" },
  { value: "lanczos3", label: "Lanczos 3" },
  { value: "mks2013", label: "Magic Kernel Sharp 2013" },
  { value: "nearest", label: "Nearest Neighbor" },
];

interface ToolbarProps {
  onExportPaint: () => void;
  onExportPng: () => void;
}

export const Toolbar = memo(function Toolbar({ onExportPaint, onExportPng }: ToolbarProps) {
  const {
    selectedCanvas,
    paddingColorPreview,
    paddingAlpha,
    showGrid,
    quantMethod,
    fitMode,
    quantizationEnabled,
    adaptiveColorCount,
    includeFixedPalette,
    resizeFilter,
    unsharpAmount,
    title,
    author,
    signed,
    embedOriginalImage,
    paintFormat,
    glass,
    sidesActive,
    showTransparencyGrid,
    loading,
    setCanvas,
    setPaddingColorPreview,
    setPaddingColor,
    setShowGrid,
    setQuantMethod,
    setFitMode,
    setQuantizationEnabled,
    setAdaptiveColorCount,
    setIncludeFixedPalette,
    setResizeFilter,
    setUnsharpAmount,
    setTitle,
    setAuthor,
    setSigned,
    setEmbedOriginalImage,
    setPaintFormat,
    setGlass,
    setSidesActive,
    setShowTransparencyGrid,
    reset,
  } = useAppStore();

  const { showTooltips } = useTheme();
  const [colorCountLocal, setColorCount] = useDebouncedValue(adaptiveColorCount, 400);
  const [sharpenLocal, setSharpen] = useDebouncedValue(unsharpAmount, 400);

  const handleColorCountChange = (val: number) => {
    setColorCount(val);
    setAdaptiveColorCount(val);
  };

  const handleSharpenChange = (val: number) => {
    setSharpen(val);
    setUnsharpAmount(val);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <CanvasSelector
          selectedCanvas={selectedCanvas}
          onChange={setCanvas}
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
          onPreview={setPaddingColorPreview}
          onCommit={setPaddingColor}
          showTooltips={showTooltips}
        />
        <Separator orientation="vertical" />
        <Tooltip disabled={!showTooltips}>
          <TooltipTrigger render={<div className="flex items-center gap-2" />}>
            <ToggleField
              id="grid-toggle"
              checked={showGrid}
              onCheckedChange={() => setShowGrid(!showGrid)}
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
              onCheckedChange={() => setShowTransparencyGrid(!showTransparencyGrid)}
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
                  <Button variant="outline" onClick={reset} disabled={loading}>
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
      <div className="flex flex-wrap items-center gap-3">
        <LabeledSelect
          icon={ScalingIcon}
          label="Resize:"
          value={resizeFilter}
          onChange={(v) => setResizeFilter(v as ResizeFilter)}
          items={RESIZE_FILTERS}
          tooltip="Algorithm used when resizing the image to fit the canvas"
          disabled={loading}
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
                  disabled={loading}
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
                    disabled={loading}
                    className="flex-1"
                  />
                  <span className="w-8 text-right text-xs text-background">{sharpenLocal}</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </>
        )}
        <Separator orientation="vertical" />
        <LabeledSelect
          icon={Maximize2Icon}
          label="Fit:"
          value={fitMode}
          onChange={(v) => setFitMode(v as ImageFitMode)}
          items={FIT_MODES}
          tooltip="How the image fits within the canvas dimensions"
          disabled={loading}
          showTooltips={showTooltips}
        />

        <Separator orientation="vertical" />
        <LabeledSelect
          icon={FileIcon}
          label="Format:"
          value={paintFormat}
          onChange={(v) => setPaintFormat(v as PaintFormat)}
          items={PAINT_FORMATS}
          tooltip={PAINT_FORMATS.find((f) => f.value === paintFormat)?.description}
          disabled={loading}
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
                  onCheckedChange={() => setGlass(!glass)}
                  disabled={loading}
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
                  onCheckedChange={() => setSidesActive(!sidesActive)}
                  disabled={loading}
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
              onCheckedChange={() => setSigned(!signed)}
              disabled={loading}
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
              onCheckedChange={() => setEmbedOriginalImage(!embedOriginalImage)}
              disabled={loading}
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
              onCheckedChange={() => setQuantizationEnabled(!quantizationEnabled)}
              disabled={loading}
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
          <LabeledSelect
            icon={SparklesIcon}
            label="Method:"
            value={quantMethod}
            onChange={(v) => setQuantMethod(v as QuantMethod)}
            items={QUANT_METHODS}
            tooltip="Algorithm used for color quantization"
            disabled={loading}
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
              disabled={loading}
              className="w-20"
            />
          </div>
          <Tooltip disabled={!showTooltips}>
            <TooltipTrigger render={<div className="flex items-center gap-2" />}>
              <ToggleField
                id="include-fixed-palette"
                checked={includeFixedPalette}
                onCheckedChange={() => setIncludeFixedPalette(!includeFixedPalette)}
                disabled={loading}
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
              onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
              disabled={loading}
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
              onChange={(e) => setAuthor((e.target as HTMLInputElement).value)}
              disabled={loading}
              placeholder="Author name"
              className="w-40"
            />
          </div>
        </div>
      )}
    </div>
  );
});
