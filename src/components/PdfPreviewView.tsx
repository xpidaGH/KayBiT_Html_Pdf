import React, { useMemo, useEffect, useCallback, useState, useRef } from 'react';
import QRCode from 'qrcode';
import Tesseract from 'tesseract.js';
import html2canvas from 'html2canvas';
import { 
  Chapter, 
  StyleConfig, 
  CoverPageConfig, 
  TOCItem, 
  PlatformMode,
  WatermarkPosition,
  WatermarkType,
  QrCodeConfig
} from '../types';
import { parseChapterContent, calculateReadingStats } from '../lib/parser';
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
  Trash2,
  Stamp,
  Shield,
  Grid,
  RotateCw,
  Maximize2,
  Minimize2,
  Sliders,
  Check,
  LayoutGrid,
  Move,
  Type,
  QrCode,
  Smartphone,
  Globe,
  Copy,
  ExternalLink,
  RefreshCw,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Filter,
  BarChart3,
  CheckCircle,
  Save,
  Bookmark,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ScanText,
  FileSearch,
  UploadCloud,
  Image as ImageIcon
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

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightTextInHtml(html: string, query: string): { highlightedHtml: string; matchCount: number } {
  if (!query || !query.trim()) {
    return { highlightedHtml: html, matchCount: 0 };
  }

  const trimmed = query.trim();
  const escaped = escapeRegExp(trimmed);
  const regex = new RegExp(`(${escaped})`, 'gi');

  let matchCounter = 0;
  const parts = html.split(/(<[^>]+>)/g);

  const highlightedParts = parts.map((part) => {
    if (part.startsWith('<') && part.endsWith('>')) {
      return part;
    }

    return part.replace(regex, (match) => {
      matchCounter++;
      return `<mark class="search-highlight bg-amber-300 text-slate-950 px-0.5 rounded font-semibold border border-amber-400/80 transition-all">${match}</mark>`;
    });
  });

  return {
    highlightedHtml: highlightedParts.join(''),
    matchCount: matchCounter
  };
}

