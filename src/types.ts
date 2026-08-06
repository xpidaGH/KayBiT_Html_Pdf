export type SupportedExtension = 'md' | 'mdx' | 'html' | 'txt';

export type CodeTheme = 
  | 'dracula' 
  | 'one-dark' 
  | 'github-light' 
  | 'nord' 
  | 'monokai' 
  | 'vscode-dark' 
  | 'solarized-light' 
  | 'night-owl';

export type PageFormat = 'A4' | 'Letter';

export type FontPairing = 
  | 'sans-mono' 
  | 'serif-mono' 
  | 'academic' 
  | 'modern-clean';

export type PlatformMode = 'web' | 'desktop' | 'mobile';

export interface ChapterMetadata {
  sourceFileName: string;
  sourcePath?: string;
  language: string;
  author: string;
  courseCode?: string;
  dateCreated: string;
  wordCount: number;
  readingTimeMinutes: number;
  tags: string[];
}

export interface Chapter {
  id: string;
  title: string;
  extension: SupportedExtension;
  content: string;
  metadata: ChapterMetadata;
  aiSummary?: string;
  keyTakeaways?: string[];
  order: number;
}

export interface TOCItem {
  id: string;
  text: string;
  level: number; // 1 for H1, 2 for H2, 3 for H3
  chapterId: string;
  chapterTitle: string;
  pageEstimate?: number;
}

export interface CoverPageConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  author: string;
  institution: string;
  courseCode: string;
  date: string;
  accentColor: string;
  style: 'academic' | 'modern' | 'minimal' | 'dark-slate';
  keywords?: string;
  subject?: string;
}

export interface PasswordProtectionConfig {
  enabled: boolean;
  password?: string;
}

export type WatermarkPosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'grid';
export type WatermarkType = 'text-svg' | 'stamp-seal' | 'badge' | 'grid';

export interface QrCodeConfig {
  enabled: boolean;
  url: string;
  title: string;
  subtitle: string;
  sizePx: number;
  darkColor: string;
  lightColor: string;
  showInPrint: boolean;
  showUrlText: boolean;
}

export interface RemoteSyncConfig {
  enabled: boolean;
  apiUrl: string;
  syncAuthToken?: string;
  autoSync: boolean;
  lastSyncedAt?: string;
  lastSyncStatus?: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncError?: string;
}

export interface StyleConfig {
  codeTheme: CodeTheme;
  fontPairing: FontPairing;
  fontSizePx: number;
  pageFormat: PageFormat;
  pageMarginMm: number;
  showLineNumbers: boolean;
  showTOC: boolean;
  showMetadataHeader: boolean;
  showPageNumbers: boolean;
  preventSnippetBreaks: boolean;
  primaryColor: string;
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  watermarkPosition?: WatermarkPosition;
  watermarkRotation?: number;
  watermarkScale?: number;
  watermarkType?: WatermarkType;
  watermarkColor?: string;
  passwordProtection?: PasswordProtectionConfig;
  qrCodeConfig?: QrCodeConfig;
  remoteSyncConfig?: RemoteSyncConfig;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  chapterTitle: string;
}

export interface PdfHistoryItem {
  id: string;
  filename: string;
  timestamp: string;
  status: 'success' | 'failed';
  exportMethod: 'server' | 'browser';
  fileSizeKb?: number;
  passwordProtected?: boolean;
  watermarkText?: string;
  errorMessage?: string;
}
