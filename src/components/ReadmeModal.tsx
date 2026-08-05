import React from 'react';
import { X, BookOpen, Download, Terminal, Copy, Check } from 'lucide-react';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const readmeMarkdown = `# KayBiT_Html_Pdf — Cross-Platform Student Notes & Vector PDF Compiler

**KayBiT_Html_Pdf** converts HTML, .txt, .md, and .mdx files into styled student .pdf programming notes with syntax highlighting, auto-generated Table of Contents, interactive canvas overlays, and custom study callout boxes.

---

## 🏛️ 1. Hybrid Multiplatform Architecture

- **Web Mode:** Offloads rendering to a server-side Node.js microservice running Puppeteer (\`/api/generate-pdf\`). Produces true vector text PDFs with selectable text, clickable TOC anchors, password protection, watermarks, and exact CSS margins.
- **Desktop Mode (Electron):** Uses Electron's native \`webContents.printToPDF()\`. Runs locally on Chromium to print vector PDFs offline without needing an internet connection.
- **Mobile Mode (Capacitor):** Sends styled HTML to native iOS/Android print preview engine via Capacitor Printer Plugin for instant "Save as PDF".

---

## 📦 2. Cross-Platform Packaging Guide

### A. Web Microservice & Docker Deployment (Node.js + Express + Vite)

1. **Install Dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Build Production Assets & Express Server:**
   \`\`\`bash
   npm run build
   \`\`\`

3. **Launch Production Server:**
   \`\`\`bash
   npm start
   \`\`\`

4. **Docker Container Build:**
   \`\`\`dockerfile
   FROM node:20-slim
   RUN apt-get update && apt-get install -y chromium fonts-liberation libnss3 libgbm1 libasound2 --no-install-recommends
   ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   \`\`\`

---

### B. Desktop Packaging (Electron for macOS, Windows, Linux)

1. **Install Electron & Builder:**
   \`\`\`bash
   npm install -D electron electron-builder
   \`\`\`

2. **Create \`electron/main.js\` Entry Point:**
   \`\`\`javascript
   const { app, BrowserWindow, ipcMain } = require('electron');
   const path = require('path');

   function createWindow() {
     const win = new BrowserWindow({
       width: 1360,
       height: 860,
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
       const pdfBuffer = await win.webContents.printToPDF({
         printBackground: true,
         pageSize: options?.pageSize || 'A4'
       });
       return { success: true, data: pdfBuffer };
     });
   }

   app.whenReady().then(createWindow);
   \`\`\`

3. **Build Desktop Installers:**
   \`\`\`bash
   # Build for macOS (.dmg), Windows (.exe), and Linux (.AppImage)
   npx electron-builder --mac --win --linux
   \`\`\`

---

### C. Mobile App Packaging (Capacitor for iOS & Android)

1. **Install Capacitor Dependencies:**
   \`\`\`bash
   npm install @capacitor/core @capacitor/cli @capacitor-community/printer
   npx cap init KayBiT_Html_Pdf com.kaybit.htmlpdf --web-dir dist
   \`\`\`

2. **Build Web App & Sync to Mobile Containers:**
   \`\`\`bash
   npm run build
   npx cap add ios
   npx cap add android
   npx cap sync
   \`\`\`

3. **Open Native IDEs to Compile & Publish:**
   \`\`\`bash
   # Open Xcode for iOS
   npx cap open ios

   # Open Android Studio for Android
   npx cap open android
   \`\`\`

---

## 3. Student Features Checklist

- [x] Syntax Highlighting with 8 Themes (Dracula, One Dark, GitHub Light, Nord, Monokai, VS Code Dark, Night Owl, Solarized Light)
- [x] Auto-Generated Table of Contents (scans H1, H2, H3 tags) & TOC Scroll Sync
- [x] Interactive Canvas Annotation Overlay (Highlighter, Pen, Eraser, Swatches)
- [x] Quick PDF Side Pane Direct Download
- [x] PDF Export History Log with Browser Local Persistence
- [x] Metadata Header Banner (Source file date, query name, language, word count)
- [x] Custom Student Callout Boxes (:::summary, :::warning, :::tip, :::code)
- [x] Page Break Protection (\`break-inside: avoid\` for code snippets)
- [x] Interactive Student Revision Flashcards Deck
- [x] Gemini AI Study Guide Generator
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(readmeMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold">Cross-Platform Packaging Guide (README.md)</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied README!' : 'Copy README.md'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950">
          <pre className="whitespace-pre-wrap leading-relaxed text-slate-300">
            {readmeMarkdown}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
