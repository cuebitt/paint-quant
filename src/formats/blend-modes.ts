import { AsepriteLayerBlendMode } from "@pixelation/aseprite";

type BlendFn = (
  srcR: number,
  srcG: number,
  srcB: number,
  srcA: number,
  dstR: number,
  dstG: number,
  dstB: number,
  dstA: number,
) => [number, number, number, number];

function alphaCompositing(
  srcA: number,
  dstA: number,
  blend: (s: number, d: number) => number,
  srcR: number,
  srcG: number,
  srcB: number,
  dstR: number,
  dstG: number,
  dstB: number,
): [number, number, number, number] {
  const outA = srcA + dstA * (1 - srcA);
  if (outA === 0) return [0, 0, 0, 0];
  const outR = (blend(srcR, dstR) * srcA + dstR * dstA * (1 - srcA)) / outA;
  const outG = (blend(srcG, dstG) * srcA + dstG * dstA * (1 - srcA)) / outA;
  const outB = (blend(srcB, dstB) * srcA + dstB * dstA * (1 - srcA)) / outA;
  return [Math.round(outR), Math.round(outG), Math.round(outB), outA];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;

  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

const blendNormal: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) =>
  alphaCompositing(sA, dA, (s, _d) => s, sR, sG, sB, dR, dG, dB);

const blendMultiply: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) =>
  alphaCompositing(sA, dA, (s, d) => (s * d) / 255, sR, sG, sB, dR, dG, dB);

const blendScreen: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) =>
  alphaCompositing(sA, dA, (s, d) => 255 - ((255 - s) * (255 - d)) / 255, sR, sG, sB, dR, dG, dB);

const blendOverlay: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) => {
  const channel = (s: number, d: number) =>
    d < 128 ? (2 * s * d) / 255 : 255 - (2 * (255 - s) * (255 - d)) / 255;
  return alphaCompositing(sA, dA, channel, sR, sG, sB, dR, dG, dB);
};

const blendDarken: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) =>
  alphaCompositing(sA, dA, (s, d) => Math.min(s, d), sR, sG, sB, dR, dG, dB);

const blendLighten: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) =>
  alphaCompositing(sA, dA, (s, d) => Math.max(s, d), sR, sG, sB, dR, dG, dB);

const blendColorDodge: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) => {
  const channel = (s: number, d: number) =>
    d === 255 ? 255 : Math.min(255, (d * 255) / (255 - s));
  return alphaCompositing(sA, dA, channel, sR, sG, sB, dR, dG, dB);
};

const blendColorBurn: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) => {
  const channel = (s: number, d: number) =>
    d === 0 ? 0 : Math.max(0, 255 - ((255 - d) * 255) / s);
  return alphaCompositing(sA, dA, channel, sR, sG, sB, dR, dG, dB);
};

const blendHardLight: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) => {
  const channel = (s: number, d: number) =>
    s < 128 ? (2 * s * d) / 255 : 255 - (2 * (255 - s) * (255 - d)) / 255;
  return alphaCompositing(sA, dA, channel, sR, sG, sB, dR, dG, dB);
};

const blendSoftLight: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) => {
  const channel = (s: number, d: number) => {
    const sN = s / 255;
    const dN = d / 255;
    if (sN <= 0.5) return d - (1 - 2 * sN) * d * (1 - d);
    const g = dN <= 0.25 ? ((16 * dN - 12) * dN + 4) * dN : Math.sqrt(dN);
    return d + (2 * sN - 1) * (g - d);
  };
  return alphaCompositing(
    sA,
    dA,
    (s, d) => (Math.round(channel(s, d) * 255) / 255) * 255,
    sR,
    sG,
    sB,
    dR,
    dG,
    dB,
  );
};

const blendDifference: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) =>
  alphaCompositing(sA, dA, (s, d) => Math.abs(s - d), sR, sG, sB, dR, dG, dB);

const blendExclusion: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) =>
  alphaCompositing(sA, dA, (s, d) => s + d - (2 * s * d) / 255, sR, sG, sB, dR, dG, dB);

const blendAddition: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) =>
  alphaCompositing(sA, dA, (s, d) => Math.min(255, s + d), sR, sG, sB, dR, dG, dB);

