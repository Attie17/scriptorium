# Scriptorium — Setup Guide

A multi-AI, human-approved publishing pipeline for serious writers.

---

## Requirements

- **Node.js** v18 or later — https://nodejs.org
- **VS Code** (recommended) or any terminal
- API keys for: Claude (Anthropic), ChatGPT (OpenAI), Perplexity, Grok (xAI)

---

## Installation

1. **Unzip** the `scriptorium` folder anywhere on your computer.

2. **Open a terminal** in the `scriptorium` folder.  
   In VS Code: open the folder, then press `` Ctrl+` `` (or `Cmd+` `` ` `` on Mac).

3. **Install dependencies:**
   ```
   npm install
   ```
   This takes about 1–2 minutes the first time.

4. **Start the app:**
   ```
   npm start
   ```

The app opens as a desktop window. You will be guided through entering your API keys on first launch.

---

## First Launch

You will be asked to:
1. Enter your 4 API keys (stored locally, never shared)
2. Enter your name as author
3. Name your first project
4. Choose genre, language, and structure

After that, you are inside the app.

---

## Using the Pipeline

Every chapter follows 6 steps. You approve each one before the next begins:

| Step | AI Used | Your Role |
|------|---------|-----------|
| 1. Research | Perplexity + Grok | Review findings, edit brief, approve |
| 2. Write | Claude | Review draft, edit directly, approve |
| 3. Fact-Check | Grok + Claude | Review verdicts and corrections, approve |
| 4. Source Check | Perplexity | Review source verdicts, approve |
| 5. Editorial | ChatGPT | Review notes, apply changes, approve |
| 6. Export | — | Download .docx for KDP or other publisher |

---

## Adding More Projects

Click **+ New Project** in the sidebar. Each project has its own genre, language, and structure settings. The pipeline adapts automatically.

---

## Language Options

- **English only** — standard pipeline
- **Afrikaans only** — Claude writes in Afrikaans throughout
- **English + Afrikaans** — English pipeline first, then Afrikaans translation exported as a second .docx

---

## Where Your Data Lives

Everything is saved locally on your machine:
- **Config + API keys:** your system's app data folder (Electron userData)
- **Projects + chapters:** same folder, as `.json` files
- **Exported .docx files:** wherever you choose to save them

Nothing leaves your machine except the API calls to Claude, Grok, Perplexity, and ChatGPT.

---

## Troubleshooting

**App doesn't open after `npm start`:**  
Make sure Node.js is installed: run `node --version` in terminal.

**"Error: invalid API key":**  
Go to Settings (bottom-left) and re-enter your keys.

**Blank panel after running a step:**  
The API call may have failed. Check your internet connection and API key balance.

---

## Folder Structure

```
scriptorium/
├── package.json        — dependencies
├── src/
│   ├── main.js         — Electron app + API calls + export
│   ├── index.html      — full UI
│   └── pipeline.js     — AI prompts per genre and step
└── README-DEV.md       — this file
```

---

## Adding Genres

Open `src/pipeline.js` and add a new entry to `GENRE_VOICES` and `STEP_PROMPTS`. The UI picks it up automatically from the genre select in the New Project modal.

---

Built for Stephanus Nel · Scriptorium v1.0
