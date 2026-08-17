# REVU App Icons

## Source Icon
`app-icon-source.jpg` — The source REVU logomark (black background, red square, white italic "R").

## Generating All Required Icon Sizes

Tauri's CLI generates all required icon sizes from the source image automatically.
Run this once from the `revu-app/` directory after installing dependencies:

```bash
cd revu-app
npm install
npx tauri icon src-tauri/icons/app-icon-source.jpg
```

This will generate all the required icon files:
- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)
- `Square*.png` (Windows Store tiles)

## Icon Format Notes
- The `tauri icon` command can accept JPEG, PNG, or SVG as input.
- The source image should be at least 1024x1024 px for best quality.
- The generated icon files are placed in `src-tauri/icons/` automatically.
- Add `src-tauri/icons/` (except the source) to `.gitignore` or commit them — both are fine. The GitHub Actions workflow regenerates them from source during build.

## Why No Pre-committed PNGs?
The individual sized PNG files are generated artifacts. The source JPEG + `tauri icon` command is the canonical source of truth.
