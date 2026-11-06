import React, { useState, useRef } from 'react';
import { 
  Plus, 
  FolderPlus, 
  FilePlus, 
  Trash2, 
  GripVertical, 
  ArrowUp, 
  ArrowDown, 
  FileText, 
  Code2, 
  Tag, 
  RotateCcw,
  BookMarked,
  Clock,
  Search,
  X
} from 'lucide-react';
import { Chapter, SupportedExtension } from '../types';
import { calculateReadingStats } from '../lib/parser';

interface ChapterSidebarProps {
  chapters: Chapter[];
  activeChapterId: string;
  onSelectChapter: (id: string) => void;
  onAddChapter: (chapter: Partial<Chapter>) => void;
  onDeleteChapter: (id: string) => void;
  onMoveChapter: (index: number, direction: 'up' | 'down') => void;
  onReorderChapters?: (sourceIndex: number, destinationIndex: number) => void;
  onResetSamples: () => void;
  onFileUpload: (files: FileList) => void;
}

export const ChapterSidebar: React.FC<ChapterSidebarProps> = ({
  chapters,
  activeChapterId,
  onSelectChapter,
  onAddChapter,
  onDeleteChapter,
  onMoveChapter,
  onReorderChapters,
  onResetSamples,
  onFileUpload
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragStart = (e: React.DragEvent, originalIndex: number) => {
    setDraggedIndex(originalIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', originalIndex.toString());
  };

  const handleDragOver = (e: React.DragEvent, originalIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedIndex === null || draggedIndex === originalIndex) {
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const position = offsetY < rect.height / 2 ? 'above' : 'below';

    setDragOverIndex(originalIndex);
    setDragOverPosition(position);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverIndex(null);
    setDragOverPosition(null);
  };

  const handleDrop = (e: React.DragEvent, originalIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    const sourceIndex = sourceIndexStr !== '' ? parseInt(sourceIndexStr, 10) : draggedIndex;

    if (sourceIndex === null || isNaN(sourceIndex) || sourceIndex < 0) {
      resetDragState();
      return;
    }

    let destIndex = originalIndex;
    if (dragOverPosition === 'below' && sourceIndex < originalIndex) {
      destIndex = originalIndex;
    } else if (dragOverPosition === 'above' && sourceIndex > originalIndex) {
      destIndex = originalIndex;
    }

    if (onReorderChapters) {
      onReorderChapters(sourceIndex, destIndex);
    } else {
      const diff = destIndex - sourceIndex;
      const direction = diff > 0 ? 'down' : 'up';
      const steps = Math.abs(diff);
      for (let i = 0; i < steps; i++) {
        onMoveChapter(sourceIndex + (direction === 'down' ? i : -i), direction);
      }
    }

    resetDragState();
  };

  const resetDragState = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragOverPosition(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files);
      e.target.value = '';
    }
  };

  const createBlankChapter = () => {
    const nextNum = chapters.length + 1;
    onAddChapter({
      title: `Chapter ${nextNum}: New Study Notes`,
      extension: 'md',
      content: `# Chapter ${nextNum}: New Study Notes\n\nWrite your markdown, HTML, or code notes here.\n\n:::summary[AI Chapter Summary]\nSummarize key concepts here.\n:::\n\n\`\`\`python\n# Add code snippet\ndef hello():\n    print("Hello KayBiT!")\n\`\`\`\n`,
      metadata: {
        sourceFileName: `chapter_${nextNum}.md`,
        language: 'Markdown',
        author: 'Student',
        dateCreated: new Date().toISOString().split('T')[0],
        wordCount: 30,
        readingTimeMinutes: 1,
        tags: ['Study', 'Notes']
      }
    });
  };

  const getSnippet = (content: string, query: string) => {
    if (!query.trim()) return null;
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);
    if (index === -1) return null;
    const start = Math.max(0, index - 25);
    const end = Math.min(content.length, index + query.length + 35);
    let snippet = content.slice(start, end).replace(/\s+/g, ' ');
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    return snippet;
  };

  const indexedChapters = chapters.map((chapter, index) => ({ chapter, originalIndex: index }));
  const filteredChapters = indexedChapters.filter(({ chapter }) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const titleMatch = chapter.title.toLowerCase().includes(q);
    const contentMatch = (chapter.content || '').toLowerCase().includes(q);
    const tagMatch = chapter.metadata?.tags?.some(tag => tag.toLowerCase().includes(q));
    const sourceMatch = chapter.metadata?.sourceFileName?.toLowerCase().includes(q);
    return titleMatch || contentMatch || tagMatch || sourceMatch;
  });

  return (
    <div
      className="w-full lg:w-80 border-r flex flex-col h-[calc(100vh-4rem)] transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
      }}
    >
      
      {/* Top Header & Upload Actions */}
      <div
        className="p-4 border-b space-y-3"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <h2
              className="font-semibold text-sm"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
            >
              Chapters & Documents
            </h2>
          </div>
          <span
            className="text-xs px-2 py-0.5 font-mono tabular-nums"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-button)',
            }}
          >
            {filteredChapters.length} / {chapters.length}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chapters or snippets..."
            className="w-full pl-9 pr-8 py-1.5 border text-xs focus:outline-none transition-colors"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-button)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Upload Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* File Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-all"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Upload Files</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".md,.mdx,.html,.txt"
            className="hidden"
          />

          {/* Folder Upload */}
          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-medium transition-all"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Upload Folder</span>
          </button>
          <input
            type="file"
            ref={folderInputRef}
            onChange={handleFileChange}
            /* @ts-ignore */
            webkitdirectory="true"
            /* @ts-ignore */
            directory="true"
            multiple
            className="hidden"
          />
        </div>

        {/* Add Blank Chapter & Reset */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={createBlankChapter}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>New Chapter</span>
          </button>

          <button
            onClick={onResetSamples}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-all border border-slate-700"
            title="Reset to Sample Student Notes"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chapters Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {chapters.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="font-medium text-slate-400 mb-1">No notes added yet</p>
            <p>Upload .md, .mdx, .html, or .txt files to compile into PDF.</p>
          </div>
        ) : filteredChapters.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            <Search className="w-7 h-7 mx-auto mb-2 text-slate-600" />
            <p className="font-medium text-slate-300 mb-1">No chapters found</p>
            <p className="text-slate-500 mb-3">No titles or content matching "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-md font-medium text-xs border border-slate-700 transition-all"
            >
              Clear Search
            </button>
          </div>
        ) : (
          filteredChapters.map(({ chapter, originalIndex }) => {
            const isActive = chapter.id === activeChapterId;
            const stats = calculateReadingStats(chapter.content || '');
            const wordCount = stats.wordCount;
            const readingTimeMinutes = stats.readingTimeMinutes;
            const snippet = searchQuery ? getSnippet(chapter.content || '', searchQuery) : null;

            const isDragged = draggedIndex === originalIndex;
            const isDropTargetAbove = dragOverIndex === originalIndex && dragOverPosition === 'above';
            const isDropTargetBelow = dragOverIndex === originalIndex && dragOverPosition === 'below';

            return (
              <div
                key={chapter.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, originalIndex)}
                onDragOver={(e) => handleDragOver(e, originalIndex)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, originalIndex)}
                onDragEnd={resetDragState}
                onClick={() => onSelectChapter(chapter.id)}
                style={{
                  backgroundColor: isActive
                    ? 'var(--accent-soft)'
                    : 'var(--bg-surface-elevated)',
                  borderColor: isActive
                    ? 'var(--accent-primary)'
                    : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-card)',
                }}
                className={`group relative p-3 cursor-pointer transition-all border select-none ${
                  isDragged ? 'opacity-40 border-dashed scale-[0.98]' : ''
                } ${isDropTargetAbove ? 'border-t-2 border-t-indigo-400 shadow-md ring-1 ring-indigo-400/40' : ''} ${
                  isDropTargetBelow ? 'border-b-2 border-b-indigo-400 shadow-md ring-1 ring-indigo-400/40' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  {/* Drag Grip Handle */}
                  <div 
                    className="cursor-grab active:cursor-grabbing p-0.5 rounded transition-colors shrink-0 mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                    title="Drag up or down to reorder chapter"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span
                      className="mt-0.5 text-xs font-mono font-bold tabular-nums"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      #{originalIndex + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-xs font-semibold truncate leading-tight"
                        style={{
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {chapter.title}
                      </h3>
                      <div
                        className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5 text-[11px] tabular-nums"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <span
                          className="uppercase font-mono px-1.5 py-0.5 border font-bold text-[10px]"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--accent-primary)',
                            borderRadius: 'var(--radius-button)',
                          }}
                        >
                          {chapter.extension}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <FileText className="w-3 h-3 shrink-0" style={{ color: 'var(--text-muted)' }} />
                          {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
                        </span>
                        <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 shrink-0" style={{ color: 'var(--text-muted)' }} />
                          {readingTimeMinutes} min read
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveChapter(originalIndex, 'up');
                      }}
                      disabled={originalIndex === 0}
                      className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-20"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveChapter(originalIndex, 'down');
                      }}
                      disabled={originalIndex === chapters.length - 1}
                      className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-20"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChapter(chapter.id);
                      }}
                      className="p-1 rounded hover:bg-rose-950/80 text-rose-400 hover:text-rose-200"
                      title="Delete Chapter"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Content Snippet Match Preview */}
                {snippet && (
                  <div className="mt-2 text-[10px] text-indigo-200/90 bg-indigo-950/40 p-1.5 rounded border border-indigo-800/40 font-mono italic truncate">
                    "{snippet}"
                  </div>
                )}

                {/* AI Summary Tag Indicator */}
                {chapter.aiSummary && !snippet && (
                  <div className="mt-2 text-[10px] text-purple-300/80 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40 truncate">
                    ✨ AI Summary Included
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Drag Drop Hint Footer */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
        <GripVertical className="w-3 h-3 text-indigo-400" />
        <span>Drag cards to reorder</span>
        <span className="text-slate-600">•</span>
        <span className="text-slate-500 font-mono">.html, .txt, .md, .mdx</span>
      </div>

    </div>
  );
};

