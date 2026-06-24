import { describe, it, expect } from "vite-plus/test";
import { DEFAULT_PADDING_COLOR } from "../core/preprocess";

describe("DEFAULT_PADDING_COLOR", () => {
  it("defaults to white", () => {
    expect(DEFAULT_PADDING_COLOR).toEqual([255, 255, 255]);
  });
});
