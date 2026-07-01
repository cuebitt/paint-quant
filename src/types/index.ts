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

export type PaintFormat = "jop-1x" | "jop-delta" | "jop-2x";

export const PAINT_FORMATS: {
  value: PaintFormat;
  label: string;
  description: string;
}[] = [
  {
    value: "jop-1x",
    label: "Joy of Painting 1.x",
    description: "Base version",
  },

  {
    value: "jop-2x",
    label: "Joy of Painting 2.x",
    description: "Glass & side painting",
  },
  {
    value: "jop-delta",
    label: "Cobblemon Delta",
    description: "Extended canvas types",
  },
];

export const ALLOWED_CANVAS_TYPES_FOR_FORMAT: Record<PaintFormat, Set<string>> = {
  "jop-1x": new Set(["1×1 Canvas", "2×2 Square", "2×1 Long Canvas", "1×2 Tall Canvas"]),
  "jop-delta": new Set(CANVAS_TYPES.map((c) => c.name)),
  "jop-2x": new Set(["1×1 Canvas", "2×2 Square", "2×1 Long Canvas", "1×2 Tall Canvas"]),
};

export function findClosestCanvas(current: CanvasType, format: PaintFormat): CanvasType {
  const allowed = ALLOWED_CANVAS_TYPES_FOR_FORMAT[format];
  if (allowed.has(current.name)) return current;

  const currentArea = current.width * current.height;
  let best: CanvasType | null = null;
  let bestDist = Infinity;

  for (const canvas of CANVAS_TYPES) {
    if (!allowed.has(canvas.name)) continue;
    const area = canvas.width * canvas.height;
    const dist = Math.abs(area - currentArea);
    if (dist < bestDist || (dist === bestDist && canvas.name < (best?.name ?? ""))) {
      bestDist = dist;
      best = canvas;
    }
  }

  return best ?? CANVAS_TYPES[0]!;
}
