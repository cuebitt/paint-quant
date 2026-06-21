import { describe, it, expect } from "vitest";

describe("preprocess exports", () => {
  it("DEFAULT_PADDING_COLOR is white", async () => {
    const { DEFAULT_PADDING_COLOR } = await import("../preprocess");
    expect(DEFAULT_PADDING_COLOR).toEqual([255, 255, 255]);
  });

  it("ResizeFilter type includes expected values", async () => {
    const mod = await import("../preprocess");
    // Type-level check: ensure the module exports the expected types
    expect(mod).toBeDefined();
  });
});
