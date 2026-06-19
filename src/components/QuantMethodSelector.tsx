import type { QuantMethod } from "../quantize";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const QUANT_METHODS: { value: QuantMethod; label: string }[] = [
  { value: "median-cut", label: "Median Cut" },
  { value: "neuquant", label: "NeuQuant Adaptive" },
  { value: "wuquant", label: "WuQuant Remap" },
];

interface QuantMethodSelectorProps {
  selectedMethod: QuantMethod;
  onChange: (method: QuantMethod) => void;
  disabled?: boolean;
}

export function QuantMethodSelector({
  selectedMethod,
  onChange,
  disabled = false,
}: QuantMethodSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium whitespace-nowrap text-foreground">Method:</span>
      <Select
        value={selectedMethod}
        onValueChange={(value) => onChange(value as QuantMethod)}
        disabled={disabled}
      >
        <SelectTrigger className="min-w-45">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {QUANT_METHODS.map((method) => (
              <SelectItem key={method.value} value={method.value}>
                {method.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
