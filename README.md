# paint-quant

A browser-based pixel art tool that quantizes images down to 28 colors (16 fixed palette + 12 adaptive) and exports the result as a JSON spec.

Upload an image, pick a canvas size, adjust the fit and padding, then export the quantized result.

## Features

- **Image quantization** using Median Cut, NeuQuant, or WuQuant algorithms (via [image-q](https://github.com/ImgPix/image-q))
- **10 canvas presets** from 16x16 to 64x64, in various aspect ratios
- **3 fit modes** — contain (fit within), fill by width, or fill by height
- **Padding color picker** — choose any of the 16 fixed palette colors as the background
- **8 accent colors** — Orange, Rose, Yellow, Green, Teal, Blue, Violet, Pink
- **Light / Dark / System** theme toggle
- **Grid overlay** to preview pixel boundaries
- **Copy JSON** — exports the quantized image as a JSON spec to your clipboard
- **GitHub Pages** deployment via GitHub Actions

## Getting started

```bash
# Install dependencies
vp install

# Start dev server
vp dev

# Type check + lint
vp check

# Fix formatting and lint issues
vp check --fix

# Run tests
vp test

# Run tests in watch mode
vp test watch
```

### Deploying to GitHub Pages

The site deploys automatically on push to `main` via [GitHub Actions](.github/workflows/deploy.yml).

To enable it, go to **Settings → Pages → Source** and select **GitHub Actions**.

## Project structure

```
src/
├── palette.ts            # Fixed palette, RGB type, nearest-color lookup
├── types.ts              # CanvasType, ImageFitMode, canvas presets
├── preprocess.ts         # Image resizing/fitting into canvas dimensions
├── quantize.ts           # Median Cut, NeuQuant, WuQuant quantization
├── quantize.worker.ts    # Web worker for off-main-thread quantization
├── serialize.ts          # Serializes quantized image to JSON spec
├── lib/                  # Utilities (cn helper)
├── __tests__/            # Vitest unit tests
├── components/           # React components + shadcn/ui primitives
└── App.tsx               # Main app (useReducer state management)

.github/workflows/
└── deploy.yml            # GitHub Pages deployment
```

## Exported JSON format

```json
{
  "version": 1,
  "canvasType": "SMALL",
  "palette": [[r, g, b], ...],
  "pixels": "FEDCBA9876543210..."
}
```

- `canvasType` — maps to a canvas preset (`SMALL`, `LONG`, `TALL`, `LARGE`, etc.)
- `palette` — up to 12 adaptive RGB colors
- `pixels` — one character per pixel, referencing the 16 fixed palette (`0`-`F`) or the adaptive palette (`G`-`R`)

## Tech stack

- React 19 + TypeScript
- Vite (via [Vite+](https://viteplus.dev))
- TailwindCSS v4
- [shadcn/ui](https://ui.shadcn.com) components
- [image-q](https://github.com/ImgPix/image-q) for quantization
- [lucide-react](https://lucide.dev) icons
- [Vitest](https://vitest.dev) for testing
- Web Workers for off-main-thread quantization
- [GitHub Actions](https://github.com/features/actions) for deployment
