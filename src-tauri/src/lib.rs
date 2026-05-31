// ============================================================
// BlameBot — Tauri Rust Backend
// Main library entry point with all command registrations
// ============================================================

use tauri::{
    Manager, Emitter,
    tray::{TrayIconBuilder, TrayIconEvent},
    menu::{Menu, MenuItem},
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

mod commands;

pub use commands::scanner::*;
pub use commands::security::*;
pub use commands::performance::*;
pub use commands::system::*;

// ─── Tauri Builder ────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // ── Plugins ──────────────────────────────────────────
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        // ── Commands ─────────────────────────────────────────
        .invoke_handler(tauri::generate_handler![
            // Scanner
            scan_project,
            read_file_content,
            get_file_stats,
            get_files_for_indexing,
            // Security
            run_security_audit,
            // Performance
            run_performance_audit,
            // System
            get_system_info,
            open_in_explorer,
            open_in_editor,
            hide_window,
            show_window,
            save_app_data,
            load_app_data,
        ])
        // ── Setup ────────────────────────────────────────────
        .setup(|app| {
            setup_global_shortcut(app)?;
            setup_system_tray(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while running BlameBot");
}

// ─── Global Shortcut (Ctrl+Space) ────────────────────────────

fn setup_global_shortcut(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri_plugin_global_shortcut::Code;
    use tauri_plugin_global_shortcut::Modifiers;

    let shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::Space);

    app.global_shortcut().on_shortcut(shortcut, |app_handle, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            if let Some(window) = app_handle.get_webview_window("main") {
                let visible = window.is_visible().unwrap_or(false);
                if visible {
                    // If app visible, just send event to open command bar
                    let _ = window.emit("toggle-command-bar", ());
                } else {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit("toggle-command-bar", ());
                }
            }
        }
    })?;

    Ok(())
}

// ─── System Tray ─────────────────────────────────────────────

fn setup_system_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let show = MenuItem::with_id(app, "show", "Show BlameBot", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show, &quit])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("BlameBot — Offline AI Copilot")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { .. } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let visible = window.is_visible().unwrap_or(false);
                    if visible {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}
