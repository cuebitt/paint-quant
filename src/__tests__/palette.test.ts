import { describe, it, expect } from "vite-plus/test";
import { FIXED_PALETTE } from "@/palette";

describe("FIXED_PALETTE", () => {
  it("contains 16 colors", () => {
    expect(FIXED_PALETTE).toHaveLength(16);
  });

  it("each color has 3 channels in range 0–255", () => {
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
