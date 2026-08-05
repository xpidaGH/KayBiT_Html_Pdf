import React, { useState, useMemo } from 'react';
import { 
  ListTree, 
  BookOpen, 
  Search, 
  ChevronRight, 
  FileText, 
  X, 
  ArrowUpRight, 
  Sparkles,
  Layers,
  Clock,
  Code
} from 'lucide-react';
import { Chapter, StyleConfig } from '../types';

interface FloatingTocButtonProps {
  chapters: Chapter[];
  activeChapterId: string;
  onSelectChapter: (id: string) => void;
  styleConfig: StyleConfig;
  setStyleConfig: React.Dispatch<React.SetStateAction<StyleConfig>>;
}

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export const FloatingTocButton: React.FC<FloatingTocButtonProps> = ({
  chapters,
  activeChapterId,
  onSelectChapter,
  styleConfig,
  setStyleConfig
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract headings for each chapter
  const chaptersWithHeadings = useMemo(() => {
    return chapters.map((ch, idx) => {
      const headings: HeadingItem[] = [];
      const lines = (ch.content || '').split('\n');
      lines.forEach((line) => {
        const match = line.match(/^(#{1,3})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const text = match[2].trim().replace(/[*_`]/g, '');
          const id = `heading-${ch.id}-${text.toLowerCase().replace(/[^\w]+/g, '-')}`;
          headings.push({ id, text, level });
        }
      });

      return {
        ...ch,
        chapterIndex: idx + 1,
        headings
      };
    });
  }, [chapters]);

  // Filter chapters/headings by search query
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chaptersWithHeadings;
    const q = searchQuery.toLowerCase();
    return chaptersWithHeadings.filter(ch => {
      const titleMatch = ch.title.toLowerCase().includes(q) || ch.filename.toLowerCase().includes(q);
      const headingMatch = ch.headings.some(h => h.text.toLowerCase().includes(q));
      return titleMatch || headingMatch;
    });
  }, [chaptersWithHeadings, searchQuery]);

  const scrollToTocInPreview = () => {
    // Ensure showTOC is enabled in styleConfig
    if (!styleConfig.showTOC) {
      setStyleConfig(prev => ({ ...prev, showTOC: true }));
    }

    // Delay slightly to allow re-render if showTOC was just enabled
    setTimeout(() => {
      const tocElem = document.getElementById('pdf-toc');
      if (tocElem) {
        tocElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Fallback scroll preview container to top
        const previewRoot = document.getElementById('pdf-render-root');
        if (previewRoot) {
          previewRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  };

  const handleJumpToChapter = (chapterId: string, headingId?: string) => {
    onSelectChapter(chapterId);

    setTimeout(() => {
      if (headingId) {
        const elem = document.getElementById(headingId);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }

      const chapterElem = document.getElementById(`chapter-section-${chapterId}`);
      if (chapterElem) {
        chapterElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  return (
    <>
      {/* Permanent Floating Table of Contents Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 no-print">
        {/* Quick Direct Scroll to Preview TOC Button (secondary pill) */}
        {isOpen && (
          <button
            onClick={scrollToTocInPreview}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-900 border border-slate-700 text-indigo-300 text-xs font-semibold shadow-xl hover:bg-slate-800 transition-all animate-fade-in"
            title="Scroll directly to Table of Contents page in PDF preview"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Go to PDF TOC</span>
          </button>
        )}

        {/* Main Floating TOC Button */}
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className={`flex items-center gap-2 px-4 py-3 rounded-full font-bold text-xs shadow-2xl transition-all duration-300 active:scale-95 ${
            isOpen 
              ? 'bg-slate-900 text-indigo-300 border-2 border-indigo-500/80 shadow-indigo-500/20' 
              : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white ring-4 ring-indigo-500/30'
          }`}
          title="Toggle Table of Contents Quick Navigator"
        >
          <ListTree className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-90 text-indigo-400' : 'text-white'}`} />
          <span className="tracking-wide uppercase font-black">Table of Contents</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-black/30 text-[10px] font-mono text-indigo-200">
            {chapters.length}
          </span>
        </button>
      </div>

      {/* Floating TOC Popover Drawer Panel */}
      {isOpen && (
        <div className="fixed bottom-22 right-6 z-50 w-88 sm:w-96 max-h-[75vh] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 flex flex-col overflow-hidden animate-fade-in no-print">
          
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  Table of Contents
                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                    Live Sync
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Jump to any chapter or section</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={scrollToTocInPreview}
                className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[10px] font-semibold flex items-center gap-1 border border-indigo-500/30 transition-colors"
                title="Scroll Preview to TOC Page"
              >
                <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">Preview TOC</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Close TOC"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="p-3 bg-slate-900 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chapters & headings..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-all font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Chapter Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-800/50">
            {filteredChapters.map((ch) => {
              const isActive = ch.id === activeChapterId;
              return (
                <div key={ch.id} className="pt-2 first:pt-0 space-y-1">
                  
                  {/* Chapter Parent Button */}
                  <div
                    onClick={() => handleJumpToChapter(ch.id)}
                    className={`group flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-200 font-bold' 
                        : 'hover:bg-slate-800/80 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[10px] shrink-0 font-extrabold ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                      }`}>
                        {ch.chapterIndex}
                      </span>
                      <div className="truncate">
                        <span className="block truncate font-semibold">{ch.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono truncate block">
                          {ch.filename}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-950">
                        {ch.readingTimeMinutes}m
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isActive ? 'rotate-90 text-indigo-400' : 'group-hover:translate-x-0.5'}`} />
                    </div>
                  </div>

                  {/* Sub-headings Tree */}
                  {ch.headings.length > 0 && (
                    <div className="pl-6 space-y-0.5 border-l-2 border-slate-800 ml-4 py-1">
                      {ch.headings.map((heading) => (
                        <button
                          key={heading.id}
                          onClick={() => handleJumpToChapter(ch.id, heading.id)}
                          className={`w-full text-left py-1 px-2 rounded text-[11px] truncate flex items-center gap-1.5 transition-colors ${
                            heading.level === 1 
                              ? 'text-slate-300 font-medium hover:text-indigo-300 hover:bg-slate-800/50' 
                              : 'text-slate-400 hover:text-slate-200 pl-3'
                          }`}
                        >
                          <span className="text-slate-500 font-mono text-[9px]">
                            {heading.level === 1 ? '§' : '•'}
                          </span>
                          <span className="truncate">{heading.text}</span>
                        </button>
                      ))}
                    </div>
                  )}

                </div>
              );
            })}

            {filteredChapters.length === 0 && (
              <div className="p-6 text-center text-slate-500 text-xs">
                No matching chapters or headings found for "{searchQuery}".
              </div>
            )}
          </div>

          {/* Drawer Footer Status */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/90 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1 font-mono">
              <Layers className="w-3 h-3 text-indigo-400" />
              {chapters.length} Chapters total
            </span>
            <button
              onClick={scrollToTocInPreview}
              className="text-indigo-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>Scroll to PDF Table of Contents</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

        </div>
      )}
    </>
  );
};
