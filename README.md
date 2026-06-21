# paintcraft

A browser-based tool that reduces images to a limited palette (configurable, up to 16 fixed + adaptive colors) and saves the result as a `.paint` file.

Upload an image, pick a canvas size, adjust the fit and padding, then export the quantized result.

## Features

- **Image quantization** using Median Cut, NeuQuant, or WuQuant algorithms (via [image-q](https://github.com/ImgPix/image-q))
- **10 canvas presets** from 16x16 to 64x64, in various aspect ratios
- **3 fit modes** - contain (fit within), fill by width, or fill by height
- **Padding color picker** - choose any of the 16 fixed palette colors as the background
- **8 accent colors** - Orange, Rose, Yellow, Green, Teal, Blue, Violet, Pink
- **Light / Dark / System** theme toggle
- **Grid overlay** to preview pixel boundaries
- **Resize filters** - nearest neighbor (pixelated) or high-quality pica filters with optional unsharp mask
- **Export paint file** - saves the quantized image as a `.paint` JSON file
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

To enable it, go to **Settings > Pages > Source** and select **GitHub Actions**.

## Project structure

```
src/
├── palette.ts            # Fixed palette, RGB type, nearest-color lookup
├── types.ts              # CanvasType, ImageFitMode, canvas presets
├── preprocess.ts         # Image resizing/fitting into canvas dimensions
├── quantize.ts           # Median Cut, NeuQuant, WuQuant quantization
├── quantize.worker.ts    # Web worker for off-main-thread quantization
├── serialize.ts          # Serializes quantized image to .paint JSON spec
├── lib/
│   └── utils.ts          # Utility helpers (cn)
├── __tests__/            # Vitest unit tests
├── components/
│   ├── ui/               # shadcn/ui primitives
│   └── *.tsx             # App-specific components
└── App.tsx               # Main app (useReducer state management)

.github/workflows/
└── deploy.yml            # GitHub Pages deployment
```

## Exported .paint format

```json
{
  "version": 1,
  "canvasType": "SMALL",
  "palette": [[r, g, b], ...],
  "pixels": "FEDCBA9876543210..."
}
```

- `canvasType` - maps to a canvas preset (`SMALL`, `LONG`, `TALL`, `LARGE`, etc.)
- `palette` - up to 12 adaptive RGB colors
- `pixels` - one character per pixel, referencing the 16 fixed palette (`0`-`F`) or the adaptive palette (`G`-`R`)

## Libraries

- [React](https://github.com/facebook/react) + [TypeScript](https://github.com/microsoft/TypeScript) - UI framework
- [Vite](https://github.com/vitejs/vite) - build tool
- [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) - utility-first CSS
- [lucide-react](https://github.com/lucide-icons/lucide) - icons
- [image-q](https://github.com/ImgPix/image-q) - color quantization (Median Cut, NeuQuant, WuQuant)
- [pica](https://github.com/nickytonline/pica) - high-quality image resizing
- [react-colorful](https://github.com/omgovich/react-colorful) - color picker component
- [shadcn/ui](https://github.com/shadcn-ui/ui) - UI primitives
- [Vitest](https://github.com/vitest-dev/vitest) - test runner
