import { describe, it, expect } from "vite-plus/test";

describe("preprocess exports", () => {
  it("DEFAULT_PADDING_COLOR is white", async () => {
    const { DEFAULT_PADDING_COLOR } = await import("../preprocess");
    expect(DEFAULT_PADDING_COLOR).toEqual([255, 255, 255]);
  });
});
