// ============================================================
// BlameBot — Project File Scanner
// Recursively scans project directories and detects languages
// ============================================================

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

// ─── Types ───────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: Option<u64>,
    pub language: Option<String>,
    pub line_count: Option<usize>,
    pub children: Option<Vec<FileNode>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanResult {
    pub tree: FileNode,
    pub total_files: usize,
    pub total_lines: usize,
    pub language_counts: HashMap<String, usize>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileStats {
    pub path: String,
    pub size: u64,
    pub line_count: usize,
    pub language: String,
    pub last_modified: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IndexableFile {
    pub path: String,
    pub content: String,
    pub language: String,
}

// ─── Language Detection ───────────────────────────────────────

fn detect_language(ext: &str) -> &'static str {
    match ext {
        "ts" | "tsx" => "typescript",
        "js" | "jsx" | "mjs" | "cjs" => "javascript",
        "py" | "pyw" => "python",
        "java" => "java",
        "rs" => "rust",
        "go" => "go",
        "css" | "scss" | "sass" | "less" => "css",
        "html" | "htm" => "html",
        "json" => "json",
        "yaml" | "yml" => "yaml",
        "toml" => "toml",
        "sql" => "sql",
        "md" | "mdx" => "markdown",
        "sh" | "bash" | "zsh" => "shell",
        "xml" => "xml",
        "kt" | "kts" => "kotlin",
        "swift" => "swift",
        "cpp" | "cc" | "cxx" => "cpp",
        "c" | "h" => "c",
        "cs" => "csharp",
        "rb" => "ruby",
        "php" => "php",
        _ => "unknown",
    }
}

fn is_excluded(path: &Path, exclude_patterns: &[String]) -> bool {
    let path_str = path.to_string_lossy();
    for pattern in exclude_patterns {
        if path_str.contains(pattern.as_str()) {
            return true;
        }
        // Also check just the directory/file name component
        if let Some(name) = path.file_name() {
            if name.to_string_lossy() == pattern.as_str() {
                return true;
            }
        }
    }
    false
}

fn count_lines(content: &str) -> usize {
    if content.is_empty() { 0 } else { content.lines().count() }
}

// ─── Commands ─────────────────────────────────────────────────

#[tauri::command]
pub fn scan_project(path: String) -> Result<ScanResult, String> {
    let root = Path::new(&path);
    if !root.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    let default_excludes = vec![
        "node_modules".to_string(),
        ".git".to_string(),
        "dist".to_string(),
        "build".to_string(),
        "target".to_string(),
        ".next".to_string(),
        "__pycache__".to_string(),
        ".cache".to_string(),
        "coverage".to_string(),
        "vendor".to_string(),
    ];

    let mut total_files = 0usize;
    let mut total_lines = 0usize;
    let mut language_counts: HashMap<String, usize> = HashMap::new();

    // Build tree node
    let tree = build_tree(root, &default_excludes, &mut total_files, &mut total_lines, &mut language_counts, 0);

    Ok(ScanResult {
        tree,
        total_files,
        total_lines,
        language_counts,
    })
}

fn build_tree(
    path: &Path,
    excludes: &[String],
    total_files: &mut usize,
    total_lines: &mut usize,
    lang_counts: &mut HashMap<String, usize>,
    depth: usize,
) -> FileNode {
    let name = path.file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_else(|| path.to_string_lossy().into_owned());

    if path.is_dir() {
        if depth > 6 { // Limit depth to avoid huge trees
            return FileNode {
                name, path: path.to_string_lossy().into_owned(),
                is_dir: true, size: None, language: None, line_count: None, children: Some(vec![]),
            };
        }

        let mut children = Vec::new();
        if let Ok(entries) = fs::read_dir(path) {
            let mut sorted: Vec<_> = entries
                .filter_map(|e| e.ok())
                .collect();
            sorted.sort_by_key(|e| (!e.path().is_dir(), e.file_name()));

            for entry in sorted {
                let child_path = entry.path();
                if !is_excluded(&child_path, excludes) {
                    children.push(build_tree(&child_path, excludes, total_files, total_lines, lang_counts, depth + 1));
                }
            }
        }

        FileNode {
            name, path: path.to_string_lossy().into_owned(),
            is_dir: true, size: None, language: None, line_count: None,
            children: Some(children),
        }
    } else {
        // It's a file
        let ext = path.extension()
            .map(|e| e.to_string_lossy().into_owned())
            .unwrap_or_default();
        let language = detect_language(&ext).to_string();
        let size = fs::metadata(path).map(|m| m.len()).ok();

        let line_count = if size.unwrap_or(0) < 500_000 { // Skip files > 500KB
            fs::read_to_string(path)
                .map(|c| { let lc = count_lines(&c); *total_lines += lc; lc })
                .unwrap_or(0)
        } else { 0 };

        *total_files += 1;
        *lang_counts.entry(language.clone()).or_insert(0) += 1;

        FileNode {
            name,
            path: path.to_string_lossy().into_owned(),
            is_dir: false,
            size,
            language: Some(language),
            line_count: Some(line_count),
            children: None,
        }
    }
}

#[tauri::command]
pub fn read_file_content(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub fn get_file_stats(path: String) -> Result<FileStats, String> {
    let p = Path::new(&path);
    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    let content = fs::read_to_string(&path).unwrap_or_default();
    let ext = p.extension().map(|e| e.to_string_lossy().into_owned()).unwrap_or_default();
    let last_modified = metadata.modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs())
        .unwrap_or(0);

    Ok(FileStats {
        path,
        size: metadata.len(),
        line_count: count_lines(&content),
        language: detect_language(&ext).to_string(),
        last_modified,
    })
}

#[tauri::command]
pub fn get_files_for_indexing(
    project_path: String,
    exclude_patterns: Vec<String>,
    extensions: Vec<String>,
) -> Result<Vec<IndexableFile>, String> {
    let root = Path::new(&project_path);
    let mut files = Vec::new();

    // Normalize extensions (strip leading dots)
    let exts: Vec<String> = extensions.iter()
        .map(|e| e.trim_start_matches('.').to_lowercase())
        .collect();

    for entry in WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
    {
        let path = entry.path();

        // Skip excluded paths
        if is_excluded(path, &exclude_patterns) {
            continue;
        }

        // Check extension
        let ext = path.extension()
            .map(|e| e.to_string_lossy().to_lowercase())
            .unwrap_or_default();

        if !exts.is_empty() && !exts.contains(&ext.to_string()) {
            continue;
        }

        // Skip very large files (>500KB)
        if let Ok(meta) = fs::metadata(path) {
            if meta.len() > 500_000 {
                continue;
            }
        }

        if let Ok(content) = fs::read_to_string(path) {
            let language = detect_language(&ext).to_string();
            files.push(IndexableFile {
                path: path.to_string_lossy().into_owned(),
                content,
                language,
            });
        }
    }

    Ok(files)
}
