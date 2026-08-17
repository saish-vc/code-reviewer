// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

/// REVU Desktop App — Tauri backend (lib.rs)
///
/// All review logic lives in the React frontend (ReviewTool.tsx) and the
/// Python FastAPI backend (app.py). This Rust file is intentionally minimal —
/// it only bootstraps the Tauri webview window.
///
/// The webview makes fetch() calls directly to the VITE_API_BASE_URL
/// production backend. The Tauri window origin that the backend sees for CORS:
///   - Windows:         http://tauri.localhost
///   - macOS / Linux:   tauri://localhost
/// Both must be listed in the backend's ALLOWED_ORIGINS env var.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running REVU desktop application");
}
