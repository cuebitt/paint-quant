import { describe, it, expect } from "vite-plus/test";
import { appReducer, initialState } from "@/app/app-state";
import { CANVAS_TYPES } from "@/types";

describe("appReducer", () => {
  it("SET_ORIGINAL sets url and clears error", () => {
    const withError = { ...initialState, error: "previous error" };
    const state = appReducer(withError, { type: "SET_ORIGINAL", url: "test.png" });
    expect(state.originalUrl).toBe("test.png");
    expect(state.error).toBeNull();
  });

  it("SET_RESULT updates urls, palette, and clears loading", () => {
    const state = appReducer(initialState, {
      type: "SET_RESULT",
      preprocessed: "pre.png",
      processed: "proc.png",
      adaptive: [[100, 200, 50]],
    });
    expect(state.preprocessedUrl).toBe("pre.png");
    expect(state.quantizedUrl).toBe("proc.png");
    expect(state.adaptivePalette).toEqual([[100, 200, 50]]);
    expect(state.loading).toBe(false);
  });

  it("SET_ERROR clears loading", () => {
    const loading = { ...initialState, loading: true };
    const state = appReducer(loading, { type: "SET_ERROR", error: "something broke" });
    expect(state.error).toBe("something broke");
    expect(state.loading).toBe(false);
  });

  it("SET_ERROR with null clears both error and loading", () => {
    const withError = { ...initialState, error: "old error", loading: true };
    const state = appReducer(withError, { type: "SET_ERROR", error: null });
    expect(state.error).toBeNull();
    expect(state.loading).toBe(false);
  });

  it("SET_PADDING_COLOR updates both paddingColor and preview", () => {
    const state = appReducer(initialState, {
      type: "SET_PADDING_COLOR",
      color: [100, 200, 50],
    });
    expect(state.paddingColor).toEqual([100, 200, 50]);
    expect(state.paddingColorPreview).toEqual([100, 200, 50]);
  });

  it("SET_PADDING_PREVIEW updates only preview", () => {
    const state = appReducer(initialState, {
      type: "SET_PADDING_PREVIEW",
      color: [100, 200, 50],
    });
    expect(state.paddingColor).toEqual(initialState.paddingColor);
    expect(state.paddingColorPreview).toEqual([100, 200, 50]);
  });

  it("RESET returns to initial state", () => {
    const modified = {
      ...initialState,
      originalUrl: "something.png",
      loading: true,
      error: "oops",
      quantMethod: "neuquant" as const,
    };
    const state = appReducer(modified, { type: "RESET" });
    expect(state).toEqual(initialState);
  });

  it("toggles each field independently", () => {
    let state = appReducer(initialState, { type: "SET_LOADING", loading: true });
    expect(state.loading).toBe(true);

    state = appReducer(initialState, { type: "SET_CANVAS", canvas: CANVAS_TYPES[3]! });
    expect(state.selectedCanvas).toBe(CANVAS_TYPES[3]!);

    state = appReducer(initialState, { type: "SET_SHOW_GRID", show: true });
    expect(state.showGrid).toBe(true);

    state = appReducer(initialState, { type: "SET_QUANT_METHOD", method: "neuquant" });
    expect(state.quantMethod).toBe("neuquant");

    state = appReducer(initialState, { type: "SET_FIT_MODE", mode: "width" });
    expect(state.fitMode).toBe("width");

    state = appReducer(initialState, { type: "SET_QUANTIZATION_ENABLED", enabled: true });
    expect(state.quantizationEnabled).toBe(true);

    state = appReducer(initialState, { type: "SET_ADAPTIVE_COLOR_COUNT", count: 8 });
    expect(state.adaptiveColorCount).toBe(8);

    state = appReducer(initialState, { type: "SET_INCLUDE_FIXED_PALETTE", include: true });
    expect(state.includeFixedPalette).toBe(true);

    state = appReducer(initialState, { type: "SET_RESIZE_FILTER", filter: "lanczos3" });
    expect(state.resizeFilter).toBe("lanczos3");

    state = appReducer(initialState, { type: "SET_UNSHARP_AMOUNT", amount: 150 });
    expect(state.unsharpAmount).toBe(150);

    state = appReducer(initialState, { type: "SET_TITLE", title: "Sunset" });
    expect(state.title).toBe("Sunset");

    state = appReducer(initialState, { type: "SET_AUTHOR", author: "Player" });
    expect(state.author).toBe("Player");

    state = appReducer(initialState, { type: "SET_SIGNED", signed: true });
    expect(state.signed).toBe(true);

    state = appReducer({ ...initialState, signed: true }, { type: "SET_SIGNED", signed: false });
    expect(state.signed).toBe(false);
  });
});
