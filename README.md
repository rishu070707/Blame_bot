# BlameBot 🤖
**Find bugs. Fix code. Audit projects. All offline.**

BlameBot is a lightning-fast, privacy-first AI developer copilot built as a native desktop application. Unlike cloud-based AI assistants, BlameBot runs 100% locally on your machine, ensuring your proprietary code never leaves your computer. 

Featuring a stunning "Premium Dark Neumorphism" interface, BlameBot seamlessly integrates with local LLMs (via Ollama) and leverages a high-performance Rust backend to analyze your entire codebase in milliseconds.

## ✨ Features

- **100% Offline & Private:** Powered by your local models (e.g., DeepSeek Coder, Llama 3) via Ollama. No subscriptions, no cloud telemetry.
- **Lightning Fast Code Search:** In-memory TF-IDF search engine indexes your code dynamically as you type.
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
3. **Ollama** - Download from [ollama.com](https://ollama.com/) and run `ollama run deepseek-coder`

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
