import React, { useMemo, useEffect, useCallback, useState, useRef } from 'react';
import { 
  Chapter, 
  StyleConfig, 
  CoverPageConfig, 
  TOCItem, 
  PlatformMode 
} from '../types';
import { parseChapterContent } from '../lib/parser';
import { CODE_THEMES } from '../lib/prismThemes';
import { 
  BookOpen, 
  FileText, 
  Tag, 
  Clock, 
  Calendar, 
  User, 
  Code, 
  Sparkles, 
  Layers, 
  Printer,
  Download,
  Loader2,
  LocateFixed,
  Pencil,
  Highlighter,
  Eraser,
  Undo2,
  Trash2
} from 'lucide-react';

interface AnnotationPath {
  id: string;
  tool: 'pen' | 'highlighter';
  color: string;
  strokeWidth: number;
  points: { x: number; y: number }[];
}

const HIGHLIGHTER_COLORS = [
  { name: 'Yellow', value: '#facc15' },
  { name: 'Green', value: '#4ade80' },
  { name: 'Cyan', value: '#38bdf8' },
  { name: 'Pink', value: '#f472b6' },
  { name: 'Orange', value: '#fb923c' },
];

const PEN_COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Dark Slate', value: '#0f172a' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
];

interface PdfPreviewViewProps {
  chapters: Chapter[];
  activeChapterId?: string;
  styleConfig: StyleConfig;
  coverConfig: CoverPageConfig;
  platformMode: PlatformMode;
  onGenerateServerPdf?: () => void;
  isPdfGenerating?: boolean;
}

