import type { ComponentChildren } from "preact";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ToggleFieldProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label: ComponentChildren;
}

export function ToggleField({ id, checked, onCheckedChange, disabled, label }: ToggleFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      <Label htmlFor={id} className="text-sm whitespace-nowrap">
        {label}
      </Label>
    </div>
  );
}
