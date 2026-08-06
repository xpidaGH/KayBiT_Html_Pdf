import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Sparkles, 
  Sliders, 
  Layers, 
  Smartphone, 
  Monitor, 
  Globe, 
  BookOpen,
  HelpCircle,
  FileCode,
  Loader2,
  History,
  Package,
  Wifi,
  WifiOff
} from 'lucide-react';
import { PlatformMode } from '../types';

interface HeaderProps {
  platformMode: PlatformMode;
  setPlatformMode: (mode: PlatformMode) => void;
  onOpenSettings: () => void;
  onOpenPdfHistory: () => void;
  onOpenBatchExport: () => void;
  onOpenPlatformGuide: () => void;
  onOpenReadme: () => void;
  onOpenFlashcards: () => void;
  onGenerateAiSummary: () => void;
  onGenerateServerPdf: () => void;
  onTriggerBrowserPrint: () => void;
  onExportHtmlBundle: () => void;
  isAiGenerating: boolean;
  isPdfGenerating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  platformMode,
  setPlatformMode,
  onOpenSettings,
  onOpenPdfHistory,
  onOpenBatchExport,
  onOpenPlatformGuide,
  onOpenReadme,
  onOpenFlashcards,
  onGenerateAiSummary,
  onGenerateServerPdf,
  onTriggerBrowserPrint,
  onExportHtmlBundle,
  isAiGenerating,
  isPdfGenerating
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl relative">
      {/* Top Visual Progress Bar during PDF Generation API Call */}
      {isPdfGenerating && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-950 overflow-hidden z-50">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-400 to-pink-500 animate-pulse w-full transition-all duration-300" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-bold text-lg text-white">
              <FileCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  KayBiT_Html_Pdf
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v2.5 Hybrid Vector
                </span>
                {!isOnline ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse" title="Service Worker caching active - working offline">
                    <WifiOff className="w-3 h-3 text-amber-400" />
                    <span>Offline</span>
                  </span>
                ) : (
                  <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Assets cached for offline availability via Service Worker">
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    <span>SW Active</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Multiplatform Student PDF Programming Notes Compiler
              </p>
            </div>
          </div>

          {/* Platform Switcher */}
          <div className="hidden lg:flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setPlatformMode('web')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                platformMode === 'web'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Web (Puppeteer)</span>
            </button>
            <button
              onClick={() => setPlatformMode('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                platformMode === 'desktop'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop (Electron)</span>
            </button>
            <button
              onClick={() => setPlatformMode('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                platformMode === 'mobile'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile (Capacitor)</span>
            </button>
          </div>

          {/* Actions & PDF Export Controls */}
          <div className="flex items-center gap-2">

            {/* AI Generator Button */}
            <button
              onClick={onGenerateAiSummary}
              disabled={isAiGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Enhance notes with Gemini AI Study Summaries & Key Takeaways"
            >
              <Sparkles className={`w-3.5 h-3.5 text-purple-400 ${isAiGenerating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">AI Study Guide</span>
            </button>

            {/* Flashcards Quiz Mode */}
            <button
              onClick={onOpenFlashcards}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
              title="Review Interactive Revision Flashcards (Ctrl+K / Cmd+K)"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Flashcards</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all hover:text-white"
              title="PDF Styling & Code Theme Settings (Ctrl+, / Cmd+,)"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* PDF Generation History Log */}
            <button
              onClick={onOpenPdfHistory}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all hover:text-white"
              title="View PDF Export Generation History (Ctrl+H / Cmd+H)"
            >
              <History className="w-4 h-4 text-purple-400" />
            </button>

            {/* Batch Multi-Chapter Export Options */}
            <button
              onClick={onOpenBatchExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 text-xs font-semibold shadow-xs transition-all hover:scale-105 active:scale-95"
              title="Export multiple chapters as individual PDFs or a consolidated volume (Ctrl+B / Cmd+B)"
            >
              <Package className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Batch Export</span>
            </button>

            {/* Server Vector PDF Download Button */}
            <button
              onClick={onGenerateServerPdf}
              disabled={isPdfGenerating}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-80 disabled:cursor-not-allowed"
              title="Download True Vector PDF rendered by Server Puppeteer Engine (Ctrl+P / Cmd+P)"
            >
              {isPdfGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin shrink-0" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Export PDF</span>
                  <span className="hidden lg:inline text-[10px] bg-indigo-700/80 px-1.5 py-0.5 rounded font-mono text-indigo-100">Ctrl+P</span>
                </>
              )}
            </button>

            {/* Browser Print Fallback Button */}
            <button
              onClick={onTriggerBrowserPrint}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all hover:text-white hidden sm:flex"
              title="Native Browser Print Preview (Ctrl+P / Cmd+P)"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Cross-Platform Architecture Info Modal Trigger */}
            <button
              onClick={onOpenPlatformGuide}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all hover:text-white"
              title="Hybrid Architecture & Platform Details"
            >
              <Layers className="w-4 h-4 text-sky-400" />
            </button>

            {/* Readme Packaging Docs */}
            <button
              onClick={onOpenReadme}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all hover:text-white"
              title="Cross-Platform Packaging Guide (README)"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
            </button>

          </div>

        </div>
      </div>

      {/* API Request Progress Overlay Banner in Header */}
      {isPdfGenerating && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border-t border-indigo-500/30 px-4 py-2 text-xs text-indigo-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
              <span className="font-semibold text-white">
                Server PDF Generation in Progress:
              </span>
              <span className="text-slate-300 hidden sm:inline">
                Rendering vector pages, syntax highlighting, and PDF page breaks via Server Puppeteer...
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="font-mono text-[11px] text-indigo-300/90 font-medium">
                API Request Active
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

