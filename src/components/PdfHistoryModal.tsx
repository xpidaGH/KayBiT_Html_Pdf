import React, { useState } from 'react';
import { 
  X, 
  History, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  FileText, 
  Clock, 
  Lock, 
  Stamp, 
  Server, 
  Printer, 
  Filter,
  AlertTriangle,
  Package
} from 'lucide-react';
import { PdfHistoryItem } from '../types';

interface PdfHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: PdfHistoryItem[];
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
  onOpenBatchExport?: () => void;
}

export const PdfHistoryModal: React.FC<PdfHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onDeleteHistoryItem,
  onOpenBatchExport
}) => {
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  if (!isOpen) return null;

  const filteredHistory = history.filter(item => {
    if (filter === 'success') return item.status === 'success';
    if (filter === 'failed') return item.status === 'failed';
    return true;
  });

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>PDF Export History</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-normal">
                  {history.length} {history.length === 1 ? 'record' : 'records'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Log of past PDF exports, status codes, and server execution details
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls & Bulk Action */}
        <div className="px-5 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filter === 'all' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({history.length})
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filter === 'success' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Successful ({history.filter(i => i.status === 'success').length})
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filter === 'failed' 
                  ? 'bg-rose-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Failed ({history.filter(i => i.status === 'failed').length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenBatchExport && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBatchExport();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md"
                title="Export multiple chapters as individual PDFs or a consolidated volume"
              >
                <Package className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Batch Export</span>
              </button>
            )}

            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700/60 hover:border-rose-800 transition-all text-xs"
                title="Clear all export history logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear Log</span>
              </button>
            )}
          </div>
        </div>

        {/* History Item List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 bg-slate-950/40">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-3 border border-dashed border-slate-800 rounded-2xl">
              <History className="w-10 h-10 mx-auto text-slate-600" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-300">No Export History Found</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {filter !== 'all' 
                    ? `No ${filter} export records matched your filter.` 
                    : 'Export your notes as a Vector PDF to start tracking export history.'}
                </p>
              </div>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="font-mono text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                      {item.filename}
                    </span>

                    {/* Status Badge */}
                    {item.status === 'success' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[10px] font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Exported</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/60 text-[10px] font-semibold">
                        <XCircle className="w-3 h-3 text-rose-400" />
                        <span>Failed</span>
                      </span>
                    )}

                    {/* Method Tag */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                      {item.exportMethod === 'server' ? (
                        <>
                          <Server className="w-2.5 h-2.5 text-indigo-400" />
                          <span>Server Puppeteer</span>
                        </>
                      ) : (
                        <>
                          <Printer className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Browser Print</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{formatDate(item.timestamp)}</span>
                    </span>

                    {item.fileSizeKb !== undefined && (
                      <span className="font-mono text-slate-300">
                        {(item.fileSizeKb).toFixed(1)} KB
                      </span>
                    )}

                    {item.passwordProtected && (
                      <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                        <Lock className="w-3 h-3" />
                        <span>Encrypted</span>
                      </span>
                    )}

                    {item.watermarkText && (
                      <span className="flex items-center gap-1 text-amber-300 text-[11px] font-medium">
                        <Stamp className="w-3 h-3" />
                        <span>Watermark ({item.watermarkText})</span>
                      </span>
                    )}
                  </div>

                  {/* Error Message if failed */}
                  {item.errorMessage && (
                    <div className="mt-1.5 p-2 rounded-lg bg-rose-950/40 border border-rose-800/40 text-[11px] text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="font-mono">{item.errorMessage}</span>
                    </div>
                  )}
                </div>

                {/* Delete Individual Record */}
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => onDeleteHistoryItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/60 transition-colors"
                    title="Delete history log entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Logs stored in local browser state</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
