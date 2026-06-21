import { describe, it, expect } from "vitest";
import { appReducer, initialState } from "../app-state";
import { CANVAS_TYPES } from "../types";

describe("appReducer", () => {
  it("handles SET_ORIGINAL", () => {
    const state = appReducer(initialState, { type: "SET_ORIGINAL", url: "test.png" });
    expect(state.originalUrl).toBe("test.png");
    expect(state.error).toBeNull();
  });

  it("clears error on SET_ORIGINAL", () => {
    const withError = { ...initialState, error: "previous error" };
    const state = appReducer(withError, { type: "SET_ORIGINAL", url: "test.png" });
    expect(state.error).toBeNull();
  });

  it("handles SET_RESULT", () => {
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

  it("handles SET_LOADING", () => {
    const state = appReducer(initialState, { type: "SET_LOADING", loading: true });
    expect(state.loading).toBe(true);
  });

  it("handles SET_ERROR", () => {
    const state = appReducer(initialState, { type: "SET_ERROR", error: "something broke" });
    expect(state.error).toBe("something broke");
    expect(state.loading).toBe(false);
  });

  it("handles SET_ERROR with null", () => {
    const withError = { ...initialState, error: "old error", loading: true };
    const state = appReducer(withError, { type: "SET_ERROR", error: null });
    expect(state.error).toBeNull();
    expect(state.loading).toBe(false);
  });

  it("handles SET_CANVAS", () => {
    const canvas = CANVAS_TYPES[3];
    const state = appReducer(initialState, { type: "SET_CANVAS", canvas });
    expect(state.selectedCanvas).toBe(canvas);
  });

  it("handles SET_SHOW_GRID", () => {
    const state = appReducer(initialState, { type: "SET_SHOW_GRID", show: true });
    expect(state.showGrid).toBe(true);
  });

  it("handles SET_QUANT_METHOD", () => {
    const state = appReducer(initialState, { type: "SET_QUANT_METHOD", method: "neuquant" });
    expect(state.quantMethod).toBe("neuquant");
  });

  it("handles SET_FIT_MODE", () => {
    const state = appReducer(initialState, { type: "SET_FIT_MODE", mode: "width" });
    expect(state.fitMode).toBe("width");
  });

  it("handles SET_PADDING_COLOR (updates both paddingColor and preview)", () => {
    const state = appReducer(initialState, {
      type: "SET_PADDING_COLOR",
      color: [100, 200, 50],
    });
    expect(state.paddingColor).toEqual([100, 200, 50]);
    expect(state.paddingColorPreview).toEqual([100, 200, 50]);
  });

  it("handles SET_PADDING_PREVIEW (updates only preview)", () => {
    const state = appReducer(initialState, {
      type: "SET_PADDING_PREVIEW",
      color: [100, 200, 50],
    });
    expect(state.paddingColor).toEqual(initialState.paddingColor);
    expect(state.paddingColorPreview).toEqual([100, 200, 50]);
  });

  it("handles SET_QUANTIZATION_ENABLED", () => {
    const state = appReducer(initialState, {
      type: "SET_QUANTIZATION_ENABLED",
      enabled: true,
    });
    expect(state.quantizationEnabled).toBe(true);
  });

  it("handles SET_ADAPTIVE_COLOR_COUNT", () => {
    const state = appReducer(initialState, {
      type: "SET_ADAPTIVE_COLOR_COUNT",
      count: 8,
    });
    expect(state.adaptiveColorCount).toBe(8);
  });

  it("handles SET_INCLUDE_FIXED_PALETTE", () => {
    const state = appReducer(initialState, {
      type: "SET_INCLUDE_FIXED_PALETTE",
      include: true,
    });
    expect(state.includeFixedPalette).toBe(true);
  });

  it("handles SET_RESIZE_FILTER", () => {
    const state = appReducer(initialState, {
      type: "SET_RESIZE_FILTER",
      filter: "lanczos3",
    });
    expect(state.resizeFilter).toBe("lanczos3");
  });

  it("handles SET_UNSHARP_AMOUNT", () => {
    const state = appReducer(initialState, {
      type: "SET_UNSHARP_AMOUNT",
      amount: 150,
    });
    expect(state.unsharpAmount).toBe(150);
  });

  it("handles SET_TITLE", () => {
    const state = appReducer(initialState, { type: "SET_TITLE", title: "Sunset" });
    expect(state.title).toBe("Sunset");
  });

  it("handles SET_AUTHOR", () => {
    const state = appReducer(initialState, { type: "SET_AUTHOR", author: "Player" });
    expect(state.author).toBe("Player");
  });

  it("handles SET_SIGNED to true", () => {
    const state = appReducer(initialState, { type: "SET_SIGNED", signed: true });
    expect(state.signed).toBe(true);
  });

  it("handles SET_SIGNED to false", () => {
    const withSigned = { ...initialState, signed: true };
    const state = appReducer(withSigned, { type: "SET_SIGNED", signed: false });
    expect(state.signed).toBe(false);
  });

  it("handles RESET", () => {
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
});
