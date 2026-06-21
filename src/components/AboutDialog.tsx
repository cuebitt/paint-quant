import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";

export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <InfoIcon className="size-4" />
        <span className="sr-only">About paintcraft</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>paintcraft</DialogTitle>
          <DialogDescription>
            Quantize images to a limited palette and save them as .paint files.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Import <code>.paint</code> files, or resize and quantize images into <code>.paint</code>{" "}
            files for use in paint tools. Everything runs in your browser! There is no back-end
            server, and no AI is used.
          </p>
          <h4 className="font-medium text-foreground">Resize</h4>
          <p>
            Scale images using nearest neighbor (pixelated) or high-quality <code>pica</code>{" "}
            filters with optional unsharp mask.
          </p>
          <h4 className="font-medium text-foreground">Quantize</h4>
          <p>
            Reduce colors with Median Cut, NeuQuant, or WuQuant. Configure dithering, color
            distance, and palette composition.
          </p>
          <h4 className="font-medium text-foreground">Export</h4>
          <p>
            Import and export <code>.paint</code> files, or save the result as a PNG.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
