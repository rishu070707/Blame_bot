// ============================================================
// BlameBot — System Commands
// App data, window management, file system helpers
// ============================================================

use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, Runtime};

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub app_data_dir: String,
    pub home_dir: String,
}

#[tauri::command]
pub fn get_system_info<R: Runtime>(app: AppHandle<R>) -> Result<SystemInfo, String> {
    let app_data = app.path().app_data_dir()
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_else(|_| String::from("unknown"));

    let home = dirs_next::home_dir()
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_else(|| String::from("unknown"));

    Ok(SystemInfo {
        os: env::consts::OS.to_string(),
        arch: env::consts::ARCH.to_string(),
        app_data_dir: app_data,
        home_dir: home,
    })
}

#[tauri::command]
pub fn open_in_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn open_in_editor(path: String) -> Result<(), String> {
    // Try VS Code first, fall back to system default
    let editors = ["code", "cursor", "subl", "vim"];
    for editor in &editors {
        if let Ok(_child) = std::process::Command::new(editor).arg(&path).spawn() {
            return Ok(());
        }
    }
    // Fall back to OS default
    open_in_explorer(path)
}

#[tauri::command]
pub fn hide_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn show_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        let _ = window.set_focus();
    }
    Ok(())
}

// ─── App Data Storage (simple KV store using files) ──────────

fn get_data_dir<R: Runtime>(app: &AppHandle<R>) -> PathBuf {
    app.path().app_data_dir()
        .map(|p| p.join("blamebot-data"))
        .unwrap_or_else(|_| PathBuf::from("./blamebot-data"))
}

#[tauri::command]
pub fn save_app_data<R: Runtime>(
    app: AppHandle<R>,
    key: String,
    data: String,
) -> Result<(), String> {
    let dir = get_data_dir(&app);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let file_path = dir.join(format!("{}.json", key));
    fs::write(file_path, data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_app_data<R: Runtime>(
    app: AppHandle<R>,
    key: String,
) -> Result<Option<String>, String> {
    let dir = get_data_dir(&app);
    let file_path = dir.join(format!("{}.json", key));
    if file_path.exists() {
        Ok(Some(fs::read_to_string(file_path).map_err(|e| e.to_string())?))
    } else {
        Ok(None)
    }
}
