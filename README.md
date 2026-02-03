# Prompti

**Enhance your prompts with AI — from anywhere.**

Prompti is a menubar app that transforms rough prompts into clear, effective ones. Click the icon or press `Cmd+Shift+Space` from any app, paste your prompt, and get an enhanced version instantly.

![Prompti Demo](assets/demo.gif)

## Features

- **Menubar/Tray App** — Always accessible, lives in your menubar
- **Global Hotkey** — `Cmd+Shift+Space` (macOS) / `Ctrl+Shift+Space` (Windows)
- **Multi-Provider Support** — Choose your AI:
  - Anthropic (Claude Opus, Sonnet, Haiku)
  - OpenAI (GPT-4o, GPT-4, GPT-3.5)
  - Google (Gemini 2.0, 1.5 Pro, 1.5 Flash)
  - Groq (Llama 3.3, Mixtral, Gemma)
  - Ollama (Local models - no API key needed!)
- **Secure** — API keys stored in macOS Keychain / Windows Credential Manager
- **Auto-Copy** — Enhanced prompt is automatically copied to clipboard
- **Dark Theme** — Clean, modern Arc-style UI

## Installation

### macOS

**Option 1: Download DMG**
1. Download `Prompti.dmg` from [Releases](https://github.com/thewolfeai/Prompti/releases)
2. Open the DMG and drag Prompti to Applications
3. Launch Prompti from Applications

**Option 2: Build from source**
```bash
git clone https://github.com/thewolfeai/Prompti.git
cd Prompti
npm install
npm run build:mac
```

### Windows

**Option 1: Download Installer**
1. Download `Prompti-Setup.exe` from [Releases](https://github.com/thewolfeai/Prompti/releases)
2. Run the installer

**Option 2: Build from source**
```bash
git clone https://github.com/thewolfeai/Prompti.git
cd Prompti
npm install
npm run build:win
```

## First Launch

1. **Choose your AI provider** — Select from Anthropic, OpenAI, Google, Groq, or Ollama
2. **Select a model** — Pick the specific model you want to use
3. **Enter your API key** — Paste your API key (skip for Ollama)
4. **Done!** — Click the menubar icon or press `Cmd+Shift+Space` to start enhancing prompts

## Getting API Keys

| Provider | Get Your Key |
|----------|--------------|
| Anthropic (Claude) | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) |
| OpenAI (GPT) | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Google (Gemini) | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) |
| Ollama | No key needed — [ollama.com](https://ollama.com) |

## Usage

1. **Open Prompti** — Click the menubar icon or press `Cmd+Shift+Space`
2. **Enter your prompt** — Type or paste your rough prompt
3. **Enhance** — Press Enter or click the Enhance button
4. **Paste** — The enhanced prompt is auto-copied, ready to paste anywhere

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+Space` | Open/close Prompti |
| `Enter` | Enhance prompt |
| `Cmd+Enter` | Enhance, copy, and close |
| `Esc` | Close Prompti |

## Development

```bash
# Clone the repo
git clone https://github.com/thewolfeai/Prompti.git
cd Prompti

# Install dependencies
npm install

# Run in development
npm start

# Build for macOS
npm run build:mac

# Build for Windows
npm run build:win
```

## How It Works

Prompti uses a carefully crafted system prompt to transform your rough prompts:

```
Transform rough prompts into clear, effective prompts.

Rules:
1. Preserve the original intent exactly
2. Add context and specificity where missing
3. Structure clearly: context → task → format
4. Remove ambiguity
5. Stay concise - don't over-elaborate
```

**Example:**
- **Input:** "help me write an email to my boss about being late"
- **Output:** "Write a professional, apologetic email to my manager explaining I'll be 15-30 minutes late today. Keep it respectful and brief. Offer to make up the time or handle urgent matters remotely."

## Security

- **No bundled API keys** — App ships without any keys
- **Secure storage** — Keys stored in macOS Keychain / Windows Credential Manager
- **No telemetry** — Your prompts are only sent to your chosen AI provider
- **Local option** — Use Ollama for 100% local, offline operation

## Tech Stack

- [Electron](https://www.electronjs.org/) — Cross-platform desktop app
- [Keytar](https://github.com/atom/node-keytar) — Secure credential storage
- AI SDKs: Anthropic, OpenAI, Google Generative AI, Groq

## License

MIT License — feel free to use, modify, and distribute.

## Contributing

Contributions welcome! Please open an issue or PR.

---

Made with AI assistance by [Drake Wolfe](https://github.com/thewolfeai)
