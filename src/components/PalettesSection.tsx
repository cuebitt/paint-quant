import { PaletteDisplay } from "./PaletteDisplay";
import { Separator } from "@/components/ui/separator";
import { FIXED_PALETTE_COLORS } from "../quantize";

interface PalettesSectionProps {
  adaptivePalette: readonly [number, number, number][];
}

export function PalettesSection({ adaptivePalette }: PalettesSectionProps) {
  return (
    <div className="flex flex-col gap-8">
      <Separator />
      <div className="flex flex-col gap-8 lg:flex-row">
        <PaletteDisplay title="Fixed Palette (16 colors)" colors={FIXED_PALETTE_COLORS} />
        <PaletteDisplay title="Adaptive Palette (12 colors)" colors={adaptivePalette} />
      </div>
    </div>
  );
}
