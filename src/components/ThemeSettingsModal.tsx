import React, { useEffect } from 'react';
import { X, Palette, Check } from 'lucide-react';
import { UI_THEMES, UiThemeId } from '../lib/themes';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: UiThemeId;
  onSelectTheme: (themeId: UiThemeId) => void;
}

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
  onSelectTheme,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (themeId: UiThemeId) => {
    onSelectTheme(themeId);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-settings-modal-title"
    >
      <div
        className="w-full max-w-2xl overflow-hidden shadow-2xl border transition-all"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
          color: 'var(--text-primary)',
          borderRadius: 'var(--radius-card)',
          fontFamily: 'var(--font-body)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <Palette
              className="w-5 h-5 shrink-0"
              style={{ color: 'var(--accent-primary)' }}
            />
            <div>
              <h2
                id="theme-settings-modal-title"
                className="text-base sm:text-lg font-bold leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                UI Theme Settings
              </h2>
              <p
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                Choose a workspace aesthetic. Changes apply immediately and persist across reloads.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 border transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-button)',
            }}
            aria-label="Close Theme Settings"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Options List */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {UI_THEMES.map((theme) => {
            const isSelected = activeTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelect(theme.id)}
                className="w-full text-left p-4 border transition-all flex items-start justify-between gap-4 group"
                style={{
                  backgroundColor: isSelected
                    ? 'var(--accent-soft)'
                    : 'var(--bg-surface-elevated)',
                  borderColor: isSelected
                    ? 'var(--accent-primary)'
                    : 'var(--border-subtle)',
                  borderRadius: 'var(--radius-card)',
                }}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-bold"
                      style={{
                        color: 'var(--text-primary)',
                        fontFamily: theme.cssVars['--font-display'],
                      }}
                    >
                      {theme.name}
                    </span>
                    {isSelected && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5"
                        style={{
                          backgroundColor: 'var(--accent-primary)',
                          color: 'var(--accent-text)',
                          borderRadius: 'var(--radius-button)',
                        }}
                      >
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>

                  <p
                    className="text-xs font-medium"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    {theme.tagline}
                  </p>

                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {theme.description}
                  </p>

                  <p
                    className="text-[11px] pt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Typography: {theme.fontLabel}
                  </p>
                </div>

                {/* Color Swatch Preview */}
                <div className="flex items-center gap-1.5 shrink-0 pt-1">
                  <span
                    className="w-5 h-5 rounded-full border border-black/15 shadow-xs"
                    style={{ backgroundColor: theme.swatches.canvas }}
                    title={`Canvas: ${theme.swatches.canvas}`}
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-black/15 shadow-xs"
                    style={{ backgroundColor: theme.swatches.surface }}
                    title={`Surface: ${theme.swatches.surface}`}
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-black/15 shadow-xs"
                    style={{ backgroundColor: theme.swatches.accent }}
                    title={`Accent: ${theme.swatches.accent}`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div
          className="px-6 py-3.5 border-t flex items-center justify-end"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold border transition-colors hover:opacity-85"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-button)',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
