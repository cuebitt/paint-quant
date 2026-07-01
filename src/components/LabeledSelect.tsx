import type { ComponentChildren } from "preact";
import type { LucideIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface LabeledSelectProps {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: readonly { value: string; label: string; description?: string }[];
  tooltip?: string;
  disabled?: boolean;
  showTooltips?: boolean;
  renderItem?: (item: { value: string; label: string; description?: string }) => ComponentChildren;
}

export function LabeledSelect({
  icon: Icon,
  label,
  value,
  onChange,
  items,
  tooltip,
  disabled = false,
  showTooltips = true,
  renderItem,
}: LabeledSelectProps) {
  const selected = items.find((i) => i.value === value);

  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-foreground">
        <Icon className="size-4 text-accent" />
        {label}
      </span>
      <Tooltip disabled={!showTooltips}>
        <TooltipTrigger
          render={
            <Select
              value={value}
              onValueChange={(v) => {
                if (v !== null) onChange(v);
              }}
              items={items}
              disabled={disabled}
            >
              <SelectTrigger className="min-w-45">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {items.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {renderItem ? (
                        renderItem(item)
                      ) : item.description ? (
                        <div className="flex flex-col">
                          <span>{item.label}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        </div>
                      ) : (
                        item.label
                      )}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          }
        />
        <TooltipContent side="bottom" sideOffset={8}>
          {tooltip ?? selected?.description ?? ""}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
