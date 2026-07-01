import { useCallback } from "preact/hooks";
import type { ImageProcessorWorkers } from "@/hooks/useImageProcessor";
import { dispatchError } from "@/lib/helpers";

export function useClipboard(
  workers: ImageProcessorWorkers,
  startTimer: (name: string) => void,
  endTimer: (name: string) => number | null,
) {
  return useCallback(async () => {
    const result = workers.quantizedDataRef.current;
    if (!result) return;

    const { quantized } = result;
    startTimer("copy-to-clipboard");
    const canvas = new OffscreenCanvas(quantized.width, quantized.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.putImageData(quantized, 0, 0);
    try {
      const blob = await canvas.convertToBlob({ type: "image/png" });
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    } catch {
      dispatchError(
        new Error("Clipboard failed"),
        "Failed to copy to clipboard. Check browser permissions.",
      );
    }
    endTimer("copy-to-clipboard");
  }, [workers, startTimer, endTimer]);
}
