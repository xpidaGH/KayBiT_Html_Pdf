# KayBiT_Html_Pdf — Cross-Platform Student Notes & Vector PDF Compiler

**KayBiT_Html_Pdf** is a high-performance, multiplatform note compiler that converts `.html`, `.txt`, `.md`, and `.mdx` documents into beautifully formatted, publication-ready vector PDF documents, interactive flashcard decks, and structured study guides.

---

## 🏛️ Architecture Overview

The system features a hybrid triple-runtime deployment model designed for web, desktop, and mobile platforms:

| Target Platform | Runtime Architecture | PDF Engine | Features |
| :--- | :--- | :--- | :--- |
| **Web App / Microservice** | Express.js + Vite + React | Server-side Puppeteer (Chromium) | High-resolution vector PDF export, selectable text, password encryption, custom watermarks |
| **Desktop App** | Electron (macOS, Windows, Linux) | Native `webContents.printToPDF()` | Offline zero-dependency PDF rendering, local filesystem IPC handlers, native print dialogues |
| **Mobile App** | Capacitor (iOS & Android) | Capacitor Native Printer Plugin | System print preview integration, touch-friendly UI, native PDF sharing |

---

## ⚙️ Features at a Glance

- 📄 **Multi-Format Parsing:** Ingests HTML, Markdown, MDX, and Plain Text files seamlessly.
- 🎨 **Code Syntax Highlighting:** 8 customizable themes (Dracula, One Dark, GitHub Light, Nord, Monokai, VS Code Dark, Night Owl, Solarized Light).
- 📌 **Auto-Generated TOC & Scroll Sync:** Automatic H1-H3 heading detection with interactive TOC navigation and active chapter scroll sync.
- 🖋️ **Interactive Canvas Annotations:** Overlay drawing toolbar with highlighter, pen, eraser, and color swatches for drawing on preview before export.
- 📜 **PDF Export History Log:** Tracks export timestamps, status codes, file sizes, watermarks, and encryption status with local browser persistence.
- 🤖 **Gemini AI Study Guide Generator:** Automated summary, flashcard, and quiz generation using Gemini 2.5 Flash.

---

## 📦 Cross-Platform Packaging Guide

### 1. Web Microservice Deployment (Node.js + Express + Docker)

#### Local Development
```bash
# Install dependencies
npm install

# Run Vite + Express dev server on port 3000
npm run dev
```

#### Production Build & Server Launch
```bash
# Build Vite SPA frontend and bundle server with esbuild
npm run build

# Start production server
npm start
```

#### Containerized Docker Deployment
Create a `Dockerfile` in the root directory:
```dockerfile
FROM node:20-slim

# Install Puppeteer Chromium dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

---

### 2. Desktop Packaging (Electron for macOS, Windows & Linux)

#### Installation & Project Setup
```bash
# Install Electron & Electron Builder as dev dependencies
npm install -D electron electron-builder
```

#### Main Electron Process (`electron/main.js`)
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Native Vector PDF Printing IPC Handler
  ipcMain.handle('generate-native-pdf', async (event, options) => {
    try {
      const pdfBuffer = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: options?.pageSize || 'A4',
        margins: { marginType: 'none' }
      });
      return { success: true, data: pdfBuffer };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

#### Preload Script (`electron/preload.js`)
```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  generateNativePdf: (options) => ipcRenderer.invoke('generate-native-pdf', options)
});
```

#### Package Executables
```bash
# Package for macOS (.dmg, .app), Windows (.exe installer), and Linux (.AppImage)
npx electron-builder --mac --win --linux
```

---

### 3. Mobile App Packaging (Capacitor for iOS & Android)

#### Installation & Configuration
```bash
# Install Capacitor core & CLI
npm install @capacitor/core @capacitor/cli @capacitor-community/printer
npx cap init KayBiT_Html_Pdf com.kaybit.htmlpdf --web-dir dist
```

#### Add Native Platforms & Sync
```bash
# Build React web application
npm run build

# Add iOS and Android target projects
npx cap add ios
npx cap add android

# Sync built assets to native projects
npx cap sync
```

#### Launch Native Environments
```bash
# Open Xcode for iOS compilation and simulator testing
npx cap open ios

# Open Android Studio for Android compilation and APK packaging
npx cap open android
```

---

## 🚀 CI/CD Automated Build Pipeline

Sample GitHub Actions Workflow (`.github/workflows/build.yml`):
```yaml
name: Build & Release Cross-Platform Binaries

on:
  push:
    tags:
      - 'v*'

jobs:
  build-cross-platform:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Build Web App
        run: npm run build

      - name: Build Desktop Binaries
        run: npx electron-builder
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 📝 License

Distributed under the MIT License. Designed for students, educators, and developer note-takers.
