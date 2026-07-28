import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup'; // html/xml
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-go';
import { Chapter, TOCItem, SupportedExtension } from '../types';

/**
 * Calculates estimated word count and reading time in minutes
 */
export function calculateReadingStats(text: string): { wordCount: number; readingTimeMinutes: number } {
  const clean = text.replace(/<[^>]*>/g, '').replace(/```[\s\S]*?```/g, '');
  const words = clean.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
  return { wordCount, readingTimeMinutes };
}

/**
 * Sanitizes and generates clean IDs for TOC headings
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Transforms callout syntax like :::summary, :::warning, :::tip, :::note into rich HTML callouts
 */
export function processCustomCallouts(htmlString: string): string {
  let processed = htmlString;

  // Process ::: block callouts
  const calloutRegex = /:::\s*(summary|warning|tip|note|code|exam)\s*(\[.*?\])?([\s\S]*?):::/gi;
  processed = processed.replace(calloutRegex, (_, type, titleMatch, innerContent) => {
    const rawType = type.toLowerCase();
    const customTitle = titleMatch ? titleMatch.slice(1, -1) : getDefaultCalloutTitle(rawType);
    const config = getCalloutStyleConfig(rawType);

    return `
      <div class="note-callout note-callout-${rawType} my-4 p-4 rounded-xl border-l-4 ${config.border} ${config.bg} shadow-xs">
        <div class="flex items-center gap-2 font-bold ${config.text} mb-1.5 text-sm uppercase tracking-wider">
          <span>${config.icon}</span>
          <span>${customTitle}</span>
        </div>
        <div class="callout-body text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
          ${innerContent.trim()}
        </div>
      </div>
    `;
  });

  // Also convert blockquotes starting with bold terms like > **AI Summary:**, > **Warning:**, > **Exam Tip:**
  processed = processed.replace(/<blockquote>\s*<p>\s*<strong>(AI Summary|Warning|Exam Tip|Note|Key Formula|Pitfall):<\/strong>\s*([\s\S]*?)<\/p>\s*<\/blockquote>/gi, (_, type, body) => {
    const rawType = mapTypeToCalloutKey(type);
    const config = getCalloutStyleConfig(rawType);
    return `
      <div class="note-callout note-callout-${rawType} my-4 p-4 rounded-xl border-l-4 ${config.border} ${config.bg} shadow-xs">
        <div class="flex items-center gap-2 font-bold ${config.text} mb-1.5 text-sm uppercase tracking-wider">
          <span>${config.icon}</span>
          <span>${type}</span>
        </div>
        <div class="callout-body text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
          ${body.trim()}
        </div>
      </div>
    `;
  });

  return processed;
}

function mapTypeToCalloutKey(typeStr: string): string {
  const lower = typeStr.toLowerCase();
  if (lower.includes('warning') || lower.includes('pitfall')) return 'warning';
  if (lower.includes('summary')) return 'summary';
  if (lower.includes('exam') || lower.includes('tip')) return 'tip';
  if (lower.includes('formula') || lower.includes('code')) return 'code';
  return 'note';
}

function getDefaultCalloutTitle(type: string): string {
  switch (type) {
    case 'summary': return 'AI Study Summary & Key Takeaways';
    case 'warning': return 'Warning / Common Exam Trap';
    case 'tip': return 'Exam Tip & High-Yield Shortcut';
    case 'code': return 'Key Algorithm / Syntax Spotlight';
    case 'exam': return 'Target Exam Question';
    default: return 'Study Note';
  }
}

function getCalloutStyleConfig(type: string) {
  switch (type) {
    case 'summary':
      return {
        bg: 'bg-purple-50/80 dark:bg-purple-950/40',
        border: 'border-purple-600',
        text: 'text-purple-700 dark:text-purple-300',
        icon: '🧠'
      };
    case 'warning':
      return {
        bg: 'bg-rose-50/80 dark:bg-rose-950/40',
        border: 'border-rose-600',
        text: 'text-rose-700 dark:text-rose-300',
        icon: '⚠️'
      };
    case 'tip':
      return {
        bg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
        border: 'border-emerald-600',
        text: 'text-emerald-700 dark:text-emerald-300',
        icon: '💡'
      };
    case 'code':
      return {
        bg: 'bg-indigo-50/80 dark:bg-indigo-950/40',
        border: 'border-indigo-600',
        text: 'text-indigo-700 dark:text-indigo-300',
        icon: '⚡'
      };
    default:
      return {
        bg: 'bg-sky-50/80 dark:bg-sky-950/40',
        border: 'border-sky-600',
        text: 'text-sky-700 dark:text-sky-300',
        icon: '📌'
      };
  }
}