export const PdfPreviewView: React.FC<PdfPreviewViewProps> = ({
  chapters,
  activeChapterId,
  styleConfig,
  coverConfig,
  platformMode,
  onGenerateServerPdf,
  isPdfGenerating
}) => {
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  // Annotation Canvas State & Handlers
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [activeTool, setActiveTool] = useState<'highlighter' | 'pen' | 'eraser'>('highlighter');
  const [activeColor, setActiveColor] = useState('#facc15');
  const [activeWidth, setActiveWidth] = useState(24);
  const [paths, setPaths] = useState<AnnotationPath[]>([]);
  const [currentPath, setCurrentPath] = useState<AnnotationPath | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to active chapter in PDF preview
  const scrollToActiveChapter = useCallback(() => {
    if (!activeChapterId) return;
    const targetEl = document.getElementById(`chapter-section-${activeChapterId}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeChapterId]);

  // Sync preview scroll location whenever active chapter changes in Sidebar
  useEffect(() => {
    if (autoSyncEnabled && activeChapterId) {
      const timer = setTimeout(() => {
        scrollToActiveChapter();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeChapterId, autoSyncEnabled, scrollToActiveChapter]);

  // Resize canvas resolution to match document paper dimensions
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateCanvasDimensions = () => {
      const width = container.scrollWidth || container.offsetWidth;
      const height = container.scrollHeight || container.offsetHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    updateCanvasDimensions();
    const observer = new ResizeObserver(() => updateCanvasDimensions());
    observer.observe(container);
    return () => observer.disconnect();
  }, [chapters, coverConfig, styleConfig]);

  // Redraw canvas paths
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allPaths = currentPath ? [...paths, currentPath] : paths;

    allPaths.forEach(path => {
      if (!path.points || path.points.length === 0) return;

      ctx.save();
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = path.strokeWidth;
      ctx.strokeStyle = path.color;

      if (path.tool === 'highlighter') {
        ctx.globalAlpha = 0.45;
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    });
  }, [paths, currentPath]);

  // Canvas coordinates converter
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const eraseAtCoords = (coords: { x: number; y: number }) => {
    const eraserRadius = activeWidth + 12;
    setPaths(prev => prev.filter(p => {
      return !p.points.some(pt => {
        const dx = pt.x - coords.x;
        const dy = pt.y - coords.y;
        return Math.sqrt(dx * dx + dy * dy) < eraserRadius;
      });
    }));
  };

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isAnnotating) return;
    const coords = getCanvasCoords(e);

    if (activeTool === 'eraser') {
      eraseAtCoords(coords);
      setIsDrawing(true);
      return;
    }

    const newPath: AnnotationPath = {
      id: `path-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tool: activeTool,
      color: activeColor,
      strokeWidth: activeWidth,
      points: [coords]
    };
    setCurrentPath(newPath);
    setIsDrawing(true);
  };

  const handleMoveDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isAnnotating) return;
    const coords = getCanvasCoords(e);

    if (activeTool === 'eraser') {
      eraseAtCoords(coords);
      return;
    }

    if (currentPath) {
      setCurrentPath(prev => prev ? {
        ...prev,
        points: [...prev.points, coords]
      } : null);
    }
  };

  const handleEndDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath && currentPath.points.length > 0) {
      setPaths(prev => [...prev, currentPath]);
    }
    setCurrentPath(null);
  };
  // Parse all chapters and compile TOC items
  const compiledData = useMemo(() => {
    const allTocItems: TOCItem[] = [];
    const parsedChapters = chapters.map((ch) => {
      const { html, tocItems } = parseChapterContent(
        ch.content,
        ch.extension,
        ch.id,
        ch.title,
        styleConfig.showLineNumbers
      );
      allTocItems.push(...tocItems);
      return { ...ch, renderedHtml: html };
    });

    return { parsedChapters, allTocItems };
  }, [chapters, styleConfig.showLineNumbers]);

  const activeThemeCss = CODE_THEMES[styleConfig.codeTheme]?.css || '';

  // Get Font Class
  const getFontFamilyClass = () => {
    switch (styleConfig.fontPairing) {
      case 'sans-mono': return 'font-sans';
      case 'serif-mono': return 'font-serif';
      case 'academic': return 'font-serif tracking-normal';
      default: return 'font-sans';
    }
  };

  return (
    <div className="flex-1 h-[calc(100vh-4rem)] bg-slate-900/90 overflow-y-auto p-4 sm:p-8 flex justify-center selection:bg-indigo-500 selection:text-white">
      
      {/* Inject Dynamic Syntax Theme CSS & Print Rules */}
      <style>{`
        ${activeThemeCss}

        /* Strict Print Rules for PDF rendering */
        @media print {
          @page {
            size: ${styleConfig.pageFormat};
            margin: ${styleConfig.pageMarginMm}mm;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: ${styleConfig.fontSizePx}px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .prevent-break, .code-block-wrapper, .note-callout, table, tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }

        /* Responsive Preview Container Styling */
        .pdf-document-paper {
          font-size: ${styleConfig.fontSizePx}px;
        }

        .pdf-document-paper pre code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }

        ${styleConfig.preventSnippetBreaks ? `
          .code-block-wrapper, .note-callout, table {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        ` : ''}

        .pdf-watermark-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          overflow: hidden;
        }

        @media print {
          .pdf-watermark-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            pointer-events: none !important;
            z-index: 9999 !important;
          }
        }
      `}</style>

      {/* Printable Document Sheet Simulation */}
      <div 
        id="pdf-render-root"
        ref={containerRef}
        className={`pdf-document-paper relative overflow-hidden w-full max-w-[850px] bg-white text-slate-900 shadow-2xl rounded-2xl p-6 sm:p-12 min-h-[1050px] border border-slate-200/80 transition-all ${getFontFamilyClass()} theme-${styleConfig.codeTheme}`}
      >
        {/* Interactive Drawing & Annotation Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 z-40 ${
            isAnnotating 
              ? 'pointer-events-auto cursor-crosshair touch-none opacity-100' 
              : 'pointer-events-none opacity-95'
          }`}
          onMouseDown={handleStartDraw}
          onMouseMove={handleMoveDraw}
          onMouseUp={handleEndDraw}
          onMouseLeave={handleEndDraw}
          onTouchStart={handleStartDraw}
          onTouchMove={handleMoveDraw}
          onTouchEnd={handleEndDraw}
        />

        {/* Fixed/Absolute Positioned Security Watermark Overlay Layer */}
        {styleConfig.watermarkEnabled && (
          <div 
            className="pdf-watermark-overlay absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden select-none"
            aria-hidden="true"
          >
            <div 
              className="pdf-watermark-text text-slate-950 font-black text-6xl sm:text-7xl tracking-widest uppercase transform -rotate-45 font-mono whitespace-nowrap"
              style={{ opacity: styleConfig.watermarkOpacity || 0.12 }}
            >
              {styleConfig.watermarkText || 'CONFIDENTIAL'}
            </div>
          </div>
        )}
        
        {/* Platform Simulator Header Notice (Non-printable) */}
        <div className="no-print mb-6 p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2 relative z-50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800">
              {platformMode === 'web' && 'Web Engine Mode: Rendered via Server Puppeteer Microservice'}
              {platformMode === 'desktop' && 'Electron Mode: Local Chromium webContents.printToPDF()'}
              {platformMode === 'mobile' && 'Capacitor Mobile Mode: Native iOS/Android Print Preview'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-slate-500 hidden sm:inline">
              Theme: {CODE_THEMES[styleConfig.codeTheme]?.name}
            </span>

            {/* Sync TOC to View Button */}
            <button
              onClick={scrollToActiveChapter}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-700 font-semibold text-xs transition-all shadow-xs active:scale-95"
              title="Scroll PDF Preview directly to currently selected Sidebar chapter heading"
            >
              <LocateFixed className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sync TOC to View</span>
            </button>

            {/* Annotate / Highlight Toggle Button */}
            <button
              onClick={() => setIsAnnotating(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-xs transition-all shadow-xs active:scale-95 ${
                isAnnotating 
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' 
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-200/80 text-amber-800'
              }`}
              title="Toggle overlay canvas to draw or highlight sections of the PDF preview"
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-600" />
              <span>{isAnnotating ? 'Close Drawing' : 'Annotate PDF'}</span>
              {paths.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-900 text-white text-[10px] font-mono">
                  {paths.length}
                </span>
              )}
            </button>

            {onGenerateServerPdf && (
              <button
                onClick={onGenerateServerPdf}
                disabled={isPdfGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download PDF directly from preview pane"
              >
                {isPdfGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Quick PDF</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Floating Annotation Controls Toolbar (Non-printable) */}
        {isAnnotating && (
          <div className="no-print mb-6 p-3 rounded-xl bg-slate-900 border border-slate-700 text-white shadow-xl flex items-center justify-between flex-wrap gap-3 animate-fade-in relative z-50">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Tool Selector */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => {
                    setActiveTool('highlighter');
                    setActiveColor('#facc15');
                    setActiveWidth(24);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    activeTool === 'highlighter' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Highlighter className="w-3.5 h-3.5" />
                  <span>Highlighter</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTool('pen');
                    setActiveColor('#ef4444');
                    setActiveWidth(4);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    activeTool === 'pen' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Pen</span>
                </button>

                <button
                  onClick={() => setActiveTool('eraser')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    activeTool === 'eraser' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Eraser</span>
                </button>
              </div>

              {/* Color Swatches */}
              {activeTool !== 'eraser' && (
                <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700">
                  {(activeTool === 'highlighter' ? HIGHLIGHTER_COLORS : PEN_COLORS).map(c => (
                    <button
                      key={c.value}
                      onClick={() => setActiveColor(c.value)}
                      className={`w-4 h-4 rounded-full transition-transform ${
                        activeColor === c.value ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-900' : 'hover:scale-110 opacity-75 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              )}

              {/* Stroke Size Selector */}
              {activeTool !== 'eraser' && (
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                  {(activeTool === 'highlighter' ? [14, 24, 36] : [2, 4, 8]).map(w => (
                    <button
                      key={w}
                      onClick={() => setActiveWidth(w)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                        activeWidth === w ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {w === 14 || w === 2 ? 'Thin' : w === 24 || w === 4 ? 'Med' : 'Thick'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions: Undo & Clear */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaths(prev => prev.slice(0, -1))}
                disabled={paths.length === 0}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 text-xs font-medium"
                title="Undo last stroke"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Undo</span>
              </button>

              <button
                onClick={() => setPaths([])}
                disabled={paths.length === 0}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-200 hover:text-rose-300 border border-slate-700 hover:border-rose-800 disabled:opacity-40 text-xs font-medium"
                title="Clear all annotations"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>
        )}

        {/* 1. Optional Cover Page */}
        {coverConfig.enabled && (
          <div className="cover-page mb-12 pb-12 border-b-2 border-slate-200 print-page-break flex flex-col justify-between min-h-[600px] bg-slate-50/50 p-8 rounded-2xl border border-slate-200/60">
            <div>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-indigo-700 bg-indigo-100 mb-6">
                {coverConfig.courseCode || 'STUDY GUIDE'}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
                {coverConfig.title || 'KayBiT Programming Study Notes'}
              </h1>
              <p className="text-lg text-slate-600 font-medium">
                {coverConfig.subtitle || 'Compiled High-Yield Reference Guide'}
              </p>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 uppercase font-semibold block text-[10px]">Author / Student</span>
                <span className="font-bold text-slate-800 text-sm">{coverConfig.author || 'Student'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold block text-[10px]">Institution / Course</span>
                <span className="font-bold text-slate-800 text-sm">{coverConfig.institution || 'Computer Science Dept.'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold block text-[10px]">Date Compiled</span>
                <span className="font-medium text-slate-700">{coverConfig.date || new Date().toISOString().split('T')[0]}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold block text-[10px]">Total Chapters</span>
                <span className="font-medium text-slate-700">{chapters.length} Chapters</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Auto-Generated Table of Contents (TOC) */}
        {styleConfig.showTOC && compiledData.allTocItems.length > 0 && (
          <div className="toc-section mb-10 p-6 rounded-2xl bg-slate-50 border border-slate-200/80 prevent-break">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-3">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                Table of Contents
              </h2>
            </div>

            <div className="space-y-2 text-sm">
              {compiledData.allTocItems.map((item, index) => (
                <div 
                  key={item.id + index}
                  className={`flex items-baseline justify-between gap-2 ${
                    item.level === 1 ? 'font-bold text-slate-900 pl-0 mt-3 border-b border-slate-200/40 pb-1' :
                    item.level === 2 ? 'font-medium text-slate-700 pl-4 text-xs' :
                    'text-slate-500 pl-8 text-[11px]'
                  }`}
                >
                  <a 
                    href={`#${item.id}`} 
                    className="hover:text-indigo-600 hover:underline truncate transition-colors flex items-center gap-2"
                  >
                    <span className="text-slate-400 font-mono text-[10px]">
                      {item.level === 1 ? `§` : '•'}
                    </span>
                    <span>{item.text}</span>
                  </a>
                  <span className="flex-1 border-b border-dotted border-slate-300 mx-2 opacity-60"></span>
                  <span className="font-mono text-slate-400 text-[10px]">
                    {item.chapterTitle.slice(0, 15)}...
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Chapter Documents Content List */}
        <div className="chapters-container space-y-12">
          {compiledData.parsedChapters.map((chapter, index) => (
            <div 
              key={chapter.id} 
              id={`chapter-section-${chapter.id}`}
              className="chapter-block print-page-break"
            >
              
              {/* Metadata Header & Origin Banner */}
              {styleConfig.showMetadataHeader && (
                <div className="chapter-metadata-banner mb-6 p-4 rounded-xl bg-slate-900 text-slate-100 shadow-md border border-slate-800 font-sans prevent-break">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white">
                        {chapter.metadata.language || 'Code'}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">
                        File: <code className="text-indigo-300 font-mono">{chapter.metadata.sourceFileName}</code>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {chapter.metadata.dateCreated}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {chapter.metadata.readingTimeMinutes} min
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-500">Course / Author: </span>
                      <span className="font-medium text-slate-200">{chapter.metadata.courseCode || 'N/A'} • {chapter.metadata.author}</span>
                    </div>

                    {chapter.metadata.tags && chapter.metadata.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-500" />
                        {chapter.metadata.tags.map(t => (
                          <span key={t} className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Auto-Generated Summary Block */}
              {chapter.aiSummary && (
                <div className="ai-summary-card mb-6 p-4 rounded-xl bg-purple-50 border-l-4 border-purple-600 text-purple-950 shadow-xs prevent-break">
                  <div className="flex items-center gap-2 font-bold text-xs text-purple-800 uppercase tracking-wider mb-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>AI High-Yield Chapter Summary</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-purple-900 mb-2">
                    {chapter.aiSummary}
                  </p>
                  {chapter.keyTakeaways && chapter.keyTakeaways.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1 text-xs text-purple-950 font-medium">
                      {chapter.keyTakeaways.map((point, pIdx) => (
                        <li key={pIdx}>{point}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Parsed Chapter Body (MD / MDX / HTML / TXT) */}
              <div 
                className="chapter-rendered-html prose max-w-none prose-slate text-sm sm:text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: chapter.renderedHtml }}
              />

              {index < compiledData.parsedChapters.length - 1 && (
                <div className="my-10 border-b border-slate-200/80 no-print" />
              )}
            </div>
          ))}
        </div>

        {/* Document Footer (Page number & branding) */}
        {styleConfig.showPageNumbers && (
          <div className="mt-16 pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>KayBiT_Html_Pdf Student Notes</span>
            <span>Compiled Reference</span>
          </div>
        )}

      </div>
    </div>
  );
};
