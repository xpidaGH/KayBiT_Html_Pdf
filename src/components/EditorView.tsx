import React, { useState, useEffect, useRef } from 'react';
import hljs from 'highlight.js';
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
  Trash2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  RotateCcw,
  Sliders,
  AudioLines,
  Mic,
  Wand2,
  CheckCircle,
  Scissors,
  Split,
  Layers,
  X
} from 'lucide-react';
import { Chapter, SupportedExtension } from '../types';
import { calculateReadingStats } from '../lib/parser';

interface EditorViewProps {
  chapter: Chapter | null;
  onUpdateChapter: (id: string, updates: Partial<Chapter>) => void;
  onSplitChapter?: (chapterId: string, newChapters: Partial<Chapter>[]) => void;
}

interface ParsedSegment {
  type: 'text' | 'code';
  content: string;
  lang?: string;
  isAutoDetected?: boolean;
  codeIndex?: number;
}

export function detectCodeLanguage(code: string): string {
  if (!code || !code.trim()) return 'plaintext';
  try {
    const res = hljs.highlightAuto(code);
    if (res && res.language) {
      return res.language.toLowerCase();
    }
  } catch (err) {
    console.warn('Language auto-detection error:', err);
  }
  return 'plaintext';
}

export function formatLanguageName(lang: string): string {
  if (!lang) return 'Text';
  const map: Record<string, string> = {
    js: 'JavaScript',
    javascript: 'JavaScript',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    py: 'Python',
    python: 'Python',
    cpp: 'C++',
    c: 'C',
    cs: 'C#',
    csharp: 'C#',
    java: 'Java',
    rs: 'Rust',
    rust: 'Rust',
    go: 'Go',
    sql: 'SQL',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    bash: 'Bash',
    sh: 'Bash',
    shell: 'Bash',
    xml: 'XML',
    yaml: 'YAML',
    yml: 'YAML',
    md: 'Markdown',
    markdown: 'Markdown',
    mdx: 'MDX',
    php: 'PHP',
    rb: 'Ruby',
    ruby: 'Ruby',
    swift: 'Swift',
    kt: 'Kotlin',
    kotlin: 'Kotlin'
  };
  const lower = lang.toLowerCase();
  return map[lower] || (lang.charAt(0).toUpperCase() + lang.slice(1));
}

export interface SplitSectionPreview {
  title: string;
  content: string;
  wordCount: number;
  readingTimeMinutes: number;
}

