import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ToolbarProps {
  showGrid: boolean;
  onToggleGrid: () => void;
  disabled?: boolean;
}

export function Toolbar({ showGrid, onToggleGrid, disabled = false }: ToolbarProps) {
  return (
    <div className="flex items-center gap-3">
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
    </div>
  );
}
