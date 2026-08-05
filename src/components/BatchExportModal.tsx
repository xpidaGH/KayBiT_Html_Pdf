import React, { useState } from 'react';
import { 
  X, 
  Package, 
  Layers, 
  FileText, 
  CheckSquare, 
  Square, 
  Download, 
  Loader2, 
  Sparkles, 
  BookOpen, 
  Sliders, 
  CheckCircle2,
  FolderDown,
  Info
} from 'lucide-react';
import { Chapter, CoverPageConfig, StyleConfig } from '../types';

interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  coverConfig: CoverPageConfig;
  styleConfig: StyleConfig;
  onExportBatch: (options: {
    mode: 'consolidated' | 'individual';
    selectedChapterIds: string[];
    customTitle?: string;
  }) => Promise<void>;
  isPdfGenerating: boolean;
  exportProgress?: { current: number; total: number; currentChapterTitle: string } | null;
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  onClose,
  chapters,
  coverConfig,
  styleConfig,
  onExportBatch,
  isPdfGenerating,
  exportProgress
}) => {
  const [exportMode, setExportMode] = useState<'consolidated' | 'individual'>('consolidated');
  const [selectedIds, setSelectedIds] = useState<string[]>(() => chapters.map(c => c.id));
  const [customTitle, setCustomTitle] = useState(coverConfig.title || 'KayBiT_Notes');

  if (!isOpen) return null;

  const isAllSelected = selectedIds.length === chapters.length && chapters.length > 0;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(chapters.map(c => c.id));
    }
  };

  const toggleChapter = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleStartExport = async () => {
    if (selectedIds.length === 0) return;
    await onExportBatch({
      mode: exportMode,
      selectedChapterIds: selectedIds,
      customTitle: customTitle.trim() || 'KayBiT_Notes'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
        
        {/* Modal Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Multi-Chapter PDF Export</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  Batch Processor
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Export selected chapters as individual PDFs or as a single consolidated volume
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isPdfGenerating}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 bg-slate-900/60">

          {/* Export Mode Selection Cards */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Choose Export Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Option 1: Consolidated Volume */}
              <div
                onClick={() => !isPdfGenerating && setExportMode('consolidated')}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  exportMode === 'consolidated'
                    ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <input
                    type="radio"
                    name="exportMode"
                    checked={exportMode === 'consolidated'}
                    onChange={() => setExportMode('consolidated')}
                    className="accent-indigo-500 w-4 h-4"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Single Consolidated Volume</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Combines all selected chapters into 1 unified master PDF document with cover page & TOC.
                  </p>
                </div>
              </div>

              {/* Option 2: Individual Chapter PDFs */}
              <div
                onClick={() => !isPdfGenerating && setExportMode('individual')}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  exportMode === 'individual'
                    ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400">
                    <FolderDown className="w-5 h-5" />
                  </div>
                  <input
                    type="radio"
                    name="exportMode"
                    checked={exportMode === 'individual'}
                    onChange={() => setExportMode('individual')}
                    className="accent-indigo-500 w-4 h-4"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Individual Chapter PDFs</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Generates and downloads separate standalone PDF files for each selected chapter in sequence.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Title Customization Field */}
          <div className="space-y-1.5 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <label className="text-xs font-semibold text-slate-300 block">
              {exportMode === 'consolidated' ? 'Volume Title' : 'File Prefix / Export Name'}
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              disabled={isPdfGenerating}
              placeholder="e.g. Data_Structures_Exam_Notes"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 font-sans"
            />
            <p className="text-[10px] text-slate-400">
              {exportMode === 'consolidated' 
                ? 'Filename will be saved as: ' + (customTitle || 'KayBiT_Notes') + '_Consolidated.pdf'
                : 'Files will be saved as: [Prefix]_[ChapterTitle].pdf'}
            </p>
          </div>

          {/* Chapter Selection Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>Select Chapters to Export</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-mono">
                  {selectedIds.length} of {chapters.length} selected
                </span>
              </label>

              <button
                onClick={toggleSelectAll}
                disabled={isPdfGenerating}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                {isAllSelected ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Select All</span>
                  </>
                )}
              </button>
            </div>

            {/* List of Chapters */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/80 max-h-56 overflow-y-auto p-1">
              {chapters.map((ch, idx) => {
                const isSelected = selectedIds.includes(ch.id);
                return (
                  <div
                    key={ch.id}
                    onClick={() => !isPdfGenerating && toggleChapter(ch.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-slate-900 text-white font-medium' 
                        : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        disabled={isPdfGenerating}
                        className="accent-indigo-500 w-4 h-4 rounded shrink-0 cursor-pointer"
                      />
                      <span className="w-5 font-mono text-[11px] text-slate-500 shrink-0 font-bold">
                        #{idx + 1}
                      </span>
                      <span className="truncate text-xs font-semibold">{ch.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-slate-500">
                      <span>{ch.readingTimeMinutes} min</span>
                      <span>•</span>
                      <span>{ch.filename}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Generation Progress Indicator */}
          {isPdfGenerating && exportProgress && (
            <div className="p-4 rounded-xl bg-indigo-950/80 border border-indigo-500/50 space-y-2 animate-pulse">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-200">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>
                    Exporting {exportProgress.current} of {exportProgress.total}:
                  </span>
                  <span className="text-white font-bold truncate max-w-xs">
                    {exportProgress.currentChapterTitle}
                  </span>
                </span>
                <span className="font-mono text-indigo-300">
                  {Math.round((exportProgress.current / exportProgress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
                  style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden sm:inline">
              {exportMode === 'consolidated' 
                ? 'Will generate 1 PDF containing ' + selectedIds.length + ' chapters'
                : 'Will generate ' + selectedIds.length + ' separate PDF files'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isPdfGenerating}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleStartExport}
              disabled={isPdfGenerating || selectedIds.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPdfGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                  <span>Processing Export...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    Export {exportMode === 'consolidated' ? 'Consolidated PDF' : `${selectedIds.length} Chapter PDFs`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
