import React from 'react';
import { 
  X, 
  Layers, 
  Globe, 
  Monitor, 
  Smartphone, 
  CheckCircle, 
  Code, 
  Cpu 
} from 'lucide-react';
import { PlatformMode } from '../types';

interface PlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  platformMode: PlatformMode;
  setPlatformMode: (mode: PlatformMode) => void;
}

export const PlatformModal: React.FC<PlatformModalProps> = ({
  isOpen,
  onClose,
  platformMode,
  setPlatformMode
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <h2 className="text-base sm:text-lg font-bold">Hybrid Multiplatform PDF Architecture</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          
          <p className="text-slate-300 leading-relaxed">
            <strong>KayBiT_Html_Pdf</strong> implements a <strong>Hybrid Architecture</strong> to guarantee native vector PDF generation across Web, Desktop, and Mobile environments without text pixelation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Web Engine */}
            <div 
              onClick={() => setPlatformMode('web')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                platformMode === 'web'
                  ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
                <Globe className="w-4 h-4" />
                <span>1. Web App (Node + Puppeteer)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Offloads HTML string to a server-side Node.js microservice running Puppeteer Chromium headless. Creates 100% vector text PDFs with selectable text, hyperlinks, and precise CSS page breaks.
              </p>
            </div>

            {/* 2. Desktop App */}
            <div 
              onClick={() => setPlatformMode('desktop')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                platformMode === 'desktop'
                  ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 text-sky-400 font-bold mb-2">
                <Monitor className="w-4 h-4" />
                <span>2. Desktop App (Electron)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Uses Electron's native <code className="text-sky-300 font-mono">webContents.printToPDF()</code>. Prints the Chromium view locally to vector PDF without requiring internet or an external server.
              </p>
            </div>

            {/* 3. Mobile App */}
            <div 
              onClick={() => setPlatformMode('mobile')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                platformMode === 'mobile'
                  ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 text-purple-400 font-bold mb-2">
                <Smartphone className="w-4 h-4" />
                <span>3. Mobile App (Capacitor)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sends styled HTML to native iOS/Android print preview engine via Capacitor Printer Plugin. Students can tap "Save as PDF" directly on their phone.
              </p>
            </div>

          </div>

          {/* Platform Code Implementation Snippet */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Code className="w-4 h-4 text-indigo-400" />
                Hybrid Adapter Code Interface
              </span>
              <span className="font-mono text-[10px] text-slate-500">/src/lib/pdfAdapter.ts</span>
            </div>

            <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed border border-slate-800">
{`export async function exportPdf(html: string, platform: 'web' | 'desktop' | 'mobile') {
  if (platform === 'desktop' && window.electronAPI) {
    // 1. Electron Local Vector Print
    return await window.electronAPI.printToPDF({ printBackground: true });
  } else if (platform === 'mobile' && window.CapacitorPrinter) {
    // 2. Capacitor Mobile Native Printer
    return await window.CapacitorPrinter.print({ html });
  } else {
    // 3. Web Puppeteer Server Microservice
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, title: 'KayBiT_Notes' })
    });
    return await response.blob();
  }
}`}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30"
          >
            Understood
          </button>
        </div>

      </div>
    </div>
  );
};
