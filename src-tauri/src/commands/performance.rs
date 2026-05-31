// ============================================================
// BlameBot — Performance Audit Engine
// Detects common performance anti-patterns in source code
// ============================================================

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use regex::Regex;
use uuid::Uuid;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PerfFinding {
    pub id: String,
    pub severity: String,
    pub issue_type: String,
    pub title: String,
    pub description: String,
    pub file: String,
    pub line: Option<usize>,
    pub snippet: Option<String>,
    pub impact: String,
    pub suggested_fix: Option<String>,
}

struct PerfRule {
    pattern: &'static str,
    issue_type: &'static str,
    severity: &'static str,
    title: &'static str,
    description: &'static str,
    impact: &'static str,
    fix: &'static str,
    languages: &'static [&'static str],
}

const PERF_RULES: &[PerfRule] = &[
    // ── N+1 Query Patterns ────────────────────────────────────
    PerfRule {
        pattern: r#"(?i)(for|forEach|map|while)\s*[\(\{].*\n?.*(findOne|findById|query|select|fetch|\.get\(|repository\."#,
        issue_type: "n_plus_one",
        severity: "high",
        title: "Potential N+1 Query Pattern",
        description: "A database query inside a loop creates N+1 queries. For N items, this executes N+1 separate DB calls instead of one.",
        impact: "high",
        fix: "Use bulk fetch operations (findMany, IN clauses, JOIN queries) before the loop. Fetch all needed data in a single query, then access it from memory.",
        languages: &["javascript", "typescript", "python", "java"],
    },
    PerfRule {
        pattern: r#"\.map\(async|\.forEach\(async|for await.*await"#,
        issue_type: "n_plus_one",
        severity: "medium",
        title: "Sequential Async Operations in Loop",
        description: "Awaiting async operations sequentially in a loop prevents parallelism. Each operation must complete before the next begins.",
        impact: "high",
        fix: "Use Promise.all() to parallelize independent operations: `await Promise.all(items.map(async item => ...))`",
        languages: &["javascript", "typescript"],
    },
    // ── Inefficient Loops ─────────────────────────────────────
    PerfRule {
        pattern: r#"for\s*\([^)]+\)\s*\{[^}]*for\s*\([^)]+\)\s*\{"#,
        issue_type: "inefficient_loop",
        severity: "medium",
        title: "Nested Loop Detected (O(n²) Complexity)",
        description: "Nested loops create O(n²) time complexity. For large datasets, this can cause severe performance degradation.",
        impact: "medium",
        fix: "Consider using hash maps/Sets to reduce to O(n). For sorting+merging operations, use two-pointer techniques.",
        languages: &["javascript", "typescript", "python", "java", "rust", "go"],
    },
    // ── Memory Issues ─────────────────────────────────────────
    PerfRule {
        pattern: r#"\.push\(|\.append\(|\.concat\("#,
        issue_type: "large_allocation",
        severity: "low",
        title: "Repeated Array Growth",
        description: "Repeatedly pushing to arrays or concatenating strings in a loop causes multiple memory reallocations.",
        impact: "low",
        fix: "Pre-allocate arrays with known size. Use Array.from() or collect() to build arrays in one step. For strings, use join() or StringBuilder.",
        languages: &["javascript", "typescript", "python"],
    },
    // ── Synchronous I/O ───────────────────────────────────────
    PerfRule {
        pattern: r#"(?i)fs\.readFileSync|fs\.writeFileSync|fs\.existsSync|readFileSync\("#,
        issue_type: "synchronous_io",
        severity: "high",
        title: "Synchronous File I/O in Application Code",
        description: "Synchronous file operations block the event loop, preventing other requests from being processed.",
        impact: "high",
        fix: "Use the async versions: fs.readFile(), fs.writeFile(), or use fs.promises API with async/await.",
        languages: &["javascript", "typescript"],
    },
    PerfRule {
        pattern: r#"time\.sleep\(|Thread\.sleep\(|sleep\("#,
        issue_type: "synchronous_io",
        severity: "medium",
        title: "Blocking Sleep Call",
        description: "Blocking sleep calls halt thread execution and waste resources. Avoid in production code.",
        impact: "medium",
        fix: "Use async/await with proper Promise-based delays. In servers, use event-driven patterns instead of polling with sleep.",
        languages: &["python", "java", "javascript", "typescript"],
    },
    // ── React Performance ──────────────────────────────────────
    PerfRule {
        pattern: r#"(?i)(setState|useState|dispatch).*\{.*\}.*=>"#,
        issue_type: "excessive_rerenders",
        severity: "low",
        title: "Potential Excessive React Re-renders",
        description: "Object/array literals in render functions create new references on every render, potentially causing unnecessary re-renders.",
        impact: "medium",
        fix: "Use useMemo() for expensive computations and useCallback() for functions passed as props. Move constants outside components.",
        languages: &["javascript", "typescript"],
    },
    // ── Regex ─────────────────────────────────────────────────
    PerfRule {
        pattern: r#"new RegExp\(".*\+|new RegExp\(`"#,
        issue_type: "unoptimized_regex",
        severity: "medium",
        title: "Regex Compiled Inside Loop or Function",
        description: "Creating RegExp objects dynamically (especially with new RegExp()) is expensive. If inside a loop, it recompiles on every iteration.",
        impact: "medium",
        fix: "Compile regex patterns once outside loops/functions using const re = /pattern/flags; and reuse them.",
        languages: &["javascript", "typescript"],
    },
    // ── Slow DB Patterns ──────────────────────────────────────
    PerfRule {
        pattern: r#"SELECT\s+\*\s+FROM|select\s+\*\s+from"#,
        issue_type: "slow_db_access",
        severity: "medium",
        title: "SELECT * Query",
        description: "Selecting all columns (SELECT *) fetches unnecessary data, increasing network transfer and memory usage.",
        impact: "medium",
        fix: "Explicitly select only the columns you need: SELECT id, name, email FROM users. Add appropriate indexes for frequently queried columns.",
        languages: &["sql", "javascript", "typescript", "python", "java"],
    },
    PerfRule {
        pattern: r#"(?i)(LIKE\s+'%|like\s+'%)"#,
        issue_type: "slow_db_access",
        severity: "medium",
        title: "Leading Wildcard in LIKE Query",
        description: "A leading wildcard in LIKE queries (LIKE '%value') prevents index usage, causing full table scans.",
        impact: "high",
        fix: "Avoid leading wildcards. Use full-text search (MATCH AGAINST in MySQL, tsvector in PostgreSQL) for text search use cases.",
        languages: &["sql", "javascript", "typescript", "python", "java"],
    },
];

