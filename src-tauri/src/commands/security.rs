// ============================================================
// BlameBot — Security Audit Engine
// Static analysis for common vulnerability patterns
// ============================================================

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use regex::Regex;
use uuid::Uuid;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SecurityFinding {
    pub id: String,
    pub severity: String,
    pub finding_type: String,
    pub title: String,
    pub description: String,
    pub file: String,
    pub line: Option<usize>,
    pub snippet: Option<String>,
    pub cwe: Option<String>,
    pub suggested_fix: Option<String>,
    pub confidence: u8,
}

// ─── Security Rules ───────────────────────────────────────────

struct SecurityRule {
    name: &'static str,
    pattern: &'static str,
    finding_type: &'static str,
    severity: &'static str,
    title: &'static str,
    description: &'static str,
    cwe: Option<&'static str>,
    fix: &'static str,
    confidence: u8,
    languages: &'static [&'static str],
}

const SECURITY_RULES: &[SecurityRule] = &[
    // ── Hardcoded Secrets ─────────────────────────────────────
    SecurityRule {
        name: "hardcoded_password",
        pattern: r#"(?i)(password|passwd|pwd)\s*[:=]\s*["']([^"']{4,})"#,
        finding_type: "hardcoded_secret",
        severity: "critical",
        title: "Hardcoded Password",
        description: "A password appears to be hardcoded in the source code. Attackers with code access can extract these credentials.",
        cwe: Some("CWE-259"),
        fix: "Use environment variables or a secrets manager (e.g., Vault, AWS Secrets Manager) to store credentials. Never commit credentials to version control.",
        confidence: 85,
        languages: &["javascript", "typescript", "python", "java", "go", "rust"],
    },
    SecurityRule {
        name: "hardcoded_api_key",
        pattern: r#"(?i)(api[_-]?key|api[_-]?secret|auth[_-]?token|access[_-]?token)\s*[:=]\s*["']([A-Za-z0-9_\-\.]{12,})"#,
        finding_type: "hardcoded_secret",
        severity: "critical",
        title: "Hardcoded API Key",
        description: "An API key or authentication token is hardcoded in the source. This can lead to unauthorized access if the code is leaked.",
        cwe: Some("CWE-312"),
        fix: "Store API keys in environment variables (process.env.API_KEY) and use a .env file excluded from version control.",
        confidence: 80,
        languages: &["javascript", "typescript", "python", "java"],
    },
    SecurityRule {
        name: "aws_access_key",
        pattern: r#"AKIA[0-9A-Z]{16}"#,
        finding_type: "exposed_credential",
        severity: "critical",
        title: "Exposed AWS Access Key",
        description: "An AWS Access Key ID has been found in the source code. This could allow unauthorized access to AWS resources.",
        cwe: Some("CWE-798"),
        fix: "Immediately rotate the AWS key. Use AWS IAM roles or environment variables instead of hardcoding credentials.",
        confidence: 95,
        languages: &["javascript", "typescript", "python", "java", "yaml", "json"],
    },
    SecurityRule {
        name: "private_key_pem",
        pattern: r#"-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----"#,
        finding_type: "exposed_credential",
        severity: "critical",
        title: "Private Key in Source",
        description: "A PEM-encoded private key has been found in source code. This is an extremely serious security risk.",
        cwe: Some("CWE-321"),
        fix: "Immediately revoke the key and remove it from the codebase. Use secure key management systems.",
        confidence: 99,
        languages: &["unknown", "javascript", "typescript", "python", "java"],
    },
    // ── SQL Injection ─────────────────────────────────────────
    SecurityRule {
        name: "sql_injection_string_concat",
        pattern: r#"(?i)(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\s+.*\+\s*(\w+|["'])"#,
        finding_type: "sql_injection",
        severity: "high",
        title: "Potential SQL Injection via String Concatenation",
        description: "SQL query constructed via string concatenation with user-controlled data may be vulnerable to SQL injection attacks.",
        cwe: Some("CWE-89"),
        fix: "Use parameterized queries or prepared statements. Never concatenate user input into SQL strings directly.",
        confidence: 75,
        languages: &["javascript", "typescript", "python", "java"],
    },
    SecurityRule {
        name: "sql_raw_query",
        pattern: r#"(?i)\.raw\(|execute\(f"|execute\(f'|\.query\(`.*\$\{"#,
        finding_type: "sql_injection",
        severity: "high",
        title: "Raw SQL Query with Variable Interpolation",
        description: "Template literal or f-string interpolation in SQL queries can lead to injection vulnerabilities.",
        cwe: Some("CWE-89"),
        fix: "Use ORM parameterized methods (e.g., Sequelize.query with replacements, SQLAlchemy's text() with bindparams).",
        confidence: 80,
        languages: &["javascript", "typescript", "python"],
    },
    // ── Unsafe Eval ──────────────────────────────────────────
    SecurityRule {
        name: "eval_usage",
        pattern: r#"\beval\s*\("#,
        finding_type: "unsafe_eval",
        severity: "high",
        title: "Unsafe eval() Usage",
        description: "eval() executes arbitrary code and can lead to code injection if user input is passed to it.",
        cwe: Some("CWE-95"),
        fix: "Avoid eval() entirely. Use JSON.parse() for JSON, Function constructor alternatives, or restructure your logic.",
        confidence: 90,
        languages: &["javascript", "typescript"],
    },
    SecurityRule {
        name: "exec_usage_python",
        pattern: r#"\bexec\s*\("|\bos\.system\s*\("|\bsubprocess\.call\s*\(.*shell\s*=\s*True"#,
        finding_type: "command_injection",
        severity: "high",
        title: "Shell Command Injection Risk",
        description: "Executing shell commands with user-controlled input can lead to command injection.",
        cwe: Some("CWE-78"),
        fix: "Use subprocess.run() with a list of arguments instead of shell=True. Validate and sanitize all user input.",
        confidence: 80,
        languages: &["python"],
    },
    // ── Weak Crypto ───────────────────────────────────────────
    SecurityRule {
        name: "md5_usage",
        pattern: r#"(?i)\bMD5\b|\.md5\(|hashlib\.md5\(|MessageDigest\.getInstance\("MD5"\)"#,
        finding_type: "weak_crypto",
        severity: "medium",
        title: "Weak Hashing Algorithm (MD5)",
        description: "MD5 is cryptographically broken and should not be used for security-sensitive operations like password hashing.",
        cwe: Some("CWE-327"),
        fix: "Use SHA-256 or SHA-3 for general hashing, bcrypt/Argon2/scrypt for password hashing.",
        confidence: 90,
        languages: &["javascript", "typescript", "python", "java"],
    },
    SecurityRule {
        name: "sha1_password",
        pattern: r#"(?i)sha1\s*\(.*password|password.*sha1\s*\("#,
        finding_type: "weak_crypto",
        severity: "high",
        title: "SHA-1 Used for Password Hashing",
        description: "SHA-1 is cryptographically weak and should never be used for password storage.",
        cwe: Some("CWE-916"),
        fix: "Use bcrypt, Argon2, or scrypt for password hashing.",
        confidence: 85,
        languages: &["javascript", "typescript", "python", "java"],
    },
    // ── Path Traversal ────────────────────────────────────────
    SecurityRule {
        name: "path_traversal",
        pattern: r#"(?i)(req\.(params|query|body)\.\w+|request\.\w+)\s*\+\s*|path\.join\(.*req\."#,
        finding_type: "path_traversal",
        severity: "high",
        title: "Potential Path Traversal",
        description: "User-controlled input used in file path construction can enable path traversal attacks (../../etc/passwd).",
        cwe: Some("CWE-22"),
        fix: "Use path.resolve() and validate that the resolved path starts with the intended base directory. Use allowlists for valid paths.",
        confidence: 70,
        languages: &["javascript", "typescript", "python"],
    },
    // ── XSS ──────────────────────────────────────────────────
    SecurityRule {
        name: "dangerously_set_html",
        pattern: r#"dangerouslySetInnerHTML|innerHTML\s*="#,
        finding_type: "xss",
        severity: "medium",
        title: "Potential XSS via innerHTML",
        description: "Setting innerHTML or using dangerouslySetInnerHTML with user data can lead to cross-site scripting (XSS).",
        cwe: Some("CWE-79"),
        fix: "Use textContent instead of innerHTML. If HTML must be set, use DOMPurify to sanitize the content first.",
        confidence: 75,
        languages: &["javascript", "typescript"],
    },
    // ── Debug / Info Disclosure ───────────────────────────────
    SecurityRule {
        name: "debug_in_production",
        pattern: r#"(?i)DEBUG\s*=\s*True|app\.debug\s*=\s*True|NODE_ENV\s*=\s*["']development["']"#,
        finding_type: "authentication_flaw",
        severity: "low",
        title: "Debug Mode Enabled",
        description: "Debug mode may expose sensitive stack traces, application internals, and error details.",
        cwe: Some("CWE-94"),
        fix: "Ensure DEBUG is set to False/false in production. Use environment variables to control this.",
        confidence: 80,
        languages: &["python", "javascript", "typescript"],
    },
];

