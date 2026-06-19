import type { QuantMethod } from "../quantize";
import { QuantMethodSelector } from "./QuantMethodSelector";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ClipboardCopyIcon, UploadIcon } from "lucide-react";

interface ToolbarProps {
  showGrid: boolean;
  onToggleGrid: () => void;
  onExport: () => void;
  onReset: () => void;
  quantMethod: QuantMethod;
  onQuantMethodChange: (method: QuantMethod) => void;
  disabled?: boolean;
}

export function Toolbar({
  showGrid,
  onToggleGrid,
  onExport,
  onReset,
  quantMethod,
  onQuantMethodChange,
  disabled = false,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      <QuantMethodSelector
        selectedMethod={quantMethod}
        onChange={onQuantMethodChange}
        disabled={disabled}
      />
      <div className="flex items-center gap-2">
        <Switch
          id="grid-toggle"
          checked={showGrid}
          onCheckedChange={onToggleGrid}
          disabled={disabled}
        />
        <Label htmlFor="grid-toggle" className="text-sm">
          Show Grid
        </Label>
      </div>
      <Button variant="outline" onClick={onExport} disabled={disabled}>
        <ClipboardCopyIcon data-icon="inline-start" />
        Copy JSON
      </Button>
      <Button variant="outline" onClick={onReset} disabled={disabled}>
        <UploadIcon data-icon="inline-start" />
        Upload new
      </Button>
    </div>
  );
}
