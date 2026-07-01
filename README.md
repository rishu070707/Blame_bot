# BlameBot 🤖
**The Unlimited, 100% Offline VS Code Alternative Desktop App with Native AI.**

BlameBot is a lightning-fast, privacy-first code editor and AI developer copilot built as a **native desktop application** (macOS, Windows, Linux). It gives you the familiar, powerful environment of VS Code, but completely offline as a standalone app supercharged with local AI. No subscriptions, no internet required, and zero rate limits. Your code never leaves your machine.

Featuring a stunning "Premium Dark Neumorphism" interface, BlameBot seamlessly integrates with local LLMs (via Ollama) and leverages a high-performance Rust backend to analyze, edit, and audit your entire codebase in milliseconds.

## ✨ Features

- **The Native Desktop VS Code Experience:** Enjoy a familiar, high-performance code editor interface built for deep focus as a dedicated desktop app, without the telemetry or bloated web dependencies.
- **Unlimited Offline AI:** Powered by your local models (e.g., qwen2.5-coder:1.5b, Llama 3) via Ollama. Say goodbye to API costs, usage caps, and recurring fees. Generate and edit as much code as you want, forever.
- **Fully Functional Native Terminal:** A built-in multi-tab terminal powered by Tauri's shell plugin that hooks directly into your OS (`PowerShell` or `sh`) with full ANSI color support and command history.
- **Robust Plugin & Extension Ecosystem:** Customize your workspace with custom Monaco themes, editor configurations (like Vim mode), and extensions, all managed efficiently in-memory via Zustand.
- **One-Click Auto-Fix:** BlameBot can write code directly to your local file system. Click "Apply to File" in chat or from audit reports to instantly patch your codebase.
- **Lightning Fast Code Search:** In-memory TF-IDF search engine indexes your code dynamically as you type, right inside your editor.
- **Automated Security & Performance Audits:** A native Rust backend crawls your file tree instantly, detecting hardcoded secrets, injection risks, N+1 queries, and blocking I/O with AI-suggested fixes.
- **Floating Command Bar:** Summon BlameBot from anywhere on your OS using `Ctrl+Space` for rapid AI queries and project navigation.
- **Premium UI/UX:** Built with a custom React component library featuring fluid framer-motion micro-interactions, glassmorphic glows, and beautiful data visualization.

## 🛠️ Tech Stack

* **Frontend:** React 19, TypeScript, Vite, Zustand (State Management), Framer Motion
* **Backend:** Rust, Tauri 2.0
* **AI Engine:** Ollama API (`localhost:11434`)
* **Styling:** Custom Vanilla CSS Design System (Premium Dark Neumorphism)

## 🚀 Getting Started

### Prerequisites
1. **Node.js** (v20+)
2. **Rust & Cargo** (Ensure MSVC C++ Build Tools or GNU MinGW toolchain is installed on Windows)
3. **Ollama** - Download from [ollama.com](https://ollama.com/) and run `ollama run qwen2.5-coder:1.5b`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/blamebot.git
   cd blamebot
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the application in development mode:
   ```bash
   npm run tauri dev
   ```

4. Build for production:
   ```bash
   npm run tauri build
   ```

## 🔒 Privacy & Security
BlameBot was designed from the ground up for enterprise environments with strict compliance requirements. It uses zero network requests outside of `localhost`. Your code is parsed, tokenized, and analyzed entirely within the confines of your own CPU and RAM.

---
*Built with ❤️ for developers who value speed, aesthetics, and privacy.*