// ─── Audit Command ────────────────────────────────────────────

#[tauri::command]
pub fn run_security_audit(project_path: String) -> Result<Vec<SecurityFinding>, String> {
    let root = Path::new(&project_path);
    if !root.exists() {
        return Err(format!("Path not found: {}", project_path));
    }

    let mut findings: Vec<SecurityFinding> = Vec::new();
    let excludes = vec![
        "node_modules", ".git", "dist", "build", "target", ".next",
        "__pycache__", "vendor", "coverage", ".cache",
    ];

    for entry in WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
    {
        let path = entry.path();

        // Skip excluded directories
        if excludes.iter().any(|ex| path.to_string_lossy().contains(ex)) {
            continue;
        }

        // Only analyze source files
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
            "yaml" | "yml" => "yaml",
            "json" => "json",
            _ => continue,
        };

        // Skip large files
        if let Ok(meta) = fs::metadata(path) {
            if meta.len() > 200_000 { continue; }
        }

        let content = match fs::read_to_string(path) {
            Ok(c) => c,
            Err(_) => continue,
        };

        let path_str = path.to_string_lossy().into_owned();

        // Apply each rule
        for rule in SECURITY_RULES {
            // Language filter
            if !rule.languages.is_empty() && !rule.languages.contains(&language) {
                continue;
            }

            let re = match Regex::new(rule.pattern) {
                Ok(r) => r,
                Err(_) => continue,
            };

            for (line_idx, line) in content.lines().enumerate() {
                if re.is_match(line) {
                    // Skip comment lines
                    let trimmed = line.trim();
                    if trimmed.starts_with("//") || trimmed.starts_with("#") || trimmed.starts_with("*") {
                        continue;
                    }

                    findings.push(SecurityFinding {
                        id: Uuid::new_v4().to_string(),
                        severity: rule.severity.to_string(),
                        finding_type: rule.finding_type.to_string(),
                        title: rule.title.to_string(),
                        description: rule.description.to_string(),
                        file: path_str.clone(),
                        line: Some(line_idx + 1),
                        snippet: Some(get_snippet(&content, line_idx, 2)),
                        cwe: rule.cwe.map(|s| s.to_string()),
                        suggested_fix: Some(rule.fix.to_string()),
                        confidence: rule.confidence,
                    });
                }
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

// ─── Helper: Extract Code Snippet ────────────────────────────

fn get_snippet(content: &str, line_idx: usize, context: usize) -> String {
    let lines: Vec<&str> = content.lines().collect();
    let start = line_idx.saturating_sub(context);
    let end = (line_idx + context + 1).min(lines.len());
    lines[start..end].join("\n")
}
