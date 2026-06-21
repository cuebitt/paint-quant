export type ImageFitMode = "contain" | "width" | "height";

export const FIT_MODES: { value: ImageFitMode; label: string }[] = [
  { value: "contain", label: "Contain (Fit)" },
  { value: "width", label: "Fill by Width" },
  { value: "height", label: "Fill by Height" },
];

export interface CanvasType {
  name: string;
  width: number;
  height: number;
  cellsX: number;
  cellsY: number;
}

export const CANVAS_TYPES: CanvasType[] = [
  { name: "1×1 Canvas", width: 16, height: 16, cellsX: 1, cellsY: 1 },
  { name: "2×1 Long Canvas", width: 32, height: 16, cellsX: 2, cellsY: 1 },
  { name: "1×2 Tall Canvas", width: 16, height: 32, cellsX: 1, cellsY: 2 },
  { name: "2×2 Square", width: 32, height: 32, cellsX: 2, cellsY: 2 },
  { name: "3×3 Square", width: 48, height: 48, cellsX: 3, cellsY: 3 },
  { name: "4×4 Large Square", width: 64, height: 64, cellsX: 4, cellsY: 4 },
  { name: "3×2 Medium", width: 48, height: 32, cellsX: 3, cellsY: 2 },
  { name: "4×3 Wide", width: 64, height: 48, cellsX: 4, cellsY: 3 },
  { name: "2×3 Medium", width: 32, height: 48, cellsX: 2, cellsY: 3 },
  { name: "3×4 Tall", width: 48, height: 64, cellsX: 3, cellsY: 4 },
];
