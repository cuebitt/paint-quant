type RGB = [number, number, number];

const FIXED_PALETTE: RGB[] = [
  [249, 255, 254],
  [249, 128, 29],
  [199, 78, 189],
  [58, 179, 218],
  [254, 216, 61],
  [128, 199, 31],
  [243, 139, 170],
  [71, 79, 82],
  [157, 157, 151],
  [22, 156, 156],
  [137, 50, 184],
  [60, 68, 170],
  [131, 84, 50],
  [94, 124, 22],
  [176, 46, 38],
  [29, 29, 33],
];

function medianCut(pixels: RGB[], depth: number): RGB[] {
  if (pixels.length === 0) return [[0, 0, 0]];
  if (depth === 0) {
    const sum = pixels.reduce(([ar, ag, ab], [r, g, b]) => [ar + r, ag + g, ab + b], [0, 0, 0]);
    const n = pixels.length;
    return [[Math.round(sum[0] / n), Math.round(sum[1] / n), Math.round(sum[2] / n)]];
  }

  const min = [Infinity, Infinity, Infinity] as RGB;
  const max = [-Infinity, -Infinity, -Infinity] as RGB;
  for (const [r, g, b] of pixels) {
    if (r < min[0]) min[0] = r;
    if (g < min[1]) min[1] = g;
    if (b < min[2]) min[2] = b;
    if (r > max[0]) max[0] = r;
    if (g > max[1]) max[1] = g;
    if (b > max[2]) max[2] = b;
  }

  const ranges: [number, number, number] = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];

  const channel =
    ranges[0] >= ranges[1] && ranges[0] >= ranges[2] ? 0 : ranges[1] >= ranges[2] ? 1 : 2;

  pixels.sort((a, b) => a[channel] - b[channel]);

  const mid = Math.floor(pixels.length / 2);
  return [
    ...medianCut(pixels.slice(0, mid), depth - 1),
    ...medianCut(pixels.slice(mid), depth - 1),
  ];
}

export function quantize(imageData: ImageData) {
  const { data, width, height } = imageData;
  const pixels: RGB[] = [];

  for (let i = 0; i < data.length; i += 4) {
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }

  const adaptive = pixels.length < 16 ? pixels.map((p) => p) : medianCut(pixels, 4);
  const combined = [...FIXED_PALETTE, ...adaptive];

  const output = new ImageData(width, height);

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];

    let bestIdx = 0;
    let bestDist = Infinity;
    for (let j = 0; j < combined.length; j++) {
      const dr = r - combined[j][0];
      const dg = g - combined[j][1];
      const db = b - combined[j][2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = j;
      }
    }

    output.data[i] = combined[bestIdx][0];
    output.data[i + 1] = combined[bestIdx][1];
    output.data[i + 2] = combined[bestIdx][2];
    output.data[i + 3] = data[i + 3];
  }

  return {
    quantized: output,
    adaptivePalette: adaptive,
    combinedPalette: combined,
  };
}

export const FIXED_PALETTE_COLORS: readonly RGB[] = FIXED_PALETTE;
