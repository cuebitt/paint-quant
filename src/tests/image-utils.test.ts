import { describe, it, expect } from "vite-plus/test";
import { rgbString, computeScale } from "../core/image-utils";

describe("rgbString", () => {
  it("converts RGB tuple to CSS rgb string", () => {
    expect(rgbString([255, 0, 0])).toBe("rgb(255,0,0)");
  });

  it("handles black", () => {
    expect(rgbString([0, 0, 0])).toBe("rgb(0,0,0)");
  });

  it("handles white", () => {
    expect(rgbString([255, 255, 255])).toBe("rgb(255,255,255)");
  });

  it("handles mid-range values", () => {
    expect(rgbString([128, 64, 32])).toBe("rgb(128,64,32)");
  });
});

describe("computeScale", () => {
  it("returns targetWidth/imageWidth for width fit mode", () => {
    expect(computeScale(100, 200, 50, 50, "width")).toBe(0.5);
  });

  it("returns targetHeight/imageHeight for height fit mode", () => {
    expect(computeScale(100, 200, 50, 50, "height")).toBe(0.25);
  });

  it("returns min ratio for contain fit mode", () => {
    expect(computeScale(100, 200, 50, 50, "contain")).toBe(0.25);
  });

  it("returns min ratio when width is limiting (contain)", () => {
    expect(computeScale(200, 100, 50, 50, "contain")).toBe(0.25);
  });

  it("handles same-size images", () => {
    expect(computeScale(100, 100, 100, 100, "contain")).toBe(1);
  });

  it("handles upscaling", () => {
    expect(computeScale(50, 50, 100, 100, "contain")).toBe(2);
  });
});