#[tauri::command]
pub fn run_performance_audit(project_path: String) -> Result<Vec<PerfFinding>, String> {
    let root = Path::new(&project_path);
    if !root.exists() {
        return Err(format!("Path not found: {}", project_path));
    }

    let mut findings: Vec<PerfFinding> = Vec::new();
    let excludes = vec![
        "node_modules", ".git", "dist", "build", "target", ".next",
        "__pycache__", "vendor", "coverage",
    ];

    for entry in WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
    {
        let path = entry.path();

        if excludes.iter().any(|ex| path.to_string_lossy().contains(ex)) {
            continue;
        }

        let ext = path.extension()
            .map(|e| e.to_string_lossy().to_lowercase())
            .unwrap_or_default();

        let language = match ext.as_str() {
            "ts" | "tsx" => "typescript",
            "js" | "jsx" | "mjs" => "javascript",
            "py" => "python",
            "java" => "java",
            "rs" => "rust",
            "go" => "go",
            "sql" => "sql",
            _ => continue,
        };

        if let Ok(meta) = fs::metadata(path) {
            if meta.len() > 200_000 { continue; }
        }

        let content = match fs::read_to_string(path) {
            Ok(c) => c,
            Err(_) => continue,
        };

        let path_str = path.to_string_lossy().into_owned();

        for rule in PERF_RULES {
            if !rule.languages.is_empty() && !rule.languages.contains(&language) {
                continue;
            }

            // For multi-line patterns, use the full content
            let re = match Regex::new(rule.pattern) {
                Ok(r) => r,
                Err(_) => continue,
            };

            if re.is_match(&content) {
                // Find which line first
                let line_idx = content.lines().enumerate()
                    .find(|(_, line)| {
                        let trimmed = line.trim();
                        !trimmed.starts_with("//") && !trimmed.starts_with("#") && re.is_match(line)
                    })
                    .map(|(i, _)| i);

                findings.push(PerfFinding {
                    id: Uuid::new_v4().to_string(),
                    severity: rule.severity.to_string(),
                    issue_type: rule.issue_type.to_string(),
                    title: rule.title.to_string(),
                    description: rule.description.to_string(),
                    file: path_str.clone(),
                    line: line_idx.map(|i| i + 1),
                    snippet: line_idx.map(|i| get_snippet(&content, i, 2)),
                    impact: rule.impact.to_string(),
                    suggested_fix: Some(rule.fix.to_string()),
                });
            }
        }
    }

    // Sort by severity
    findings.sort_by_key(|f| match f.severity.as_str() {
        "critical" => 0,
        "high"     => 1,
        "medium"   => 2,
        "low"      => 3,
        _          => 4,
    });

    Ok(findings)
}

fn get_snippet(content: &str, line_idx: usize, context: usize) -> String {
    let lines: Vec<&str> = content.lines().collect();
    let start = line_idx.saturating_sub(context);
    let end = (line_idx + context + 1).min(lines.len());
    lines[start..end].join("\n")
}
