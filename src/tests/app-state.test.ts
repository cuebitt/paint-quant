import { describe, it, expect, beforeEach } from "vite-plus/test";
import { useAppStore } from "@/app/store";
import { CANVAS_TYPES } from "@/types";

describe("appStore", () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  it("setOriginal sets url and clears error", () => {
    useAppStore.getState().setError("previous error");
    useAppStore.getState().setOriginal("test.png");
    const s = useAppStore.getState();
    expect(s.originalUrl).toBe("test.png");
    expect(s.error).toBeNull();
  });

  it("setResult updates urls, palette, and clears loading", () => {
    useAppStore.getState().setLoading(true);
    useAppStore.getState().setResult("pre.png", "proc.png", [[100, 200, 50]]);
    const s = useAppStore.getState();
    expect(s.preprocessedUrl).toBe("pre.png");
    expect(s.quantizedUrl).toBe("proc.png");
    expect(s.adaptivePalette).toEqual([[100, 200, 50]]);
    expect(s.loading).toBe(false);
  });

  it("setError clears loading", () => {
    useAppStore.getState().setLoading(true);
    useAppStore.getState().setError("something broke");
    const s = useAppStore.getState();
    expect(s.error).toBe("something broke");
    expect(s.loading).toBe(false);
  });

  it("setError with null clears both error and loading", () => {
    useAppStore.getState().setError("old error");
    useAppStore.getState().setLoading(true);
    useAppStore.getState().setError(null);
    const s = useAppStore.getState();
    expect(s.error).toBeNull();
    expect(s.loading).toBe(false);
  });

  it("setPaddingColor updates both paddingColor and preview", () => {
    useAppStore.getState().setPaddingColor([100, 200, 50]);
    const s = useAppStore.getState();
    expect(s.paddingColor).toEqual([100, 200, 50]);
    expect(s.paddingColorPreview).toEqual([100, 200, 50]);
  });

  it("setPaddingColorPreview updates only preview", () => {
    useAppStore.getState().setPaddingColorPreview([100, 200, 50]);
    const s = useAppStore.getState();
    expect(s.paddingColor).toEqual(useAppStore.getState().paddingColor);
    expect(s.paddingColorPreview).toEqual([100, 200, 50]);
  });

  it("reset returns to initial state", () => {
    useAppStore.getState().setOriginal("something.png");
    useAppStore.getState().setLoading(true);
    useAppStore.getState().setError("oops");
    useAppStore.getState().setQuantMethod("neuquant");
    useAppStore.getState().reset();
    const s = useAppStore.getState();
    expect(s.originalUrl).toBeNull();
    expect(s.loading).toBe(false);
    expect(s.error).toBeNull();
    expect(s.quantMethod).toBe("median-cut");
  });

  it("toggles each field independently", () => {
    useAppStore.getState().setLoading(true);
    expect(useAppStore.getState().loading).toBe(true);

    useAppStore.getState().setCanvas(CANVAS_TYPES[3]!);
    expect(useAppStore.getState().selectedCanvas).toBe(CANVAS_TYPES[3]!);

    useAppStore.getState().setShowGrid(true);
    expect(useAppStore.getState().showGrid).toBe(true);

    useAppStore.getState().setQuantMethod("neuquant");
    expect(useAppStore.getState().quantMethod).toBe("neuquant");

    useAppStore.getState().setFitMode("width");
    expect(useAppStore.getState().fitMode).toBe("width");

    useAppStore.getState().setQuantizationEnabled(true);
    expect(useAppStore.getState().quantizationEnabled).toBe(true);

    useAppStore.getState().setAdaptiveColorCount(8);
    expect(useAppStore.getState().adaptiveColorCount).toBe(8);

    useAppStore.getState().setIncludeFixedPalette(true);
    expect(useAppStore.getState().includeFixedPalette).toBe(true);

    useAppStore.getState().setResizeFilter("lanczos3");
    expect(useAppStore.getState().resizeFilter).toBe("lanczos3");

    useAppStore.getState().setUnsharpAmount(150);
    expect(useAppStore.getState().unsharpAmount).toBe(150);

    useAppStore.getState()._set({ title: "Sunset" }, "setTitle");
    expect(useAppStore.getState().title).toBe("Sunset");

    useAppStore.getState()._set({ author: "Player" }, "setAuthor");
    expect(useAppStore.getState().author).toBe("Player");

    useAppStore.getState()._set({ signed: true }, "setSigned");
    expect(useAppStore.getState().signed).toBe(true);

    useAppStore.getState()._set({ signed: false }, "setSigned");
    expect(useAppStore.getState().signed).toBe(false);
  });
});
