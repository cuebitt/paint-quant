# paintcraft

A browser-based tool that resizes and optionally quantizes images to a limited palette, then saves the result as a `.paint` file for use in Minecraft.

Upload an image, pick a canvas size, adjust the fit and padding, then export the result.

## Features

- **Image quantization** (optional) using Median Cut, NeuQuant, or WuQuant algorithms (via [image-q](https://github.com/ImgPix/image-q))
- **1–256 adaptive colors** with optional fixed palette inclusion
- **10 canvas presets** from 16x16 to 64x64, in various aspect ratios
- **3 fit modes** - contain (fit within), fill by width, or fill by height
- **Padding color picker** - choose any of the 16 fixed palette colors as the background
- **8 accent colors** - Orange, Rose, Yellow, Green, Teal, Blue, Violet, Pink
- **Light / Dark / System** theme toggle
- **Grid overlay** to preview pixel boundaries
- **Resize filters** - nearest neighbor (pixelated), box, hamming, lanczos2, lanczos3, or mks2013 (via [pica](https://github.com/nickytonline/pica)) with optional unsharp mask
- **Import `.paint` files** for re-editing
- **Export paint file** - saves the quantized image as a `.paint` NBT file
- **Export PNG** - saves the result as a standard PNG image
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
├── paint-nbt.ts          # Reads/writes .paint NBT files (Minecraft painting format)
├── lib/
│   └── utils.ts          # Utility helpers (cn)
├── __tests__/            # Vitest unit tests
├── components/
│   ├── ui/               # shadcn/ui primitives
│   └── *.tsx             # App-specific components
└── App.tsx               # Main app (useReducer state management)

.github/workflows/
├── ci.yml                # CI checks (format, lint, typecheck, tests)
└── deploy.yml            # GitHub Pages deployment
```

## Exported .paint format

The `.paint` file is an uncompressed NBT (Named Binary Tag) binary, compatible with Minecraft's painting data format. It contains:

| Field        | Type      | Description                                   |
| ------------ | --------- | --------------------------------------------- |
| `ct`         | byte      | Canvas type index (0–3)                       |
| `pixels`     | int array | ARGB pixel values (one int per pixel)         |
| `generation` | int       | Painting generation number                    |
| `v`          | int       | Version number                                |
| `name`       | string    | Painting name                                 |
| `author`     | string    | Author name (optional, omitted when empty)    |
| `title`      | string    | Painting title (optional, omitted when empty) |

### Canvas type indices

| Index | Dimensions | Pixel count |
| ----- | ---------- | ----------- |
| 0     | 16×16      | 256         |
| 1     | 32×32      | 1024        |
| 2     | 32×16      | 512         |
| 3     | 16×32      | 512         |

## Libraries

- [React](https://github.com/facebook/react) + [TypeScript](https://github.com/microsoft/TypeScript) - UI framework
- [Vite-plus](https://github.com/voidzero-dev/vite-plus) - build tool and CLI
- [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) - utility-first CSS
- [lucide-react](https://github.com/lucide-icons/lucide) - icons
- [image-q](https://github.com/ImgPix/image-q) - color quantization (Median Cut, NeuQuant, WuQuant)
- [pica](https://github.com/nickytonline/pica) - high-quality image resizing
- [prismarine-nbt](https://github.com/PrismarineJS/prismarine-nbt) - NBT reading/writing for .paint files
- [react-colorful](https://github.com/omgovich/react-colorful) - color picker component
- [shadcn/ui](https://github.com/shadcn-ui/ui) - UI primitives
- [Vitest](https://github.com/vitest-dev/vitest) - test runner
