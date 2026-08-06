import React from 'react';
import { 
  X, 
  Sliders, 
  Palette, 
  Type, 
  FileCheck, 
  BookOpen, 
  Layout, 
  Check, 
  ShieldAlert,
  Stamp,
  Lock,
  Eye,
  EyeOff,
  QrCode,
  Smartphone,
  Globe,
  RefreshCw,
  Key,
  ShieldCheck,
  Cloud,
  CloudCheck,
  CloudOff,
  CloudRain,
  Server,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send
} from 'lucide-react';
import { StyleConfig, CoverPageConfig, CodeTheme, RemoteSyncConfig } from '../types';
import { CODE_THEMES } from '../lib/prismThemes';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  styleConfig: StyleConfig;
  setStyleConfig: React.Dispatch<React.SetStateAction<StyleConfig>>;
  coverConfig: CoverPageConfig;
  setCoverConfig: React.Dispatch<React.SetStateAction<CoverPageConfig>>;
  onSyncRemote?: (apiUrl?: string, token?: string) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  styleConfig,
  setStyleConfig,
  coverConfig,
  setCoverConfig,
  onSyncRemote
}) => {
  const [showPdfPassword, setShowPdfPassword] = React.useState(false);
  const [showSyncToken, setShowSyncToken] = React.useState(false);
  const [showPayloadPreview, setShowPayloadPreview] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold">PDF Styling & Page Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Section 1: Code Syntax Highlighting Theme */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" />
              <span>Code Syntax Theme</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(Object.keys(CODE_THEMES) as CodeTheme[]).map((themeKey) => {
                const theme = CODE_THEMES[themeKey];
                const isSelected = styleConfig.codeTheme === themeKey;
                return (
                  <button
                    key={themeKey}
                    onClick={() => setStyleConfig(prev => ({ ...prev, codeTheme: themeKey }))}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">{theme.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    {/* Visual Color Preview Dots */}
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full border border-slate-700" style={{ backgroundColor: theme.background }} title="Background" />
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.textColor }} title="Text" />
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.accentColor }} title="Accent" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Page Layout & Typography */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Paper Format</label>
              <select
                value={styleConfig.pageFormat}
                onChange={(e) => setStyleConfig(prev => ({ ...prev, pageFormat: e.target.value as any }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="A4">A4 (Standard Europe/International)</option>
                <option value="Letter">US Letter (North America)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Page Margins (mm)</label>
              <select
                value={styleConfig.pageMarginMm}
                onChange={(e) => setStyleConfig(prev => ({ ...prev, pageMarginMm: parseInt(e.target.value, 10) }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value={10}>10 mm (Compact)</option>
                <option value={15}>15 mm (Recommended Standard)</option>
                <option value={20}>20 mm (Spacious Academic)</option>
                <option value={25}>25 mm (Wide Binder)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Font Pairing</label>
              <select
                value={styleConfig.fontPairing}
                onChange={(e) => setStyleConfig(prev => ({ ...prev, fontPairing: e.target.value as any }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="sans-mono">Sans-Serif + Monospace (Modern Clean)</option>
                <option value="serif-mono">Serif + Monospace (Classic Textbook)</option>
                <option value="academic">Academic Paper Style</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Base Font Size (px)</label>
              <input
                type="number"
                min={11}
                max={18}
                value={styleConfig.fontSizePx}
                onChange={(e) => setStyleConfig(prev => ({ ...prev, fontSizePx: parseInt(e.target.value, 10) || 14 }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Section 3: Student PDF Features & Page Break Rules */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Student PDF Controls</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={styleConfig.preventSnippetBreaks}
                  onChange={(e) => setStyleConfig(prev => ({ ...prev, preventSnippetBreaks: e.target.checked }))}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">Prevent Code Snippet Cuts</span>
                  <span className="text-[11px] text-slate-400 block">Adds CSS page-break-inside: avoid to code blocks</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={styleConfig.showTOC}
                  onChange={(e) => setStyleConfig(prev => ({ ...prev, showTOC: e.target.checked }))}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">Auto Table of Contents</span>
                  <span className="text-[11px] text-slate-400 block">Auto-generates hyperlinked index page at top</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={styleConfig.showLineNumbers}
                  onChange={(e) => setStyleConfig(prev => ({ ...prev, showLineNumbers: e.target.checked }))}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">Code Line Numbers</span>
                  <span className="text-[11px] text-slate-400 block">Numbered IDE gutter on pre blocks</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={styleConfig.showMetadataHeader}
                  onChange={(e) => setStyleConfig(prev => ({ ...prev, showMetadataHeader: e.target.checked }))}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">Metadata Source Banners</span>
                  <span className="text-[11px] text-slate-400 block">Header on notes showing date, file, tags</span>
                </div>
              </label>

            </div>
          </div>

          {/* Section 4: Cover Page Configurator */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layout className="w-4 h-4 text-sky-400" />
                <span>Title Cover Page</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-indigo-300 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={coverConfig.enabled}
                  onChange={(e) => setCoverConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Include Cover Page</span>
              </label>
            </div>

            {coverConfig.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Document Title</label>
                  <input
                    type="text"
                    value={coverConfig.title}
                    onChange={(e) => setCoverConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={coverConfig.subtitle}
                    onChange={(e) => setCoverConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Author Name (PDF Author Metadata)</label>
                  <input
                    type="text"
                    value={coverConfig.author}
                    onChange={(e) => setCoverConfig(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none"
                    placeholder="e.g. Alex Kay"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Institution / Dept</label>
                  <input
                    type="text"
                    value={coverConfig.institution}
                    onChange={(e) => setCoverConfig(prev => ({ ...prev, institution: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">PDF Document Subject</label>
                  <input
                    type="text"
                    value={coverConfig.subject || ''}
                    onChange={(e) => setCoverConfig(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none"
                    placeholder="e.g. High-Yield Computer Science Reference"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">PDF Keywords (Comma Separated)</label>
                  <input
                    type="text"
                    value={coverConfig.keywords || ''}
                    onChange={(e) => setCoverConfig(prev => ({ ...prev, keywords: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none font-mono"
                    placeholder="e.g. CS101, React, Data Structures, Study Notes"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 5: PDF Watermark Configurator */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Stamp className="w-4 h-4 text-amber-400" />
                <span>PDF Security Watermark</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-indigo-300 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={styleConfig.watermarkEnabled}
                  onChange={(e) => setStyleConfig(prev => ({ ...prev, watermarkEnabled: e.target.checked }))}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Enable Watermark</span>
              </label>
            </div>

            {styleConfig.watermarkEnabled && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Watermark Type</label>
                    <select
                      value={styleConfig.watermarkType || 'text-svg'}
                      onChange={(e) => setStyleConfig(prev => ({ ...prev, watermarkType: e.target.value as any }))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500"
                    >
                      <option value="text-svg">Vector SVG Text</option>
                      <option value="stamp-seal">Official Stamp Seal</option>
                      <option value="badge">Security Shield Badge</option>
                      <option value="grid">Tiled Page Grid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Watermark Text</label>
                    <input
                      type="text"
                      value={styleConfig.watermarkText}
                      onChange={(e) => setStyleConfig(prev => ({ ...prev, watermarkText: e.target.value.toUpperCase() }))}
                      placeholder="CONFIDENTIAL / DRAFT"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white uppercase outline-none focus:border-indigo-500 font-mono font-bold tracking-wider"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Position</label>
                    <select
                      value={styleConfig.watermarkPosition || 'center'}
                      onChange={(e) => setStyleConfig(prev => ({ ...prev, watermarkPosition: e.target.value as any }))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500"
                    >
                      <option value="center">Center</option>
                      <option value="top-left">Top Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                      <option value="grid">Tiled Grid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Opacity ({Math.round((styleConfig.watermarkOpacity ?? 0.12) * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0.05"
                      max="0.80"
                      step="0.01"
                      value={styleConfig.watermarkOpacity ?? 0.12}
                      onChange={(e) => setStyleConfig(prev => ({ ...prev, watermarkOpacity: parseFloat(e.target.value) }))}
                      className="w-full accent-amber-500 bg-slate-900 rounded-lg h-2 cursor-pointer mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Rotation ({styleConfig.watermarkRotation ?? -45}°)
                    </label>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      step="5"
                      value={styleConfig.watermarkRotation ?? -45}
                      onChange={(e) => setStyleConfig(prev => ({ ...prev, watermarkRotation: parseInt(e.target.value, 10) }))}
                      className="w-full accent-amber-500 bg-slate-900 rounded-lg h-2 cursor-pointer mt-1"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1.5">Quick Watermark Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['CONFIDENTIAL', 'DRAFT', 'INTERNAL USE ONLY', 'EXAM PREP', 'DO NOT DISTRIBUTE', 'PROPRIETARY'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setStyleConfig(prev => ({ ...prev, watermarkText: preset }))}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all ${
                          styleConfig.watermarkText === preset
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 6: PDF Password Protection */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>PDF Password Protection</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-indigo-300 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={styleConfig.passwordProtection?.enabled || false}
                  onChange={(e) => setStyleConfig(prev => ({
                    ...prev,
                    passwordProtection: {
                      enabled: e.target.checked,
                      password: prev.passwordProtection?.password || ''
                    }
                  }))}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Password Encrypt PDF</span>
              </label>
            </div>

            {styleConfig.passwordProtection?.enabled && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Set PDF Access Password</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                        let generated = '';
                        for (let i = 0; i < 12; i++) {
                          generated += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        setStyleConfig(prev => ({
                          ...prev,
                          passwordProtection: {
                            enabled: true,
                            password: generated
                          }
                        }));
                        setShowPdfPassword(true);
                      }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono font-semibold"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Generate Random</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPdfPassword ? 'text' : 'password'}
                      value={styleConfig.passwordProtection?.password || ''}
                      onChange={(e) => setStyleConfig(prev => ({
                        ...prev,
                        passwordProtection: {
                          enabled: true,
                          password: e.target.value
                        }
                      }))}
                      placeholder="Enter secret user password..."
                      className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500 font-mono tracking-wide"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPdfPassword(prev => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
                      title={showPdfPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPdfPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Password Strength Meter & Status */}
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>AES-256 Vector PDF Encryption</span>
                    </div>
                    {(() => {
                      const pwd = styleConfig.passwordProtection?.password || '';
                      if (!pwd) {
                        return <span className="text-amber-400 font-semibold">⚠️ Password required</span>;
                      }
                      if (pwd.length < 6) {
                        return <span className="text-rose-400 font-semibold">Weak</span>;
                      }
                      if (pwd.length < 10) {
                        return <span className="text-amber-400 font-semibold">Moderate</span>;
                      }
                      return <span className="text-emerald-400 font-semibold">Strong</span>;
                    })()}
                  </div>

                  <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
                    🔒 When exported via Server PDF, the output file is encrypted with AES-256. Anyone opening the PDF will be prompted for this user password.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section 7: Mobile QR Code Injection */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Mobile QR Code Injection</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-emerald-300 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={styleConfig.qrCodeConfig?.enabled ?? true}
                  onChange={(e) => setStyleConfig(prev => ({
                    ...prev,
                    qrCodeConfig: {
                      title: 'Scan for Mobile HTML Companion & Interactive Bundle',
                      subtitle: 'Scan with your smartphone camera to access the live responsive HTML bundle, code snippets, flashcards, and AI study guide.',
                      sizePx: 150,
                      darkColor: '#0f172a',
                      lightColor: '#ffffff',
                      showInPrint: true,
                      showUrlText: true,
                      ...prev.qrCodeConfig,
                      enabled: e.target.checked,
                      url: prev.qrCodeConfig?.url || (typeof window !== 'undefined' ? window.location.href : '')
                    }
                  }))}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0"
                />
                <span>Inject Mobile QR Code</span>
              </label>
            </div>

            {(styleConfig.qrCodeConfig?.enabled ?? true) && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-400">Target Web Link (URL)</label>
                    <button
                      type="button"
                      onClick={() => setStyleConfig(prev => ({
                        ...prev,
                        qrCodeConfig: {
                          enabled: true,
                          title: 'Scan for Mobile HTML Companion & Interactive Bundle',
                          subtitle: 'Scan with your smartphone camera to access the live responsive HTML bundle, code snippets, flashcards, and AI study guide.',
                          sizePx: 150,
                          darkColor: '#0f172a',
                          lightColor: '#ffffff',
                          showInPrint: true,
                          showUrlText: true,
                          ...prev.qrCodeConfig,
                          url: typeof window !== 'undefined' ? window.location.href : ''
                        }
                      }))}
                      className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset to Current URL</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={styleConfig.qrCodeConfig?.url || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStyleConfig(prev => ({
                        ...prev,
                        qrCodeConfig: {
                          enabled: true,
                          title: 'Scan for Mobile HTML Companion & Interactive Bundle',
                          subtitle: 'Scan with your smartphone camera to access the live responsive HTML bundle, code snippets, flashcards, and AI study guide.',
                          sizePx: 150,
                          darkColor: '#0f172a',
                          lightColor: '#ffffff',
                          showInPrint: true,
                          showUrlText: true,
                          ...prev.qrCodeConfig,
                          url: val
                        }
                      }));
                    }}
                    placeholder="https://your-bundle-url.com"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-indigo-300 font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Card Title</label>
                    <input
                      type="text"
                      value={styleConfig.qrCodeConfig?.title || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStyleConfig(prev => ({
                          ...prev,
                          qrCodeConfig: {
                            enabled: true,
                            url: typeof window !== 'undefined' ? window.location.href : '',
                            subtitle: 'Scan with your smartphone camera to access the live responsive HTML bundle, code snippets, flashcards, and AI study guide.',
                            sizePx: 150,
                            darkColor: '#0f172a',
                            lightColor: '#ffffff',
                            showInPrint: true,
                            showUrlText: true,
                            ...prev.qrCodeConfig,
                            title: val
                          }
                        }));
                      }}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      QR Size ({styleConfig.qrCodeConfig?.sizePx || 150}px)
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="240"
                      step="10"
                      value={styleConfig.qrCodeConfig?.sizePx || 150}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setStyleConfig(prev => ({
                          ...prev,
                          qrCodeConfig: {
                            enabled: true,
                            url: typeof window !== 'undefined' ? window.location.href : '',
                            title: 'Scan for Mobile HTML Companion & Interactive Bundle',
                            subtitle: 'Scan with your smartphone camera to access the live responsive HTML bundle, code snippets, flashcards, and AI study guide.',
                            darkColor: '#0f172a',
                            lightColor: '#ffffff',
                            showInPrint: true,
                            showUrlText: true,
                            ...prev.qrCodeConfig,
                            sizePx: val
                          }
                        }));
                      }}
                      className="w-full accent-emerald-500 bg-slate-900 rounded-lg h-2 cursor-pointer mt-1"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  📱 Automatically injects a camera-scannable QR code section on the last page of the compiled PDF so readers can scan with any phone to open the full interactive HTML bundle.
                </p>
              </div>
            )}
          </div>

          {/* Section 8: Remote API Endpoint Chapter Synchronization */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>Remote API Chapter Synchronization</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-sky-300 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={styleConfig.remoteSyncConfig?.enabled ?? false}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setStyleConfig(prev => {
                      const updatedRemote: RemoteSyncConfig = {
                        enabled: isChecked,
                        apiUrl: prev.remoteSyncConfig?.apiUrl || '/api/sync-chapters',
                        syncAuthToken: prev.remoteSyncConfig?.syncAuthToken || '',
                        autoSync: prev.remoteSyncConfig?.autoSync ?? true,
                        lastSyncStatus: prev.remoteSyncConfig?.lastSyncStatus || 'idle'
                      };
                      try {
                        localStorage.setItem('kaybit_remote_sync_config', JSON.stringify(updatedRemote));
                      } catch {}
                      return {
                        ...prev,
                        remoteSyncConfig: updatedRemote
                      };
                    });
                  }}
                  className="rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-0"
                />
                <span>Enable Remote Sync</span>
              </label>
            </div>

            {(styleConfig.remoteSyncConfig?.enabled ?? false) && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                
                {/* Sync Status Badge */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2.5">
                    {styleConfig.remoteSyncConfig?.lastSyncStatus === 'syncing' ? (
                      <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                    ) : styleConfig.remoteSyncConfig?.lastSyncStatus === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : styleConfig.remoteSyncConfig?.lastSyncStatus === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Server className="w-4 h-4 text-slate-400" />
                    )}

                    <div>
                      <span className="font-bold text-slate-200 block">
                        {styleConfig.remoteSyncConfig?.lastSyncStatus === 'syncing' && 'Syncing chapters with remote API...'}
                        {styleConfig.remoteSyncConfig?.lastSyncStatus === 'success' && 'Remote Sync Active & Ready'}
                        {styleConfig.remoteSyncConfig?.lastSyncStatus === 'error' && 'Remote Sync Error'}
                        {(!styleConfig.remoteSyncConfig?.lastSyncStatus || styleConfig.remoteSyncConfig?.lastSyncStatus === 'idle') && 'Remote Sync Idle'}
                      </span>
                      {styleConfig.remoteSyncConfig?.lastSyncedAt && (
                        <span className="text-[11px] text-slate-400">
                          Last successful sync: {new Date(styleConfig.remoteSyncConfig.lastSyncedAt).toLocaleTimeString()} ({new Date(styleConfig.remoteSyncConfig.lastSyncedAt).toLocaleDateString()})
                        </span>
                      )}
                      {styleConfig.remoteSyncConfig?.lastSyncError && (
                        <span className="text-[11px] text-rose-400 block font-mono">
                          {styleConfig.remoteSyncConfig.lastSyncError}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onSyncRemote) {
                        onSyncRemote(
                          styleConfig.remoteSyncConfig?.apiUrl,
                          styleConfig.remoteSyncConfig?.syncAuthToken
                        );
                      }
                    }}
                    disabled={styleConfig.remoteSyncConfig?.lastSyncStatus === 'syncing'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 shrink-0"
                  >
                    {styleConfig.remoteSyncConfig?.lastSyncStatus === 'syncing' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Sync Now</span>
                  </button>
                </div>

                {/* Endpoint URL Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-sky-400" />
                      <span>Remote API Endpoint URL</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">POST HTTP JSON</span>
                  </div>
                  <input
                    type="text"
                    value={styleConfig.remoteSyncConfig?.apiUrl || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStyleConfig(prev => {
                        const updatedRemote: RemoteSyncConfig = {
                          ...prev.remoteSyncConfig!,
                          enabled: true,
                          apiUrl: val
                        };
                        try {
                          localStorage.setItem('kaybit_remote_sync_config', JSON.stringify(updatedRemote));
                        } catch {}
                        return {
                          ...prev,
                          remoteSyncConfig: updatedRemote
                        };
                      });
                    }}
                    placeholder="e.g. https://api.yourdomain.com/v1/chapters or /api/sync-chapters"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-sky-300 font-mono outline-none focus:border-sky-500"
                  />
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-medium">Quick Endpoints:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStyleConfig(prev => {
                          const updatedRemote: RemoteSyncConfig = {
                            ...prev.remoteSyncConfig!,
                            enabled: true,
                            apiUrl: '/api/sync-chapters'
                          };
                          try {
                            localStorage.setItem('kaybit_remote_sync_config', JSON.stringify(updatedRemote));
                          } catch {}
                          return {
                            ...prev,
                            remoteSyncConfig: updatedRemote
                          };
                        });
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-sky-400 hover:text-white transition-all"
                    >
                      /api/sync-chapters (Built-in Express Server)
                    </button>
                  </div>
                </div>

                {/* Bearer / API Auth Token Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>Authorization Header Token / API Key (Optional)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSyncToken(prev => !prev)}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      {showSyncToken ? 'Hide Token' : 'Show Token'}
                    </button>
                  </div>
                  <input
                    type={showSyncToken ? 'text' : 'password'}
                    value={styleConfig.remoteSyncConfig?.syncAuthToken || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStyleConfig(prev => {
                        const updatedRemote: RemoteSyncConfig = {
                          ...prev.remoteSyncConfig!,
                          enabled: true,
                          syncAuthToken: val
                        };
                        try {
                          localStorage.setItem('kaybit_remote_sync_config', JSON.stringify(updatedRemote));
                        } catch {}
                        return {
                          ...prev,
                          remoteSyncConfig: updatedRemote
                        };
                      });
                    }}
                    placeholder="e.g. Bearer eyJhbGci... or secret-api-key-123"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono outline-none focus:border-sky-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    If specified, sent in request headers as <code className="text-amber-300">Authorization: Bearer [token]</code>.
                  </p>
                </div>

                {/* Auto Sync Toggle */}
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={styleConfig.remoteSyncConfig?.autoSync ?? true}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setStyleConfig(prev => {
                        const updatedRemote: RemoteSyncConfig = {
                          ...prev.remoteSyncConfig!,
                          enabled: true,
                          autoSync: isChecked
                        };
                        try {
                          localStorage.setItem('kaybit_remote_sync_config', JSON.stringify(updatedRemote));
                        } catch {}
                        return {
                          ...prev,
                          remoteSyncConfig: updatedRemote
                        };
                      });
                    }}
                    className="rounded bg-slate-950 border-slate-700 text-sky-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">Auto-Sync Remote API on Chapter Changes</span>
                    <span className="text-[11px] text-slate-400 block">
                      Automatically sends debounced POST requests whenever chapter content, order, or metadata is edited.
                    </span>
                  </div>
                </label>

                {/* Developer Payload Inspector */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowPayloadPreview(prev => !prev)}
                    className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 underline"
                  >
                    {showPayloadPreview ? 'Hide Remote API Payload Format' : 'Inspect Remote API Request JSON Schema'}
                  </button>

                  {showPayloadPreview && (
                    <div className="mt-2 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                      <pre className="text-[10px] font-mono text-emerald-300 whitespace-pre-wrap overflow-x-auto">
{`// Sent via POST ${styleConfig.remoteSyncConfig?.apiUrl || '/api/sync-chapters'}
{
  "chapters": [
    {
      "id": "ch-1",
      "title": "Data Structures",
      "extension": "md",
      "content": "# Markdown text...",
      "metadata": { ... }
    }
  ],
  "timestamp": "${new Date().toISOString()}",
  "totalChapters": 4,
  "appVersion": "1.0.0"
}`}
                      </pre>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            Apply Settings
          </button>
        </div>

      </div>
    </div>
  );
};
