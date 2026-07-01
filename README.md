# paintcraft 🎨

Converts images into `.paint` files for the [Joy of Painting](https://modrinth.com/mod/joy-of-painting) Minecraft mod. Drop in an image, pick a canvas size, tweak the fit and padding, export.

Supports PNG, JPEG, WEBP, GIF, PSD, Aseprite, Pixil, Piskel, SVG, and `.paint` files. Can also re-import `.paint` files if you want to keep editing.

## What it does

**Import & export**

- Loads PNG, JPEG, WEBP, GIF, SVG, PSD, Aseprite, Pixil, and Piskel (`.ase`, `.aseprite`, `.pixil`, `.piskel`)
- Re-imports `.paint` files for further editing (auto-detects format variant)
- Exports as `.paint` NBT, PNG, or copies to clipboard
- Three format variants: `jop-1x` (base), `jop-delta` (Cobblemon Delta), `jop-2x` (glass + side paintings)

**Image processing**

- Optional quantization via Median Cut, NeuQuant, or WuQuant (using [image-q](https://github.com/ImgPix/image-q)) with Floyd-Steinberg dithering
- 1–256 adaptive colors, with support for fixed palette inclusion
- Resize filters: nearest neighbor, box, hamming, lanczos2, lanczos3, or Magic Kernel Sharp 2013 (via [pica](https://github.com/nickytonline/pica)), plus optional unsharp mask
- Side-by-side original vs. processed comparison
- Embed original image as WebP inside `.paint` file for re-editing later

**Canvas & layout**

- 10 presets from 16×16 to 64×64, see [Canvas presets](#canvas-presets)
- Fit modes: contain, fill by width, fill by height
- Background color picker (full hex, with RGBA for glass mode)
- Grid overlay
- Glass canvas support (jop-2x format) with transparent backgrounds
- Side painting support (jop-2x format), exports edge pixel data for 3D canvas blocks

**Settings**

- 8 accent colors, light/dark/system theme
- Signed or unsigned painting toggle (controls `generation` and `v` fields for Joy of Painting compatibility)
- Title and author fields for signed paintings
- Tooltip toggle (show/hide tooltips globally)
- Transparency grid toggle

**Other**

- Undo/redo with 50-state history
- Keyboard shortcuts — see [below](#keyboard-shortcuts)
- Saves your quantization method, fit mode, resize filter, and theme to localStorage
- Heavy processing runs in Web Workers to keep the UI responsive

## What it does not

`paintcraft` does not include any painting/pixel editing features. Use [Pixil](http://pixilart.com), [Piskel](http://piskelapp.com), [PhotoPea](http://photopea.com), or [Aseprite](https://www.aseprite.org).

## Getting started

```bash
# Install dependencies
pnpm install

# Start dev server
vp dev

# Lint
vp lint

# Fix lint issues
vp lint --fix

# Format
vp fmt

# Type check (via build)
vp build

# Run tests
vp test

# Run tests in watch mode
vp test watch
```

### GitHub Pages

Deploys automatically on push to `main` with [GitHub Actions](.github/workflows/deploy.yml). To enable, go to **Settings > Pages > Source** and choose **GitHub Actions**.

## Keyboard shortcuts

| Shortcut                  | Action               |
| ------------------------- | -------------------- |
| `Ctrl+Z`                  | Undo                 |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo                 |
| `G`                       | Toggle grid overlay  |
| `Q`                       | Toggle quantization  |
| `Ctrl+Shift+E`            | Export `.paint` file |
| `Ctrl+Shift+P`            | Export PNG           |
| `Ctrl+Shift+C`            | Copy to clipboard    |

## Canvas presets

| Index | Name             | Dimensions | Cells | Aspect ratio |
| ----- | ---------------- | ---------- | ----- | ------------ |
| 0     | 1x1 Canvas       | 16×16      | 1×1   | 1:1          |
| 1     | 2x1 Long Canvas  | 32×16      | 2×1   | 2:1          |
| 2     | 1x2 Tall Canvas  | 16×32      | 1×2   | 1:2          |
| 3     | 2x2 Square       | 32×32      | 2×2   | 1:1          |
| 4     | 3x3 Square       | 48×48      | 3×3   | 1:1          |
| 5     | 4x4 Large Square | 64×64      | 4×4   | 1:1          |
| 6     | 3x2 Medium       | 48×32      | 3×2   | 3:2          |
| 7     | 4x3 Wide         | 64×48      | 4×3   | 4:3          |
| 8     | 2x3 Medium       | 32×48      | 2×3   | 2:3          |
| 9     | 3x4 Tall         | 48×64      | 3×4   | 3:4          |

## .paint file format

An uncompressed NBT binary. Three format variants:

| Variant     | Description          | Canvas types                     |
| ----------- | -------------------- | -------------------------------- |
| `jop-1x`    | Base Joy of Painting | 0–3 (16×16 to 32×32)             |
| `jop-delta` | Cobblemon Delta      | 0–9 (all presets)                |
| `jop-2x`    | Joy of Painting 2.x  | 0–9 (all presets, glass + sides) |

### Common fields

| Field        | Type      | Description                                   |
| ------------ | --------- | --------------------------------------------- |
| `ct`         | byte      | Canvas type index (0–9)                       |
| `pixels`     | int array | ARGB pixel values                             |
| `generation` | int       | 0 = unsigned, 1 = signed                      |
| `v`          | int       | 99 = unsigned, 2 = signed                     |
| `name`       | string    | Auto-generated UUID-based identifier          |
| `title`      | string    | Only written if both title and author are set |
| `author`     | string    | Only written if both title and author are set |

### Additional fields (jop-2x only)

| Field        | Type       | Description                         |
| ------------ | ---------- | ----------------------------------- |
| `img`        | byte array | Embedded WebP image (if enabled)    |
| `sidePixels` | int array  | Edge pixel data for 3D canvas sides |

### Canvas type → dimensions

| Index | Dimensions | Pixels |
| ----- | ---------- | ------ |
| 0     | 16×16      | 256    |
| 1     | 32×16      | 512    |
| 2     | 16×32      | 512    |
| 3     | 32×32      | 1024   |
| 4     | 48×48      | 2304   |
| 5     | 64×64      | 4096   |
| 6     | 48×32      | 1536   |
| 7     | 64×48      | 3072   |
| 8     | 32×48      | 1536   |
| 9     | 48×64      | 3072   |

## Libraries

- [Preact](https://github.com/preactjs/preact) + [TypeScript](https://github.com/microsoft/TypeScript) — UI
- [Zustand](https://github.com/pmndrs/zustand) — state management
- [Vite-plus](https://github.com/voidzero-dev/vite-plus) — build tool
- [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss), [shadcn/ui](https://github.com/shadcn-ui/ui), [lucide-react](https://github.com/lucide-icons/lucide), [react-colorful](https://github.com/omgovich/react-colorful), [@base-ui/react](https://github.com/mui/base-ui)
- [image-q](https://github.com/ImgPix/image-q) — quantization
- [pica](https://github.com/nickytonline/pica) — resizing
- [nbtify](https://github.com/Offroaders123/nbtify) — NBT read/write
- [@pixelation/aseprite](https://github.com/nickytonline/aseprite-loader), [ag-psd](https://github.com/nickytonline/ag-psd) — file format support
- [DOMPurify](https://github.com/cure53/DOMPurify) — HTML sanitization
- [Vitest](https://github.com/vitest-dev/vitest) — tests