interface PdfPreviewViewProps {
  chapters: Chapter[];
  activeChapterId?: string;
  styleConfig: StyleConfig;
  setStyleConfig?: React.Dispatch<React.SetStateAction<StyleConfig>>;
  coverConfig: CoverPageConfig;
  platformMode: PlatformMode;
  onGenerateServerPdf?: () => void;
  isPdfGenerating?: boolean;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export const PdfPreviewView: React.FC<PdfPreviewViewProps> = ({
  chapters,
  activeChapterId,
  styleConfig,
  setStyleConfig,
  coverConfig,
  platformMode,
  onGenerateServerPdf,
  isPdfGenerating,
  isFocusMode,
  onToggleFocusMode
}) => {
  const [internalFocusMode, setInternalFocusMode] = useState(false);
  const activeFocusMode = isFocusMode !== undefined ? isFocusMode : internalFocusMode;

  const toggleFocusMode = useCallback(() => {
    if (onToggleFocusMode) {
      onToggleFocusMode();
    } else {
      setInternalFocusMode(prev => !prev);
    }
  }, [onToggleFocusMode]);

  // Keyboard shortcut: Escape key exits Focus Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeFocusMode) {
        toggleFocusMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFocusMode, toggleFocusMode]);

  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  // Watermark Manager Tool State
  const [isWatermarkToolOpen, setIsWatermarkToolOpen] = useState(false);

  const updateWatermark = (updates: Partial<StyleConfig>) => {
    if (setStyleConfig) {
      setStyleConfig(prev => ({ ...prev, ...updates }));
    }
  };

  // Mobile QR Code Manager Tool State
  const [isQrToolOpen, setIsQrToolOpen] = useState(false);
  const [qrSvgString, setQrSvgString] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  const updateQrCodeConfig = (updates: Partial<QrCodeConfig>) => {
    if (setStyleConfig) {
      setStyleConfig(prev => ({
        ...prev,
        qrCodeConfig: {
          enabled: true,
          url: typeof window !== 'undefined' ? window.location.href : 'https://ais-dev-r5oaf3sq7af4t6lpb5a6kz-413914693725.europe-west3.run.app',
          title: 'Scan for Mobile HTML Companion & Interactive Bundle',
          subtitle: 'Scan with your smartphone camera to access the live responsive HTML bundle, code snippets, flashcards, and AI study guide.',
          sizePx: 150,
          darkColor: '#0f172a',
          lightColor: '#ffffff',
          showInPrint: true,
          showUrlText: true,
          ...prev.qrCodeConfig,
          ...updates
        }
      }));
    }
  };

  // Dynamically generate Vector SVG and Canvas DataURL QR codes
  useEffect(() => {
    const qrConfig = styleConfig.qrCodeConfig;
    if (!qrConfig || !qrConfig.enabled) return;

    const targetUrl = qrConfig.url || (typeof window !== 'undefined' ? window.location.href : 'https://ais-dev-r5oaf3sq7af4t6lpb5a6kz-413914693725.europe-west3.run.app');

    QRCode.toString(targetUrl, {
      type: 'svg',
      margin: 1,
      width: qrConfig.sizePx || 150,
      color: {
        dark: qrConfig.darkColor || '#0f172a',
        light: qrConfig.lightColor || '#ffffff'
      }
    }).then(svg => {
      setQrSvgString(svg);
    }).catch(err => {
      console.error("QR SVG generation error:", err);
    });

    QRCode.toDataURL(targetUrl, {
      margin: 1,
      width: (qrConfig.sizePx || 150) * 2,
      color: {
        dark: qrConfig.darkColor || '#0f172a',
        light: qrConfig.lightColor || '#ffffff'
      }
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error("QR DataURL generation error:", err);
    });
  }, [
    styleConfig.qrCodeConfig?.enabled,
    styleConfig.qrCodeConfig?.url,
    styleConfig.qrCodeConfig?.sizePx,
    styleConfig.qrCodeConfig?.darkColor,
    styleConfig.qrCodeConfig?.lightColor
  ]);

  // Annotation Canvas State & Handlers
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [activeTool, setActiveTool] = useState<'highlighter' | 'pen' | 'eraser'>('highlighter');
  const [activeColor, setActiveColor] = useState('#facc15');
  const [activeWidth, setActiveWidth] = useState(24);
  const [paths, setPaths] = useState<AnnotationPath[]>([]);
  const [currentPath, setCurrentPath] = useState<AnnotationPath | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom Level State (percentage: 50% - 200%)
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Saved View State (Persisted in localStorage)
  const [savedViewState, setSavedViewState] = useState<{
    scrollTop: number;
    scrollLeft: number;
    zoomLevel: number;
    timestamp: number;
  } | null>(() => {
    try {
      const item = localStorage.getItem('pdf_preview_saved_view_state');
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  });

  const [viewStateToast, setViewStateToast] = useState<string | null>(null);

  // Tesseract OCR Feature State & Handlers
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string>('Ready to scan');
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrResultText, setOcrResultText] = useState<string>('');
  const [ocrConfidence, setOcrConfidence] = useState<number>(0);
  const [ocrWords, setOcrWords] = useState<Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number }; confidence: number }>>([]);
  const [isOcrOverlayActive, setIsOcrOverlayActive] = useState(false);
  const [ocrSourceTab, setOcrSourceTab] = useState<'page' | 'image' | 'upload'>('page');
  const [embeddedImages, setEmbeddedImages] = useState<Array<{ src: string; alt: string }>>([]);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [ocrToastMessage, setOcrToastMessage] = useState<string | null>(null);
  const [copiedOcrText, setCopiedOcrText] = useState(false);

  // Scan embedded images inside document paper when modal opens or tab changes
  const scanEmbeddedImages = useCallback(() => {
    const rootEl = containerRef.current || document.getElementById('pdf-render-root');
    if (!rootEl) return;
    const imgEls = rootEl.querySelectorAll('img');
    const imgs: Array<{ src: string; alt: string }> = [];
    imgEls.forEach((img, idx) => {
      if (img.src && !img.src.includes('data:image/svg+xml')) {
        imgs.push({
          src: img.src,
          alt: img.alt || `Embedded Image ${idx + 1}`
        });
      }
    });
    setEmbeddedImages(imgs);
    if (imgs.length > 0 && !selectedImageSrc) {
      setSelectedImageSrc(imgs[0].src);
    }
  }, [selectedImageSrc]);

  useEffect(() => {
    if (isOcrModalOpen) {
      scanEmbeddedImages();
    }
  }, [isOcrModalOpen, scanEmbeddedImages]);

  // Performs Tesseract OCR recognition on an image source (canvas element, image element, or URL/File)
  const handleRunOcr = async (imageSource: string | HTMLCanvasElement | File | HTMLImageElement) => {
    setIsOcrProcessing(true);
    setOcrProgress(0);
    setOcrStatus('Initializing Tesseract OCR engine...');

    try {
      const result = await Tesseract.recognize(imageSource, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const p = Math.round((m.progress || 0) * 100);
            setOcrProgress(p);
            setOcrStatus(`Recognizing text (${p}%)...`);
          } else {
            setOcrStatus(`${m.status.charAt(0).toUpperCase() + m.status.slice(1)}...`);
          }
        }
      });

      const dataAny = result.data as any;
      const extracted = dataAny.text || '';
      const confidence = Math.round(dataAny.confidence || 0);
      const rawWords: Array<any> = dataAny.words || dataAny.lines || [];
      const words = rawWords.map(w => ({
        text: w.text || '',
        bbox: w.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
        confidence: Math.round(w.confidence || 0)
      }));

      setOcrResultText(extracted);
      setOcrConfidence(confidence);
      setOcrWords(words);
      setIsOcrOverlayActive(true);
      setOcrStatus(`OCR Recognition Complete (${confidence}% confidence)`);
      setOcrToastMessage(`Extracted ${words.length} words with ${confidence}% confidence!`);
      setTimeout(() => setOcrToastMessage(null), 3500);
    } catch (err: any) {
      console.error('Tesseract OCR error:', err);
      setOcrStatus(`OCR Error: ${err?.message || 'Failed to process image'}`);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Capture current rendered PDF preview page using html2canvas & run OCR
  const handleRunOcrOnCurrentPage = async () => {
    const paperEl = containerRef.current || document.getElementById('pdf-render-root');
    if (!paperEl) return;

    setIsOcrProcessing(true);
    setOcrStatus('Capturing high-DPI document snapshot...');

    try {
      const canvas = await html2canvas(paperEl, {
        scale: 1,
        logging: false,
        useCORS: true,
        allowTaint: true,
        ignoreElements: (element) => element.classList.contains('no-print') || element.classList.contains('ocr-selectable-text-layer')
      });

      await handleRunOcr(canvas);
    } catch (err: any) {
      console.error('html2canvas screenshot error:', err);
      setOcrStatus(`Snapshot Error: ${err?.message || 'Failed to capture document'}`);
      setIsOcrProcessing(false);
    }
  };

  // Upload scanned image file handler
  const handleFileUploadForOcr = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleRunOcr(file);
    }
  };

  // Captures the current scroll position and zoom level of the preview area
  const handleSaveViewState = () => {
    const container = scrollContainerRef.current;
    const currentScrollTop = container ? container.scrollTop : 0;
    const currentScrollLeft = container ? container.scrollLeft : 0;

    const newState = {
      scrollTop: currentScrollTop,
      scrollLeft: currentScrollLeft,
      zoomLevel,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem('pdf_preview_saved_view_state', JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to save view state to localStorage', e);
    }

    setSavedViewState(newState);
    setViewStateToast(`View state saved! (Zoom: ${zoomLevel}%, Scroll: ${Math.round(currentScrollTop)}px)`);
    setTimeout(() => setViewStateToast(null), 3000);
  };

  // Restores saved scroll position and zoom level
  const handleRestoreViewState = (stateToRestore?: { scrollTop: number; scrollLeft: number; zoomLevel: number } | null) => {
    const targetState = stateToRestore || savedViewState;
    if (!targetState) return;

    setZoomLevel(targetState.zoomLevel || 100);

    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: targetState.scrollTop,
          left: targetState.scrollLeft || 0,
          behavior: 'smooth'
        });
      }
    }, 120);

    setViewStateToast(`Restored View State (Zoom: ${targetState.zoomLevel}%, Scroll: ${Math.round(targetState.scrollTop)}px)`);
    setTimeout(() => setViewStateToast(null), 3000);
  };

  // Restore view state on initial mount if saved
  useEffect(() => {
    if (savedViewState && typeof savedViewState.scrollTop === 'number') {
      setZoomLevel(savedViewState.zoomLevel || 100);
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = savedViewState.scrollTop;
          scrollContainerRef.current.scrollLeft = savedViewState.scrollLeft || 0;
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, []);

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

  // Render Dynamic Vector SVG Watermark Layer
  const renderSvgWatermark = () => {
    if (!styleConfig.watermarkEnabled) return null;

    const text = styleConfig.watermarkText || 'CONFIDENTIAL';
    const opacity = styleConfig.watermarkOpacity ?? 0.12;
    const pos = styleConfig.watermarkPosition || 'center';
    const rotation = styleConfig.watermarkRotation ?? -45;
    const scale = styleConfig.watermarkScale ?? 1.0;
    const type = styleConfig.watermarkType || 'text-svg';
    const color = styleConfig.watermarkColor || '#0f172a';

    // Grid type: Tiled SVG Pattern across entire page
    if (type === 'grid' || pos === 'grid') {
      const patternId = `wm-grid-pattern-${text.replace(/\s+/g, '-')}`;
      return (
        <div className="pdf-watermark-overlay absolute inset-0 pointer-events-none z-30 overflow-hidden select-none" aria-hidden="true">
          <svg className="w-full h-full">
            <defs>
              <pattern
                id={patternId}
                width={260 * scale}
                height={180 * scale}
                patternUnits="userSpaceOnUse"
                patternTransform={`rotate(${rotation})`}
              >
                <text
                  x={130 * scale}
                  y={90 * scale}
                  fill={color}
                  fillOpacity={opacity}
                  fontSize={20 * scale}
                  fontWeight="900"
                  fontFamily="monospace"
                  textAnchor="middle"
                  letterSpacing="0.15em"
                >
                  {text}
                </text>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
          </svg>
        </div>
      );
    }

    // Position CSS classes
    let positionClasses = 'flex items-center justify-center inset-0';
    if (pos === 'top-left') positionClasses = 'top-8 left-8 items-start justify-start';
    else if (pos === 'top-right') positionClasses = 'top-8 right-8 items-start justify-end';
    else if (pos === 'bottom-left') positionClasses = 'bottom-8 left-8 items-end justify-start';
    else if (pos === 'bottom-right') positionClasses = 'bottom-8 right-8 items-end justify-end';

    if (type === 'stamp-seal') {
      return (
        <div className={`pdf-watermark-overlay absolute pointer-events-none z-30 overflow-hidden select-none flex ${positionClasses}`} aria-hidden="true">
          <svg
            width={240 * scale}
            height={240 * scale}
            viewBox="0 0 200 200"
            style={{
              transform: `rotate(${rotation}deg)`,
              opacity: opacity,
              color: color
            }}
          >
            <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="10 5" />
            <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M 100 25 L 103 33 L 111 33 L 105 38 L 107 46 L 100 41 L 93 46 L 95 38 L 89 33 L 97 33 Z" fill="currentColor" />
            <path d="M 100 175 L 103 167 L 111 167 L 105 162 L 107 154 L 100 159 L 93 154 L 95 162 L 89 167 L 97 167 Z" fill="currentColor" />
            <circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" strokeWidth="3" />
            <rect x="15" y="82" width="170" height="36" fill="white" stroke="currentColor" strokeWidth="3" rx="4" />
            <text
              x="100"
              y="105"
              fill="currentColor"
              fontSize={text.length > 12 ? '13' : '17'}
              fontWeight="900"
              fontFamily="sans-serif"
              textAnchor="middle"
              letterSpacing="0.1em"
            >
              {text}
            </text>
            <text x="100" y="58" fill="currentColor" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.15em">
              OFFICIAL STAMP
            </text>
            <text x="100" y="148" fill="currentColor" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.15em">
              KAYBIT VERIFIED
            </text>
          </svg>
        </div>
      );
    }

    if (type === 'badge') {
      return (
        <div className={`pdf-watermark-overlay absolute pointer-events-none z-30 overflow-hidden select-none flex ${positionClasses}`} aria-hidden="true">
          <svg
            width={210 * scale}
            height={250 * scale}
            viewBox="0 0 200 240"
            style={{
              transform: `rotate(${rotation}deg)`,
              opacity: opacity,
              color: color
            }}
          >
            <path
              d="M 100 10 L 180 40 L 180 120 C 180 180 100 225 100 225 C 100 225 20 180 20 120 L 20 40 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
            />
            <path
              d="M 100 22 L 168 48 L 168 116 C 168 168 100 208 100 208 C 100 208 32 168 32 116 L 32 48 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <circle cx="100" cy="70" r="20" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="M 92 70 L 98 76 L 110 62" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="25" y="115" width="150" height="34" fill="white" stroke="currentColor" strokeWidth="3" rx="4" />
            <text
              x="100"
              y="137"
              fill="currentColor"
              fontSize={text.length > 12 ? '12' : '15'}
              fontWeight="900"
              fontFamily="sans-serif"
              textAnchor="middle"
              letterSpacing="0.1em"
            >
              {text}
            </text>
            <text x="100" y="175" fill="currentColor" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.2em">
              SECURE NOTES
            </text>
          </svg>
        </div>
      );
    }

    // Default: 'text-svg'
    return (
      <div className={`pdf-watermark-overlay absolute pointer-events-none z-30 overflow-hidden select-none flex ${positionClasses}`} aria-hidden="true">
        <svg
          className="overflow-visible"
          style={{
            transform: `rotate(${rotation}deg) scale(${scale})`,
            opacity: opacity,
            color: color
          }}
        >
          <text
            x="0"
            y="0"
            fill="currentColor"
            fontSize="52"
            fontWeight="900"
            fontFamily="monospace"
            textAnchor="middle"
            dominantBaseline="middle"
            letterSpacing="0.22em"
            className="uppercase select-none"
          >
            {text}
          </text>
        </svg>
      </div>
    );
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

  // Group TOC items by chapter for structured Table of Contents rendering
  const tocDataByChapter = useMemo(() => {
    return chapters.map((ch, idx) => {
      const chapterTocItems = compiledData.allTocItems.filter(item => item.chapterId === ch.id);
      return {
        chapter: ch,
        index: idx + 1,
        anchorId: `chapter-section-${ch.id}`,
        headings: chapterTocItems
      };
    });
  }, [chapters, compiledData.allTocItems]);

  // Calculate document-wide summary statistics for PDF Preview footer
  const documentSummaryStats = useMemo(() => {
    let totalWordCount = 0;
    let totalCharCount = 0;
    let totalCodeBlocksCount = 0;

    chapters.forEach((ch) => {
      const text = ch.content || '';
      const stats = calculateReadingStats(text);
      totalWordCount += stats.wordCount;
      totalCharCount += text.length;

      const codeMatches = text.match(/```[\s\S]*?```/g);
      if (codeMatches) {
        totalCodeBlocksCount += codeMatches.length;
      }
    });

    const totalEstMinutes = Math.max(1, Math.ceil(totalWordCount / 200));

    return {
      totalChapters: chapters.length,
      totalWordCount,
      totalCharCount,
      totalEstMinutes,
      totalCodeBlocksCount,
      totalTocSections: compiledData.allTocItems.length
    };
  }, [chapters, compiledData.allTocItems]);

  // Preview Search Bar & Text Fragment Highlighter State
  const [previewSearchQuery, setPreviewSearchQuery] = useState('');
  const [filterMatchingChaptersOnly, setFilterMatchingChaptersOnly] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Compute searched / filtered chapters with highlight text fragments
  const searchedChaptersData = useMemo(() => {
    let totalMatchCount = 0;
    const q = previewSearchQuery.trim().toLowerCase();

    const chaptersWithHighlight = compiledData.parsedChapters.map((ch) => {
      if (!q) {
        return {
          ...ch,
          highlightedHtml: ch.renderedHtml,
          matchCount: 0,
          isMatch: true
        };
      }

      const { highlightedHtml, matchCount } = highlightTextInHtml(ch.renderedHtml, previewSearchQuery);
      
      const titleMatch = ch.title.toLowerCase().includes(q);
      const summaryMatch = ch.aiSummary?.toLowerCase().includes(q) || false;
      const totalChapterMatches = matchCount + (titleMatch ? 1 : 0) + (summaryMatch ? 1 : 0);
      const isMatch = totalChapterMatches > 0;

      totalMatchCount += totalChapterMatches;

      return {
        ...ch,
        highlightedHtml,
        matchCount: totalChapterMatches,
        isMatch
      };
    });

    const displayedChapters = filterMatchingChaptersOnly && q
      ? chaptersWithHighlight.filter(ch => ch.isMatch)
      : chaptersWithHighlight;

    return {
      displayedChapters,
      totalMatchCount,
      matchingChaptersCount: chaptersWithHighlight.filter(ch => ch.isMatch).length
    };
  }, [compiledData.parsedChapters, previewSearchQuery, filterMatchingChaptersOnly]);

  const scrollToMatch = (direction: 'next' | 'prev') => {
    if (typeof document === 'undefined') return;
    const matches = document.querySelectorAll('#pdf-render-root mark.search-highlight');
    if (!matches || matches.length === 0) return;

    let nextIdx = currentMatchIndex;
    if (direction === 'next') {
      nextIdx = (currentMatchIndex + 1) % matches.length;
    } else {
      nextIdx = (currentMatchIndex - 1 + matches.length) % matches.length;
    }

    setCurrentMatchIndex(nextIdx);

    matches.forEach((el) => {
      el.classList.remove('ring-4', 'ring-indigo-600', 'bg-amber-400', 'scale-105');
    });

    const target = matches[nextIdx] as HTMLElement;
    if (target) {
      target.classList.add('ring-4', 'ring-indigo-600', 'bg-amber-400', 'scale-105');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

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
    <div 
      ref={scrollContainerRef}
      style={{ backgroundColor: 'var(--bg-canvas)' }}
      className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto p-4 sm:p-8 flex justify-center selection:bg-indigo-500 selection:text-white transition-colors"
    >
      
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
        style={{
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'top center',
          marginBottom: zoomLevel > 100 ? `${(zoomLevel - 100) * 10}px` : '0px',
          transition: 'transform 0.15s ease-out'
        }}
        className={`pdf-document-paper relative overflow-hidden w-full ${activeFocusMode ? 'max-w-[1020px]' : 'max-w-[850px]'} bg-white text-slate-900 shadow-2xl rounded-2xl p-6 sm:p-12 min-h-[1050px] border border-slate-200/80 transition-all ${getFontFamilyClass()} theme-${styleConfig.codeTheme}`}
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

        {/* Dynamic Vector SVG Watermark Overlay Layer */}
        {renderSvgWatermark()}

        {/* Interactive OCR Selectable Text Layer Overlay */}
        {isOcrOverlayActive && ocrWords.length > 0 && (
          <div 
            className="ocr-selectable-text-layer absolute inset-0 z-35 pointer-events-auto select-text no-print overflow-hidden"
            title="OCR Selectable Text Layer - Highlight and copy text directly with mouse selection"
          >
            {ocrWords.map((word, idx) => {
              if (!word.text || !word.text.trim()) return null;
              const width = word.bbox.x1 - word.bbox.x0;
              const height = word.bbox.y1 - word.bbox.y0;
              return (
                <span
                  key={`ocr-word-${idx}`}
                  style={{
                    position: 'absolute',
                    left: `${word.bbox.x0}px`,
                    top: `${word.bbox.y0}px`,
                    width: `${Math.max(width, 6)}px`,
                    height: `${Math.max(height, 10)}px`,
                    fontSize: `${Math.max(10, height * 0.82)}px`,
                    lineHeight: `${height}px`,
                    color: 'transparent',
                    backgroundColor: 'rgba(6, 182, 212, 0.12)',
                    userSelect: 'text',
                    cursor: 'text',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                  className="hover:bg-cyan-500/25 transition-colors border-b border-cyan-400/30"
                  title={`OCR Word (${word.confidence}% confidence): ${word.text}`}
                >
                  {word.text}
                </span>
              );
            })}
          </div>
        )}
        
        {/* Platform Simulator Header Notice (Non-printable) */}
        <div className="no-print mb-6 p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2 relative z-50">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${activeFocusMode ? 'bg-indigo-500 ring-2 ring-indigo-300' : 'bg-emerald-500'} animate-pulse`}></span>
            <span className="font-semibold text-slate-800">
              {activeFocusMode ? (
                <span className="text-indigo-700 font-extrabold flex items-center gap-1.5">
                  <span>Reading Focus Mode Active</span>
                  <span className="text-[10px] text-slate-500 font-normal hidden sm:inline">(Press Esc or click Exit to return)</span>
                </span>
              ) : (
                <>
                  {platformMode === 'web' && 'Web Engine Mode: Rendered via Server Puppeteer Microservice'}
                  {platformMode === 'desktop' && 'Electron Mode: Local Chromium webContents.printToPDF()'}
                  {platformMode === 'mobile' && 'Capacitor Mobile Mode: Native iOS/Android Print Preview'}
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-slate-500 hidden sm:inline">
              Theme: {CODE_THEMES[styleConfig.codeTheme]?.name}
            </span>

            {/* Focus Mode Toggle Button */}
            <button
              onClick={toggleFocusMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs transition-all shadow-xs active:scale-95 ${
                activeFocusMode 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400/40' 
                  : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200/90 text-indigo-700'
              }`}
              title={activeFocusMode ? "Exit Fullscreen Focus Reading Mode (Esc)" : "Hide sidebars and tools to expand PDF preview to full screen width"}
            >
              {activeFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />}
              <span>{activeFocusMode ? 'Exit Focus Mode' : 'Focus Mode'}</span>
            </button>

            {/* Zoom Level Control Widget */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 text-slate-800 p-0.5 rounded-lg text-xs font-semibold shadow-2xs">
              <button
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
                disabled={zoomLevel <= 50}
                className="p-1 hover:bg-slate-100 rounded disabled:opacity-40 transition-colors"
                title="Zoom Out (Min 50%)"
              >
                <ZoomOut className="w-3.5 h-3.5 text-slate-600" />
              </button>

              <span className="font-mono text-[11px] font-bold px-1 text-slate-800 min-w-[36px] text-center">
                {zoomLevel}%
              </span>

              <button
                onClick={() => setZoomLevel(prev => Math.min(200, prev + 10))}
                disabled={zoomLevel >= 200}
                className="p-1 hover:bg-slate-100 rounded disabled:opacity-40 transition-colors"
                title="Zoom In (Max 200%)"
              >
                <ZoomIn className="w-3.5 h-3.5 text-slate-600" />
              </button>

              {zoomLevel !== 100 && (
                <button
                  onClick={() => setZoomLevel(100)}
                  className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono font-bold transition-colors border border-slate-200"
                  title="Reset Zoom to 100%"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Save View State Button */}
            <button
              onClick={handleSaveViewState}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs active:scale-95"
              title="Capture and save current scroll position and zoom level"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save View State</span>
            </button>

            {/* Restore View State Button (Visible when savedViewState exists) */}
            {savedViewState && (
              <button
                onClick={() => handleRestoreViewState()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/90 text-indigo-800 font-bold text-xs transition-all shadow-xs active:scale-95"
                title={`Restore saved state: Zoom ${savedViewState.zoomLevel}%, Scroll ${Math.round(savedViewState.scrollTop)}px`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Restore ({savedViewState.zoomLevel}%)</span>
              </button>
            )}

            {/* Sync TOC to View Button */}
            <button
              onClick={scrollToActiveChapter}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-all shadow-xs active:scale-95"
              title="Scroll PDF Preview directly to currently selected Sidebar chapter heading"
            >
              <LocateFixed className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sync TOC</span>
            </button>

            {/* SVG Watermark Manager Toggle Button */}
            <button
              onClick={() => setIsWatermarkToolOpen(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-xs transition-all shadow-xs active:scale-95 ${
                isWatermarkToolOpen 
                  ? 'bg-purple-600 text-white border-purple-500 font-bold' 
                  : styleConfig.watermarkEnabled
                  ? 'bg-purple-50 hover:bg-purple-100 border-purple-200/80 text-purple-800'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="Open SVG Watermark Manager tool with opacity, angle, and position controls"
            >
              <Stamp className={`w-3.5 h-3.5 ${styleConfig.watermarkEnabled ? 'text-purple-600' : 'text-slate-500'}`} />
              <span>Watermark Tool</span>
              {styleConfig.watermarkEnabled && (
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              )}
            </button>

            {/* Mobile QR Code Generator Toggle Button */}
            <button
              onClick={() => setIsQrToolOpen(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-xs transition-all shadow-xs active:scale-95 ${
                isQrToolOpen 
                  ? 'bg-emerald-600 text-white border-emerald-500 font-bold' 
                  : styleConfig.qrCodeConfig?.enabled
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200/80 text-emerald-800'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="Automatically generate & inject a QR code at the end of the PDF linking to original HTML bundle"
            >
              <QrCode className={`w-3.5 h-3.5 ${styleConfig.qrCodeConfig?.enabled ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>Mobile QR Code</span>
              {styleConfig.qrCodeConfig?.enabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
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

            {/* OCR Text Extractor Toggle Button */}
            <button
              onClick={() => setIsOcrModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-xs transition-all shadow-xs active:scale-95 ${
                isOcrModalOpen 
                  ? 'bg-cyan-600 text-white border-cyan-500 font-bold' 
                  : ocrResultText
                  ? 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200/80 text-cyan-800 font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="Extract & select text from scanned PDF pages, diagrams, or MDX images using Tesseract.js OCR"
            >
              <ScanText className={`w-3.5 h-3.5 ${ocrResultText ? 'text-cyan-600' : 'text-slate-500'}`} />
              <span>OCR Scan Text</span>
              {ocrResultText && (
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
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

        {/* PDF Preview Live Search & Text Fragment Highlighter Bar */}
        <div className="no-print mb-6 p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 flex items-center justify-between gap-3 flex-wrap relative z-50 shadow-lg">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-indigo-400 pointer-events-none" />
              <input
                type="text"
                value={previewSearchQuery}
                onChange={(e) => {
                  setPreviewSearchQuery(e.target.value);
                  setCurrentMatchIndex(0);
                }}
                placeholder="Search & highlight text fragments in preview pane..."
                className="w-full pl-9 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans transition-all"
              />
              {previewSearchQuery && (
                <button
                  onClick={() => {
                    setPreviewSearchQuery('');
                    setCurrentMatchIndex(0);
                  }}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs p-0.5 rounded transition-colors"
                  title="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Chapters Toggle */}
            <button
              onClick={() => setFilterMatchingChaptersOnly(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                filterMatchingChaptersOnly
                  ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="Hide chapters that do not match the current search query"
            >
              <Filter className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">Filter Chapters</span>
            </button>
          </div>

          {/* Matches Counter & Previous/Next Navigation */}
          {previewSearchQuery.trim() && (
            <div className="flex items-center gap-2 text-xs shrink-0">
              <span className="px-2.5 py-1 rounded-md bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 font-mono text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {searchedChaptersData.totalMatchCount > 0 ? (
                  <span>
                    <strong className="text-amber-400 font-bold">{searchedChaptersData.totalMatchCount}</strong> match{searchedChaptersData.totalMatchCount === 1 ? '' : 'es'} in{' '}
                    <strong className="text-white">{searchedChaptersData.matchingChaptersCount}</strong> chapter{searchedChaptersData.matchingChaptersCount === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span className="text-slate-400">No matches found</span>
                )}
              </span>

              {searchedChaptersData.totalMatchCount > 0 && (
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => scrollToMatch('prev')}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
                    title="Jump to Previous Highlighted Match"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-slate-400 px-1">
                    {currentMatchIndex + 1}/{searchedChaptersData.totalMatchCount}
                  </span>
                  <button
                    onClick={() => scrollToMatch('next')}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
                    title="Jump to Next Highlighted Match"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Watermark Manager Panel (Non-printable) */}
        {isWatermarkToolOpen && (
          <div className="no-print mb-6 p-4 rounded-xl bg-slate-900 border border-slate-700 text-white shadow-xl space-y-4 animate-fade-in relative z-50">
            {/* Top Bar: Title & Enable Switch */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Stamp className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">SVG Watermark Manager</h4>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-purple-300">
                  <input
                    type="checkbox"
                    checked={styleConfig.watermarkEnabled}
                    onChange={(e) => updateWatermark({ watermarkEnabled: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-0"
                  />
                  <span>Enable Watermark</span>
                </label>

                <button
                  onClick={() => setIsWatermarkToolOpen(false)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] font-mono"
                >
                  Close ✕
                </button>
              </div>
            </div>

            {/* Presets Row */}
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block mb-1.5 uppercase tracking-wider">Quick Presets</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => updateWatermark({
                    watermarkEnabled: true,
                    watermarkText: 'CONFIDENTIAL',
                    watermarkType: 'stamp-seal',
                    watermarkPosition: 'center',
                    watermarkRotation: -45,
                    watermarkOpacity: 0.15,
                    watermarkColor: '#0f172a'
                  })}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1"
                >
                  <span>🛡️ Official Seal</span>
                </button>

                <button
                  onClick={() => updateWatermark({
                    watermarkEnabled: true,
                    watermarkText: 'DRAFT NOTES',
                    watermarkType: 'text-svg',
                    watermarkPosition: 'center',
                    watermarkRotation: -45,
                    watermarkOpacity: 0.12,
                    watermarkColor: '#0f172a'
                  })}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1"
                >
                  <span>📜 Diagonal Text</span>
                </button>

                <button
                  onClick={() => updateWatermark({
                    watermarkEnabled: true,
                    watermarkText: 'DO NOT COPY',
                    watermarkType: 'grid',
                    watermarkPosition: 'grid',
                    watermarkRotation: -30,
                    watermarkOpacity: 0.08,
                    watermarkColor: '#0f172a'
                  })}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1"
                >
                  <span>🏁 Copy Guard Grid</span>
                </button>

                <button
                  onClick={() => updateWatermark({
                    watermarkEnabled: true,
                    watermarkText: 'EXAM PREP 2026',
                    watermarkType: 'badge',
                    watermarkPosition: 'top-right',
                    watermarkRotation: 0,
                    watermarkOpacity: 0.20,
                    watermarkColor: '#1e40af'
                  })}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1"
                >
                  <span>🎓 Security Badge</span>
                </button>
              </div>
            </div>

            {/* Row 1: Watermark Type & Watermark Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Watermark Type</label>
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                  {[
                    { id: 'text-svg', label: 'Vector Text', icon: Type },
                    { id: 'stamp-seal', label: 'Stamp Seal', icon: Stamp },
                    { id: 'badge', label: 'Badge', icon: Shield },
                    { id: 'grid', label: 'Tiled Grid', icon: LayoutGrid }
                  ].map(t => {
                    const Icon = t.icon;
                    const active = (styleConfig.watermarkType || 'text-svg') === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => updateWatermark({ watermarkType: t.id as WatermarkType, watermarkEnabled: true })}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all ${
                          active ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="hidden sm:inline">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Watermark Text</label>
                <input
                  type="text"
                  value={styleConfig.watermarkText || ''}
                  onChange={(e) => updateWatermark({ watermarkText: e.target.value.toUpperCase(), watermarkEnabled: true })}
                  placeholder="CONFIDENTIAL / DRAFT..."
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white uppercase font-mono font-bold outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Row 2: Position Placement Grid & Color Swatches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Position Placement</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-semibold">
                  {[
                    { id: 'top-left', label: 'Top Left' },
                    { id: 'center', label: 'Center' },
                    { id: 'top-right', label: 'Top Right' },
                    { id: 'bottom-left', label: 'Bottom Left' },
                    { id: 'grid', label: 'Tiled Grid' },
                    { id: 'bottom-right', label: 'Bottom Right' }
                  ].map(p => {
                    const active = (styleConfig.watermarkPosition || 'center') === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => updateWatermark({ watermarkPosition: p.id as WatermarkPosition, watermarkEnabled: true })}
                        className={`py-1 px-1 rounded text-[10px] transition-all text-center ${
                          active ? 'bg-purple-600 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Watermark Color</label>
                <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700 h-[38px]">
                  {[
                    { name: 'Dark Slate', value: '#0f172a' },
                    { name: 'Crimson Red', value: '#dc2626' },
                    { name: 'Royal Blue', value: '#1e40af' },
                    { name: 'Forest Green', value: '#166534' },
                    { name: 'Amber Gold', value: '#b45309' }
                  ].map(c => (
                    <button
                      key={c.value}
                      onClick={() => updateWatermark({ watermarkColor: c.value, watermarkEnabled: true })}
                      className={`w-5 h-5 rounded-full border border-slate-600 transition-transform ${
                        (styleConfig.watermarkColor || '#0f172a') === c.value ? 'scale-125 ring-2 ring-purple-400 ring-offset-1 ring-offset-slate-900' : 'hover:scale-110 opacity-80'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                  <span className="text-[10px] text-slate-400 font-mono ml-auto">
                    {styleConfig.watermarkColor || '#0f172a'}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 3: Sliders for Opacity, Rotation, Scale */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                  <span className="uppercase tracking-wider">Opacity</span>
                  <span className="text-purple-300 font-mono font-bold">
                    {Math.round((styleConfig.watermarkOpacity ?? 0.12) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.80"
                  step="0.01"
                  value={styleConfig.watermarkOpacity ?? 0.12}
                  onChange={(e) => updateWatermark({ watermarkOpacity: parseFloat(e.target.value), watermarkEnabled: true })}
                  className="w-full accent-purple-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                  <span className="uppercase tracking-wider">Rotation Angle</span>
                  <span className="text-purple-300 font-mono font-bold">
                    {styleConfig.watermarkRotation ?? -45}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  step="5"
                  value={styleConfig.watermarkRotation ?? -45}
                  onChange={(e) => updateWatermark({ watermarkRotation: parseInt(e.target.value, 10), watermarkEnabled: true })}
                  className="w-full accent-purple-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                  <span className="uppercase tracking-wider">Scale Size</span>
                  <span className="text-purple-300 font-mono font-bold">
                    {(styleConfig.watermarkScale ?? 1.0).toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={styleConfig.watermarkScale ?? 1.0}
                  onChange={(e) => updateWatermark({ watermarkScale: parseFloat(e.target.value), watermarkEnabled: true })}
                  className="w-full accent-purple-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>
            </div>

          </div>
        )}

        {/* Floating QR Code Manager Panel (Non-printable) */}
        {isQrToolOpen && (
          <div className="no-print mb-6 p-4 rounded-xl bg-slate-900 border border-slate-700 text-white shadow-xl space-y-4 animate-fade-in relative z-50">
            {/* Top Bar: Title & Enable Switch */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Mobile HTML Bundle QR Code Injector</h4>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-300">
                  <input
                    type="checkbox"
                    checked={styleConfig.qrCodeConfig?.enabled ?? true}
                    onChange={(e) => updateQrCodeConfig({ enabled: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-0"
                  />
                  <span>Inject QR Code at End of PDF</span>
                </label>

                <button
                  onClick={() => setIsQrToolOpen(false)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] font-mono"
                >
                  Close ✕
                </button>
              </div>
            </div>

            {/* Presets Row */}
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block mb-1.5 uppercase tracking-wider">Quick Target Link Presets</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => updateQrCodeConfig({
                    enabled: true,
                    url: typeof window !== 'undefined' ? window.location.href : '',
                    title: 'Scan for Mobile HTML Companion & Interactive Bundle',
                    subtitle: 'Scan with your smartphone camera to access the live responsive HTML bundle, code snippets, flashcards, and AI study guide.'
                  })}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Current App URL</span>
                </button>

                <button
                  onClick={() => updateQrCodeConfig({
                    enabled: true,
                    url: typeof window !== 'undefined' ? `${window.location.origin}/?mode=mobile-bundle` : '',
                    title: 'Interactive Mobile Study Notes Bundle',
                    subtitle: 'Access interactive code runners, quiz flashcards, and high-yield notes on your mobile device.'
                  })}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Mobile App Mode</span>
                </button>

                <button
                  onClick={() => updateQrCodeConfig({
                    enabled: true,
                    url: 'https://github.com',
                    title: 'Source Code Repository & Notes Bundle',
                    subtitle: 'Scan to clone, star, or view full original markdown and source HTML files.'
                  })}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1"
                >
                  <Code className="w-3.5 h-3.5 text-purple-400" />
                  <span>GitHub Source Repo</span>
                </button>
              </div>
            </div>

            {/* Main Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Inputs Form */}
              <div className="md:col-span-8 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mobile Bundle Web Link (URL)</label>
                    <button
                      onClick={() => updateQrCodeConfig({ url: typeof window !== 'undefined' ? window.location.href : '' })}
                      className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Use Current App URL</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={styleConfig.qrCodeConfig?.url || ''}
                    onChange={(e) => updateQrCodeConfig({ url: e.target.value, enabled: true })}
                    placeholder="https://your-app-bundle-domain.com"
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-indigo-300 font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Card Title</label>
                    <input
                      type="text"
                      value={styleConfig.qrCodeConfig?.title || ''}
                      onChange={(e) => updateQrCodeConfig({ title: e.target.value, enabled: true })}
                      placeholder="Scan for Mobile Interactive Bundle"
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-medium outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">QR Code Size ({styleConfig.qrCodeConfig?.sizePx || 150}px)</label>
                    <input
                      type="range"
                      min="100"
                      max="240"
                      step="10"
                      value={styleConfig.qrCodeConfig?.sizePx || 150}
                      onChange={(e) => updateQrCodeConfig({ sizePx: parseInt(e.target.value, 10), enabled: true })}
                      className="w-full accent-emerald-500 bg-slate-800 rounded-lg h-2 cursor-pointer mt-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Subtitle / Instructions</label>
                  <textarea
                    rows={2}
                    value={styleConfig.qrCodeConfig?.subtitle || ''}
                    onChange={(e) => updateQrCodeConfig({ subtitle: e.target.value, enabled: true })}
                    placeholder="Scan with your smartphone camera to access..."
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                {/* Color Palette Choice */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">QR Color Palette</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { name: 'Dark Slate', dark: '#0f172a', light: '#ffffff' },
                      { name: 'Deep Indigo', dark: '#312e81', light: '#f5f3ff' },
                      { name: 'Emerald Night', dark: '#064e3b', light: '#ecfdf5' },
                      { name: 'Crimson Seal', dark: '#881337', light: '#fff1f2' },
                      { name: 'Pure Black', dark: '#000000', light: '#ffffff' }
                    ].map(pal => (
                      <button
                        key={pal.name}
                        onClick={() => updateQrCodeConfig({ darkColor: pal.dark, lightColor: pal.light, enabled: true })}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
                          (styleConfig.qrCodeConfig?.darkColor || '#0f172a') === pal.dark
                            ? 'border-emerald-400 bg-slate-800 text-white font-bold ring-1 ring-emerald-400'
                            : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full border border-slate-500" style={{ backgroundColor: pal.dark }} />
                        <span>{pal.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live QR Code Preview Badge */}
              <div className="md:col-span-4 p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Live QR Preview</span>
                {qrSvgString ? (
                  <div 
                    className="p-2 bg-white rounded-lg border border-slate-200 shadow-md mb-2 overflow-hidden"
                    style={{ width: `${Math.min((styleConfig.qrCodeConfig?.sizePx || 150), 140)}px` }}
                    dangerouslySetInnerHTML={{ __html: qrSvgString }}
                  />
                ) : (
                  <div className="w-28 h-28 bg-slate-900 rounded-lg flex items-center justify-center text-slate-600 text-xs font-mono mb-2">
                    Loading...
                  </div>
                )}
                <span className="text-[10px] text-indigo-300 font-mono truncate max-w-full px-2">
                  {styleConfig.qrCodeConfig?.url || 'No URL set'}
                </span>
              </div>
            </div>
          </div>
        )}

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

        {/* 2. Auto-Generated Table of Contents (TOC) Header */}
        {styleConfig.showTOC && chapters.length > 0 && (
          <div id="pdf-toc" className="toc-section mb-10 p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-xs print-page-break prevent-break">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4 mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-700 shadow-2xs">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">
                    Automatic Navigation Index
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Table of Contents
                  </h2>
                </div>
              </div>

              <div className="text-right text-xs text-slate-500 font-mono flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <span><strong className="text-slate-800 font-extrabold">{chapters.length}</strong> {chapters.length === 1 ? 'Chapter' : 'Chapters'}</span>
                <span>•</span>
                <span><strong className="text-indigo-600 font-extrabold">{compiledData.allTocItems.length}</strong> Headings</span>
              </div>
            </div>

            <div className="space-y-3.5">
              {tocDataByChapter.map(({ chapter, index, anchorId, headings }) => (
                <div key={chapter.id} className="toc-chapter-group bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-400 transition-all">
                  {/* Primary Chapter Header Anchor Link */}
                  <div className="flex items-baseline justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <a
                      href={`#${anchorId}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(anchorId);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="flex items-center gap-2.5 text-sm font-extrabold text-slate-900 hover:text-indigo-600 transition-colors group cursor-pointer min-w-0"
                      title={`Jump to Chapter ${index}: ${chapter.title}`}
                    >
                      <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-mono text-xs font-black shrink-0 shadow-xs">
                        CH {index}
                      </span>
                      <span className="truncate group-hover:underline font-bold text-slate-900 text-base">
                        {chapter.title}
                      </span>
                    </a>

                    <span className="flex-1 border-b border-dotted border-slate-300 mx-2 opacity-70 hidden sm:block" />

                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-slate-500">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10px] uppercase font-bold">
                        .{chapter.extension}
                      </span>
                      <span>{chapter.readingTimeMinutes || 1} min read</span>
                    </div>
                  </div>

                  {/* Chapter Sub-Headings Nested Tree */}
                  {headings.length > 0 && (
                    <div className="mt-3 pl-4 sm:pl-6 pt-2.5 border-t border-slate-100 space-y-2">
                      {headings.map((item, hIdx) => (
                        <div
                          key={item.id + hIdx}
                          className={`flex items-baseline justify-between gap-2 text-xs ${
                            item.level === 1 ? 'font-bold text-slate-800 pl-1' :
                            item.level === 2 ? 'font-medium text-slate-700 pl-4 text-[11px]' :
                            'text-slate-500 pl-7 text-[10px]'
                          }`}
                        >
                          <a
                            href={`#${item.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              const el = document.getElementById(item.id);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="hover:text-indigo-600 hover:underline truncate transition-colors flex items-center gap-2 cursor-pointer text-slate-700 hover:font-bold"
                            title={`Jump to section: ${item.text}`}
                          >
                            <span className="text-indigo-400 font-mono text-[10px]">
                              {item.level === 1 ? '▸' : '•'}
                            </span>
                            <span>{item.text}</span>
                          </a>

                          <span className="flex-1 border-b border-dotted border-slate-200 mx-2 opacity-50 hidden md:block" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Chapter Documents Content List */}
        <div className="chapters-container space-y-12">
          {searchedChaptersData.displayedChapters.map((chapter, index) => (
            <div 
              key={chapter.id} 
              id={`chapter-section-${chapter.id}`}
              className="chapter-block print-page-break relative"
            >
              {/* Match Counter Badge for Search */}
              {chapter.matchCount > 0 && previewSearchQuery.trim() && (
                <div className="no-print mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-950 font-mono text-xs font-bold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>{chapter.matchCount} match{chapter.matchCount === 1 ? '' : 'es'} in this chapter</span>
                </div>
              )}
              
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

              {/* Parsed Chapter Body (MD / MDX / HTML / TXT) with Highlighted Search Fragments */}
              <div 
                className="chapter-rendered-html prose max-w-none prose-slate text-sm sm:text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: chapter.highlightedHtml }}
              />

              {index < searchedChaptersData.displayedChapters.length - 1 && (
                <div className="my-10 border-b border-slate-200/80 no-print" />
              )}
            </div>
          ))}

          {/* Empty Search Filter State Notice */}
          {searchedChaptersData.displayedChapters.length === 0 && (
            <div className="no-print p-12 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl my-8 text-slate-600">
              <Search className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No matching chapters found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No chapters matched your search query "<span className="font-semibold text-slate-800">{previewSearchQuery}</span>".
              </p>
              <button
                onClick={() => {
                  setPreviewSearchQuery('');
                  setFilterMatchingChaptersOnly(false);
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all"
              >
                Clear Search Filter
              </button>
            </div>
          )}
        </div>

        {/* 4. Injected Mobile QR Code & Original HTML Bundle Card Section */}
        {styleConfig.qrCodeConfig?.enabled && (
          <div className="pdf-qr-section mt-12 mb-8 p-6 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-800 prevent-break print-page-break-before relative overflow-hidden">
            {/* Background Glow Accents */}
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Card Top Banner */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block">
                      MOBILE COMPANION & HTML BUNDLE ACCESS
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                      {styleConfig.qrCodeConfig.title || 'Scan for Mobile Interactive HTML Bundle'}
                    </h3>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* QR Code Graphic Column */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-inner">
                  {qrSvgString ? (
                    <div 
                      className="p-3 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden"
                      style={{ width: `${(styleConfig.qrCodeConfig.sizePx || 150) + 24}px` }}
                      dangerouslySetInnerHTML={{ __html: qrSvgString }}
                    />
                  ) : qrDataUrl ? (
                    <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200">
                      <img 
                        src={qrDataUrl} 
                        alt="Mobile Bundle QR Code" 
                        style={{ width: `${styleConfig.qrCodeConfig.sizePx || 150}px`, height: `${styleConfig.qrCodeConfig.sizePx || 150}px` }} 
                        className="rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center bg-slate-900 rounded-xl text-slate-500 text-xs font-mono">
                      Generating QR...
                    </div>
                  )}

                  <span className="text-[11px] font-mono text-slate-400 mt-3 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    Smartphone Camera Scannable
                  </span>
                </div>

                {/* Instructions & Links Column */}
                <div className="md:col-span-7 space-y-4">
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {styleConfig.qrCodeConfig.subtitle || 'Scan with your smartphone camera to access the responsive HTML bundle with live code syntax highlighting, interactive flashcards, AI study notes, and responsive mobile TOC.'}
                  </p>

                  {/* Feature Highlights Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-2 text-slate-200">
                      <Code className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Syntax-Highlighted Code</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-2 text-slate-200">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>AI Chapter Summaries</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-2 text-slate-200">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Flashcards Mode</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-2 text-slate-200">
                      <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Interactive TOC</span>
                    </div>
                  </div>

                  {/* Raw URL Display & Copy Action */}
                  {styleConfig.qrCodeConfig.showUrlText && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Direct Original Bundle URL:
                      </span>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="font-mono text-xs text-indigo-300 truncate select-all flex-1">
                          {styleConfig.qrCodeConfig.url}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(styleConfig.qrCodeConfig?.url || window.location.href);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold flex items-center gap-1 transition-colors no-print"
                          title="Copy URL link to clipboard"
                        >
                          {copiedLink ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Real-Time Document Summary Statistics Footer Section */}
        <div className="pdf-summary-footer-section mt-12 mb-8 p-6 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-800 prevent-break relative overflow-hidden">
          {/* Subtle Background Glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 block">
                    Document Analytics & Compilation Summary
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Real-Time Statistics Overview
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Updated Live</span>
              </div>
            </div>

            {/* Metrics Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Total Chapters */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Chapters</span>
                  <Layers className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">
                    {documentSummaryStats.totalChapters}
                  </div>
                  <span className="text-[10px] text-slate-400">Total Units</span>
                </div>
              </div>

              {/* Total Words */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Words</span>
                  <FileText className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
                    {documentSummaryStats.totalWordCount.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400">Words Counted</span>
                </div>
              </div>

              {/* Estimated Reading Time */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Est. Read Time</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                    ~{documentSummaryStats.totalEstMinutes} <span className="text-xs font-normal text-amber-200/80">min</span>
                  </div>
                  <span className="text-[10px] text-slate-400">@ 200 words/min</span>
                </div>
              </div>

              {/* TOC Headings */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">TOC Headings</span>
                  <BookOpen className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-purple-300 font-mono">
                    {documentSummaryStats.totalTocSections}
                  </div>
                  <span className="text-[10px] text-slate-400">Parsed Sections</span>
                </div>
              </div>

              {/* Code Snippets */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Code Snippets</span>
                  <Code className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">
                    {documentSummaryStats.totalCodeBlocksCount}
                  </div>
                  <span className="text-[10px] text-slate-400">Code Blocks</span>
                </div>
              </div>

              {/* Total Characters */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Characters</span>
                  <Sparkles className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-rose-300 font-mono">
                    {(documentSummaryStats.totalCharCount / 1000).toFixed(1)}k
                  </div>
                  <span className="text-[10px] text-slate-400">{documentSummaryStats.totalCharCount.toLocaleString()} chars</span>
                </div>
              </div>
            </div>

            {/* Document Verification Footer Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono flex-wrap gap-2">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                Compilation Verified • Real-Time Stats Synchronized
              </span>
              <span>kaybit-pdf-compiler v2.4</span>
            </div>
          </div>
        </div>

        {/* Document Footer (Page number & branding) */}
        {styleConfig.showPageNumbers && (
          <div className="mt-16 pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>KayBiT_Html_Pdf Student Notes</span>
            <span>Compiled Reference</span>
          </div>
        )}

      </div>

      {/* View State Saved / Restored Toast Notification */}
      {viewStateToast && (
        <div className="no-print fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-950 text-white border border-indigo-500/60 shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in backdrop-blur-md">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{viewStateToast}</span>
        </div>
      )}

      {/* Tesseract.js OCR Text Extractor Modal */}
      {isOcrModalOpen && (
        <div className="no-print fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
                  <ScanText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Tesseract OCR Text Extractor</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      AI Vision
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Extract, select, and copy text from scanned PDF pages, diagrams, or MDX images
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOcrModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close OCR Scanner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source Tab Selector */}
            <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/30 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setOcrSourceTab('page')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  ocrSourceTab === 'page'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Current PDF Page Snapshot</span>
              </button>

              <button
                onClick={() => setOcrSourceTab('image')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                  ocrSourceTab === 'image'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Embedded MDX Images</span>
                {embeddedImages.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/30 text-cyan-300 text-[10px] font-mono">
                    {embeddedImages.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setOcrSourceTab('upload')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  ocrSourceTab === 'upload'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload External Scan</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Tab 1: Page Snapshot */}
              {ocrSourceTab === 'page' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Full Document Page OCR</h4>
                      <p className="text-[11px] text-slate-400">
                        Renders current document sheet into high-DPI canvas & extracts all text
                      </p>
                    </div>
                    <button
                      onClick={handleRunOcrOnCurrentPage}
                      disabled={isOcrProcessing}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50 active:scale-95"
                    >
                      {isOcrProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanText className="w-4 h-4" />}
                      <span>{isOcrProcessing ? 'Scanning Page...' : 'Start Full Page OCR'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Embedded MDX Images */}
              {ocrSourceTab === 'image' && (
                <div className="space-y-3">
                  {embeddedImages.length === 0 ? (
                    <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-400 text-xs">
                      No embedded images found in current document. Try uploading an image or running Full Page OCR.
                    </div>
                  ) : (
                    <>
                      <label className="text-xs font-semibold text-slate-300 block">
                        Select an embedded image from current document:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-1">
                        {embeddedImages.map((img, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedImageSrc(img.src)}
                            className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col items-center gap-2 ${
                              selectedImageSrc === img.src
                                ? 'bg-cyan-950/60 border-cyan-500 ring-2 ring-cyan-500/30'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <img src={img.src} alt={img.alt} className="w-full h-24 object-cover rounded-lg" />
                            <span className="text-[10px] text-slate-400 truncate w-full text-center">
                              {img.alt}
                            </span>
                          </div>
                        ))}
                      </div>

                      {selectedImageSrc && (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => handleRunOcr(selectedImageSrc)}
                            disabled={isOcrProcessing}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50 active:scale-95"
                          >
                            {isOcrProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanText className="w-4 h-4" />}
                            <span>Scan Selected Image</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Tab 3: Upload Scan */}
              {ocrSourceTab === 'upload' && (
                <div className="p-6 rounded-xl bg-slate-950 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 transition-colors text-center space-y-3">
                  <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto" />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Upload Scanned Document / Image</span>
                    <span className="text-[11px] text-slate-500">Supports PNG, JPG, WEBP, BMP</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUploadForOcr}
                    disabled={isOcrProcessing}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Status & Live Progress Bar */}
              {(isOcrProcessing || ocrStatus !== 'Ready to scan') && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-2">
                      {isOcrProcessing && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
                      <span>{ocrStatus}</span>
                    </span>
                    {ocrConfidence > 0 && !isOcrProcessing && (
                      <span className="text-emerald-400 font-mono font-bold">
                        {ocrConfidence}% confidence
                      </span>
                    )}
                  </div>

                  {isOcrProcessing && (
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                        style={{ width: `${ocrProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Extracted Text Result Panel */}
              {ocrResultText && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <FileSearch className="w-4 h-4 text-cyan-400" />
                      <span>Extracted OCR Text</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsOcrOverlayActive(prev => !prev);
                          setOcrToastMessage(
                            !isOcrOverlayActive 
                              ? "Selectable overlay text layer ENABLED on document paper!" 
                              : "Overlay text layer disabled."
                          );
                          setTimeout(() => setOcrToastMessage(null), 2500);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                          isOcrOverlayActive
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                        title="Toggle interactive text layer overlay over the PDF preview paper"
                      >
                        <ScanText className="w-3.5 h-3.5" />
                        <span>{isOcrOverlayActive ? 'Overlay Active' : 'Enable Overlay'}</span>
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(ocrResultText);
                          setCopiedOcrText(true);
                          setTimeout(() => setCopiedOcrText(false), 2000);
                        }}
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                      >
                        {copiedOcrText ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedOcrText ? 'Copied!' : 'Copy Text'}</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={ocrResultText}
                    onChange={(e) => setOcrResultText(e.target.value)}
                    rows={8}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 leading-relaxed outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
              <span>Powered by Tesseract.js Neural Network</span>
              <button
                onClick={() => setIsOcrModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OCR Notification Toast */}
      {ocrToastMessage && (
        <div className="no-print fixed bottom-6 left-6 z-50 px-4 py-2.5 rounded-xl bg-slate-950 text-white border border-cyan-500/60 shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in backdrop-blur-md">
          <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{ocrToastMessage}</span>
        </div>
      )}
    </div>
  );
};
