import React, { useState, useEffect } from 'react';
import { 
  Chapter, 
  StyleConfig, 
  CoverPageConfig, 
  Flashcard, 
  PlatformMode, 
  SupportedExtension,
  PdfHistoryItem
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
import { calculateReadingStats } from './lib/parser';

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

  // Periodic localStorage persistence hook for chapters
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

    // Trigger periodic auto-save interval every 5 seconds to prevent data loss
    const intervalId = setInterval(saveToLocalStorage, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [chapters]);
  const [platformMode, setPlatformMode] = useState<PlatformMode>('web');

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPdfHistoryOpen, setIsPdfHistoryOpen] = useState(false);
  const [isPlatformGuideOpen, setIsPlatformGuideOpen] = useState(false);
  const [isReadmeOpen, setIsReadmeOpen] = useState(false);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);

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

  // PDF & Page Styling Settings
  const [styleConfig, setStyleConfig] = useState<StyleConfig>({
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
    watermarkOpacity: 0.12
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
    style: 'academic'
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
      const updated = [newItem, ...prev];
      try {
        localStorage.setItem('kaybit_pdf_history', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save PDF history:', e);
      }
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
      // Build self-contained HTML document string with styles
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${coverConfig.title}</title>
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Top App Bar */}
      <Header
        platformMode={platformMode}
        setPlatformMode={setPlatformMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPdfHistory={() => setIsPdfHistoryOpen(true)}
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
        
        {/* Left Sidebar: Chapters & Files */}
        <ChapterSidebar
          chapters={chapters}
          activeChapterId={activeChapterId}
          onSelectChapter={handleSelectChapter}
          onAddChapter={handleAddChapter}
          onDeleteChapter={handleDeleteChapter}
          onMoveChapter={handleMoveChapter}
          onResetSamples={handleResetSamples}
          onFileUpload={handleFileUpload}
        />

        {/* Center Pane: Live Editor & Metadata Editor */}
        <EditorView
          chapter={activeChapter}
          onUpdateChapter={handleUpdateChapter}
        />

        {/* Right Pane: High-Fidelity Printable PDF Preview */}
        <PdfPreviewView
          chapters={chapters}
          activeChapterId={activeChapterId}
          styleConfig={styleConfig}
          coverConfig={coverConfig}
          platformMode={platformMode}
          onGenerateServerPdf={handleGenerateServerPdf}
          isPdfGenerating={isPdfGenerating}
        />

      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        styleConfig={styleConfig}
        setStyleConfig={setStyleConfig}
        coverConfig={coverConfig}
        setCoverConfig={setCoverConfig}
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
      />

    </div>
  );
}
