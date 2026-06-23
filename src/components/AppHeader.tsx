import { PaintBucketIcon } from "lucide-react";
import { AboutDialog } from "@/components/AboutDialog";
import { ModeToggle } from "@/components/ModeToggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent p-2">
            <PaintBucketIcon className="size-6 text-accent-foreground" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">paintcraft</h1>
            <p className="text-xs text-muted-foreground">
              Resize, quantize, and export images as paint files
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <AboutDialog />
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
