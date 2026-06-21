import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2Icon, UploadIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onUpload: (file: File) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function UploadDropzone({
  onUpload,
  loading = false,
  disabled = false,
}: UploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openFileDialog();
    }
  };

  return (
    <Card
      className={cn(
        "relative cursor-pointer border-2 border-dashed transition-colors",
        isDragActive ? "border-accent bg-accent/5" : "border-border hover:border-accent/50",
        (disabled || loading) && "pointer-events-none opacity-50",
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={openFileDialog}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Upload image"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.paint"
        onChange={handleFileChange}
        className="absolute inset-0 cursor-pointer opacity-0"
        disabled={disabled || loading}
      />

      <CardHeader className="items-center text-center">
        <div
          className={cn(
            "mx-auto mb-2 w-fit rounded-full p-4",
            isDragActive ? "bg-accent/20" : "bg-accent/10",
          )}
        >
          <UploadIcon className="size-8 text-accent" />
        </div>
        <CardTitle className="text-lg">
          {isDragActive ? "Drop image here" : "Upload an image"}
        </CardTitle>
        <CardDescription>
          {isDragActive ? "Release to upload" : "Drag & drop or click to browse"}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center text-center">
        <div className="flex items-center gap-2">
          {["PNG", "JPG", "WEBP", "GIF", "PAINT"].map((ext) => (
            <span key={ext} className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
              {ext}
            </span>
          ))}
        </div>

        {loading && (
          <div className="mt-6 flex items-center gap-3">
            <Loader2Icon className="size-5 animate-spin text-accent" />
            <span className="text-sm text-muted-foreground">Processing...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
