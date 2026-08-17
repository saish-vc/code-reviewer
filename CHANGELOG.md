# Changelog

All notable changes to REVU are documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/)

---

## [1.0.0] — 2026-08-17

### 🎉 First Desktop-Only Release

This release marks the transition from a hosted web application to a
native desktop application distributed via GitHub Releases.

### Added
- **Tauri v2 desktop app** (`revu-app/`) — wraps the existing React/Vite
  ReviewTool UI in a native webview window for Windows, macOS, and Linux.
- **GitHub Actions release workflow** (`.github/workflows/release-app.yml`) —
  triggered on `v*` tags; builds and publishes platform installers:
  - Windows: `.msi` installer
  - macOS: `.dmg` (Intel x86_64 + Apple Silicon aarch64)
  - Linux: `.AppImage` and `.deb`
- **Downloads section** on the marketing site (`src/components/Downloads.tsx`) —
  detects visitor OS, fetches live download links from the GitHub Releases API,
  highlights the matching platform, shows graceful fallback if no release exists.
- REVU app icon (black/red/white editorial logomark) generated from source.
- `CHANGELOG.md` (this file).

### Changed
- **Marketing site CTAs updated**: "TRY A REVIEW" / "START A REVIEW" /
  "04 / LIVE TOOL" all now point to the Downloads section (`#downloads`)
  instead of the in-page ReviewTool section. No remaining path to a hosted
  in-browser version of the review tool on the marketing site.
- **Backend CORS origins updated** — default `ALLOWED_ORIGINS` now includes
  the Tauri webview origins (`http://tauri.localhost` for Windows,
  `tauri://localhost` for macOS/Linux) and local dev origins. Wildcard
  origins are not used.
- **CI workflow updated** — validates both the root marketing site and the
  `revu-app/` Tauri frontend build on every PR/push.

### Removed
- **Hosted web version of revu-app retired** — the ReviewTool is no longer
  publicly accessible as a browser-based web app. The Tauri desktop app is
  the only supported way to use the review tool.
- `ReviewTool` component removed from the marketing site's `App.tsx`.
  The component source is preserved in `revu-app/src/ReviewTool.tsx`.

### Notes
- Builds are **unsigned** (no paid code-signing certificate).
  - Windows: SmartScreen may warn → "More info" → "Run anyway"
  - macOS: Gatekeeper may block → right-click app → "Open"
  - This is expected for open-source, free-distribution builds.
- Rust (via `rustup`) is required for local Tauri development.
  See `revu-app/README` section in `README.md` for setup instructions.

---

_Prior to v1.0.0, REVU was a single-page web app served from the FastAPI
backend container. No versioned changelog was maintained for that phase._
