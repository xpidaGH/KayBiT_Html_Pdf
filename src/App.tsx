import React, { useState, useEffect } from 'react';
import { 
  Chapter, 
  StyleConfig, 
  CoverPageConfig, 
  Flashcard, 
  PlatformMode, 
  SupportedExtension,
  PdfHistoryItem,
  RemoteSyncConfig
} from './types';
import { INITIAL_CHAPTERS } from './data/sampleChapters';
import { Header } from './components/Header';
import { ChapterSidebar } from './components/ChapterSidebar';
import { EditorView } from './components/EditorView';
import { PdfPreviewView } from './components/PdfPreviewView';
import { SettingsModal } from './components/SettingsModal';
import { FlashcardsView } from './components/FlashcardsView';
import { PlatformModal } from './components/PlatformModal';
import { ReadmeModal } from './components/ReadmeModal';
import { PdfHistoryModal } from './components/PdfHistoryModal';
import { BatchExportModal } from './components/BatchExportModal';
import { FloatingTocButton } from './components/FloatingTocButton';
import { ThemeSettingsModal } from './components/ThemeSettingsModal';
import { calculateReadingStats } from './lib/parser';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { UiThemeId, getSavedUiTheme, applyUiTheme } from './lib/themes';

export default function App() {
  // State
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    try {
      const saved = localStorage.getItem('chapters');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to load chapters from localStorage:', err);
    }
    return INITIAL_CHAPTERS;
  });
  const [activeChapterId, setActiveChapterId] = useState<string>('ch-1');

  // PDF & Page Styling Settings
  const [styleConfig, setStyleConfig] = useState<StyleConfig>(() => {
    let savedRemoteSync: RemoteSyncConfig = {
      enabled: false,
      apiUrl: '/api/sync-chapters',
      syncAuthToken: '',
      autoSync: true,
      lastSyncStatus: 'idle'
    };
    try {
      const saved = localStorage.getItem('kaybit_remote_sync_config');
      if (saved) {
        savedRemoteSync = { ...savedRemoteSync, ...JSON.parse(saved) };
      }
    } catch {}

    return {
      codeTheme: 'dracula',
      fontPairing: 'sans-mono',
      fontSizePx: 14,
      pageFormat: 'A4',
      pageMarginMm: 15,
      showLineNumbers: true,
      showTOC: true,
      showMetadataHeader: true,
      showPageNumbers: true,
      preventSnippetBreaks: true,
      primaryColor: '#4f46e5',
      watermarkEnabled: false,
      watermarkText: 'CONFIDENTIAL',
      watermarkOpacity: 0.12,
      watermarkPosition: 'center',
      watermarkRotation: -45,
      watermarkScale: 1.0,
      watermarkType: 'text-svg',
      watermarkColor: '#0f172a',
      qrCodeConfig: {
        enabled: true,
        url: typeof window !== 'undefined' ? window.location.href : 'https://ais-dev-r5oaf3sq7af4t6lpb5a6kz-413914693725.europe-west3.run.app',
        title: 'Scan for Mobile HTML Companion & Interactive Bundle',
        subtitle: 'Scan with your smartphone camera to access the live responsive HTML bundle, code snippets, flashcards, and AI study guide.',
        sizePx: 150,
        darkColor: '#0f172a',
        lightColor: '#ffffff',
        showInPrint: true,
        showUrlText: true
      },
      remoteSyncConfig: savedRemoteSync
    };
  });

  // Remote Endpoint Synchronization Handler
  const handleSyncRemoteEndpoint = async (overrideUrl?: string, overrideToken?: string) => {
    const syncCfg = styleConfig.remoteSyncConfig;
    const apiUrlToUse = (overrideUrl !== undefined ? overrideUrl : syncCfg?.apiUrl) || '/api/sync-chapters';
    const tokenToUse = overrideToken !== undefined ? overrideToken : syncCfg?.syncAuthToken;

    if (!apiUrlToUse.trim()) {
      setStyleConfig(prev => ({
        ...prev,
        remoteSyncConfig: {
          ...prev.remoteSyncConfig!,
          lastSyncStatus: 'error',
          lastSyncError: 'Please provide a valid remote API Endpoint URL.'
        }
      }));
      return;
    }

    setStyleConfig(prev => ({
      ...prev,
      remoteSyncConfig: {
        ...prev.remoteSyncConfig!,
        apiUrl: apiUrlToUse,
        syncAuthToken: tokenToUse,
        lastSyncStatus: 'syncing',
        lastSyncError: undefined
      }
    }));

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (tokenToUse && tokenToUse.trim()) {
        headers['Authorization'] = tokenToUse.startsWith('Bearer ') ? tokenToUse : `Bearer ${tokenToUse}`;
      }

      const response = await fetch(apiUrlToUse.trim(), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          chapters,
          timestamp: new Date().toISOString(),
          totalChapters: chapters.length,
          appVersion: '1.0.0'
        })
      });

      if (!response.ok) {
        throw new Error(`Remote API endpoint responded with HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json().catch(() => ({}));
      const nowIso = new Date().toISOString();

      setStyleConfig(prev => {
        const updatedRemote: RemoteSyncConfig = {
          ...prev.remoteSyncConfig!,
          enabled: true,
          apiUrl: apiUrlToUse,
          syncAuthToken: tokenToUse,
          lastSyncedAt: nowIso,
          lastSyncStatus: 'success',
          lastSyncError: undefined
        };
        try {
          localStorage.setItem('kaybit_remote_sync_config', JSON.stringify(updatedRemote));
        } catch {}
        return {
          ...prev,
          remoteSyncConfig: updatedRemote
        };
      });
    } catch (err: any) {
      console.error('Failed to sync chapter data with remote endpoint:', err);
      setStyleConfig(prev => {
        const updatedRemote: RemoteSyncConfig = {
          ...prev.remoteSyncConfig!,
          apiUrl: apiUrlToUse,
          syncAuthToken: tokenToUse,
          lastSyncStatus: 'error',
          lastSyncError: err.message || 'Network connection failed'
        };
        try {
          localStorage.setItem('kaybit_remote_sync_config', JSON.stringify(updatedRemote));
        } catch {}
        return {
          ...prev,
          remoteSyncConfig: updatedRemote
        };
      });
    }
  };

  // Periodic chapter persistence hook (localStorage & optional Remote Endpoint Sync)
  useEffect(() => {
    const STORAGE_KEY = 'chapters';

    const saveToLocalStorage = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chapters));
      } catch (err) {
        console.error('Failed to save chapters to localStorage:', err);
      }
    };

    // Save immediately on state change
    saveToLocalStorage();

    // Trigger optional Remote Endpoint Sync if enabled and autoSync is true
    let autoSyncTimer: NodeJS.Timeout | undefined;
    if (
      styleConfig.remoteSyncConfig?.enabled &&
      styleConfig.remoteSyncConfig?.autoSync &&
      styleConfig.remoteSyncConfig?.apiUrl
    ) {
      autoSyncTimer = setTimeout(() => {
        handleSyncRemoteEndpoint();
      }, 1500);
    }

    // Trigger periodic auto-save interval every 5 seconds to prevent data loss
    const intervalId = setInterval(saveToLocalStorage, 5000);

    return () => {
      clearInterval(intervalId);
      if (autoSyncTimer) clearTimeout(autoSyncTimer);
    };
  }, [chapters, styleConfig.remoteSyncConfig?.enabled, styleConfig.remoteSyncConfig?.autoSync, styleConfig.remoteSyncConfig?.apiUrl]);
  const [platformMode, setPlatformMode] = useState<PlatformMode>('web');

  // Focus Mode state (expands PDF Preview to fill screen width)
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThemeSettingsOpen, setIsThemeSettingsOpen] = useState(false);
  const [isPdfHistoryOpen, setIsPdfHistoryOpen] = useState(false);
  const [isBatchExportOpen, setIsBatchExportOpen] = useState(false);
  const [isPlatformGuideOpen, setIsPlatformGuideOpen] = useState(false);
  const [isReadmeOpen, setIsReadmeOpen] = useState(false);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);

  // UI Theme state (persisted in localStorage)
  const [uiTheme, setUiTheme] = useState<UiThemeId>(() => getSavedUiTheme());

  useEffect(() => {
    applyUiTheme(uiTheme);
  }, [uiTheme]);

  // Export progress state
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; currentChapterTitle: string } | null>(null);

  // PDF Export History State (persisted in localStorage)
  const [pdfHistory, setPdfHistory] = useState<PdfHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('kaybit_pdf_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Async process state
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  // Global Keyboard Shortcuts Hook (Ctrl+P, Ctrl+F, Ctrl+S, Ctrl+,, Ctrl+H, Ctrl+B, Ctrl+K, Escape)
  useKeyboardShortcuts({
    onGeneratePdf: () => {
      handleGenerateServerPdf();
    },
    onToggleFocusMode: () => {
      setIsFocusMode(prev => !prev);
    },
    onSyncSave: () => {
      handleSyncRemoteEndpoint();
    },
    onOpenSettings: () => {
      setIsSettingsOpen(prev => !prev);
    },
    onOpenHistory: () => {
      setIsPdfHistoryOpen(prev => !prev);
    },
    onOpenBatchExport: () => {
      setIsBatchExportOpen(prev => !prev);
    },
    onOpenFlashcards: () => {
      setIsFlashcardsOpen(prev => !prev);
    },
    onCloseModals: () => {
      setIsSettingsOpen(false);
      setIsThemeSettingsOpen(false);
      setIsPdfHistoryOpen(false);
      setIsBatchExportOpen(false);
      setIsPlatformGuideOpen(false);
      setIsReadmeOpen(false);
      setIsFlashcardsOpen(false);
      setIsFocusMode(false);
    }
  });

  // Cover Page Settings
  const [coverConfig, setCoverConfig] = useState<CoverPageConfig>({
    enabled: true,
    title: 'KayBiT Programming Study Notes',
    subtitle: 'Compiled High-Yield Computer Science Reference',
    author: 'Alex Kay',
    institution: 'Computer Science & Engineering',
    courseCode: 'CS101 / CS201 / CS305',
    date: new Date().toISOString().split('T')[0],
    accentColor: '#4f46e5',
    style: 'academic',
    keywords: 'Computer Science, Algorithms, Data Structures, React, Study Notes',
    subject: 'High-Yield Computer Science Reference & Notes'
  });

  // Generated Flashcards state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    {
      id: 'fc-1',
      chapterTitle: 'Data Structures: Trees',
      question: 'What is the time complexity of searching a degenerate Binary Search Tree?',
      answer: 'O(N) linear time, because missing balances cause the BST to behave like a singly linked list.'
    },
    {
      id: 'fc-2',
      chapterTitle: 'React 19 State Management',
      question: 'What React 19 hook allows optimistic UI rendering before backend resolution?',
      answer: 'useOptimistic hook allows immediate state updates while an async Server Action transitions.'
    }
  ]);

  // Active Chapter lookup
  const activeChapter = chapters.find(c => c.id === activeChapterId) || chapters[0] || null;

  // Chapter handlers
  const handleSelectChapter = (id: string) => {
    setActiveChapterId(id);
  };

  const handleAddChapter = (newChapterPartial: Partial<Chapter>) => {
    const newId = `ch-${Date.now()}`;
    const stats = calculateReadingStats(newChapterPartial.content || '');
    
    const fullChapter: Chapter = {
      id: newId,
      title: newChapterPartial.title || 'Untitled Chapter',
      extension: newChapterPartial.extension || 'md',
      content: newChapterPartial.content || '',
      order: chapters.length + 1,
      metadata: newChapterPartial.metadata || {
        sourceFileName: `note_${chapters.length + 1}.md`,
        language: 'Markdown',
        author: coverConfig.author,
        dateCreated: new Date().toISOString().split('T')[0],
        wordCount: stats.wordCount,
        readingTimeMinutes: stats.readingTimeMinutes,
        tags: ['Notes']
      }
    };

    setChapters(prev => [...prev, fullChapter]);
    setActiveChapterId(newId);
  };

  const handleUpdateChapter = (id: string, updates: Partial<Chapter>) => {
    setChapters(prev =>
      prev.map(ch => (ch.id === id ? { ...ch, ...updates } : ch))
    );
  };

  const handleDeleteChapter = (id: string) => {
    setChapters(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (activeChapterId === id && filtered.length > 0) {
        setActiveChapterId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleMoveChapter = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= chapters.length) return;

    const updated = [...chapters];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setChapters(updated);
  };

  const handleReorderChapters = (sourceIndex: number, destinationIndex: number) => {
    if (sourceIndex === destinationIndex || sourceIndex < 0 || destinationIndex < 0) return;
    setChapters(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(destinationIndex, 0, moved);
      return updated;
    });
  };

  const handleResetSamples = () => {
    setChapters(INITIAL_CHAPTERS);
    setActiveChapterId('ch-1');
  };

  // Upload files or folder contents
  const handleFileUpload = async (fileList: FileList) => {
    const newChapters: Chapter[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const name = file.name;
      const lower = name.toLowerCase();

      let ext: SupportedExtension = 'md';
      if (lower.endsWith('.mdx')) ext = 'mdx';
      else if (lower.endsWith('.html') || lower.endsWith('.htm')) ext = 'html';
      else if (lower.endsWith('.txt')) ext = 'txt';
      else if (lower.endsWith('.md')) ext = 'md';
      else continue; // skip unsupported extensions

      try {
        const textContent = await file.text();
        const stats = calculateReadingStats(textContent);
        const titleWithoutExt = name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

        newChapters.push({
          id: `ch-upload-${Date.now()}-${i}`,
          title: titleWithoutExt,
          extension: ext,
          content: textContent,
          order: chapters.length + i + 1,
          metadata: {
            sourceFileName: name,
            language: ext === 'html' ? 'HTML' : ext === 'txt' ? 'Text' : 'Markdown',
            author: coverConfig.author || 'Student',
            dateCreated: new Date().toISOString().split('T')[0],
            wordCount: stats.wordCount,
            readingTimeMinutes: stats.readingTimeMinutes,
            tags: ['Uploaded', ext.toUpperCase()]
          }
        });
      } catch (err) {
        console.error('Failed reading uploaded file:', name, err);
      }
    }

    if (newChapters.length > 0) {
      setChapters(prev => [...prev, ...newChapters]);
      setActiveChapterId(newChapters[0].id);
    }
  };

  // AI Summary Generator Call
  const handleGenerateAiSummary = async () => {
    if (!activeChapter) return;
    setIsAiGenerating(true);

    try {
      const res = await fetch('/api/ai-summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: activeChapter.content,
          filename: activeChapter.metadata.sourceFileName,
          language: activeChapter.metadata.language
        })
      });

      const data = await res.json();
      if (data.summary) {
        handleUpdateChapter(activeChapter.id, {
          aiSummary: data.summary,
          keyTakeaways: data.keyTakeaways || []
        });

        // Add new flashcards if returned
        if (data.flashcards && Array.isArray(data.flashcards)) {
          const newFcs: Flashcard[] = data.flashcards.map((f: any, idx: number) => ({
            id: `fc-gen-${Date.now()}-${idx}`,
            chapterTitle: activeChapter.title,
            question: f.question,
            answer: f.answer
          }));
          setFlashcards(prev => [...newFcs, ...prev]);
        }
      }
    } catch (err) {
      console.error('AI summary generation error:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // PDF History Handlers
  const handleAddHistoryItem = (item: Omit<PdfHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: PdfHistoryItem = {
      ...item,
      id: `pdf-log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };
    setPdfHistory(prev => {
      let updated = [newItem, ...prev];

      // Auto-archive older entries exceeding 50 items to a downloadable JSON file
      if (updated.length > 50) {
        const keepItems = updated.slice(0, 50);
        const archiveItems = updated.slice(50);

        try {
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(archiveItems, null, 2));
          const downloadAnchor = document.createElement('a');
          downloadAnchor.setAttribute("href", dataStr);
          downloadAnchor.setAttribute("download", `pdf_history_archive_${new Date().toISOString().split('T')[0]}.json`);
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();
        } catch (e) {
          console.error('Failed to trigger history auto-archive download:', e);
        }

        updated = keepItems;
      }

      try {
        localStorage.setItem('kaybit_pdf_history', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save PDF history:', e);
      }
      return updated;
    });
  };

  const handleSplitChapter = (chapterId: string, newChaptersPartial: Partial<Chapter>[]) => {
    setChapters(prev => {
      const targetIdx = prev.findIndex(c => c.id === chapterId);
      if (targetIdx === -1) return prev;
      const original = prev[targetIdx];

      const replacementChapters: Chapter[] = newChaptersPartial.map((part, idx) => ({
        id: idx === 0 ? original.id : `ch-split-${Date.now()}-${idx}`,
        title: part.title || `${original.title} (Part ${idx + 1})`,
        extension: original.extension,
        content: part.content || '',
        order: original.order + idx,
        metadata: part.metadata || original.metadata,
        aiSummary: idx === 0 ? original.aiSummary : undefined,
        keyTakeaways: idx === 0 ? original.keyTakeaways : undefined
      }));

      const updated = [...prev];
      updated.splice(targetIdx, 1, ...replacementChapters);
      return updated;
    });
  };

  const handleClearHistory = () => {
    setPdfHistory([]);
    localStorage.removeItem('kaybit_pdf_history');
  };

  const handleDeleteHistoryItem = (id: string) => {
    setPdfHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem('kaybit_pdf_history', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update PDF history:', e);
      }
      return updated;
    });
  };

  // Server Vector PDF Generation Download
  const handleGenerateServerPdf = async () => {
    const renderNode = document.getElementById('pdf-render-root');
    if (!renderNode) return;

    const exportFileName = `${(coverConfig.title || 'KayBiT_Notes').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    setIsPdfGenerating(true);

    try {
      // Build self-contained HTML document string with styles and PDF metadata
      const authorMeta = coverConfig.author || 'KayBiT User';
      const subjectMeta = coverConfig.subject || coverConfig.subtitle || 'Study Notes & Reference Guide';
      const keywordsMeta = coverConfig.keywords || `${coverConfig.title}, ${coverConfig.courseCode}, PDF, Study Notes`;

      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${coverConfig.title}</title>
            <meta name="author" content="${authorMeta}" />
            <meta name="subject" content="${subjectMeta}" />
            <meta name="keywords" content="${keywordsMeta}" />
            <meta name="description" content="${subjectMeta}" />
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                background-color: white !important;
                color: #0f172a !important;
                padding: 0;
                margin: 0;
              }
              .no-print { display: none !important; }
              .print-page-break { page-break-after: always; break-after: page; }
              .prevent-break, .code-block-wrapper, .note-callout, table, tr {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .pdf-watermark-overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                pointer-events: none !important;
                z-index: 9999 !important;
                overflow: hidden !important;
              }
            </style>
          </head>
          <body>
            <div style="padding: 20px;">
              ${renderNode.innerHTML}
            </div>
          </body>
        </html>
      `;

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: fullHtml,
          title: coverConfig.title || 'KayBiT_Notes',
          metadata: {
            author: authorMeta,
            subject: subjectMeta,
            keywords: keywordsMeta
          },
          coverConfig: coverConfig,
          margin: `${styleConfig.pageMarginMm}mm`,
          displayHeaderFooter: styleConfig.showPageNumbers,
          format: styleConfig.pageFormat,
          passwordProtection: styleConfig.passwordProtection
        })
      });

      if (!response.ok) {
        throw new Error(`Server PDF generation failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const fileSizeKb = blob.size / 1024;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Record successful export in history
      handleAddHistoryItem({
        filename: exportFileName,
        status: 'success',
        exportMethod: 'server',
        fileSizeKb,
        passwordProtected: styleConfig.passwordProtection?.enabled && !!styleConfig.passwordProtection?.password,
        watermarkText: styleConfig.watermarkEnabled ? styleConfig.watermarkText : undefined
      });
    } catch (err: any) {
      console.warn('Server PDF failed, triggering native browser print fallback:', err);
      
      // Record failed export in history
      handleAddHistoryItem({
        filename: exportFileName,
        status: 'failed',
        exportMethod: 'server',
        errorMessage: err.message || 'Server PDF render error',
        passwordProtected: styleConfig.passwordProtection?.enabled && !!styleConfig.passwordProtection?.password,
        watermarkText: styleConfig.watermarkEnabled ? styleConfig.watermarkText : undefined
      });

      window.print();
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleTriggerBrowserPrint = () => {
    const exportFileName = `${(coverConfig.title || 'KayBiT_Notes').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf (Browser Print)`;
    handleAddHistoryItem({
      filename: exportFileName,
      status: 'success',
      exportMethod: 'browser',
      watermarkText: styleConfig.watermarkEnabled ? styleConfig.watermarkText : undefined
    });
    window.print();
  };

  const handleExportHtmlBundle = () => {
    const renderNode = document.getElementById('pdf-render-root');
    if (!renderNode) return;

    const blob = new Blob([renderNode.outerHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'KayBiT_Notes_Bundle.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Batch Export Handler (Consolidated Volume or Individual Chapter PDFs)
  const handleExportBatch = async (options: {
    mode: 'consolidated' | 'individual';
    selectedChapterIds: string[];
    customTitle?: string;
  }) => {
    const { mode, selectedChapterIds, customTitle } = options;
    if (selectedChapterIds.length === 0) return;

    setIsPdfGenerating(true);

    const selectedChapters = chapters.filter(c => selectedChapterIds.includes(c.id));
    const titleToUse = customTitle || coverConfig.title || 'KayBiT_Notes';

    try {
      if (mode === 'consolidated') {
        setExportProgress({
          current: 1,
          total: 1,
          currentChapterTitle: `Consolidated Volume (${selectedChapters.length} Chapters)`
        });

        const renderNode = document.getElementById('pdf-render-root');
        const htmlToUse = renderNode ? renderNode.innerHTML : '';

        const fullHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>${titleToUse}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                body {
                  font-family: system-ui, -apple-system, sans-serif;
                  background-color: white !important;
                  color: #0f172a !important;
                  padding: 0;
                  margin: 0;
                }
                .no-print { display: none !important; }
                .print-page-break { page-break-after: always; break-after: page; }
                .prevent-break, .code-block-wrapper, .note-callout, table, tr {
                  page-break-inside: avoid;
                  break-inside: avoid;
                }
              </style>
            </head>
            <body>
              <div style="padding: 20px;">
                ${htmlToUse}
              </div>
            </body>
          </html>
        `;

        const exportFileName = `${titleToUse.replace(/[^a-zA-Z0-9_-]/g, '_')}_Consolidated.pdf`;

        const response = await fetch('/api/generate-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            html: fullHtml,
            title: titleToUse,
            margin: `${styleConfig.pageMarginMm}mm`,
            displayHeaderFooter: styleConfig.showPageNumbers,
            format: styleConfig.pageFormat,
            passwordProtection: styleConfig.passwordProtection
          })
        });

        if (!response.ok) {
          throw new Error(`Server PDF generation failed with status ${response.status}`);
        }

        const blob = await response.blob();
        const fileSizeKb = blob.size / 1024;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportFileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        handleAddHistoryItem({
          filename: exportFileName,
          status: 'success',
          exportMethod: 'server',
          fileSizeKb,
          passwordProtected: styleConfig.passwordProtection?.enabled && !!styleConfig.passwordProtection?.password,
          watermarkText: styleConfig.watermarkEnabled ? styleConfig.watermarkText : undefined
        });

      } else {
        // Mode: 'individual' - Loop over each selected chapter
        const total = selectedChapters.length;
        for (let i = 0; i < total; i++) {
          const ch = selectedChapters[i];
          setExportProgress({
            current: i + 1,
            total,
            currentChapterTitle: ch.title
          });

          const chNode = document.getElementById(`chapter-section-${ch.id}`);
          const chContentHtml = chNode ? chNode.innerHTML : `<div class="p-6"><h1>${ch.title}</h1><div>${ch.content}</div></div>`;

          const singleChapterHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8" />
                <title>${ch.title}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                  body {
                    font-family: system-ui, -apple-system, sans-serif;
                    background-color: white !important;
                    color: #0f172a !important;
                    padding: 30px;
                    margin: 0;
                  }
                  .no-print { display: none !important; }
                  .prevent-break, .code-block-wrapper, .note-callout, table, tr {
                    page-break-inside: avoid;
                    break-inside: avoid;
                  }
                </style>
              </head>
              <body>
                <div style="max-width: 800px; margin: 0 auto;">
                  <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 24px;">
                    <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #6366f1; font-family: monospace;">
                      ${titleToUse} • Chapter ${i + 1}
                    </span>
                    <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 4px;">
                      ${ch.title}
                    </h1>
                  </div>
                  <div>${chContentHtml}</div>
                </div>
              </body>
            </html>
          `;

          const cleanPrefix = titleToUse.replace(/[^a-zA-Z0-9_-]/g, '_');
          const cleanChTitle = ch.title.replace(/[^a-zA-Z0-9_-]/g, '_');
          const exportFileName = `${cleanPrefix}_Ch${i + 1}_${cleanChTitle}.pdf`;

          const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              html: singleChapterHtml,
              title: `${ch.title} - ${titleToUse}`,
              margin: `${styleConfig.pageMarginMm}mm`,
              displayHeaderFooter: styleConfig.showPageNumbers,
              format: styleConfig.pageFormat,
              passwordProtection: styleConfig.passwordProtection
            })
          });

          if (!response.ok) {
            throw new Error(`PDF generation failed for ${ch.title}`);
          }

          const blob = await response.blob();
          const fileSizeKb = blob.size / 1024;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = exportFileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          handleAddHistoryItem({
            filename: exportFileName,
            status: 'success',
            exportMethod: 'server',
            fileSizeKb,
            passwordProtected: styleConfig.passwordProtection?.enabled && !!styleConfig.passwordProtection?.password,
            watermarkText: styleConfig.watermarkEnabled ? styleConfig.watermarkText : undefined
          });

          if (i < total - 1) {
            await new Promise(r => setTimeout(r, 400));
          }
        }
      }
    } catch (err: any) {
      console.error('Batch PDF export error:', err);
      alert(`Batch PDF export error: ${err.message || 'Error exporting'}`);
    } finally {
      setIsPdfGenerating(false);
      setExportProgress(null);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col selection:bg-indigo-600 selection:text-white transition-colors"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
      }}
    >
      
      {/* Top App Bar */}
      <Header
        platformMode={platformMode}
        setPlatformMode={setPlatformMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenThemeSettings={() => setIsThemeSettingsOpen(true)}
        onOpenPdfHistory={() => setIsPdfHistoryOpen(true)}
        onOpenBatchExport={() => setIsBatchExportOpen(true)}
        onOpenPlatformGuide={() => setIsPlatformGuideOpen(true)}
        onOpenReadme={() => setIsReadmeOpen(true)}
        onOpenFlashcards={() => setIsFlashcardsOpen(true)}
        onGenerateAiSummary={handleGenerateAiSummary}
        onGenerateServerPdf={handleGenerateServerPdf}
        onTriggerBrowserPrint={handleTriggerBrowserPrint}
        onExportHtmlBundle={handleExportHtmlBundle}
        isAiGenerating={isAiGenerating}
        isPdfGenerating={isPdfGenerating}
      />

      {/* Main Split Layout: Sidebar | Editor | Printable PDF Preview */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Sidebar: Chapters & Files (Hidden in Focus Mode) */}
        {!isFocusMode && (
          <ChapterSidebar
            chapters={chapters}
            activeChapterId={activeChapterId}
            onSelectChapter={handleSelectChapter}
            onAddChapter={handleAddChapter}
            onDeleteChapter={handleDeleteChapter}
            onMoveChapter={handleMoveChapter}
            onReorderChapters={handleReorderChapters}
            onResetSamples={handleResetSamples}
            onFileUpload={handleFileUpload}
          />
        )}

        {/* Center Pane: Live Editor & Metadata Editor (Hidden in Focus Mode) */}
        {!isFocusMode && (
          <EditorView
            chapter={activeChapter}
            onUpdateChapter={handleUpdateChapter}
            onSplitChapter={handleSplitChapter}
          />
        )}

        {/* Right Pane: High-Fidelity Printable PDF Preview */}
        <PdfPreviewView
          chapters={chapters}
          activeChapterId={activeChapterId}
          styleConfig={styleConfig}
          setStyleConfig={setStyleConfig}
          coverConfig={coverConfig}
          platformMode={platformMode}
          onGenerateServerPdf={handleGenerateServerPdf}
          isPdfGenerating={isPdfGenerating}
          isFocusMode={isFocusMode}
          onToggleFocusMode={() => setIsFocusMode(prev => !prev)}
        />

      </main>

      {/* Modals */}
      <ThemeSettingsModal
        isOpen={isThemeSettingsOpen}
        onClose={() => setIsThemeSettingsOpen(false)}
        activeTheme={uiTheme}
        onSelectTheme={(themeId) => setUiTheme(themeId)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        styleConfig={styleConfig}
        setStyleConfig={setStyleConfig}
        coverConfig={coverConfig}
        setCoverConfig={setCoverConfig}
        onSyncRemote={handleSyncRemoteEndpoint}
      />

      <FlashcardsView
        isOpen={isFlashcardsOpen}
        onClose={() => setIsFlashcardsOpen(false)}
        flashcards={flashcards}
      />

      <PlatformModal
        isOpen={isPlatformGuideOpen}
        onClose={() => setIsPlatformGuideOpen(false)}
        platformMode={platformMode}
        setPlatformMode={setPlatformMode}
      />

      <ReadmeModal
        isOpen={isReadmeOpen}
        onClose={() => setIsReadmeOpen(false)}
      />

      <PdfHistoryModal
        isOpen={isPdfHistoryOpen}
        onClose={() => setIsPdfHistoryOpen(false)}
        history={pdfHistory}
        onClearHistory={handleClearHistory}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onOpenBatchExport={() => setIsBatchExportOpen(true)}
      />

      <BatchExportModal
        isOpen={isBatchExportOpen}
        onClose={() => setIsBatchExportOpen(false)}
        chapters={chapters}
        coverConfig={coverConfig}
        styleConfig={styleConfig}
        onExportBatch={handleExportBatch}
        isPdfGenerating={isPdfGenerating}
        exportProgress={exportProgress}
      />

      {/* Floating Table of Contents Button (Visible at all times) */}
      <FloatingTocButton
        chapters={chapters}
        activeChapterId={activeChapterId}
        onSelectChapter={handleSelectChapter}
        styleConfig={styleConfig}
        setStyleConfig={setStyleConfig}
      />

    </div>
  );
}
