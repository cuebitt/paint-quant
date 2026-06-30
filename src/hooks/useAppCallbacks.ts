import { useCallback } from "preact/hooks";
import type { Dispatch } from "preact/hooks";
import type { RefObject } from "preact";
import type { AppState, AppAction } from "@/app/app-state";
import type { ProcessImageFn, ImageProcessorWorkers } from "@/hooks/useImageProcessor";
import { importPaintFile, exportPaintFile, exportPng } from "@/lib/file-io";
import { dispatchError, getProcessImageArgs } from "@/lib/helpers";

const IMPORT_HANDLERS: Record<
  string,
  { type: string; extract: (reader: FileReader) => Record<string, unknown>; text?: boolean }
> = {
  ".ase": { type: "parseAseprite", extract: (r) => ({ buffer: r.result }) },
  ".aseprite": { type: "parseAseprite", extract: (r) => ({ buffer: r.result }) },
  ".psd": { type: "parsePsd", extract: (r) => ({ buffer: r.result }) },
  ".svg": { type: "parseSvg", extract: (r) => ({ text: r.result }), text: true },
  ".piskel": { type: "parsePiskel", extract: (r) => ({ text: r.result }), text: true },
  ".pixil": { type: "parsePixil", extract: (r) => ({ text: r.result }), text: true },
};

export function useAppCallbacks(
  dispatch: Dispatch<AppAction>,
  state: AppState,
  stateRef: RefObject<AppState>,
  processImage: ProcessImageFn,
  workers: ImageProcessorWorkers,
) {
  const readIntoImportWorker = useCallback(
    (
      file: File,
      type: string,
      extract: (reader: FileReader) => Record<string, unknown>,
      asText = false,
    ) => {
      dispatch({ type: "SET_LOADING", loading: true });
      const reader = new FileReader();
      reader.onload = () => {
        if (!workers.importWorkerRef.current) {
          dispatchError(
            dispatch,
            new Error("Import worker not initialized"),
            "Import worker not initialized",
          );
          return;
        }
        workers.importWorkerRef.current.postMessage({ type, ...extract(reader) });
      };
      reader.onerror = () => {
        dispatchError(
          dispatch,
          new Error(`Failed to read ${file.name}`),
          `Failed to read ${file.name}`,
        );
      };
      if (asText) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    },
    [dispatch, workers],
  );

  const handleImportPaintFile = useCallback(
    (file: File) => importPaintFile(file, dispatch, workers, stateRef),
    [dispatch, workers, stateRef],
  );

  const handleUpload = useCallback(
    (file: File) => {
      if (file.name.endsWith(".paint")) {
        handleImportPaintFile(file);
        return;
      }
      for (const [ext, handler] of Object.entries(IMPORT_HANDLERS)) {
        if (file.name.endsWith(ext)) {
          readIntoImportWorker(file, handler.type, handler.extract, handler.text);
          return;
        }
      }

      dispatch({ type: "SET_LOADING", loading: true });
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          workers.originalImageRef.current = img;
          dispatch({ type: "SET_ORIGINAL", url: reader.result as string });
          const s = stateRef.current;
          if (!s) return;
          void processImage(img, ...getProcessImageArgs(s));
        };
        img.onerror = () => {
          dispatchError(
            dispatch,
            new Error(`Failed to load ${file.name}`),
            `Failed to load ${file.name}`,
          );
        };
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        dispatchError(
          dispatch,
          new Error(`Failed to read ${file.name}`),
          `Failed to read ${file.name}`,
        );
      };
      reader.readAsDataURL(file);
    },
    [processImage, handleImportPaintFile, workers, stateRef, dispatch, readIntoImportWorker],
  );

  const handleExportPaintFile = useCallback(
    () => exportPaintFile(workers, state),
    [state, workers],
  );

  const handleExportPng = useCallback(() => exportPng(workers, dispatch), [workers, dispatch]);

  return { handleUpload, handleExportPaintFile, handleExportPng };
}
