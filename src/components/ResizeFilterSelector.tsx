import type { ResizeFilter } from "../preprocess";
import { ScalingIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RESIZE_FILTERS: { value: ResizeFilter; label: string }[] = [
  { value: "nearest", label: "Nearest Neighbor" },
  { value: "box", label: "Box" },
  { value: "hamming", label: "Hamming" },
  { value: "lanczos2", label: "Lanczos 2" },
  { value: "lanczos3", label: "Lanczos 3" },
  { value: "mks2013", label: "Magic Kernel Sharp 2013" },
];

interface ResizeFilterSelectorProps {
  selectedFilter: ResizeFilter;
  onChange: (filter: ResizeFilter) => void;
  disabled?: boolean;
}

export function ResizeFilterSelector({
  selectedFilter,
  onChange,
  disabled = false,
}: ResizeFilterSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-foreground">
        <ScalingIcon className="size-4 text-accent" />
        Resize:
      </span>
      <Select
        value={selectedFilter}
        onValueChange={(value) => onChange(value as ResizeFilter)}
        items={RESIZE_FILTERS}
        disabled={disabled}
      >
        <SelectTrigger className="min-w-45">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {RESIZE_FILTERS.map((filter) => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