/**
 * Highlights all <pre><code class="language-xyz"> blocks with Prism.js
 */
export function applyPrismHighlighting(htmlContent: string, showLineNumbers: boolean = true): string {
  // Replace code blocks
  return htmlContent.replace(/<pre><code(?:\s+class="language-([a-zA-Z0-9_+-]+)")?>([\s\S]*?)<\/code><\/pre>/gi, (match, lang, codeText) => {
    const rawCode = codeText
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    const language = (lang || 'javascript').toLowerCase();
    const prismLang = Prism.languages[language] || Prism.languages.javascript;
    
    let highlighted = rawCode;
    try {
      highlighted = Prism.highlight(rawCode, prismLang, language);
    } catch {
      highlighted = rawCode;
    }

    const lines = highlighted.split('\n');
    const lineCount = lines.length;

    let numberedCode = highlighted;
    if (showLineNumbers && lineCount > 1) {
      numberedCode = lines
        .map((line, idx) => `<span class="line-number text-slate-400 select-none text-right pr-3 inline-block w-8 text-xs font-mono">${idx + 1}</span>${line}`)
        .join('\n');
    }

    return `
      <div class="code-block-wrapper my-5 rounded-xl overflow-hidden border border-slate-700/60 shadow-md font-mono text-xs sm:text-sm bg-[#1e1e1e] group relative">
        <div class="code-header flex items-center justify-between px-4 py-2 bg-slate-900/90 text-slate-300 border-b border-slate-800 text-xs">
          <div class="flex items-center gap-2 font-semibold">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span class="ml-2 uppercase tracking-wider text-[10px] text-slate-400 font-bold">${language}</span>
          </div>
          <span class="text-[10px] text-slate-500 font-mono">${lineCount} lines</span>
        </div>
        <pre class="language-${language} p-4 overflow-x-auto m-0 leading-relaxed font-mono"><code>${numberedCode}</code></pre>
      </div>
    `;
  });
}

/**
 * Main parser pipeline for HTML, TXT, MD, MDX
 */
export function parseChapterContent(
  content: string,
  extension: SupportedExtension,
  chapterId: string,
  chapterTitle: string,
  showLineNumbers: boolean = true
): { html: string; tocItems: TOCItem[] } {
  let rawHtml = '';

  if (extension === 'html') {
    rawHtml = content;
  } else if (extension === 'txt') {
    // Escape text and preserve paragraphs
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    rawHtml = escaped
      .split('\n\n')
      .map(p => `<p class="my-3 leading-relaxed">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
  } else {
    // MD or MDX
    // Pre-process MDX components like <Note>, <Warning>, <CodeSnippet>
    let mdxCleaned = content
      .replace(/<Note(?:\s+title="([^"]*)")?>([\s\S]*?)<\/Note>/gi, (_, t, b) => `:::note[${t || 'Note'}]\n${b}\n:::`)
      .replace(/<Warning(?:\s+title="([^"]*)")?>([\s\S]*?)<\/Warning>/gi, (_, t, b) => `:::warning[${t || 'Warning'}]\n${b}\n:::`)
      .replace(/<Summary(?:\s+title="([^"]*)")?>([\s\S]*?)<\/Summary>/gi, (_, t, b) => `:::summary[${t || 'AI Summary'}]\n${b}\n:::`);

    try {
      rawHtml = marked.parse(mdxCleaned, { async: false }) as string;
    } catch {
      rawHtml = `<p>${mdxCleaned}</p>`;
    }
  }

  // Extract headings and inject unique HTML IDs for Table of Contents
  const tocItems: TOCItem[] = [];
  let headingCounter = 0;

  const htmlWithIds = rawHtml.replace(/<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, levelStr, attrs, titleText) => {
    headingCounter++;
    const level = parseInt(levelStr, 10);
    const plainText = titleText.replace(/<[^>]*>/g, '').trim();
    const headingId = `heading-${chapterId}-${slugify(plainText) || headingCounter}`;

    tocItems.push({
      id: headingId,
      text: plainText,
      level,
      chapterId,
      chapterTitle,
    });

    return `<h${level}${attrs} id="${headingId}" class="heading-level-${level} scroll-mt-12">${titleText}</h${level}>`;
  });

  // Apply custom callouts
  const withCallouts = processCustomCallouts(htmlWithIds);

  // Apply Prism syntax highlighting
  const finalHtml = applyPrismHighlighting(withCallouts, showLineNumbers);

  return { html: finalHtml, tocItems };
}
