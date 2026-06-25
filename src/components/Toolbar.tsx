import { useState, useEffect, useRef } from "preact/hooks";
import type { QuantMethod } from "@/core/quantize";
import type { ImageFitMode } from "@/types";
import type { ResizeFilter } from "@/core/preprocess";
import { QuantMethodSelector } from "@/components/QuantMethodSelector";
import { FitModeSelector } from "@/components/FitModeSelector";
import { ResizeFilterSelector } from "@/components/ResizeFilterSelector";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { SparklesIcon } from "lucide-react";

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
}

export function Toolbar({
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
}: ToolbarProps) {
  const [pendingColorCount, setPendingColorCount] = useState<number | null>(null);
  const [pendingSharpen, setPendingSharpen] = useState<number | null>(null);
  const colorCountLocal = pendingColorCount ?? adaptiveColorCount;
  const sharpenLocal = pendingSharpen ?? unsharpAmount;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sharpenDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const pendingDebounce = debounceRef.current;
    const pendingSharpen = sharpenDebounceRef.current;
    return () => {
      if (pendingDebounce) clearTimeout(pendingDebounce);
      if (pendingSharpen) clearTimeout(pendingSharpen);
    };
  }, [debounceRef, sharpenDebounceRef]);

  const handleColorCountChange = (val: number) => {
    setPendingColorCount(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPendingColorCount(null);
      onAdaptiveColorCountChange(val);
    }, 400);
  };

  const handleSharpenChange = (val: number) => {
    setPendingSharpen(val);
    if (sharpenDebounceRef.current) clearTimeout(sharpenDebounceRef.current);
    sharpenDebounceRef.current = setTimeout(() => {
      setPendingSharpen(null);
      onUnsharpAmountChange(val);
    }, 400);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <ResizeFilterSelector
        selectedFilter={resizeFilter}
        onChange={onResizeFilterChange}
        disabled={disabled}
      />
      {resizeFilter !== "nearest" && (
        <>
          <Separator orientation="vertical" />
          <Tooltip disabled={sharpenLocal === 0}>
            <TooltipTrigger render={<div className="flex items-center gap-2" />}>
              <Switch
                id="sharpen-toggle"
                checked={sharpenLocal > 0}
                onCheckedChange={(checked) => {
                  handleSharpenChange(checked ? 150 : 0);
                }}
                disabled={disabled}
              />
              <Label htmlFor="sharpen-toggle" className="text-sm whitespace-nowrap">
                Sharpen
              </Label>
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
      <FitModeSelector selectedMode={fitMode} onChange={onFitModeChange} disabled={disabled} />

      <Separator orientation="vertical" />

      <div className="flex items-center gap-2">
        <Switch
          id="signed-toggle"
          checked={signed}
          onCheckedChange={onSignedChange}
          disabled={disabled}
        />
        <Label
          htmlFor="signed-toggle"
          className="flex items-center gap-1.5 text-sm whitespace-nowrap"
        >
          {signed ? "Signed (Non-editable)" : "Unsigned (Editable)"}
        </Label>
      </div>
      <Separator orientation="vertical" />
      <div className="flex items-center gap-2">
        <Switch
          id="quantization-toggle"
          checked={quantizationEnabled}
          onCheckedChange={onQuantizationEnabledChange}
          disabled={disabled}
        />
        <Label htmlFor="quantization-toggle" className="flex items-center gap-1.5 text-sm">
          <SparklesIcon className="size-3.5 text-muted-foreground" />
          Quantize
        </Label>
      </div>

      {quantizationEnabled && (
        <div className="flex w-full flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <QuantMethodSelector
            selectedMethod={quantMethod}
            onChange={onQuantMethodChange}
            disabled={disabled}
          />
          <div className="flex items-center gap-2">
            <Label htmlFor="adaptive-colors" className="text-sm whitespace-nowrap">
              Colors:
            </Label>
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
          <div className="flex items-center gap-2">
            <Switch
              id="include-fixed-palette"
              checked={includeFixedPalette}
              onCheckedChange={onIncludeFixedPaletteChange}
              disabled={disabled}
            />
            <Label htmlFor="include-fixed-palette" className="text-sm whitespace-nowrap">
              Fixed palette
            </Label>
          </div>
        </div>
      )}
      {signed && (
        <div className="flex w-full flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="painting-title" className="text-sm whitespace-nowrap">
              Title:
            </Label>
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
            <Label htmlFor="painting-author" className="text-sm whitespace-nowrap">
              Author:
            </Label>
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
      <Separator orientation="vertical" />
      <div className="flex items-center gap-2">
        <Switch
          id="embed-original-image"
          checked={embedOriginalImage}
          onCheckedChange={onEmbedOriginalImageChange}
          disabled={disabled}
        />
        <Label htmlFor="embed-original-image" className="text-sm whitespace-nowrap">
          Embed original
        </Label>
      </div>
    </div>
  );
}
