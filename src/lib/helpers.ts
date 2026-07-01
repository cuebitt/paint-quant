import type { AppState } from "@/app/app-state";
import type { Dispatch } from "preact/hooks";

export function dispatchError(
  dispatch: Dispatch<{ type: "SET_ERROR"; error: string }>,
  err: unknown,
  fallback: string,
) {
  dispatch({
    type: "SET_ERROR",
    error: err instanceof Error ? err.message : fallback,
  });
}

export function getProcessImageArgs(s: AppState) {
  return [
    s.selectedCanvas,
    s.quantMethod,
    s.fitMode,
    s.paddingColor,
    s.quantizationEnabled,
    { colors: s.adaptiveColorCount, includeFixedPalette: s.includeFixedPalette },
    { filter: s.resizeFilter, unsharpAmount: s.unsharpAmount },
    s.glass ? s.paddingAlpha : 1,
  ] as const;
}
