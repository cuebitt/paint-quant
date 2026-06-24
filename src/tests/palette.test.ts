import { describe, it, expect } from "vite-plus/test";
import { FIXED_PALETTE } from "@/core/palette";

describe("FIXED_PALETTE", () => {
  it("is a 16-color RGB palette", () => {
    expect(FIXED_PALETTE).toHaveLength(16);
    for (const [r, g, b] of FIXED_PALETTE) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    }
  });
});
