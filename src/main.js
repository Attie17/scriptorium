const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');
const PROJECTS_PATH = path.join(app.getPath('userData'), 'projects');

if (!fs.existsSync(PROJECTS_PATH)) fs.mkdirSync(PROJECTS_PATH, { recursive: true });

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f0f0f',
    show: false
  });

  mainWindow.loadFile('src/index.html');
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// ── CONFIG ──────────────────────────────────────────────────────────────────
ipcMain.handle('load-config', () => {
  if (fs.existsSync(CONFIG_PATH)) return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  return null;
});

ipcMain.handle('save-config', (_, config) => {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  return true;
});

// ── PROJECTS ─────────────────────────────────────────────────────────────────
ipcMain.handle('list-projects', () => {
  const files = fs.readdirSync(PROJECTS_PATH).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(PROJECTS_PATH, f), 'utf8'));
    return { id: f.replace('.json', ''), name: data.name, genre: data.genre, updatedAt: data.updatedAt };
  });
});

ipcMain.handle('load-project', (_, id) => {
  const p = path.join(PROJECTS_PATH, `${id}.json`);
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  return null;
});

ipcMain.handle('save-project', (_, project) => {
  project.updatedAt = new Date().toISOString();
  fs.writeFileSync(path.join(PROJECTS_PATH, `${project.id}.json`), JSON.stringify(project, null, 2));
  return true;
});

// ── AI CALLS ─────────────────────────────────────────────────────────────────
ipcMain.handle('ai-call', async (_, { provider, prompt, systemPrompt }) => {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

  try {
    if (provider === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.keys.claude,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 4000,
          system: systemPrompt || '',
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      if (data.error) return { error: data.error.message };
      return { text: data.content[0].text };
    }

    if (provider === 'perplexity') {
      const res = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.keys.perplexity}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            { role: 'system', content: systemPrompt || 'You are a research assistant.' },
            { role: 'user', content: prompt }
          ]
        })
      });
      const data = await res.json();
      if (data.error) return { error: data.error.message };
      return { text: data.choices[0].message.content };
    }

    if (provider === 'grok') {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.keys.grok}`
        },
        body: JSON.stringify({
          model: 'grok-2-latest',
          messages: [
            { role: 'system', content: systemPrompt || 'You are a fact-checking assistant.' },
            { role: 'user', content: prompt }
          ]
        })
      });
      const data = await res.json();
      if (data.error) return { error: data.error.message };
      return { text: data.choices[0].message.content };
    }

    if (provider === 'chatgpt') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.keys.chatgpt}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt || 'You are an editorial assistant.' },
            { role: 'user', content: prompt }
          ]
        })
      });
      const data = await res.json();
      if (data.error) return { error: data.error.message };
      return { text: data.choices[0].message.content };
    }

    return { error: 'Unknown provider' };
  } catch (err) {
    return { error: err.message };
  }
});

// ── EXPORT ────────────────────────────────────────────────────────────────────
ipcMain.handle('export-docx', async (_, { content, title, language }) => {
  const { Document, Paragraph, TextRun, HeadingLevel, PageBreak, AlignmentType } = require('docx');

  const lines = content.split('\n').filter(l => l.trim());
  const children = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      children.push(new Paragraph({ text: line.replace('## ', ''), heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
    } else if (line.startsWith('### ')) {
      children.push(new Paragraph({ text: line.replace('### ', ''), heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }));
    } else if (line.startsWith('---')) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    } else {
      children.push(new Paragraph({
        children: [new TextRun({ text: line, font: 'Georgia', size: 24 })],
        spacing: { after: 200 },
        alignment: AlignmentType.JUSTIFIED
      }));
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: title, heading: HeadingLevel.TITLE, spacing: { after: 400 } }),
        ...children
      ]
    }]
  });

  const { Packer } = require('docx');
  const buffer = await Packer.toBuffer(doc);

  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Chapter',
    defaultPath: `${title.replace(/[^a-z0-9]/gi, '_')}.docx`,
    filters: [{ name: 'Word Document', extensions: ['docx'] }]
  });

  if (filePath) {
    fs.writeFileSync(filePath, buffer);
    return { success: true, path: filePath };
  }
  return { success: false };
});
