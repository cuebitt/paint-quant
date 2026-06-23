import { UploadDropzone } from "@/components/UploadDropzone";

interface UploadViewProps {
  onUpload: (file: File) => void;
  loading: boolean;
}

export function UploadView({ onUpload, loading }: UploadViewProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <UploadDropzone onUpload={onUpload} loading={loading} />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Maximum file size: 10MB. Supported formats: PNG, JPG, WEBP, GIF, .paint, .ase, .aseprite,
        .psd, .svg
      </p>
    </div>
  );
}
