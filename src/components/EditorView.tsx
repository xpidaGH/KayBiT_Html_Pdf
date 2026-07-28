import React, { useState } from 'react';
import { 
  FileText, 
  Code, 
  Sparkles, 
  AlertTriangle, 
  Lightbulb, 
  Info, 
  Heading1, 
  Heading2, 
  Heading3, 
  Tag, 
  User, 
  Calendar, 
  Clock, 
  Hash,
  BookOpen,
  ChevronDown,
  ChevronRight,
  FoldVertical,
  UnfoldVertical,
  Copy,
  Check,
  Code2,
  Edit3,
  Trash2
} from 'lucide-react';
import { Chapter, SupportedExtension } from '../types';
import { calculateReadingStats } from '../lib/parser';

interface EditorViewProps {
  chapter: Chapter | null;
  onUpdateChapter: (id: string, updates: Partial<Chapter>) => void;
}

interface ParsedSegment {
  type: 'text' | 'code';
  content: string;
  lang?: string;
  codeIndex?: number;
}

function parseContentSegments(content: string) {
  const segments: ParsedSegment[] = [];
  const regex = /```(\w*)\r?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let codeCount = 0;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: 'code',
      lang: match[1] || 'text',
      content: match[2],
      codeIndex: codeCount++,
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(lastIndex),
    });
  }

  return { segments, totalCodeBlocks: codeCount };
}

export const EditorView: React.FC<EditorViewProps> = ({ chapter, onUpdateChapter }) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'metadata'>('editor');
  const [viewMode, setViewMode] = useState<'raw' | 'folding'>('folding');
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<number, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!chapter) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-500 p-8">
        <p>Select or create a chapter to begin editing.</p>
      </div>
    );
  }

  const { segments, totalCodeBlocks } = parseContentSegments(chapter.content || '');

  const handleContentChange = (content: string) => {
    const stats = calculateReadingStats(content);
    onUpdateChapter(chapter.id, {
      content,
      metadata: {
        ...chapter.metadata,
        wordCount: stats.wordCount,
        readingTimeMinutes: stats.readingTimeMinutes
      }
    });
  };

  const handleMetadataChange = (key: keyof typeof chapter.metadata, value: any) => {
    onUpdateChapter(chapter.id, {
      metadata: {
        ...chapter.metadata,
        [key]: value
      }
    });
  };

  const toggleFold = (codeIndex: number) => {
    setCollapsedBlocks(prev => ({
      ...prev,
      [codeIndex]: !prev[codeIndex]
    }));
  };

  const handleFoldAll = () => {
    const newMap: Record<number, boolean> = {};
    for (let i = 0; i < totalCodeBlocks; i++) {
      newMap[i] = true;
    }
    setCollapsedBlocks(newMap);
  };

  const handleExpandAll = () => {
    setCollapsedBlocks({});
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleUpdateSegment = (segmentIndex: number, newContent: string, newLang?: string) => {
    const updated = [...segments];
    updated[segmentIndex] = {
      ...updated[segmentIndex],
      content: newContent,
      lang: newLang !== undefined ? newLang : updated[segmentIndex].lang,
    };

    let full = '';
    for (const seg of updated) {
      if (seg.type === 'text') {
        full += seg.content;
      } else {
        full += `\`\`\`${seg.lang || ''}\n${seg.content}\n\`\`\``;
      }
    }
    handleContentChange(full);
  };

  const handleDeleteSegment = (segmentIndex: number) => {
    const updated = segments.filter((_, idx) => idx !== segmentIndex);
    let full = '';
    for (const seg of updated) {
      if (seg.type === 'text') {
        full += seg.content;
      } else {
        full += `\`\`\`${seg.lang || ''}\n${seg.content}\n\`\`\``;
      }
    }
    handleContentChange(full);
  };

  const insertSnippet = (snippet: string) => {
    const textarea = document.getElementById(`editor-textarea-${chapter.id}`) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);

      const newText = before + snippet + after;
      handleContentChange(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + snippet.length, start + snippet.length);
      }, 50);
    } else {
      // If in folding mode, append to end of content
      handleContentChange((chapter.content || '') + snippet);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-950 border-r border-slate-800 text-slate-200">
      
      {/* Editor Sub-Header & Controls */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="text"
            value={chapter.title}
            onChange={(e) => onUpdateChapter(chapter.id, { title: e.target.value })}
            className="bg-transparent font-bold text-sm sm:text-base text-white border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-2 py-1 outline-none w-full truncate"
            placeholder="Chapter Title..."
          />
          <select
            value={chapter.extension}
            onChange={(e) => onUpdateChapter(chapter.id, { extension: e.target.value as SupportedExtension })}
            className="bg-slate-800 text-xs text-indigo-300 font-mono font-bold px-2 py-1 rounded border border-slate-700 outline-none"
          >
            <option value="md">.MD</option>
            <option value="mdx">.MDX</option>
            <option value="html">.HTML</option>
            <option value="txt">.TXT</option>
          </select>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Code & Content
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === 'metadata' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Metadata Header
          </button>
        </div>
      </div>

      {activeTab === 'editor' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Quick Toolbar for Callouts & Formatting */}
          <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mr-1">Insert Callout:</span>
            
            <button
              onClick={() => insertSnippet('\n:::summary[AI Study Summary]\nWrite core chapter summary points here.\n:::\n')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/50 shrink-0"
              title="Insert AI Summary Callout"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>AI Summary</span>
            </button>

            <button
              onClick={() => insertSnippet('\n:::warning[Common Exam Trap]\nDetail common pitfalls or bugs here.\n:::\n')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 shrink-0"
              title="Insert Warning / Trap Callout"
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Warning</span>
            </button>

            <button
              onClick={() => insertSnippet('\n:::tip[Exam High-Yield Tip]\nHighlight important exam hints here.\n:::\n')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/50 shrink-0"
              title="Insert High-Yield Tip Callout"
            >
              <Lightbulb className="w-3 h-3 text-emerald-400" />
              <span>Exam Tip</span>
            </button>

            <button
              onClick={() => insertSnippet('\n```python\n# Write code here\ndef process():\n    pass\n```\n')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/50 shrink-0"
              title="Insert Syntax Highlighted Code Block"
            >
              <Code className="w-3 h-3 text-indigo-400" />
              <span>Code Block</span>
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1 shrink-0" />

            <button
              onClick={() => insertSnippet('\n# Section Heading 1\n')}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
              title="H1 Heading"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertSnippet('\n## Subsection Heading 2\n')}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
              title="H2 Heading"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1 shrink-0" />

            {/* Folding Controls & Mode Toggle */}
            <div className="flex items-center gap-1.5 ml-auto shrink-0">
              {totalCodeBlocks > 0 && (
                <div className="flex items-center gap-1 mr-1">
                  <button
                    onClick={handleFoldAll}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                    title="Fold All Code Blocks"
                  >
                    <FoldVertical className="w-3 h-3 text-indigo-400" />
                    <span className="hidden sm:inline">Fold All</span>
                  </button>
                  <button
                    onClick={handleExpandAll}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                    title="Expand All Code Blocks"
                  >
                    <UnfoldVertical className="w-3 h-3 text-indigo-400" />
                    <span className="hidden sm:inline">Expand All</span>
                  </button>
                </div>
              )}

              <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px]">
                <button
                  onClick={() => setViewMode('folding')}
                  className={`px-2 py-0.5 rounded font-medium flex items-center gap-1 transition-all ${
                    viewMode === 'folding' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Code Block Folding View"
                >
                  <FoldVertical className="w-3 h-3" />
                  <span>Folding View</span>
                  {totalCodeBlocks > 0 && (
                    <span className="ml-0.5 px-1 rounded-full bg-indigo-950 text-indigo-200 text-[9px] font-mono">
                      {totalCodeBlocks}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`px-2 py-0.5 rounded font-medium flex items-center gap-1 transition-all ${
                    viewMode === 'raw' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Raw Markdown Editor"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Raw Text</span>
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'raw' ? (
            /* Main Code Textarea Editor */
            <div className="flex-1 relative bg-slate-950">
              <textarea
                id={`editor-textarea-${chapter.id}`}
                value={chapter.content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full p-4 bg-transparent text-slate-100 font-mono text-xs sm:text-sm leading-relaxed outline-none resize-none selection:bg-indigo-600 selection:text-white"
                placeholder="Type or paste Markdown, HTML, or code notes here..."
                spellCheck={false}
              />
            </div>
          ) : (
            /* Interactive Block Folding Editor View */
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
              {segments.map((segment, segIdx) => {
                if (segment.type === 'text') {
                  return (
                    <div key={`seg-${segIdx}`} className="relative">
                      <textarea
                        value={segment.content}
                        onChange={(e) => handleUpdateSegment(segIdx, e.target.value)}
                        rows={Math.max(2, segment.content.split('\n').length)}
                        className="w-full p-3 bg-slate-900/40 border border-slate-800/80 rounded-lg text-slate-100 font-mono text-xs sm:text-sm leading-relaxed outline-none focus:border-indigo-500/60 focus:bg-slate-900/70 resize-y transition-colors"
                        placeholder="Enter markdown text, headings, or callouts..."
                        spellCheck={false}
                      />
                    </div>
                  );
                }

                // Code Segment
                const cIndex = segment.codeIndex ?? 0;
                const isFolded = !!collapsedBlocks[cIndex];
                const lines = segment.content.split('\n');
                const lineCount = lines.length;

                return (
                  <div 
                    key={`seg-${segIdx}`} 
                    className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/90 shadow-md transition-all"
                  >
                    {/* Code Block Header Bar */}
                    <div className="px-3 py-2 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between gap-2 select-none">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => toggleFold(cIndex)}
                          className="p-1 rounded hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 transition-colors"
                          title={isFolded ? 'Expand Code Block' : 'Collapse Code Block'}
                        >
                          {isFolded ? (
                            <ChevronRight className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        <Code2 className="w-4 h-4 text-indigo-400 shrink-0" />

                        <input
                          type="text"
                          value={segment.lang || ''}
                          onChange={(e) => handleUpdateSegment(segIdx, segment.content, e.target.value.toLowerCase())}
                          placeholder="lang"
                          className="w-20 px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-[11px] font-mono font-bold text-indigo-300 uppercase outline-none focus:border-indigo-500"
                        />

                        <span className="text-xs text-slate-400 font-mono">
                          {lineCount} {lineCount === 1 ? 'line' : 'lines'}
                        </span>

                        {isFolded && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800/50 text-indigo-300 font-medium">
                            Folded Snippet
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyCode(segment.content, cIndex)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                          title="Copy Code"
                        >
                          {copiedIndex === cIndex ? (
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

                        <button
                          onClick={() => toggleFold(cIndex)}
                          className="px-2 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/50 text-indigo-300 text-[11px] font-medium transition-colors"
                        >
                          {isFolded ? 'Expand' : 'Fold'}
                        </button>

                        <button
                          onClick={() => handleDeleteSegment(segIdx)}
                          className="p-1 rounded hover:bg-rose-950 hover:text-rose-400 text-slate-500 transition-colors"
                          title="Delete Code Block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Code Block Body */}
                    {isFolded ? (
                      <div 
                        onClick={() => toggleFold(cIndex)}
                        className="p-3 bg-slate-950/60 text-slate-500 text-xs font-mono cursor-pointer hover:bg-slate-950/80 hover:text-slate-400 flex items-center justify-between transition-colors italic"
                      >
                        <span>
                          /// [Folded Code Snippet: {segment.lang || 'code'} ({lineCount} lines)] Click or press Expand to view code...
                        </span>
                        <UnfoldVertical className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-2" />
                      </div>
                    ) : (
                      <div className="relative bg-slate-950">
                        <textarea
                          value={segment.content}
                          onChange={(e) => handleUpdateSegment(segIdx, e.target.value)}
                          rows={Math.max(3, lineCount)}
                          className="w-full p-3 bg-slate-950 text-indigo-100 font-mono text-xs sm:text-sm leading-relaxed outline-none resize-y"
                          placeholder="Write code here..."
                          spellCheck={false}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {segments.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  <Code2 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="font-semibold text-slate-300 mb-1">Empty Chapter</p>
                  <p>Type markdown or insert code blocks using the toolbar buttons above.</p>
                </div>
              )}
            </div>
          )}

          {/* Footer Stats Bar */}
          <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3 text-slate-500" />
                {chapter.metadata.wordCount} words
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {chapter.metadata.readingTimeMinutes} min read
              </span>
            </div>
            <span className="text-slate-500 font-mono">
              Auto-saved
            </span>
          </div>

        </div>
      ) : (
        /* Metadata Configuration Tab */
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-950">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              Source Header Metadata Labeling
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              This metadata is automatically formatted into the header banner of each note chapter in the final PDF.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Source File Name</label>
              <input
                type="text"
                value={chapter.metadata.sourceFileName}
                onChange={(e) => handleMetadataChange('sourceFileName', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Primary Language</label>
              <input
                type="text"
                value={chapter.metadata.language}
                onChange={(e) => handleMetadataChange('language', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500"
                placeholder="Python, C++, TypeScript..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Author / Student</label>
              <input
                type="text"
                value={chapter.metadata.author}
                onChange={(e) => handleMetadataChange('author', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Course Code</label>
              <input
                type="text"
                value={chapter.metadata.courseCode || ''}
                onChange={(e) => handleMetadataChange('courseCode', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500"
                placeholder="CS101, CS202..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Date Created</label>
              <input
                type="date"
                value={chapter.metadata.dateCreated}
                onChange={(e) => handleMetadataChange('dateCreated', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Topic Tags (comma separated)</label>
              <input
                type="text"
                value={chapter.metadata.tags.join(', ')}
                onChange={(e) => handleMetadataChange('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500"
                placeholder="Algorithms, Revision, Exam"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
