import { PaletteDisplay } from "./PaletteDisplay";
import { Separator } from "@/components/ui/separator";

export function PalettesSection() {
  return (
    <div className="flex flex-col gap-8">
      <Separator />
      <div className="flex flex-col gap-8 lg:flex-row">
        <PaletteDisplay title="Fixed Palette (16 colors)" />
        <PaletteDisplay title="Adaptive Palette (12 colors)" />
      </div>
    </div>
  );
}