const blendSubtract: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) =>
  alphaCompositing(sA, dA, (s, d) => Math.max(0, s - d), sR, sG, sB, dR, dG, dB);

const blendDivide: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) => {
  const channel = (s: number, d: number) => (d === 0 ? 255 : Math.min(255, (s * 255) / d));
  return alphaCompositing(sA, dA, channel, sR, sG, sB, dR, dG, dB);
};

function hslBlend(
  sR: number,
  sG: number,
  sB: number,
  dR: number,
  dG: number,
  dB: number,
  mode: "hue" | "saturation" | "color" | "luminosity",
): [number, number, number] {
  const [sH, sS, sL] = rgbToHsl(sR, sG, sB);
  const [dH, dS, dL] = rgbToHsl(dR, dG, dB);

  switch (mode) {
    case "hue":
      return hslToRgb(sH, dS, dL);
    case "saturation":
      return hslToRgb(dH, sS, dL);
    case "color":
      return hslToRgb(sH, sS, dL);
    case "luminosity":
      return hslToRgb(dH, dS, sL);
  }
}

const blendHue: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) => {
  const [oR, oG, oB] = hslBlend(sR, sG, sB, dR, dG, dB, "hue");
  return alphaCompositing(sA, dA, (s, _d) => s, oR, oG, oB, dR, dG, dB);
};

const blendSaturation: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) => {
  const [oR, oG, oB] = hslBlend(sR, sG, sB, dR, dG, dB, "saturation");
  return alphaCompositing(sA, dA, (s, _d) => s, oR, oG, oB, dR, dG, dB);
};

const blendColor: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) => {
  const [oR, oG, oB] = hslBlend(sR, sG, sB, dR, dG, dB, "color");
  return alphaCompositing(sA, dA, (s, _d) => s, oR, oG, oB, dR, dG, dB);
};

const blendLuminosity: BlendFn = (sR, sG, sB, sA, dR, dG, dB, dA) => {
  const [oR, oG, oB] = hslBlend(sR, sG, sB, dR, dG, dB, "luminosity");
  return alphaCompositing(sA, dA, (s, _d) => s, oR, oG, oB, dR, dG, dB);
};

const blendFunctions: Record<AsepriteLayerBlendMode, BlendFn> = {
  [AsepriteLayerBlendMode.Normal]: blendNormal,
  [AsepriteLayerBlendMode.Multiply]: blendMultiply,
  [AsepriteLayerBlendMode.Screen]: blendScreen,
  [AsepriteLayerBlendMode.Overlay]: blendOverlay,
  [AsepriteLayerBlendMode.Darken]: blendDarken,
  [AsepriteLayerBlendMode.Lighten]: blendLighten,
  [AsepriteLayerBlendMode.ColorDodge]: blendColorDodge,
  [AsepriteLayerBlendMode.ColorBurn]: blendColorBurn,
  [AsepriteLayerBlendMode.HardLight]: blendHardLight,
  [AsepriteLayerBlendMode.SoftLight]: blendSoftLight,
  [AsepriteLayerBlendMode.Difference]: blendDifference,
  [AsepriteLayerBlendMode.Exclusion]: blendExclusion,
  [AsepriteLayerBlendMode.Hue]: blendHue,
  [AsepriteLayerBlendMode.Saturation]: blendSaturation,
  [AsepriteLayerBlendMode.Color]: blendColor,
  [AsepriteLayerBlendMode.Luminosity]: blendLuminosity,
  [AsepriteLayerBlendMode.Addition]: blendAddition,
  [AsepriteLayerBlendMode.Subtract]: blendSubtract,
  [AsepriteLayerBlendMode.Divide]: blendDivide,
};

export function applyBlendMode(
  mode: AsepriteLayerBlendMode,
  srcR: number,
  srcG: number,
  srcB: number,
  srcA: number,
  dstR: number,
  dstG: number,
  dstB: number,
  dstA: number,
): [number, number, number, number] {
  const fn = blendFunctions[mode];
  return fn ? fn(srcR, srcG, srcB, srcA, dstR, dstG, dstB, dstA) : [0, 0, 0, 0];
}