export function performSmartSplit(
  chapterTitle: string,
  content: string,
  splitLevel: 'h2' | 'h3' | 'auto' = 'auto'
): SplitSectionPreview[] {
  if (!content || !content.trim()) return [];

  const lines = content.split(/\r?\n/);
  
  let headingRegex: RegExp;
  if (splitLevel === 'h2') {
    headingRegex = /^##\s+(.+)$/;
  } else if (splitLevel === 'h3') {
    headingRegex = /^###?\s+(.+)$/;
  } else {
    const hasH2 = lines.some(line => /^##\s+/.test(line));
    if (hasH2) {
      headingRegex = /^##\s+(.+)$/;
    } else {
      headingRegex = /^###?\s+(.+)$/;
    }
  }

  const sections: { title: string; lines: string[] }[] = [];
  let currentTitle = chapterTitle;
  let currentLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(headingRegex);

    if (match) {
      if (currentLines.join('\n').trim().length > 0) {
        sections.push({
          title: currentTitle,
          lines: currentLines
        });
      }
      
      const cleanHeading = match[1].replace(/[*_`]/g, '').trim();
      currentTitle = cleanHeading || `${chapterTitle} (Part ${sections.length + 1})`;
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.join('\n').trim().length > 0) {
    sections.push({
      title: currentTitle,
      lines: currentLines
    });
  }

  return sections.map((sec, idx) => {
    const sectionContent = sec.lines.join('\n').trim();
    const stats = calculateReadingStats(sectionContent);
    return {
      title: sec.title || `${chapterTitle} (Part ${idx + 1})`,
      content: sectionContent,
      wordCount: stats.wordCount,
      readingTimeMinutes: stats.readingTimeMinutes
    };
  });
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

    const rawLang = match[1] ? match[1].trim() : '';
    const codeContent = match[2];
    const isUnspecified = !rawLang || ['text', 'code', 'plaintext'].includes(rawLang.toLowerCase());
    const detected = isUnspecified ? detectCodeLanguage(codeContent) : rawLang;

    segments.push({
      type: 'code',
      lang: detected,
      isAutoDetected: isUnspecified && detected !== 'plaintext',
      content: codeContent,
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

function cleanTextForSpeech(title: string, rawContent: string): string {
  if (!rawContent && !title) return '';
  let text = `Chapter: ${title}.\n\n` + (rawContent || '');
  return text
    .replace(/```[\s\S]*?```/g, ' [Code block omitted from speech] ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/:::[a-z]+\[([^\]]+)\]([\s\S]*?):::/g, '$1. $2')
    .replace(/[-*+]\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const EditorView: React.FC<EditorViewProps> = ({ chapter, onUpdateChapter, onSplitChapter }) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'metadata'>('editor');
  const [viewMode, setViewMode] = useState<'raw' | 'folding'>('folding');
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<number, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [autoDetectToast, setAutoDetectToast] = useState<string | null>(null);

  // Smart Chapter Splitter State
  const [isSmartSplitModalOpen, setIsSmartSplitModalOpen] = useState(false);
  const [splitLevel, setSplitLevel] = useState<'h2' | 'h3' | 'auto'>('auto');
  const [addPartTags, setAddPartTags] = useState(true);

  // Text-To-Speech (TTS) Web Speech API State & Controls (Persisted to localStorage)
  const [showTtsPanel, setShowTtsPanel] = useState(false);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const [isPausedSpeech, setIsPausedSpeech] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kaybit_tts_rate');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 2.0) return parsed;
      }
    }
    return 1.0;
  });
  const [speechPitch, setSpeechPitch] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kaybit_tts_pitch');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 1.5) return parsed;
      }
    }
    return 1.0;
  });
  const [speechVoices, setSpeechVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('kaybit_tts_voice') || '';
    }
    return '';
  });
  const [speechProgress, setSpeechProgress] = useState<number>(0);

  // Persist TTS rate, pitch, and selected voice to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kaybit_tts_rate', speechRate.toString());
    }
  }, [speechRate]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kaybit_tts_pitch', speechPitch.toString());
    }
  }, [speechPitch]);

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedVoiceURI) {
      localStorage.setItem('kaybit_tts_voice', selectedVoiceURI);
    }
  }, [selectedVoiceURI]);

  // Load available SpeechSynthesis Voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setSpeechVoices(voices);
        if (voices.length > 0) {
          const savedVoice = localStorage.getItem('kaybit_tts_voice');
          const foundSaved = savedVoice ? voices.find(v => (v.voiceURI || v.name) === savedVoice) : null;
          if (foundSaved) {
            setSelectedVoiceURI(foundSaved.voiceURI || foundSaved.name);
          } else if (!selectedVoiceURI) {
            const defaultVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
            setSelectedVoiceURI(defaultVoice.voiceURI || defaultVoice.name);
          }
        }
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Stop speech when chapter changes or component unmounts
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      setIsPausedSpeech(false);
      setSpeechProgress(0);
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [chapter?.id]);

  const speakCurrentChapter = (restart = false) => {
    if (!chapter || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPausedSpeech && !restart) {
      window.speechSynthesis.resume();
      setIsPausedSpeech(false);
      setIsPlayingSpeech(true);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = cleanTextForSpeech(chapter.title, chapter.content);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;

    if (selectedVoiceURI && speechVoices.length > 0) {
      const matchVoice = speechVoices.find(v => (v.voiceURI || v.name) === selectedVoiceURI);
      if (matchVoice) {
        utterance.voice = matchVoice;
      }
    }

    utterance.onboundary = (event) => {
      if (event.charIndex !== undefined && cleanText.length > 0) {
        const pct = Math.min(100, Math.round((event.charIndex / cleanText.length) * 100));
        setSpeechProgress(pct);
      }
    };

    utterance.onend = () => {
      setIsPlayingSpeech(false);
      setIsPausedSpeech(false);
      setSpeechProgress(100);
    };

    utterance.onerror = (err) => {
      console.error("TTS Speech error:", err);
      setIsPlayingSpeech(false);
      setIsPausedSpeech(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlayingSpeech(true);
    setIsPausedSpeech(false);
    setSpeechProgress(0);
  };

  const pauseSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPausedSpeech(true);
      setIsPlayingSpeech(false);
    }
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      setIsPausedSpeech(false);
      setSpeechProgress(0);
    }
  };

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

  const handleAutoDetectCodeLanguages = () => {
    if (!chapter) return;
    const rawContent = chapter.content || '';
    const detectedLangsSet = new Set<string>();

    const updatedContent = rawContent.replace(/```(\w*)\r?\n([\s\S]*?)```/g, (_, rawLang, codeContent) => {
      const isUnspecified = !rawLang || ['text', 'code', 'plaintext'].includes(rawLang.trim().toLowerCase());
      const langToUse = isUnspecified ? detectCodeLanguage(codeContent) : rawLang.trim().toLowerCase();

      if (langToUse && langToUse !== 'plaintext') {
        detectedLangsSet.add(formatLanguageName(langToUse));
      }

      return `\`\`\`${langToUse}\n${codeContent}\`\`\``;
    });

    const stats = calculateReadingStats(updatedContent);
    const detectedList = Array.from(detectedLangsSet);
    const langString = detectedList.length > 0 ? detectedList.join(', ') : (chapter.metadata.language || 'Markdown / Text');

    const existingTags = chapter.metadata.tags || [];
    const updatedTags = Array.from(new Set([...existingTags, ...detectedList]));

    onUpdateChapter(chapter.id, {
      content: updatedContent,
      metadata: {
        ...chapter.metadata,
        wordCount: stats.wordCount,
        readingTimeMinutes: stats.readingTimeMinutes,
        language: langString,
        tags: updatedTags
      }
    });

    const toastText = detectedList.length > 0
      ? `Auto-detected ${detectedList.length} code languages: ${langString}. Updated chapter metadata & tags!`
      : `Language auto-detection complete. Primary chapter language: ${langString}.`;

    setAutoDetectToast(toastText);
    setTimeout(() => setAutoDetectToast(null), 3800);
  };

  const handleConfirmSmartSplit = () => {
    if (!chapter) return;
    const splitSections = performSmartSplit(chapter.title, chapter.content || '', splitLevel);
    if (splitSections.length <= 1) {
      setAutoDetectToast("No H2/H3 heading boundaries found to split this chapter.");
      setTimeout(() => setAutoDetectToast(null), 3500);
      setIsSmartSplitModalOpen(false);
      return;
    }

    const newChaptersList: Partial<Chapter>[] = splitSections.map((sec, idx) => {
      const existingTags = chapter.metadata?.tags || ['Notes'];
      const partTag = `Part ${idx + 1}`;
      const updatedTags = addPartTags ? Array.from(new Set([...existingTags, partTag])) : existingTags;

      return {
        title: sec.title,
        content: sec.content,
        metadata: {
          ...chapter.metadata,
          wordCount: sec.wordCount,
          readingTimeMinutes: sec.readingTimeMinutes,
          tags: updatedTags
        }
      };
    });

    if (onSplitChapter) {
      onSplitChapter(chapter.id, newChaptersList);
      setAutoDetectToast(`Smart Split: Separated chapter into ${splitSections.length} smaller sub-chapters!`);
      setTimeout(() => setAutoDetectToast(null), 4000);
    } else {
      onUpdateChapter(chapter.id, {
        title: newChaptersList[0].title,
        content: newChaptersList[0].content,
        metadata: newChaptersList[0].metadata
      });
      setAutoDetectToast(`Smart Split complete: Updated chapter with Part 1.`);
      setTimeout(() => setAutoDetectToast(null), 3500);
    }

    setIsSmartSplitModalOpen(false);
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

        {/* Text-to-Speech Web Speech API Button */}
        <button
          onClick={() => setShowTtsPanel(prev => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold transition-all shrink-0 ${
            showTtsPanel || isPlayingSpeech || isPausedSpeech
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
          }`}
          title="Read Chapter Aloud with Web Speech API"
        >
          <Volume2 className={`w-3.5 h-3.5 ${isPlayingSpeech ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">Text-to-Speech</span>
          {isPlayingSpeech && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        {/* Tab Toggle */}
        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs shrink-0">
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

      {/* Text-to-Speech Web Speech API Interactive Controls Panel */}
      {showTtsPanel && (
        <div className="bg-slate-900 border-b border-slate-800 p-3.5 space-y-3 animate-fade-in text-slate-200">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <AudioLines className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Chapter Text-to-Speech Audio Reader
              </h4>
              {isPlayingSpeech && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-semibold text-amber-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Reading Aloud
                </span>
              )}
              {isPausedSpeech && (
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-300">
                  Paused
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Play / Pause / Stop main controls */}
              {isPlayingSpeech ? (
                <button
                  onClick={pauseSpeech}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={() => speakCurrentChapter(false)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isPausedSpeech ? 'Resume' : 'Read Chapter'}</span>
                </button>
              )}

              {(isPlayingSpeech || isPausedSpeech) && (
                <button
                  onClick={stopSpeech}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-medium transition-colors"
                  title="Stop Speech"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              )}

              <button
                onClick={() => setShowTtsPanel(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Sliders & Voice Select Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
            {/* Speech Rate Control */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Speed Rate ({speechRate.toFixed(2)}x)
                </label>
                <div className="flex items-center gap-1">
                  {[0.75, 1.0, 1.25, 1.5, 2.0].map(r => (
                    <button
                      key={r}
                      onClick={() => {
                        setSpeechRate(r);
                        if (isPlayingSpeech) speakCurrentChapter(true);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        speechRate === r
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {r}x
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={speechRate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSpeechRate(val);
                  if (isPlayingSpeech) speakCurrentChapter(true);
                }}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
            </div>

            {/* Speech Pitch Control */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Voice Pitch ({speechPitch.toFixed(2)})
                </label>
                <button
                  onClick={() => {
                    setSpeechPitch(1.0);
                    if (isPlayingSpeech) speakCurrentChapter(true);
                  }}
                  className="text-[10px] text-indigo-400 hover:underline font-mono"
                >
                  Reset (1.0)
                </button>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={speechPitch}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSpeechPitch(val);
                  if (isPlayingSpeech) speakCurrentChapter(true);
                }}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
            </div>

            {/* Speech Voice Selection */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                Voice Accent
              </label>
              <select
                value={selectedVoiceURI}
                onChange={(e) => {
                  setSelectedVoiceURI(e.target.value);
                  if (isPlayingSpeech) speakCurrentChapter(true);
                }}
                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-amber-500"
              >
                {speechVoices.map((voice) => (
                  <option key={voice.voiceURI || voice.name} value={voice.voiceURI || voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
                {speechVoices.length === 0 && (
                  <option value="">Default System Voice</option>
                )}
              </select>
            </div>
          </div>

          {/* Reading Progress Bar */}
          {(isPlayingSpeech || isPausedSpeech || speechProgress > 0) && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Audio Speech Position</span>
                <span>{speechProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${speechProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

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

            <button
              onClick={handleAutoDetectCodeLanguages}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 shrink-0 font-semibold transition-all active:scale-95"
              title="Auto-detect code languages using highlight.js AI engine and update chapter metadata"
            >
              <Wand2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Auto-Detect Languages</span>
            </button>

            <button
              onClick={() => setIsSmartSplitModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 shrink-0 font-semibold transition-all active:scale-95"
              title="Automatically split this chapter into smaller sub-chapters based on H2/H3 headings"
            >
              <Scissors className="w-3.5 h-3.5 text-indigo-400" />
              <span>Smart Split</span>
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

                        {segment.isAutoDetected && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono font-medium flex items-center gap-1" title="Language automatically detected with highlight.js">
                            <Wand2 className="w-2.5 h-2.5 text-cyan-400" />
                            <span>Auto</span>
                          </span>
                        )}

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

      {/* Auto-Detect Language Toast Notification */}
      {autoDetectToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white border border-cyan-500/60 shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in backdrop-blur-md">
          <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{autoDetectToast}</span>
        </div>
      )}

      {/* Smart Chapter Splitter Modal */}
      {isSmartSplitModalOpen && chapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Smart Chapter Splitter</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Split long chapters into readable sub-chapters by H2 or H3 heading boundaries
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSmartSplitModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Options */}
            <div className="p-5 border-b border-slate-800 bg-slate-900/60 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Split Boundary Rule</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSplitLevel('auto')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      splitLevel === 'auto'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Auto (H2 or H3)
                  </button>
                  <button
                    onClick={() => setSplitLevel('h2')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      splitLevel === 'h2'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Strict H2 (`##`)
                  </button>
                  <button
                    onClick={() => setSplitLevel('h3')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      splitLevel === 'h3'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Strict H3 (`###`)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="add-part-tags"
                  checked={addPartTags}
                  onChange={(e) => setAddPartTags(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="add-part-tags" className="text-slate-300 cursor-pointer select-none">
                  Automatically add sequential "Part 1", "Part 2" topic tags to metadata
                </label>
              </div>
            </div>

            {/* Live Split Preview */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3 bg-slate-950/40">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Split Preview</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {performSmartSplit(chapter.title, chapter.content || '', splitLevel).length} {performSmartSplit(chapter.title, chapter.content || '', splitLevel).length === 1 ? 'chapter' : 'chapters'}
                </span>
              </h3>

              {performSmartSplit(chapter.title, chapter.content || '', splitLevel).map((sec, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span>{sec.title}</span>
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Part {idx + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{sec.wordCount} words</span>
                    <span>•</span>
                    <span>~{sec.readingTimeMinutes} min read</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setIsSmartSplitModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSmartSplit}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg active:scale-95"
              >
                <Scissors className="w-4 h-4" />
                <span>Confirm Smart Split</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
